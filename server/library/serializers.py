import os
from urllib.parse import quote

from django.conf import settings
from rest_framework import serializers
from django.contrib.auth.models import User
from django.db.models import Avg
from .models import Book, Category, Bookmark, Collection, ReadingHistory, Comment, ActivityLog

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'first_name', 'last_name']

class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = ['id', 'name', 'description']

class CommentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Comment
        fields = ['id', 'book', 'user_name', 'comment_text', 'rating', 'created_at']

    def validate_comment_text(self, value):
        if not str(value).strip():
            raise serializers.ValidationError("Comment text cannot be empty.")
        return value

class BookSerializer(serializers.ModelSerializer):
    category = CategorySerializer(read_only=True)
    average_rating = serializers.SerializerMethodField()
    comment_count = serializers.SerializerMethodField()

    cover_image = serializers.SerializerMethodField()
    cover_image_url = serializers.SerializerMethodField()
    pdf = serializers.SerializerMethodField()
    pdf_url = serializers.SerializerMethodField()
    pdf_file = serializers.SerializerMethodField()
    audio = serializers.SerializerMethodField()
    audio_url = serializers.SerializerMethodField()
    audio_file = serializers.SerializerMethodField()

    class Meta:
        model = Book
        fields = [
            'id', 'title', 'author', 'category', 'description', 
            'cover_image', 'cover_image_url', 'pdf', 'pdf_url', 'pdf_file',
            'audio', 'audio_url', 'audio_file', 'published_date',
            'created_at',
            'average_rating', 'comment_count'
        ]

    @staticmethod
    def _safe_file_url(file_field):
        try:
            if not file_field:
                return None
            url = str(file_field.url or '').strip()
        except Exception:
            return None
        return url or None

    @staticmethod
    def _safe_external_url(value):
        if value is None:
            return None
        value = str(value).strip()
        return value or None

    def get_cover_image(self, obj):
        return self.get_cover_image_url(obj)

    @staticmethod
    def _local_media_url(file_field):
        if not file_field or not getattr(file_field, 'name', None):
            return None

        relative_name = str(file_field.name).replace('\\', '/').lstrip('/')
        media_root = os.path.abspath(str(settings.MEDIA_ROOT))
        local_path = os.path.abspath(os.path.join(media_root, relative_name))
        try:
            is_inside_media_root = os.path.commonpath([media_root, local_path]) == media_root
        except ValueError:
            is_inside_media_root = False

        if not is_inside_media_root or not os.path.isfile(local_path):
            return None

        return f"{settings.MEDIA_URL.rstrip('/')}/{quote(relative_name, safe='/')}"

    def get_cover_image_url(self, obj):
        if obj.cover_image and getattr(obj.cover_image, 'name', None):
            return self._local_media_url(obj.cover_image)
        return self._safe_external_url(obj.cover_image_url)

    def get_pdf(self, obj):
        return self.get_pdf_url(obj)

    def get_pdf_url(self, obj):
        # Prefer an uploaded file, but fall back to the explicit external URL
        # when storage is unavailable or the uploaded object is missing.
        return self._safe_file_url(obj.pdf_file) or self._safe_external_url(obj.pdf_url)

    def get_pdf_file(self, obj):
        return self.get_pdf_url(obj)

    def get_audio(self, obj):
        return self.get_audio_url(obj)

    def get_audio_url(self, obj):
        return self._safe_file_url(obj.audio_file) or self._safe_external_url(obj.audio_url)

    def get_audio_file(self, obj):
        return self.get_audio_url(obj)

    def get_average_rating(self, obj):
        result = obj.comments.aggregate(Avg('rating'))['rating__avg']
        return round(result, 1) if result is not None else 0.0

    def get_comment_count(self, obj):
        return obj.comments.count()

class BookmarkSerializer(serializers.ModelSerializer):
    book = BookSerializer(read_only=True)

    class Meta:
        model = Bookmark
        fields = ['id', 'user', 'book', 'created_at']

class CollectionSerializer(serializers.ModelSerializer):
    books = BookSerializer(many=True, read_only=True)

    class Meta:
        model = Collection
        fields = ['id', 'user', 'name', 'description', 'books', 'created_at']

class ReadingHistorySerializer(serializers.ModelSerializer):
    book = BookSerializer(read_only=True)
    
    class Meta:
        model = ReadingHistory
        fields = ['id', 'user', 'book', 'last_read_at']

class ActivityLogSerializer(serializers.ModelSerializer):
    class Meta:
        model = ActivityLog
        fields = ['id', 'event_type', 'user_identifier', 'created_at']
