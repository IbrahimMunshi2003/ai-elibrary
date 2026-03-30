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

// Mock user data for when backend isn't ready
const mockUser = { id: 1, name: 'Demo User', email: 'user@example.com' };

export const apiService = {
  // Books API Integration
  getBooks: async () => {
    try {
      const response = await api.get('/books/');
      
      // Map DRF response to match what the frontend expects
      const formattedBooks = response.data.map((book) => ({
        id: book.id,
        title: book.title,
        author: book.author,
        category: book.category ? book.category.name : 'General',
        description: book.description,
        coverImage: book.cover_image_url || 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?q=80&w=600&auto=format&fit=crop', 
        pdfUrl: book.pdf_file, // Link to the PDF added locally via admin
        rating: 4.5, // Future: add rating to backend
      }));
      
      return { data: formattedBooks };
    } catch (err) {
      console.warn("Backend unavailable or empty. Falling back to mock data.", err);
      const { books } = await import('../utils/constants.js');
      return { data: books };
    }
  },
  getBook: async (id) => {
    const response = await apiService.getBooks();
    const book = response.data.find(b => b.id.toString() === id.toString());
    if (book) return { data: book };
    throw new Error('Book not found');
  },
  searchBooks: async (query) => {
    try {
      const response = await apiService.getBooks();
      const books = response.data;
      const q = query.toLowerCase();
      const results = books.filter(b => 
        (b.title && b.title.toLowerCase().includes(q)) || 
        (b.author && b.author.toLowerCase().includes(q)) ||
        (b.category && b.category.toLowerCase().includes(q))
      );
      return { data: results };
    } catch (err) {
      console.warn("Search error:", err);
      return { data: [] };
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
    // For now, map signup to login since backend doesn't have a dedicated /signup/ yet.
    // Future: implement registration backend.
    return apiService.login({ username: data.name, password: data.password });
  },

  // Bookmarks (Handled locally in Zustand, these are mock API wrappers)
  getBookmarks: async () => {
    return new Promise(resolve => setTimeout(() => resolve({ data: [] }), 300));
  },

  // AI
  askAI: async (question) => {
  try {
    const res = await api.post('/ask-ai/', { question });
    return res;
  } catch (error) {
    console.error("AI API ERROR:", error.response || error);
    throw error;
  }
},
  
  getAISummary: async (bookTitle, author) => {
    // Wrapper around askAI for a specific summary prompt
    const question = `Give me a short summary of the book "${bookTitle}" by ${author}. Keep it under structured into 3 bullet points.`;
    return api.post('/ask-ai/', { question });
  }
};
