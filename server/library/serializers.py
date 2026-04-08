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
    audio_file = serializers.FileField(required=False)

    class Meta:
        model = Book
        fields = [
            'id', 'title', 'author', 'category', 'description', 
            'pdf_file', 'cover_image', 'cover_image_url', 'audio_file', 'audio_url', 'published_date', 'created_at',
            'average_rating', 'comment_count'
        ]

    def get_average_rating(self, obj):
        # Calculate dynamic average
        # Default to 0.0 if no comments
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
