from django.http import JsonResponse
from django.contrib.auth import authenticate
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated

from .models import Book, Bookmark, ReadingHistory
from .serializers import BookSerializer
from .gemini_service import ask_gemini

from rest_framework_simplejwt.tokens import RefreshToken

# ==========================================
# AUTHENTICATION API
# ==========================================
class LoginAPIView(APIView):
    """
    Handles User Login via POST request.
    Returns JWT access & refresh tokens, user_id, and username if successful.
    """
    def post(self, request):
        username = request.data.get('username')
        password = request.data.get('password')
        
        user = authenticate(username=username, password=password)
        if user:
            refresh = RefreshToken.for_user(user)
            return Response({
                'refresh': str(refresh),
                'access': str(refresh.access_token),
                'user_id': user.id, 
                'username': user.username
            }, status=status.HTTP_200_OK)
            
        return Response({'error': 'Invalid Credentials'}, status=status.HTTP_401_UNAUTHORIZED)


# ==========================================
# DASHBOARD API
# ==========================================
class DashboardAPIView(APIView):
    """
    Retrieves the personalized user dashboard contents.
    Requires Token Authentication.
    """
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        user = request.user
        
        # 1. Saved Books
        bookmarks = Bookmark.objects.filter(user=user)
        saved_books = [b.book for b in bookmarks]
        
        # 2. Recent Reads
        history = ReadingHistory.objects.filter(user=user).select_related('book').order_by('-last_read_at')[:10]
        recent_reads = [h.book for h in history]
        
        # 3. Recommended Books (Simplified for now - Random books not read by user)
        read_book_ids = history.values_list('book_id', flat=True)
        recommended = Book.objects.exclude(id__in=read_book_ids).order_by('?')[:5]
        
        return Response({
            'saved_books': BookSerializer(saved_books, many=True).data,
            'recent_reads': BookSerializer(recent_reads, many=True).data,
            'recommended_books': BookSerializer(recommended, many=True).data,
        }, status=status.HTTP_200_OK)


# ==========================================
# PUBLIC API
# ==========================================
from rest_framework import generics
from rest_framework.permissions import AllowAny

class BookListAPIView(generics.ListAPIView):
    """
    Retrieves a list of all available books.
    Strictly public, bypasses JWT auth to prevent 401s from stale frontend tokens.
    """
    authentication_classes = []
    permission_classes = [AllowAny]
    queryset = Book.objects.all().order_by('-created_at')
    serializer_class = BookSerializer


# ==========================================
# AI INTEGRATION API
# ==========================================
def ask_ai(request):
    question = request.GET.get("question")
    if not question:
        return JsonResponse({"error": "No question provided"})

    answer = ask_gemini(question)
    return JsonResponse({"answer": answer})