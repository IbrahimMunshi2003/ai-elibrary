from django.http import JsonResponse
from django.contrib.auth import authenticate
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated

from .models import Book, Bookmark, ReadingHistory
from .serializers import BookSerializer

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
        username = str(request.data.get('username', '')).strip()
        password = str(request.data.get('password', '')).strip()
        
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
import os
import requests
from rest_framework.decorators import api_view, permission_classes, authentication_classes
from rest_framework.permissions import AllowAny
from rest_framework_simplejwt.authentication import JWTAuthentication

@api_view(['GET', 'POST'])
@authentication_classes([])  # Disable default to prevent 401 on invalid tokens
@permission_classes([AllowAny])
def ask_ai(request):
    # Extract query from GET params or POST body
    question = request.GET.get("question") or request.data.get("question")
    if not question:
        return JsonResponse({"error": "No question provided"}, status=400)

    # 1. Fetch library catalog context
    books = Book.objects.select_related('category').all()
    catalog_context = "Library Catalog:\n"
    for b in books:
        cat_name = b.category.name if b.category else "Uncategorized"
        catalog_context += f"- '{b.title}' by {b.author} (Category: {cat_name}). Summary: {b.description[:100]}...\n"

    # 2. Fetch user context if authenticated
    user_context = ""
    
    # Manually authenticate to gracefully fall back to anonymous if token is expired/invalid
    user = None
    auth_header = request.META.get('HTTP_AUTHORIZATION', '')
    if auth_header.startswith('Bearer '):
        try:
            jwt_auth = JWTAuthentication()
            validated_token = jwt_auth.get_validated_token(auth_header.split(' ')[1])
            user = jwt_auth.get_user(validated_token)
        except Exception:
            pass

    if user and user.is_authenticated:
        # Bookmarks
        bookmarks = Bookmark.objects.filter(user=user).select_related('book')
        if bookmarks.exists():
            user_context += "User's Saved/Bookmarked Books:\n" + "\n".join([f"- {b.book.title}" for b in bookmarks]) + "\n\n"
        
        # Reading History
        history = ReadingHistory.objects.filter(user=user).select_related('book').order_by('-last_read_at')[:10]
        if history.exists():
            user_context += "User's Recent Reading History:\n" + "\n".join([f"- {h.book.title}" for h in history]) + "\n\n"

    # 3. Combine prompt
    system_prompt = (
        "You are an intelligent library assistant. Use the library catalog context and personal "
        "user context to answer the user's question, summarize books, or recommend books. "
        "Only recommend books that are actually in the catalog. Be concise and friendly.\n\n"
    )
    
    full_prompt = system_prompt + catalog_context + "\n" + user_context + f"User's Question: {question}"

    # 4. Call Gemini REST API
    api_key = os.environ.get("GEMINI_API_KEY")
    if not api_key:
        return JsonResponse({"answer": "I'm sorry, my AI features aren't configured right now (missing API key)." })

    url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key={api_key}"
    payload = {
        "contents": [{"parts": [{"text": full_prompt}]}]
    }
    
    try:
        response = requests.post(url, json=payload, headers={"Content-Type": "application/json"})
        response.raise_for_status()
        data = response.json()
        
        try:
            answer = data["candidates"][0]["content"]["parts"][0]["text"]
        except (KeyError, IndexError):
            answer = "I couldn't process the response from the AI."
            
    except requests.exceptions.RequestException as e:
        answer = f"I encountered an error while reaching the AI: {str(e)}"

    return JsonResponse({"answer": answer})
