from django.contrib.auth import get_user_model
from django.conf import settings
from django.urls import reverse
from rest_framework.test import APITestCase

from .models import ActivityLog, Book, Category, Comment, UserActivity
from .serializers import BookSerializer


class CommentDeletionPermissionTests(APITestCase):
    def setUp(self):
        user_model = get_user_model()
        self.author = user_model.objects.create_user(
            username="comment-author",
            password="test-password",
        )
        self.other_user = user_model.objects.create_user(
            username="other-user",
            password="test-password",
        )
        self.admin = user_model.objects.create_user(
            username="comment-admin",
            password="test-password",
            is_staff=True,
        )
        self.book = Book.objects.create(title="Test Book", author="Test Author")
        self.comment = Comment.objects.create(
            book=self.book,
            user_name=self.author.username,
            comment_text="A useful review",
            rating=5,
        )
        self.url = reverse("api-delete-comment", kwargs={"id": self.comment.id})

    def test_anonymous_user_cannot_delete_comment(self):
        response = self.client.delete(self.url)

        self.assertEqual(response.status_code, 401)
        self.assertTrue(Comment.objects.filter(id=self.comment.id).exists())

    def test_non_author_cannot_delete_comment(self):
        self.client.force_authenticate(user=self.other_user)

        response = self.client.delete(self.url)

        self.assertEqual(response.status_code, 403)
        self.assertTrue(Comment.objects.filter(id=self.comment.id).exists())

    def test_comment_author_can_delete_comment(self):
        self.client.force_authenticate(user=self.author)

        response = self.client.delete(self.url)

        self.assertEqual(response.status_code, 204)
        self.assertFalse(Comment.objects.filter(id=self.comment.id).exists())

    def test_staff_user_can_delete_comment(self):
        self.client.force_authenticate(user=self.admin)

        response = self.client.delete(self.url)

        self.assertEqual(response.status_code, 204)
        self.assertFalse(Comment.objects.filter(id=self.comment.id).exists())


class ActivityTrackingPermissionTests(APITestCase):
    def setUp(self):
        user_model = get_user_model()
        self.user = user_model.objects.create_user(
            username="activity-user",
            password="test-password",
        )
        self.url = reverse("api-track-activity")

    def test_anonymous_user_cannot_track_activity(self):
        response = self.client.post(self.url, {"event": "pdf_open"}, format="json")

        self.assertEqual(response.status_code, 401)
        self.assertFalse(ActivityLog.objects.exists())

    def test_activity_uses_authenticated_username(self):
        self.client.force_authenticate(user=self.user)

        response = self.client.post(
            self.url,
            {"event": "pdf_open", "user": "another-user"},
            format="json",
        )

        self.assertEqual(response.status_code, 201)
        self.assertTrue(
            ActivityLog.objects.filter(
                event_type="pdf_open",
                user_identifier=self.user.username,
            ).exists()
        )
        self.assertFalse(ActivityLog.objects.filter(user_identifier="another-user").exists())
        self.assertEqual(
            UserActivity.objects.get(user_identifier=self.user.username).pdf_opened,
            1,
        )

    def test_invalid_activity_event_is_rejected(self):
        self.client.force_authenticate(user=self.user)

        response = self.client.post(self.url, {"event": "unknown"}, format="json")

        self.assertEqual(response.status_code, 400)
        self.assertFalse(ActivityLog.objects.exists())


class BookApiIntegrationTests(APITestCase):
    def setUp(self):
        self.category = Category.objects.create(name="Testing")
        self.book = Book.objects.create(
            title="Uploaded Admin Book",
            author="Test Author",
            category=self.category,
            pdf_url="https://cdn.example.test/books/admin-book.pdf",
            cover_image_url="/media/books/covers/admin-book.jpg",
        )

    def test_book_serializer_prefers_pdf_file_and_falls_back_to_pdf_url(self):
        serializer = BookSerializer(self.book)
        data = serializer.data

        self.assertEqual(data["pdf"], self.book.pdf_url)
        self.assertEqual(data["pdf_url"], self.book.pdf_url)
        self.assertEqual(data["cover_image"], self.book.cover_image_url)

    def test_local_cover_uses_media_url_instead_of_cloudinary_storage_url(self):
        book = Book.objects.create(
            title="Local Cover Book",
            author="Test Author",
            cover_image="books/covers/download_1_Rzfnmn4.jpeg",
            cover_image_url=(
                "https://res.cloudinary.com/dmihwrfpm/image/upload/v1/"
                "media/books/covers/download_1_Rzfnmn4.jpeg"
            ),
        )

        data = BookSerializer(book).data

        self.assertEqual(
            data["cover_image"],
            f"{settings.MEDIA_URL}books/covers/download_1_Rzfnmn4.jpeg",
        )
        self.assertEqual(data["cover_image_url"], data["cover_image"])

    def test_local_cover_media_url_is_served_when_debug_is_false(self):
        book = Book.objects.create(
            title="Served Local Cover",
            author="Test Author",
            cover_image="books/covers/download_1_Rzfnmn4.jpeg",
        )

        response = self.client.get(BookSerializer(book).data["cover_image"])

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response["Content-Type"], "image/jpeg")

    def test_missing_local_cover_does_not_fall_back_to_cloudinary_path(self):
        book = Book.objects.create(
            title="Missing Local Cover",
            author="Test Author",
            cover_image="books/covers/missing-cover.jpeg",
            cover_image_url=(
                "https://res.cloudinary.com/dmihwrfpm/image/upload/v1/"
                "media/books/covers/missing-cover.jpeg"
            ),
        )

        self.assertIsNone(BookSerializer(book).data["cover_image"])

    def test_public_books_endpoint_returns_normalized_book_fields(self):
        response = self.client.get(reverse("api-books-list"))

        self.assertEqual(response.status_code, 200)
        payload = response.data["results"]
        self.assertEqual(len(payload), 1)
        self.assertEqual(payload[0]["title"], self.book.title)
        self.assertEqual(payload[0]["pdf"], self.book.pdf_url)
        self.assertEqual(payload[0]["category"]["name"], self.category.name)

    def test_search_endpoint_returns_admin_uploaded_book(self):
        response = self.client.get(reverse("api-search"), {"q": "Uploaded Admin"})

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data[0]["id"], self.book.id)
        self.assertEqual(response.data[0]["pdf_url"], self.book.pdf_url)
