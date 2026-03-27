from rest_framework import serializers
from django.contrib.auth.models import User
from .models import Book, Category, Bookmark, Collection, ReadingHistory

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'first_name', 'last_name']

class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = ['id', 'name', 'description']

class BookSerializer(serializers.ModelSerializer):
    category = CategorySerializer(read_only=True)

    class Meta:
        model = Book
        fields = [
            'id', 'title', 'author', 'category', 'description', 
            'pdf_file', 'cover_image_url', 'published_date', 'created_at'
        ]

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
