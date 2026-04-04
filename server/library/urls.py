from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import ask_ai, LoginAPIView, SignupAPIView, dashboard_stats, BookViewSet, CategoryListAPIView, SearchAPIView, BookmarkViewSet, get_and_create_comments, delete_comment, track_activity

router = DefaultRouter()
router.register(r'books', BookViewSet, basename='api-books')
router.register(r'bookmarks', BookmarkViewSet, basename='api-bookmarks')

urlpatterns = [
    path("login/", LoginAPIView.as_view(), name="api-login"),
    path("signup/", SignupAPIView.as_view(), name="api-signup"),
    path("dashboard/", dashboard_stats, name="api-dashboard"),
    path("categories/", CategoryListAPIView.as_view(), name="api-categories"),
    path("search/", SearchAPIView.as_view(), name="api-search"),
    path("ask-ai/", ask_ai, name="api-ask-ai"),
    path("activity/track/", track_activity, name="api-track-activity"),
    path('books/<int:id>/comments/', get_and_create_comments, name='api-book-comments'),
    path('comments/<int:id>/', delete_comment, name='api-delete-comment'),
    path("", include(router.urls)),
]