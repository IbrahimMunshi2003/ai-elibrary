import os
import tempfile
import time
import csv
from datetime import datetime

import requests
from django.core.files import File
from django.core.management.base import BaseCommand
from django.db import transaction
from django.db.models import Q
from django.utils.text import slugify

from library.models import Book, Category


class Command(BaseCommand):
    help = 'Import public-domain English PDF books from Project Gutenberg'

    GUTENDEX_URL = 'https://gutendex.com/books/'
    OFFICIAL_CATALOG_URL = 'https://www.gutenberg.org/cache/epub/feeds/pg_catalog.csv'
    OFFICIAL_PDF_URL = 'https://www.gutenberg.org/cache/epub/{book_id}/pg{book_id}-images.pdf'
    REQUEST_TIMEOUT = 30
    REQUEST_ATTEMPTS = 3
    BACKOFF_SECONDS = 1
    REQUEST_HEADERS = {'User-Agent': 'AI-ELibrary Gutenberg importer/1.0'}

    def add_arguments(self, parser):
        parser.add_argument(
            '--count',
            type=int,
            default=100,
            help='Number of Gutenberg books to select (default: 100)',
        )

    def handle(self, *args, **options):
        count = options['count']
        if count < 1:
            self.stderr.write(self.style.ERROR('--count must be at least 1.'))
            return

        try:
            books = self.fetch_books(self.candidate_limit(count))
        except Exception as exc:
            self.stderr.write(self.style.ERROR(f'Could not fetch Gutenberg metadata: {exc}'))
            self.write_summary(0, 0, 1, 0)
            return

        category, _ = Category.objects.get_or_create(
            name='Project Gutenberg',
            defaults={'description': 'Public-domain books imported from Project Gutenberg.'},
        )

        created = 0
        skipped = 0
        failed = 0
        pdfs_uploaded = 0

        for position, metadata in enumerate(books, start=1):
            if created >= count:
                break
            title = self.clean_text(metadata.get('title')) or 'Untitled Gutenberg Book'
            self.stdout.write(f'[{position}/{len(books)}] {title}')

            if self.is_duplicate(title, metadata.get('id')):
                skipped += 1
                self.stdout.write(self.style.WARNING('  Skipped: a book with this title already exists.'))
                continue

            try:
                book, pdf_uploaded = self.import_book(metadata, category)
                created += 1
                pdfs_uploaded += int(pdf_uploaded)
                if pdf_uploaded:
                    self.stdout.write(self.style.SUCCESS('  Created and uploaded PDF to Cloudinary.'))
                else:
                    self.stdout.write(self.style.WARNING('  Created without a PDF; no PDF URL was available.'))
            except Exception as exc:
                failed += 1
                self.stdout.write(self.style.ERROR(f'  Failed: {exc}'))

        if created < count:
            self.stdout.write(self.style.WARNING(
                f'Only {created} new books were imported from the available candidates; '
                f'{count - created} requested books remain.'
            ))
        self.write_summary(created, skipped, failed, pdfs_uploaded)

    @staticmethod
    def candidate_limit(count):
        return max(count * 3, count + 5)

    def fetch_books(self, count):
        selected = []
        next_url = f'{self.GUTENDEX_URL}?languages=en&mime_type=application%2Fpdf'

        try:
            while next_url and len(selected) < count:
                response = self.request_with_retries(next_url, 'Gutenberg metadata')
                payload = response.json()
                for metadata in payload.get('results', []):
                    if self.pdf_url(metadata):
                        selected.append(metadata)
                        if len(selected) >= count:
                            break
                next_url = payload.get('next')
        except (requests.RequestException, ValueError) as exc:
            self.stdout.write(self.style.WARNING(
                f'Gutendex metadata unavailable after retries: {exc}'
            ))
            selected = []

        if len(selected) < count:
            self.stdout.write(self.style.WARNING(
                f'Gutendex returned {len(selected)} PDF books; trying the official Gutenberg catalog.'
            ))
            selected = self.fetch_official_catalog_books(count, selected)

        return selected[:count]

    def fetch_official_catalog_books(self, count, selected):
        try:
            response = self.request_with_retries(
                self.OFFICIAL_CATALOG_URL,
                'official Gutenberg catalog',
            )
            rows = csv.DictReader(response.content.decode('utf-8-sig', errors='replace').splitlines())
            for row in rows:
                if len(selected) >= count:
                    break
                if row.get('Language', '').strip().lower() not in ('en', 'eng'):
                    continue

                metadata = self.catalog_metadata(row)
                if metadata:
                    selected.append(metadata)
        except (requests.RequestException, ValueError, KeyError, csv.Error) as exc:
            self.stdout.write(self.style.WARNING(f'Official Gutenberg catalog unavailable: {exc}'))

        return selected

    def catalog_metadata(self, row):
        book_id = row.get('Text#', '').strip()
        if not book_id.isdigit():
            return None

        title = self.clean_text(row.get('Title'))
        if not title:
            return None

        return {
            'id': int(book_id),
            'title': title,
            'authors': [{'name': self.clean_text(row.get('Authors'))}],
            'languages': [row.get('Language', 'en').strip()],
            'subjects': [row.get('Subjects', '')] if row.get('Subjects') else [],
            'formats': {
                'application/pdf': self.OFFICIAL_PDF_URL.format(book_id=book_id),
            },
            'issued': row.get('Issued'),
        }

    def request_with_retries(self, url, label):
        last_error = None
        for attempt in range(1, self.REQUEST_ATTEMPTS + 1):
            try:
                response = requests.get(
                    url,
                    headers=self.REQUEST_HEADERS,
                    timeout=self.REQUEST_TIMEOUT,
                    stream=url != self.OFFICIAL_CATALOG_URL,
                )
                response.raise_for_status()
                return response
            except requests.RequestException as exc:
                last_error = exc
                if attempt < self.REQUEST_ATTEMPTS:
                    delay = self.BACKOFF_SECONDS * (2 ** (attempt - 1))
                    self.stdout.write(self.style.WARNING(
                        f'{label} attempt {attempt}/{self.REQUEST_ATTEMPTS} failed; retrying in {delay}s.'
                    ))
                    time.sleep(delay)

        raise last_error

    def import_book(self, metadata, category):
        title = self.clean_text(metadata.get('title')) or 'Untitled Gutenberg Book'
        authors = metadata.get('authors') or []
        author_names = [self.clean_text(author.get('name')) for author in authors]
        author_names = [name for name in author_names if name]
        author = ', '.join(author_names) or 'Unknown'
        description = self.build_description(metadata)
        published_date = self.parse_publication_date(metadata)

        book = Book(
            title=title[:255],
            author=author[:255],
            category=category,
            description=description,
            cover_image_url=self.cover_url(metadata),
            published_date=published_date,
            audio_file=None,
            audio_url=None,
        )

        pdf_uploaded = False
        with tempfile.NamedTemporaryFile(prefix='gutenberg_', suffix='.pdf', delete=False) as temporary:
            temporary_path = temporary.name

        try:
            self.download_pdf(metadata, temporary_path)
            with open(temporary_path, 'rb') as pdf_handle:
                filename = f'{slugify(title)[:180] or "gutenberg-book"}.pdf'
                book.pdf_file.save(filename, File(pdf_handle), save=False)
            pdf_uploaded = True

            with transaction.atomic():
                book.save()
                stored_url = self.stored_file_url(book)
                book.pdf_url = stored_url
                book.save(update_fields=['pdf_url'])
        finally:
            if os.path.exists(temporary_path):
                os.remove(temporary_path)

        return book, pdf_uploaded

    def download_pdf(self, metadata, path):
        last_error = None
        for url in self.pdf_urls(metadata):
            try:
                response = self.request_with_retries(url, 'Gutenberg PDF download')
                self.write_pdf_response(response, path)
                return url
            except (requests.RequestException, ValueError) as exc:
                last_error = exc
                self.stdout.write(self.style.WARNING(
                    f'PDF unavailable for Gutenberg ID {metadata.get("id")}: {exc}'
                ))

        raise last_error or ValueError('No usable Gutenberg PDF URL was found')

    def write_pdf_response(self, response, path):
        content_type = response.headers.get('Content-Type', '').lower()
        first_chunk = next(response.iter_content(chunk_size=8 * 1024), b'')
        if not first_chunk.startswith(b'%PDF-') and 'application/pdf' not in content_type:
            raise ValueError('Gutenberg format URL did not return a PDF')

        with open(path, 'wb') as output:
            output.write(first_chunk)
            for chunk in response.iter_content(chunk_size=64 * 1024):
                if chunk:
                    output.write(chunk)

    def pdf_urls(self, metadata):
        direct_url = self.pdf_url(metadata)
        urls = [direct_url] if direct_url else []
        book_id = metadata.get('id')
        if book_id:
            urls.extend([
                self.OFFICIAL_PDF_URL.format(book_id=book_id),
                f'https://www.gutenberg.org/cache/epub/{book_id}/pg{book_id}.pdf',
            ])
        return list(dict.fromkeys(url for url in urls if url))

    @staticmethod
    def pdf_url(metadata):
        formats = metadata.get('formats') or {}
        direct_url = formats.get('application/pdf')
        if direct_url:
            return direct_url
        for content_type, url in formats.items():
            if content_type.lower().startswith('application/pdf') and url:
                return url
        return None

    @staticmethod
    def cover_url(metadata):
        formats = metadata.get('formats') or {}
        return formats.get('image/jpeg') or formats.get('image/png')

    @staticmethod
    def is_duplicate(title, gutenberg_id=None):
        title_match = Q(title__iexact=title.strip())
        if gutenberg_id:
            id_match = Q(description__icontains=f'Project Gutenberg ID: {gutenberg_id}')
            return Book.objects.filter(title_match | id_match).exists()
        return Book.objects.filter(title_match).exists()

    @staticmethod
    def stored_file_url(book):
        try:
            return book.pdf_file.url if book.pdf_file else None
        except Exception as exc:
            raise ValueError(f'Cloudinary PDF URL could not be resolved: {exc}')

    @staticmethod
    def clean_text(value):
        return ' '.join(str(value or '').split()).strip()

    def build_description(self, metadata):
        gutenberg_id = metadata.get('id')
        languages = ', '.join(metadata.get('languages') or []) or 'en'
        subjects = ', '.join(metadata.get('subjects') or [])
        bookshelves = ', '.join(metadata.get('bookshelves') or [])
        copyright_status = metadata.get('copyright')

        lines = [
            f'Project Gutenberg ID: {gutenberg_id}' if gutenberg_id else None,
            f'Language: {languages}',
            f'Copyright: {"Yes" if copyright_status else "Public domain"}',
            f'Subjects: {subjects}' if subjects else None,
            f'Bookshelves: {bookshelves}' if bookshelves else None,
        ]
        return '\n'.join(line for line in lines if line)[:10000]

    @staticmethod
    def parse_publication_date(metadata):
        value = metadata.get('publication_date') or metadata.get('issued')
        if not value:
            return None
        try:
            return datetime.strptime(value[:10], '%Y-%m-%d').date()
        except (TypeError, ValueError):
            return None

    def write_summary(self, created, skipped, failed, pdfs_uploaded):
        self.stdout.write('')
        self.stdout.write(self.style.SUCCESS('Gutenberg import complete.'))
        self.stdout.write(f'Created: {created}')
        self.stdout.write(f'Skipped: {skipped}')
        self.stdout.write(f'Failed: {failed}')
        self.stdout.write(f'PDFs successfully uploaded: {pdfs_uploaded}')
