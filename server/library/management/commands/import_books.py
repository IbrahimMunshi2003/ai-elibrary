import os
import requests
import time
from urllib.parse import quote
from django.core.management.base import BaseCommand
from django.core.files.base import ContentFile
from django.utils.text import slugify
from library.models import Book, Category

class Command(BaseCommand):
    help = 'Bulk import free books from Google Books and Project Gutenberg'

    def add_arguments(self, parser):
        parser.add_argument('--query', type=str, help='Search term for specific categories')
        parser.add_argument('--limit', type=int, default=20, help='Total limit of books to import')

    def handle(self, *args, **options):
        query_param = options.get('query')
        total_limit = options.get('limit')
        
        # Default categories based on user requirements if no specific query provided
        categories = [query_param] if query_param else ["computer science", "artificial intelligence", "history", "religion", "science"]
        
        books_imported = 0

        self.stdout.write(self.style.SUCCESS('Starting bulk import...'))

        for category_name in categories:
            if books_imported >= total_limit:
                break
                
            self.stdout.write(f"Searching for books in: {category_name}...")
            
            # Fetch from Google Books API
            google_books = self.fetch_google_books(category_name)
            
            for g_book in google_books:
                if books_imported >= total_limit:
                    break
                    
                title = g_book.get('title')
                if not title:
                    continue
                    
                # Check for duplicates
                if Book.objects.filter(title__iexact=title).exists():
                    self.stdout.write(f"  ✗ Skipped (Already Exists): {title}")
                    continue

                # Prepare Book data
                authors = ", ".join(g_book.get('authors', ['Unknown']))
                description = g_book.get('description', '')
                cover_url = g_book.get('thumbnail')
                
                # Fetch category object
                category_obj, _ = Category.objects.get_or_create(name=category_name.capitalize())

                # Create the book instance early (without files first)
                book = Book(
                    title=title,
                    author=authors,
                    description=description,
                    category=category_obj,
                    cover_image_url=cover_url
                )

                # Attempt to find PDF on Gutenberg
                pdf_content, pdf_filename = self.fetch_gutenberg_pdf(title, authors)
                
                # Download Cover Image locally if available
                cover_content, cover_filename = self.download_image(cover_url, title)

                # Save files if downloaded
                if pdf_content:
                    book.pdf_file.save(pdf_filename, ContentFile(pdf_content), save=False)
                    self.stdout.write(self.style.SUCCESS(f"  ✓ PDF Attached: {title}"))
                
                if cover_content:
                    book.cover_image.save(cover_filename, ContentFile(cover_content), save=False)

                try:
                    book.save()
                    books_imported += 1
                    self.stdout.write(self.style.SUCCESS(f"✓ Book Added: {title}"))
                except Exception as e:
                    self.stdout.write(self.style.ERROR(f"  ✗ Error saving {title}: {str(e)}"))

        self.stdout.write(self.style.SUCCESS(f"Import complete! Total books added: {books_imported}"))

    def fetch_google_books(self, query):
        """Fetches metadata from Google Books API."""
        url = f"https://www.googleapis.com/books/v1/volumes?q={quote(query)}&maxResults=10"
        try:
            response = requests.get(url, timeout=10)
            response.raise_for_status()
            data = response.json()
            results = []
            for item in data.get('items', []):
                v_info = item.get('volumeInfo', {})
                results.append({
                    'title': v_info.get('title'),
                    'authors': v_info.get('authors', []),
                    'description': v_info.get('description', ''),
                    'thumbnail': v_info.get('imageLinks', {}).get('thumbnail'),
                    'publishedDate': v_info.get('publishedDate')
                })
            return results
        except Exception as e:
            self.stdout.write(self.style.WARNING(f"Google Books API Error: {str(e)}"))
            return []

    def fetch_gutenberg_pdf(self, title, authors):
        """Attempts to find and download a PDF from Project Gutenberg via Gutendex."""
        # 1. Search Gutendex
        search_query = f"{title} {authors}"
        gutendex_url = f"https://gutendex.com/books?search={quote(title)}"
        
        try:
            res = requests.get(gutendex_url, timeout=10)
            res.raise_for_status()
            results = res.json().get('results', [])
            
            if not results:
                return None, None

            # Narrow down results (check title similarity)
            match = results[0] # Take first match for simplicity
            formats = match.get('formats', {})
            g_id = match.get('id')
            
            # 2. Try direct PDF from formats
            pdf_url = formats.get('application/pdf')
            
            # 3. Fallback: Construct standard Gutenberg PDF URL if ID is known
            if not pdf_url and g_id:
                # Common pattern: https://www.gutenberg.org/ebooks/{id}.pdf.noimages
                pdf_url = f"https://www.gutenberg.org/ebooks/{g_id}.pdf.noimages"

            if pdf_url:
                # Verify and download
                pdf_res = requests.get(pdf_url, timeout=15, stream=True)
                if pdf_res.status_code == 200:
                    ext = ".pdf"
                    filename = f"{slugify(title[:50])}{ext}"
                    return pdf_res.content, filename
                    
        except Exception as e:
            self.stdout.write(self.style.WARNING(f"  Gutenberg search error for {title}: {str(e)}"))
            
        return None, None

    def download_image(self, url, title):
        """Downloads an image from a URL."""
        if not url:
            return None, None
        try:
            res = requests.get(url, timeout=10)
            if res.status_code == 200:
                ext = ".jpg" # Default to jpg for thumbnails
                filename = f"{slugify(title[:50])}{ext}"
                return res.content, filename
        except Exception:
            pass
        return None, None
