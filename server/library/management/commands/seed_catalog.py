from django.core.management.base import BaseCommand
from django.core.management import call_command
from django.db import transaction

from library.models import Book, Category


BOOKS = [
    ("Ancient History", "The Histories", "Herodotus", 2707),
    ("Ancient History", "The Decline and Fall of the Roman Empire", "Edward Gibbon", 25717),
    ("World History", "The Outline of History", "H. G. Wells", 45368),
    ("World History", "The Story of Mankind", "Hendrik Willem van Loon", 754),
    ("Indian History", "The Discovery of India", "Jawaharlal Nehru", None),
    ("Indian History", "India: What Can It Teach Us?", "Friedrich Max Muller", 3287),
    ("Physics", "Six Easy Pieces", "Richard Feynman", None),
    ("Physics", "Relativity: The Special and General Theory", "Albert Einstein", 30155),
    ("Chemistry", "The Story of Alchemy and the Beginnings of Chemistry", "M. M. Pattison Muir", 14218),
    ("Biology", "The Origin of Species", "Charles Darwin", 2009),
    ("Space & Astronomy", "The Story of the Heavens", "Robert Stawell Ball", 26831),
    ("Quran", "The Qur'an", "Muhammad Marmaduke Pickthall", None),
    ("Hadith", "Forty Hadith of Imam Nawawi", "Imam Nawawi", None),
    ("Seerah", "The Life of Muhammad", "Muhammad Husayn Haykal", None),
    ("Islamic History", "The History of the Khalifas", "Jalaluddin as-Suyuti", None),
    ("Islamic Books", "The Book of Assistance", "Imam Abdullah ibn Alawi al-Haddad", None),
    (
        "Superhero Comics",
        "The Adventures of Sherlock Holmes (Illustrated Edition)",
        "Arthur Conan Doyle",
        1661,
    ),
    (
        "Manga",
        "The Wonderful Wizard of Oz (Illustrated Edition)",
        "L. Frank Baum",
        55,
    ),
    ("Kids Comics", "Alice's Adventures in Wonderland", "Lewis Carroll", 11),
    ("Fantasy", "The Wonderful Wizard of Oz (Fantasy Edition)", "L. Frank Baum", 55),
    ("Mystery", "The Moonstone", "Wilkie Collins", 155),
    ("Thriller", "The Thirty-Nine Steps", "John Buchan", 558),
    ("Romance", "Pride and Prejudice", "Jane Austen", 1342),
    ("Programming", "Think Python", "Allen B. Downey", 2014),
    ("Mathematics", "The Elements", "Euclid", 21076),
    ("Computer Science", "The Art of Computer Programming", "Donald Knuth", None),
    ("Biography", "The Autobiography of Benjamin Franklin", "Benjamin Franklin", 20203),
    ("Biography", "The Story of My Experiments with Truth", "Mahatma Gandhi", None),
    ("Technology", "The Art of Computer Programming", "Donald Knuth", None),
    ("Technology", "The Practice of Programming", "Brian Kernighan and Rob Pike", None),
]

AUDIOBOOKS = [
    ("The Adventures of Sherlock Holmes", "Sir Arthur Conan Doyle"),
    ("Frankenstein", "Mary Shelley"),
    ("Dracula", "Bram Stoker"),
    ("Jane Eyre", "Charlotte Bronte"),
    ("The Time Machine", "H. G. Wells"),
    ("The Secret Garden", "Frances Hodgson Burnett"),
    ("The Wonderful Wizard of Oz", "L. Frank Baum"),
    ("The Picture of Dorian Gray", "Oscar Wilde"),
    ("A Tale of Two Cities", "Charles Dickens"),
    ("Moby Dick", "Herman Melville"),
]


class Command(BaseCommand):
    help = "Populate the hierarchical navbar categories with idempotent book records."

    @staticmethod
    def gutenberg_url(gutenberg_id):
        return (
            f"https://www.gutenberg.org/ebooks/{gutenberg_id}"
            if gutenberg_id
            else None
        )

    @staticmethod
    def cover_url(gutenberg_id):
        return (
            f"https://www.gutenberg.org/cache/epub/{gutenberg_id}/"
            f"pg{gutenberg_id}.cover.medium.jpg"
            if gutenberg_id
            else None
        )

    @staticmethod
    def description(title, author, source_url):
        if source_url:
            return (
                f"{title} by {author}. Public-domain text available from "
                f"Project Gutenberg: {source_url}"
            )
        return (
            f"{title} by {author}. Catalog record only; no verified public-domain "
            "download is attached."
        )

    @staticmethod
    def find_book(title, author):
        return (
            Book.objects.filter(title__iexact=title, author__iexact=author)
            .order_by("id")
            .first()
        )

    @transaction.atomic
    def handle(self, *args, **options):
        call_command("seed_audiobooks")
        created = 0
        updated = 0
        categories_created = 0

        for category_name, title, author, gutenberg_id in BOOKS:
            category, category_was_created = Category.objects.get_or_create(
                name=category_name,
                defaults={"description": f"{category_name} books."},
            )
            categories_created += int(category_was_created)
            source_url = self.gutenberg_url(gutenberg_id)
            book = self.find_book(title, author)
            if book is None:
                book = Book(title=title, author=author)
                created += 1
            else:
                updated += 1

            book.category = category
            book.description = self.description(title, author, source_url)
            if source_url:
                book.pdf_url = source_url
                book.cover_image_url = self.cover_url(gutenberg_id)
            book.save()

        audio_category, category_was_created = Category.objects.get_or_create(
            name="Audio Books",
            defaults={"description": "Public-domain audiobooks from LibriVox."},
        )
        categories_created += int(category_was_created)
        audio_found = 0
        for title, author in AUDIOBOOKS:
            book = self.find_book(title, author)
            if book is not None:
                if book.category_id != audio_category.id:
                    book.category = audio_category
                    book.save(update_fields=["category"])
                audio_found += 1

        self.stdout.write(
            self.style.SUCCESS(
                f"Catalog seed complete: {created} created, {updated} updated, "
                f"{categories_created} categories created, {audio_found}/10 "
                "existing audiobooks retained."
            )
        )
