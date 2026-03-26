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
  // Books (Mocks for now as backend has no endpoints)
  getBooks: async () => {
    // Return mock data for frontend demo
    const { books } = await import('../utils/constants.js');
    return new Promise(resolve => setTimeout(() => resolve({ data: books }), 500));
  },
  getBook: async (id) => {
    const { books } = await import('../utils/constants.js');
    const book = books.find(b => b.id.toString() === id.toString());
    return new Promise((resolve, reject) => 
      setTimeout(() => book ? resolve({ data: book }) : reject(new Error('Book not found')), 300)
    );
  },
  searchBooks: async (query) => {
    const { books } = await import('../utils/constants.js');
    const q = query.toLowerCase();
    const results = books.filter(b => 
      b.title.toLowerCase().includes(q) || 
      b.author.toLowerCase().includes(q) ||
      b.category.toLowerCase().includes(q)
    );
    return new Promise(resolve => setTimeout(() => resolve({ data: results }), 500));
  },

  // Auth (Mocks for now)
  login: async (credentials) => {
    return new Promise(resolve => setTimeout(() => resolve({ data: { user: mockUser, token: 'demo_token_123' } }), 800));
  },
  signup: async (data) => {
    return new Promise(resolve => setTimeout(() => resolve({ data: { user: { id: 2, ...data }, token: 'demo_token_456' } }), 800));
  },

  // Bookmarks (Handled locally in Zustand, these are mock API wrappers)
  getBookmarks: async () => {
    return new Promise(resolve => setTimeout(() => resolve({ data: [] }), 300));
  },

  // AI
  askAI: async (question) => {
    // Uses the actual live endpoint `GET /api/ask-ai/?question=`
    return api.get('/ask-ai/', { params: { question } });
  },
  
  getAISummary: async (bookTitle, author) => {
    // Wrapper around askAI for a specific summary prompt
    const question = `Give me a short summary of the book "${bookTitle}" by ${author}. Keep it under structured into 3 bullet points.`;
    return api.get('/ask-ai/', { params: { question } });
  }
};
