from django.http import JsonResponse
from django.contrib.auth import authenticate
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.decorators import api_view, permission_classes, authentication_classes

from .models import Book, Bookmark, ReadingHistory, Category, Comment, UserActivity, ActivityLog
from .serializers import BookSerializer, CommentSerializer, ActivityLogSerializer

from rest_framework_simplejwt.tokens import RefreshToken

# ==========================================
# AUTHENTICATION API
# ==========================================
class SignupAPIView(APIView):
    """
    Handles User Signup via POST request.
    Creates a new user and returns JWT tokens along with the user info.
    """
    permission_classes = [AllowAny]
    authentication_classes = []

    def post(self, request):
        username = str(request.data.get('username', '')).strip()
        email = str(request.data.get('email', '')).strip()
        password = str(request.data.get('password', '')).strip()

        if not username or not password:
            return Response({'error': 'Username and password are required'}, status=status.HTTP_400_BAD_REQUEST)

        from django.contrib.auth.models import User
        if User.objects.filter(username=username).exists():
            return Response({'error': 'Username already exists'}, status=status.HTTP_400_BAD_REQUEST)

        user = User.objects.create_user(username=username, email=email, password=password)
        
        refresh = RefreshToken.for_user(user)
        return Response({
            'refresh': str(refresh),
            'access': str(refresh.access_token),
            'user_id': user.id,
            'username': user.username
        }, status=status.HTTP_201_CREATED)

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
from django.db.models import Count, Avg
from django.utils import timezone
from datetime import timedelta

class DashboardAPIView(APIView):
    """
    Unified analytics dashboard API.
    Returns stats, charts data, and recent activity in one call.
    """
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        user = request.user
        username = user.username
        
        # 1. Basic Stats (Personalized)
        activity, _ = UserActivity.objects.get_or_create(user_identifier=username)
        
        stats = {
            'total_books': Book.objects.count(),
            'total_comments': Comment.objects.count(),
            'avg_rating': Book.objects.aggregate(avg=Avg('comments__rating'))['avg'] or 0,
            'pdfs_opened': activity.pdf_opened,
            'ai_queries': activity.ai_queries,
            'bookmarks_count': activity.bookmarks,
        }
        
        # 2. Category Distribution (Chart A & C)
        categories = Category.objects.annotate(count=Count('books')).values('name', 'count')
        category_data = [{'name': c['name'], 'value': c['count']} for c in categories]
        
        # 3. Activity Trend (Last 7 Days - Chart B)
        today = timezone.now().date()
        date_range = [today - timedelta(days=i) for i in range(6, -1, -1)]
        
        trend_data = []
        for date in date_range:
            logs = ActivityLog.objects.filter(
                user_identifier=username,
                created_at__date=date
            )
            trend_data.append({
                'date': date.strftime('%b %d'),
                'pdf_opens': logs.filter(event_type='pdf_open').count(),
                'ai_queries': logs.filter(event_type='ai_query').count(),
                'bookmarks': logs.filter(event_type='bookmark').count(),
            })
            
        # 4. Top Books
        # Sort by average rating and then by count
        top_books = Book.objects.annotate(
            avg_rate=Avg('comments__rating'),
            count_rate=Count('comments')
        ).order_by('-avg_rate', '-count_rate')[:5]
        
        # 5. Recent Activity
        recent_logs = ActivityLog.objects.filter(user_identifier=username)[:10]
        
        return Response({
            'stats': stats,
            'category_distribution': category_data,
            'activity_trend': trend_data,
            'top_books': BookSerializer(top_books, many=True).data,
            'recent_activity': ActivityLogSerializer(recent_logs, many=True).data,
            'saved_books': BookSerializer([b.book for b in Bookmark.objects.filter(user=user)[:5]], many=True).data,
        }, status=status.HTTP_200_OK)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def track_activity(request):
    """
    Tracks user interaction events.
    Increments UserActivity counters and creates an ActivityLog entry.
    """
    event_type = request.data.get('event_type')
    username = request.user.username
    
    if event_type not in ['pdf_open', 'ai_query', 'bookmark', 'comment']:
        return Response({"error": "Invalid event type"}, status=status.HTTP_400_BAD_REQUEST)
    
    # 1. Update/Create Counter
    activity, _ = UserActivity.objects.get_or_create(user_identifier=username)
    if event_type == 'pdf_open':
        activity.pdf_opened += 1
    elif event_type == 'ai_query':
        activity.ai_queries += 1
    elif event_type == 'bookmark':
        activity.bookmarks += 1
    # Note: 'comment' is tracked but usually we might just count the models.
    # However, for consistency with UserActivity fields, we keep it simple.
    activity.save()
    
    # 2. Create Log Entry
    ActivityLog.objects.create(
        event_type=event_type,
        user_identifier=username
    )
    
    return Response({"success": True}, status=status.HTTP_201_CREATED)


# ==========================================
# PUBLIC & PROTECTED API
# ==========================================
from rest_framework import generics, viewsets
from rest_framework.permissions import AllowAny, IsAuthenticatedOrReadOnly, IsAdminUser
from django.db.models import Q
from .serializers import CategorySerializer, BookmarkSerializer

class CategoryListAPIView(generics.ListAPIView):
    """
    Retrieves a list of all categories.
    """
    authentication_classes = []
    permission_classes = [AllowAny]
    queryset = Category.objects.all().order_by('name')
    serializer_class = CategorySerializer

from rest_framework.pagination import PageNumberPagination
class BookPagination(PageNumberPagination):
    page_size = 20

class BookViewSet(viewsets.ModelViewSet):
    """
    ViewSet for viewing and editing books.
    Public can view. Only Admin (staff) can create, update, delete.
    """
    queryset = Book.objects.all().order_by('-created_at')
    serializer_class = BookSerializer
    pagination_class = BookPagination

    def get_permissions(self):
        if self.action in ['list', 'retrieve', 'search']:
            return [AllowAny()]
        return [IsAdminUser()]

class SearchAPIView(generics.ListAPIView):
    """
    Searches books by title, author, or category.
    """
    authentication_classes = []
    permission_classes = [AllowAny]
    serializer_class = BookSerializer
    
    def get_queryset(self):
        query = self.request.GET.get('q', '')
        if query:
            return Book.objects.filter(
                Q(title__icontains=query) |
                Q(author__icontains=query) |
                Q(category__name__icontains=query)
            ).distinct().order_by('-created_at')
        return Book.objects.none()

class BookmarkViewSet(viewsets.ModelViewSet):
    """
    ViewSet for user bookmarks.
    """
    permission_classes = [IsAuthenticated]
    serializer_class = BookmarkSerializer
    
    def get_queryset(self):
        return Bookmark.objects.filter(user=self.request.user).order_by('-created_at')
        
    def perform_create(self, serializer):
        serializer.save(user=self.request.user)


# ==========================================
# AI INTEGRATION API
# ==========================================
import os
import requests
from django.http import JsonResponse
import os
import requests
from django.http import JsonResponse
from rest_framework.permissions import AllowAny
from rest_framework_simplejwt.authentication import JWTAuthentication
from rest_framework_simplejwt.authentication import JWTAuthentication
from .models import Book
from .groq_service import ask_groq

@api_view(['GET', 'POST'])
@authentication_classes([])  
@permission_classes([AllowAny])
def ask_ai(request):
    question = request.GET.get("question") or request.data.get("question", "")
    if not question:
        return JsonResponse({"error": "No question provided"}, status=400)

    books = Book.objects.order_by('?')[:10]

    answer = ask_groq(question, books)

    return JsonResponse({"answer": answer})

# ==========================================
# COMMENTS & RATINGS API
# ==========================================
@api_view(['GET', 'POST'])
@permission_classes([AllowAny])
def get_and_create_comments(request, id):
    """
    GET: List all comments for a specific book.
    POST: Create a new comment for a book.
    """
    try:
        book = Book.objects.get(id=id)
    except Book.DoesNotExist:
        return Response({"error": "Book not found"}, status=status.HTTP_404_NOT_FOUND)

    if request.method == 'GET':
        comments = Comment.objects.filter(book=book).order_by('-created_at')
        serializer = CommentSerializer(comments, many=True)
        return Response(serializer.data)

    elif request.method == 'POST':
        if not request.user.is_authenticated:
            return Response({"error": "Unauthorized"}, status=status.HTTP_401_UNAUTHORIZED)
            
        data = request.data.copy()
        data['book'] = book.id
        data['user_name'] = request.user.username
        
        serializer = CommentSerializer(data=data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

@api_view(['DELETE'])
@permission_classes([AllowAny]) # As per prompt: "allow open delete for now"
def delete_comment(request, id):
    """
    Delete a specific comment.
    In production, this should be Restricted to Admin or the Comment Owner.
    """
    try:
        comment = Comment.objects.get(id=id)
        comment.delete()
        return Response({"message": "Comment deleted successfully"}, status=status.HTTP_204_NO_CONTENT)
    except Comment.DoesNotExist:
        return Response({"error": "Comment not found"}, status=status.HTTP_404_NOT_FOUND)

# ==========================================
# DASHBOARD & ANALYTICS API
# ==========================================
from django.db.models import Avg, Count
from django.db.models.functions import TruncDate
from datetime import timedelta
from django.utils import timezone
from .models import UserActivity, ActivityLog, Category

@api_view(['POST'])
@permission_classes([AllowAny])
def track_activity(request):
    event_type = request.data.get('event')
    user_identifier = request.data.get('user', 'demo_user')

    if not event_type:
        return JsonResponse({"error": "Event type required"}, status=400)

    # Increment counter
    activity, created = UserActivity.objects.get_or_create(user_identifier=user_identifier)
    if event_type == 'pdf_open':
        activity.pdf_opened += 1
    elif event_type == 'ai_query':
        activity.ai_queries += 1
    elif event_type == 'bookmark':
        activity.bookmarks += 1
    activity.save()

    # Log stream
    ActivityLog.objects.create(event_type=event_type, user_identifier=user_identifier)

    return JsonResponse({"status": "success", "event": event_type})

@api_view(['GET'])
@permission_classes([AllowAny])
def dashboard_stats(request):
    from .models import Comment, Bookmark # Ensure available
    
    total_books = Book.objects.count()
    total_comments = Comment.objects.count()
    avg_rating = Comment.objects.aggregate(Avg('rating'))['rating__avg'] or 0

    # Global activity metrics (sum all users if multiple)
    activities = UserActivity.objects.all()
    pdf_opened = sum(a.pdf_opened for a in activities)
    ai_queries = sum(a.ai_queries for a in activities)
    bookmarks_count = sum(a.bookmarks for a in activities)

    # Category distribution for Pie chart
    category_distribution = list(Category.objects.annotate(value=Count('books')).values('name', 'value'))
    
    # Activity Trend for Line chart (last 7 days grouped by date)
    seven_days_ago = timezone.now().date() - timedelta(days=6)
    
    trend = list(ActivityLog.objects.filter(created_at__date__gte=seven_days_ago)
        .annotate(date=TruncDate('created_at'))
        .values('date')
        .annotate(
            pdf_open=Count('id', filter=Q(event_type='pdf_open')),
            ai_query=Count('id', filter=Q(event_type='ai_query')),
            bookmark=Count('id', filter=Q(event_type='bookmark'))
        ).order_by('date'))
    
    # Format dates as strings
    formatted_trend = []
    for item in trend:
        formatted_trend.append({
            'date': item['date'].strftime('%Y-%m-%d'),
            'pdf_open': item['pdf_open'],
            'ai_query': item['ai_query'],
            'bookmark': item['bookmark'],
        })

    # Recent activity
    recent_activity = [
        {"event_type": log.event_type, "created_at": log.created_at, "user": log.user_identifier}
        for log in ActivityLog.objects.order_by('-created_at')[:10]
    ]

    # Top Books (most comments as a proxy, or highest rated)
    # Group by book title, order by comments
    top_books = list(Book.objects.annotate(comment_count=Count('comments')).order_by('-comment_count')[:5].values('id', 'title', 'author', 'comment_count'))

    return JsonResponse({
        "total_books": total_books,
        "total_comments": total_comments,
        "average_rating": round(avg_rating, 1),
        "pdf_opened": pdf_opened,
        "ai_queries": ai_queries,
        "bookmarks": bookmarks_count,
        "category_distribution": category_distribution,
        "activity_trend": formatted_trend,
        "recent_activity": recent_activity,
        "top_books": top_books,
    })
