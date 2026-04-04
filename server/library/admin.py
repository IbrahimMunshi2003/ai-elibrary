from django.contrib import admin
from .models import Category, Book, Bookmark, Collection, ReadingHistory, Comment

# Register Categories
@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    list_display = ('name', 'description')
    search_fields = ('name',)

# Register Books
@admin.register(Book)
class BookAdmin(admin.ModelAdmin):
    list_display = ('title', 'author', 'category', 'created_at')
    list_filter = ('category', 'created_at')
    search_fields = ('title', 'author', 'description')

# Register Bookmarks
@admin.register(Bookmark)
class BookmarkAdmin(admin.ModelAdmin):
    list_display = ('user', 'book', 'created_at')
    list_filter = ('created_at',)
    search_fields = ('user__username', 'book__title')

# Register Collections
@admin.register(Collection)
class CollectionAdmin(admin.ModelAdmin):
    list_display = ('name', 'user', 'created_at')
    list_filter = ('created_at',)
    search_fields = ('name', 'user__username', 'description')

# Register Reading History
@admin.register(ReadingHistory)
class ReadingHistoryAdmin(admin.ModelAdmin):
    list_display = ('user', 'book', 'last_read_at')
    list_filter = ('last_read_at',)
    search_fields = ('user__username', 'book__title')

# Register Comments & Ratings
@admin.register(Comment)
class CommentAdmin(admin.ModelAdmin):
    list_display = ('book', 'user_name', 'rating', 'created_at')
    list_filter = ('rating', 'created_at')
    search_fields = ('book__title', 'user_name', 'comment_text')
