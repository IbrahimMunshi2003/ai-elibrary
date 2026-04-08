import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const api = axios.create({
  baseURL: `${API_BASE_URL}/api`,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add interceptor to include auth token if present
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('auth_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Add interceptor to handle 401 Unauthorized responses
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      if (window.location.pathname !== '/login' && window.location.pathname !== '/signup') {
        localStorage.removeItem('auth_token');
        localStorage.removeItem('auth-storage');
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

// Helper to build full URLs for media files from backend
export const getFullUrl = (path) => {
  if (!path) return null;
  if (path.startsWith('http')) return path;
  return `${API_BASE_URL}${path}`;
};

// Mock data to enable frontend build before backend is ready
export const apiService = {
  // Books API Integration
  getBooks: async () => {
    try {
      const response = await api.get('/books/');
      
      // Handle pagination wrapper or direct array
      const data = response.data.results || response.data || [];
      
      // Map DRF response to match what the frontend expects
      const formattedBooks = data.map((book) => ({
        id: book.id,
        title: book.title,
        author: book.author,
        category: book.category ? book.category.name : 'Others',
        description: book.description,
        // Use full URL for images/pdfs
        coverImage: getFullUrl(book.cover_image) || getFullUrl(book.cover_image_url) || 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?q=80&w=600&auto=format&fit=crop', 
        pdfUrl: getFullUrl(book.pdf_file),
        audioFile: getFullUrl(book.audio_file),
        audioUrl: book.audio_url,
        rating: book.average_rating || 0,
        commentCount: book.comment_count || 0,
        // Maintain original fields for grouping flexibility if needed
        cover_image: book.cover_image,
        cover_image_url: book.cover_image_url
      }));
      
      return formattedBooks;
    } catch (err) {
      console.warn("Backend unavailable or empty. Falling back to mock data.", err);
      const { books } = await import('../utils/constants.js');
      return books;
    }
  },
  getBook: async (id) => {
    try {
      const response = await api.get(`/books/${id}/`);
      const book = response.data;
      return {
        id: book.id,
        title: book.title,
        author: book.author,
        category: book.category ? book.category.name : 'Others',
        description: book.description,
        coverImage: getFullUrl(book.cover_image) || getFullUrl(book.cover_image_url) || 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?q=80&w=600&auto=format&fit=crop', 
        pdfUrl: getFullUrl(book.pdf_file),
        audioFile: getFullUrl(book.audio_file),
        audioUrl: book.audio_url,
        rating: book.average_rating || 0,
        commentCount: book.comment_count || 0,
      };
    } catch (err) {
      console.warn("Direct book fetch failed, trying local find:", err);
      const books = await apiService.getBooks();
      const book = books.find(b => b.id.toString() === id.toString());
      if (book) return book;
      throw new Error('Book not found');
    }
  },
  searchBooks: async (query) => {
    try {
      const response = await api.get(`/search/?q=${encodeURIComponent(query)}`);
      const data = response.data.results || response.data || [];
      
      const formattedBooks = data.map((book) => ({
        id: book.id,
        title: book.title,
        author: book.author,
        category: book.category ? book.category.name : 'Others',
        description: book.description,
        coverImage: getFullUrl(book.cover_image) || getFullUrl(book.cover_image_url) || 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?q=80&w=600&auto=format&fit=crop', 
        pdfUrl: getFullUrl(book.pdf_file),
        audioFile: getFullUrl(book.audio_file),
        audioUrl: book.audio_url,
        rating: book.average_rating || 0,
        commentCount: book.comment_count || 0,
      }));
      return formattedBooks;
    } catch (err) {
      console.warn("Search error, falling back locally:", err);
      const books = await apiService.getBooks();
      const q = query.toLowerCase();
      const results = books.filter(b => 
        (b.title && b.title.toLowerCase().includes(q)) || 
        (b.author && b.author.toLowerCase().includes(q)) ||
        (b.category && b.category.toLowerCase().includes(q))
      );
      return results;
    }
  },
  
  deleteBook: async (id) => {
    try {
      await api.delete(`/books/${id}/`);
      return { success: true };
    } catch (err) {
      console.warn("Delete error (fallback to local state removal):", err);
      return { success: false, error: err };
    }
  },

  // Auth Integration
  login: async (credentials) => {
    try {
      const response = await api.post('/login/', credentials);
      // The backend returns { access, refresh, user_id, username }
      const { access, user_id, username } = response.data;
      
      // Map it to what the frontend's Zustand store expects
      return { 
        data: { 
          user: { id: user_id, name: username, email: credentials.username + '@user.com' }, 
          token: access 
        } 
      };
    } catch (error) {
      const errorMsg = error.response?.data?.error || error.response?.data?.detail || error.message || "Login failed";
      console.error("Login Error:", errorMsg);
      throw new Error(errorMsg);
    }
  },
  signup: async (data) => {
    try {
      const response = await api.post('/signup/', {
        username: data.name,
        email: data.email,
        password: data.password
      });
      const { access, user_id, username } = response.data;
      return { 
        data: { 
          user: { id: user_id, name: username, email: data.email }, 
          token: access 
        } 
      };
    } catch (error) {
      const errorMsg = error.response?.data?.error || error.response?.data?.detail || error.message || "Signup failed";
      console.error("Signup Error:", errorMsg);
      throw new Error(errorMsg);
    }
  },

  // Bookmarks API
  getBookmarks: async () => {
    try {
      const response = await api.get('/bookmarks/');
      const bookmarks = response.data.map(b => b.book.id); // returning mapped list of book IDs
      return bookmarks;
    } catch (err) {
      console.warn("Bookmarks API error:", err);
      return [];
    }
  },
  
  addBookmark: async (bookId) => {
    try {
      await api.post('/bookmarks/', { book: bookId });
      await apiService.trackActivity('bookmark');
    } catch(e) {
      console.warn("Failed to add bookmark to backend:", e);
    }
  },
  
  removeBookmark: async (bookId) => {
    try {
      // Backend expects the ID of the bookmark itself to delete, but for simplicity,
      // if we only have bookId, we first might need to fetch the bookmark ID.
      // Assuming a custom endpoint or we handle it on backend by matching bookId + user.
      // For now, doing a safe generic try block.
      const response = await api.get('/bookmarks/');
      const bm = response.data.find(b => b.book.id === bookId);
      if (bm) {
        await api.delete(`/bookmarks/${bm.id}/`);
      }
    } catch(e) {
      console.warn("Failed to remove bookmark from backend:", e);
    }
  },

  // AI
  askAI: async (question) => {
    return api.get("/ask-ai/", {
      params: { question }
    });
  },
  
  getAISummary: async (bookTitle, author) => {
    // Wrapper around askAI for a specific summary prompt
    const question = `Give me a short summary of the book "${bookTitle}" by ${author}. Keep it under structured into 3 bullet points.`;
    return api.post('/ask-ai/', { question });
  },

  // Analytics & Dashboard
  getDashboardStats: async () => {
    try {
      const response = await api.get('/dashboard/');
      return response.data;
    } catch (err) {
      console.error("Failed to fetch dashboard data:", err);
      throw err;
    }
  },
  trackActivity: async (eventType) => {
    try {
      await api.post('/activity/track/', { event: eventType, user: "demo_user" });
      return { success: true };
    } catch (err) {
      console.warn(`Failed to track activity [${eventType}]:`, err);
      return { success: false };
    }
  },

  // Comments & Ratings
  getComments: async (bookId) => {
    try {
      const response = await api.get(`/books/${bookId}/comments/`);
      return response.data;
    } catch (err) {
      console.warn("Failed to fetch comments:", err);
      return [];
    }
  },
  postComment: async (bookId, data) => {
    try {
      // Expects { user_name, comment_text, rating }
      const response = await api.post(`/books/${bookId}/comments/`, data);
      return response.data;
    } catch (err) {
      console.error("Failed to post comment:", err);
      throw err;
    }
  },
  deleteComment: async (commentId) => {
    try {
      await api.delete(`/comments/${commentId}/`);
      return { success: true };
    } catch (err) {
      console.error("Failed to delete comment:", err);
      throw err;
    }
  }
};
