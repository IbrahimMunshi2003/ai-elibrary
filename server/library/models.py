from django.db import models
from django.contrib.auth.models import User
from django.core.validators import MinValueValidator, MaxValueValidator

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
    cover_image = models.ImageField(upload_to='books/covers/', blank=True, null=True)
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

# Comment & Rating Model
class Comment(models.Model):
    book = models.ForeignKey(Book, on_delete=models.CASCADE, related_name='comments')
    user_name = models.CharField(max_length=100)
    comment_text = models.TextField()
    rating = models.IntegerField(
        validators=[MinValueValidator(1), MaxValueValidator(5)]
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.user_name}'s review on {self.book.title} ({self.rating} stars)"

# User Activity Statistics (Counters)
class UserActivity(models.Model):
    user_identifier = models.CharField(max_length=150, unique=True)
    pdf_opened = models.PositiveIntegerField(default=0)
    ai_queries = models.PositiveIntegerField(default=0)
    bookmarks = models.PositiveIntegerField(default=0)

    def __str__(self):
        return f"Activity for {self.user_identifier}"

# Activity Log Events (Stream)
class ActivityLog(models.Model):
    EVENT_CHOICES = (
        ('pdf_open', 'PDF Open'),
        ('ai_query', 'AI Query'),
        ('bookmark', 'Bookmark'),
        ('comment', 'Comment'),
    )
    
    event_type = models.CharField(max_length=20, choices=EVENT_CHOICES)
    user_identifier = models.CharField(max_length=150)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.user_identifier} - {self.event_type} at {self.created_at}"
