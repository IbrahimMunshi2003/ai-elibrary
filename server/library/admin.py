from django.contrib import admin
from django.utils.html import format_html
from django.db.models import Avg
from django.contrib import messages
from django.utils.safestring import mark_safe
from .models import Category, Book, Bookmark, Collection, ReadingHistory, Comment, ActivityLog

# Register Categories
@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    list_display = ('name', 'description')
    search_fields = ('name',)

# Register Books
@admin.register(Book)
class BookAdmin(admin.ModelAdmin):
    list_display = ('title', 'author', 'category', 'average_rating', 'has_pdf', 'has_audio', 'created_at')
    list_filter = ('category', 'created_at')
    search_fields = ('title', 'author')
    ordering = ('-created_at',)
    
    fieldsets = (
        ('Book Details', {
            'fields': ('title', 'author', 'category', 'description', 'published_date')
        }),
        ('Media', {
            'fields': ('cover_image', 'cover_image_url', 'pdf_file', 'audio_file', 'audio_url', 'audio_preview')
        }),
    )
    readonly_fields = ('audio_preview', 'created_at')

    @admin.display(boolean=True, description='Has PDF')
    def has_pdf(self, obj):
        return bool(obj.pdf_file)

    @admin.display(boolean=True, description='Has Audio')
    def has_audio(self, obj):
        return bool(obj.audio_file or obj.audio_url)

    @admin.display(description='Avg Rating')
    def average_rating(self, obj):
        result = obj.comments.aggregate(Avg('rating'))['rating__avg']
        return round(result, 1) if result else 0.0

    def audio_preview(self, obj):
        audio_src = None
        if obj.audio_file:
            audio_src = obj.audio_file.url
        elif obj.audio_url:
            audio_src = obj.audio_url
            
        if audio_src:
            return format_html(
                '<a href="{}" target="_blank" style="display:inline-block; margin-bottom:10px;">🎧 View Audio Source</a><br>'
                '<audio controls><source src="{}" type="audio/mpeg"></audio>',
                audio_src, audio_src
            )
        return "No audio available"
    audio_preview.short_description = "Audio Preview"

    def changelist_view(self, request, extra_context=None):
        if request.method == 'GET' and not getattr(request, '_dashboard_stats_shown', False):
            request._dashboard_stats_shown = True
            total_books = Book.objects.count()
            # Count books that have either audio_url or audio_file
            total_audio = Book.objects.exclude(audio_url__isnull=True, audio_file="").exclude(audio_url="", audio_file="").count()
            
            total_comments = Comment.objects.count()
            
            avg_rating = Comment.objects.aggregate(Avg('rating'))['rating__avg']
            avg_rating = round(avg_rating, 1) if avg_rating else 0.0
            
            stats_html = format_html(
                '<div style="font-size:16px; font-weight:bold; padding:15px; margin-bottom:0px; background:linear-gradient(45deg, #2b5876, #4e4376); color:white; border-radius:8px; display:flex; justify-content:space-around; align-items:center;">'
                '<span>📚 Total Books: <strong style="font-size:18px;">{}</strong></span>'
                '<span>🎧 Audio Books: <strong style="font-size:18px;">{}</strong></span>'
                '<span>💬 Total Comments: <strong style="font-size:18px;">{}</strong></span>'
                '<span>⭐ Average Rating: <strong style="font-size:18px;">{}</strong></span>'
                '</div>',
                total_books, total_audio, total_comments, avg_rating
            )
            messages.info(request, mark_safe(stats_html))
            
        return super().changelist_view(request, extra_context)

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
    search_fields = ('user_name', 'comment_text')
    actions = ['delete_selected_comments']

    def has_delete_permission(self, request, obj=None):
        # Only admin (superusers) can delete comments
        return request.user.is_superuser

    @admin.action(description="Delete selected comments")
    def delete_selected_comments(self, request, queryset):
        if not self.has_delete_permission(request):
            self.message_user(request, "You do not have permission to delete comments.", level=messages.ERROR)
            return
        
        count = queryset.count()
        queryset.delete()
        self.message_user(request, f"{count} comments were successfully deleted.")

# Register Activity Tracking
@admin.register(ActivityLog)
class ActivityLogAdmin(admin.ModelAdmin):
    list_display = ('user_identifier', 'event_type', 'created_at')
    list_filter = ('event_type', 'created_at')
    search_fields = ('user_identifier',)
