import os
import django
import sys

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

import cloudinary
import cloudinary.api
from library.models import Book

def sync_cloudinary():
    print("Fetching resources from Cloudinary...")
    try:
        resources = []
        for r_type in ["image", "raw", "video"]:
            next_cursor = None
            while True:
                response = cloudinary.api.resources(
                    type="upload",
                    prefix="media/books/",
                    max_results=500,
                    next_cursor=next_cursor,
                    resource_type=r_type
                )
                resources.extend(response.get('resources', []))
                next_cursor = response.get('next_cursor')
                if not next_cursor:
                    break

        print(f"Found {len(resources)} resources in Cloudinary.")

        books = Book.objects.all()
        for book in books:
            updated = False
            title_clean = "".join([c for c in book.title.lower() if c.isalnum()])
            
            for r in resources:
                public_id = r['public_id']
                r_type = r['resource_type']
                format = r.get('format', '')
                
                # Check if public_id contains the book title
                id_clean = "".join([c for c in public_id.split('/')[-1].lower() if c.isalnum()])
                
                # We need a decent match. 
                # e.g., title: "The Nostradamus Enigma", public_id: "media/books/pdfs/TheNostradamusEnigma"
                if len(title_clean) > 3 and (title_clean in id_clean or id_clean in title_clean):
                    if r_type == 'image' or format in ['jpg', 'png', 'jpeg']:
                        if str(book.cover_image) != public_id:
                            book.cover_image = public_id
                            updated = True
                    elif r_type == 'raw' and format == 'pdf':
                        if str(book.pdf_file) != public_id:
                            book.pdf_file = public_id
                            updated = True
                    elif r_type == 'video' or format in ['mp3', 'wav']:
                        if str(book.audio_file) != public_id:
                            book.audio_file = public_id
                            updated = True

            if updated:
                book.save()
                print(f"Updated Book: {book.title}")
                
        print("Sync complete.")
    except Exception as e:
        print(f"Error syncing Cloudinary: {e}")

if __name__ == "__main__":
    sync_cloudinary()
