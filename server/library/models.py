from django.db import models
from django.contrib.auth.models import User

# Category Model for grouping books
class Category(models.Model):
    name = models.CharField(max_length=100, unique=True)
    description = models.TextField(blank=True)

    class Meta:
        verbose_name_plural = "Categories"

    def __str__(self):
        return self.name

# Book Model containing all details of a book
class Book(models.Model):
    title = models.CharField(max_length=255)
    author = models.CharField(max_length=255)
    category = models.ForeignKey(Category, on_delete=models.SET_NULL, null=True, related_name='books')
    description = models.TextField(blank=True)
    pdf_file = models.FileField(upload_to='books/pdfs/', blank=True, null=True)
    cover_image_url = models.URLField(blank=True, null=True, help_text="URL for the book cover image")
    published_date = models.DateField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.title

# Bookmark Model to track books saved by users
class Bookmark(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='bookmarks')
    book = models.ForeignKey(Book, on_delete=models.CASCADE, related_name='bookmarked_by')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('user', 'book') # Prevent duplicate bookmarks

    def __str__(self):
        return f"{self.user.username} saved {self.book.title}"

# Collection Model for users to group books
class Collection(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='collections')
    name = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    books = models.ManyToManyField(Book, related_name='collections', blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.name} by {self.user.username}"

# ReadingHistory Model to track what users recently read
class ReadingHistory(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='reading_history')
    book = models.ForeignKey(Book, on_delete=models.CASCADE, related_name='read_by')
    last_read_at = models.DateTimeField(auto_now=True) # Updates every time the user reads

    class Meta:
        verbose_name_plural = "Reading Histories"
        ordering = ['-last_read_at']

    def __str__(self):
        return f"{self.user.username} read {self.book.title}"
