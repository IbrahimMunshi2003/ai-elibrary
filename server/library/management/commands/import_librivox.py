import os
import re
import tempfile
import time
import unicodedata
from difflib import SequenceMatcher
from xml.etree import ElementTree

import requests
from django.core.files import File
from django.core.management.base import BaseCommand
from django.db import transaction
from django.db.models import Q
from django.utils.text import slugify

from library.models import Book


class Command(BaseCommand):
    help = 'Attach real LibriVox MP3 audiobooks to existing books'

    LIBRIVOX_API_URL = 'https://librivox.org/api/feed/audiobooks/'
    REQUEST_TIMEOUT = 30
    REQUEST_ATTEMPTS = 3
    BACKOFF_SECONDS = 1
    REQUEST_HEADERS = {'User-Agent': 'AI-ELibrary LibriVox importer/1.0'}

    def add_arguments(self, parser):
        parser.add_argument(
            '--count',
            type=int,
            default=30,
            help='Number of new audiobook updates to complete (default: 30)',
        )

    def handle(self, *args, **options):
        count = options['count']
        if count < 1:
            self.stderr.write(self.style.ERROR('--count must be at least 1.'))
            return

        updated = 0
        skipped = 0
        failed = 0
        uploaded = 0
        candidates = self.candidate_books()

        for position, book in enumerate(candidates, start=1):
            if updated >= count:
                break

            self.stdout.write(f'[{position}/{len(candidates)}] {book.title}')
            try:
                if self.has_audio(book):
                    skipped += 1
                    self.stdout.write(self.style.WARNING('Skipped: audiobook already exists.'))
                    continue

                match = self.find_match(book)
                if not match:
                    skipped += 1
                    self.stdout.write(self.style.WARNING('Skipped: no reliable LibriVox match.'))
                    continue

                self.stdout.write('Audiobook found')
                self.attach_audiobook(book, match)
                updated += 1
                uploaded += 1
                self.stdout.write('Downloaded')
                self.stdout.write('Uploaded to Cloudinary')
                self.stdout.write('Book updated')
            except Exception as exc:
                failed += 1
                self.stdout.write(self.style.ERROR(f'Failed: {exc}'))

        if updated < count:
            self.stdout.write(self.style.WARNING(
                f'Only {updated} new audiobook updates completed; {count - updated} requested.'
            ))

        self.stdout.write('')
        self.stdout.write(self.style.SUCCESS('Audiobooks import complete.'))
        self.stdout.write(f'Updated: {updated}')
        self.stdout.write(f'Skipped: {skipped}')
        self.stdout.write(f'Failed: {failed}')
        self.stdout.write(f'Uploaded to Cloudinary: {uploaded}')

    def candidate_books(self):
        no_audio = (
            (Q(audio_file__isnull=True) | Q(audio_file=''))
            & (Q(audio_url__isnull=True) | Q(audio_url=''))
        )
        gutenberg = Q(description__icontains='Project Gutenberg ID:')
        preferred = list(Book.objects.filter(no_audio & gutenberg).order_by('id'))
        fallback = Book.objects.filter(no_audio).exclude(
            id__in=[book.id for book in preferred]
        ).order_by('id')
        return preferred + list(fallback)

    @staticmethod
    def has_audio(book):
        return bool(book.audio_file or (book.audio_url and book.audio_url.strip()))

    def find_match(self, book):
        params = [('format', 'json'), ('title', book.title)]

        try:
            response = self.request_with_retries(
                self.LIBRIVOX_API_URL,
                params=params,
                label=f'LibriVox search for {book.title}',
            )
        except requests.HTTPError as exc:
            if exc.response is not None and exc.response.status_code == 404:
                return None
            raise
        results = response.json().get('books', [])
        ranked = []
        for result in results:
            score = self.match_score(book, result)
            if score >= 0.72:
                ranked.append((score, result))

        for score, result in sorted(ranked, key=lambda item: item[0], reverse=True):
            mp3_url = self.resolve_mp3_url(result)
            if mp3_url:
                result['_mp3_url'] = mp3_url
                return result
        return None

    def match_score(self, book, result):
        book_title = self.normalized(book.title)
        lv_title = self.normalized(result.get('title'))
        title_score = SequenceMatcher(None, book_title, lv_title).ratio()
        if book_title in lv_title or lv_title in book_title:
            title_score = max(title_score, 0.9)

        book_author = self.author_tokens(book.author)
        lv_author = self.author_tokens(result.get('authors'))
        if book_author and lv_author:
            author_score = len(book_author & lv_author) / max(len(book_author), len(lv_author))
        else:
            author_score = 0.5

        return (title_score * 0.75) + (author_score * 0.25)

    def attach_audiobook(self, book, match):
        mp3_url = match.get('_mp3_url')
        if not mp3_url:
            raise ValueError('LibriVox record has no downloadable MP3')

        temporary_path = None
        try:
            with tempfile.NamedTemporaryFile(prefix='librivox_', suffix='.mp3', delete=False) as temporary:
                temporary_path = temporary.name
            self.download_mp3(mp3_url, temporary_path)

            filename = f'{slugify(book.title)[:180] or "audiobook"}.mp3'
            with open(temporary_path, 'rb') as audio_handle:
                book.audio_file.save(filename, File(audio_handle), save=False)

            with transaction.atomic():
                book.save()
                stored_url = self.stored_audio_url(book)
                if not stored_url:
                    raise ValueError('Cloudinary returned no audiobook URL')
                book.audio_url = stored_url
                book.save(update_fields=['audio_url'])
        finally:
            if temporary_path and os.path.exists(temporary_path):
                os.remove(temporary_path)

    def download_mp3(self, url, path):
        response = self.request_with_retries(url, params=None, label='LibriVox MP3 download', stream=True)
        content_type = response.headers.get('Content-Type', '').lower()
        first_chunk = next(response.iter_content(chunk_size=64 * 1024), b'')
        if not first_chunk or (
            not first_chunk.startswith(b'ID3')
            and not first_chunk.startswith(b'\xff\xfb')
            and 'audio/mpeg' not in content_type
            and 'audio/mp3' not in content_type
        ):
            raise ValueError('LibriVox URL did not return an MP3 file')

        with open(path, 'wb') as output:
            output.write(first_chunk)
            for chunk in response.iter_content(chunk_size=256 * 1024):
                if chunk:
                    output.write(chunk)

    def request_with_retries(self, url, params, label, stream=False):
        last_error = None
        for attempt in range(1, self.REQUEST_ATTEMPTS + 1):
            try:
                response = requests.get(
                    url,
                    params=params,
                    headers=self.REQUEST_HEADERS,
                    timeout=self.REQUEST_TIMEOUT,
                    stream=stream,
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

    def resolve_mp3_url(self, result):
        for key in ('url_mp3', 'url_audio'):
            url = result.get(key)
            if url and '.mp3' in url.lower():
                return url

        rss_url = result.get('url_rss')
        if not rss_url:
            return None
        try:
            response = self.request_with_retries(
                rss_url,
                params=None,
                label='LibriVox RSS feed',
            )
            root = ElementTree.fromstring(response.content)
        except (requests.RequestException, ElementTree.ParseError):
            return None

        for enclosure in root.findall('.//enclosure'):
            url = enclosure.attrib.get('url', '')
            if '.mp3' in url.lower():
                return url
        return None

    @staticmethod
    def stored_audio_url(book):
        try:
            return book.audio_file.url if book.audio_file else None
        except Exception as exc:
            raise ValueError(f'Cloudinary returned no audiobook URL: {exc}')

    @staticmethod
    def clean_text(value):
        return ' '.join(str(value or '').split()).strip()

    @staticmethod
    def normalized(value):
        value = unicodedata.normalize('NFKD', str(value or ''))
        value = ''.join(char for char in value if not unicodedata.combining(char))
        value = value.lower().replace('&', ' and ')
        value = re.sub(r'\b(the|a|an)\b', ' ', value)
        return re.sub(r'[^a-z0-9]+', ' ', value).strip()

    @classmethod
    def author_tokens(cls, value):
        if isinstance(value, list):
            value = ' '.join(
                f'{author.get("first_name", "")} {author.get("last_name", "")}'
                for author in value
                if isinstance(author, dict)
            )
        return set(cls.normalized(value).split()) - {'unknown'}

    def write_summary(self, updated, skipped, failed, uploaded):
        self.stdout.write('')
        self.stdout.write(self.style.SUCCESS('Audiobooks import complete.'))
        self.stdout.write(f'Updated: {updated}')
        self.stdout.write(f'Skipped: {skipped}')
        self.stdout.write(f'Failed: {failed}')
        self.stdout.write(f'Uploaded to Cloudinary: {uploaded}')
