from django.urls import path
from .views import ask_ai, LoginAPIView, DashboardAPIView, BookListAPIView

urlpatterns = [
    path("login/", LoginAPIView.as_view(), name="api-login"),
    path("dashboard/", DashboardAPIView.as_view(), name="api-dashboard"),
    path("books/", BookListAPIView.as_view(), name="api-books"),
    path("ask-ai/", ask_ai, name="api-ask-ai"),
]