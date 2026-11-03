import unicodedata

from django.core.management.base import BaseCommand

from library.models import Book, Category


AUDIOBOOKS = [
    {
        "title": "The Adventures of Sherlock Holmes",
        "author": "Sir Arthur Conan Doyle",
        "description": "A collection of Sherlock Holmes mysteries narrated through Dr. Watson's accounts of their investigations.",
        "archive_id": "adventuressherlockholmes_v4_1501_librivox",
        "audio_file": "adventuresofsherlockholmes_01_doyle_64kb.mp3",
    },
    {
        "title": "Frankenstein",
        "author": "Mary Shelley",
        "description": "Victor Frankenstein creates a living being and faces the consequences of his attempt to overcome the limits of nature.",
        "archive_id": "frankenstein1831_tac_librivox",
        "audio_file": "frankenstein_00_shelley_64kb.mp3",
    },
    {
        "title": "Dracula",
        "author": "Bram Stoker",
        "description": "An epistolary gothic novel about Count Dracula's attempt to establish himself in England and the people who oppose him.",
        "archive_id": "dracula_v4_1903_librivox",
        "audio_file": "dracula_v4_01_stoker_64kb.mp3",
    },
    {
        "title": "Jane Eyre",
        "author": "Charlotte Bronte",
        "description": "Jane Eyre's journey from an unhappy childhood to independence, love, and self-knowledge.",
        "archive_id": "jane_eyre_librivox",
        "audio_file": "jane_eyre_00_bronte_64kb.mp3",
    },
    {
        "title": "The Time Machine",
        "author": "H. G. Wells",
        "description": "A Victorian inventor travels far into the future and discovers how humanity and Earth have changed.",
        "archive_id": "thetimemachine_2004_librivox",
        "audio_file": "thetimemachine_01_wells_64kb.mp3",
    },
    {
        "title": "The Secret Garden",
        "author": "Frances Hodgson Burnett",
        "description": "After moving to Yorkshire, Mary Lennox discovers a hidden garden and helps bring new life to the people around her.",
        "archive_id": "secret_garden_1105_librivox",
        "audio_file": "secretgarden_01_burnett_64kb.mp3",
    },
    {
        "title": "The Wonderful Wizard of Oz",
        "author": "L. Frank Baum",
        "description": "Dorothy and her dog Toto travel through Oz and seek the Wizard's help to find their way home.",
        "archive_id": "wonderfulwizardofoz5_1701_librivox",
        "audio_file": "wonderfulwizardofoz_01_baum_64kb.mp3",
    },
    {
        "title": "The Picture of Dorian Gray",
        "author": "Oscar Wilde",
        "description": "A young man's portrait bears the marks of his corruption while he remains outwardly unchanged.",
        "archive_id": "picture_of_dorian_gray_2107_librivox",
        "audio_file": "pictureofdoriangray_01_wilde_64kb.mp3",
    },
    {
        "title": "A Tale of Two Cities",
        "author": "Charles Dickens",
        "description": "A story of sacrifice, loyalty, and revolution set in London and Paris during the French Revolution.",
        "archive_id": "taleoftwocities_2104_librivox",
        "audio_file": "taleoftwocities_01_dickens_64kb.mp3",
    },
    {
        "title": "Moby Dick",
        "author": "Herman Melville",
        "description": "Ishmael joins Captain Ahab's obsessive voyage across the sea in pursuit of the white whale Moby Dick.",
        "archive_id": "moby_dick_librivox",
        "audio_file": "mobydick_000_melville_64kb.mp3",
    },
]


class Command(BaseCommand):
    help = "Add or update ten public-domain LibriVox audiobooks."

    @staticmethod
    def normalized_author(value):
        value = unicodedata.normalize("NFKD", value)
        return "".join(char for char in value if not unicodedata.combining(char)).casefold()

    def handle(self, *args, **options):
        category, _ = Category.objects.get_or_create(
            name="Audio Books",
            defaults={"description": "Public-domain audiobooks from LibriVox."},
        )

        created = 0
        updated = 0
        for audiobook in AUDIOBOOKS:
            audio_url = (
                f"https://archive.org/download/{audiobook['archive_id']}/"
                f"{audiobook['audio_file']}"
            )
            cover_url = f"https://archive.org/services/img/{audiobook['archive_id']}"
            book = next(
                (
                    candidate
                    for candidate in Book.objects.filter(
                        title__iexact=audiobook["title"]
                    ).order_by("id")
                    if self.normalized_author(candidate.author)
                    == self.normalized_author(audiobook["author"])
                ),
                None,
            )
            if book is None:
                book = Book(
                    title=audiobook["title"],
                    author=audiobook["author"],
                )
                created += 1
            else:
                updated += 1

            book.category = category
            book.description = audiobook["description"]
            book.cover_image_url = cover_url
            book.audio_url = audio_url
            book.save()

        self.stdout.write(
            self.style.SUCCESS(
                f"Seeded {len(AUDIOBOOKS)} audiobooks ({created} created, {updated} updated)."
            )
        )
