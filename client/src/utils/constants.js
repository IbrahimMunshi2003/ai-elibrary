export const CATEGORIES = [
  'All',
  'Software Engineering',
  'System Design',
  'Data Science',
  'Artificial Intelligence',
  'Productivity',
  'Business',
];

export const SORT_OPTIONS = [
  { value: 'recent', label: 'Recently Added' },
  { value: 'title_asc', label: 'Title (A-Z)' },
  { value: 'title_desc', label: 'Title (Z-A)' },
];

// Mock data to enable frontend build before backend is ready
export const books = [
  {
    id: 1,
    title: 'Clean Code: A Handbook of Agile Software Craftsmanship',
    author: 'Robert C. Martin',
    description: 'Even bad code can function. But if code isn\'t clean, it can bring a development organization to its knees.',
    category: 'Software Engineering',
    coverImage: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?q=80&w=600&auto=format&fit=crop',
    rating: 4.8,
    pages: 464,
  },
  {
    id: 2,
    title: 'Designing Data-Intensive Applications',
    author: 'Martin Kleppmann',
    description: 'Data is at the center of many challenges in system design today. Difficult issues need to be figured out, such as scalability, consistency, reliability, efficiency, and maintainability.',
    category: 'System Design',
    coverImage: 'https://images.unsplash.com/photo-1518770660439-4636190af475?q=80&w=600&auto=format&fit=crop',
    rating: 4.9,
    pages: 616,
  },
  {
    id: 3,
    title: 'Deep Learning',
    author: 'Ian Goodfellow',
    description: 'An introduction to a broad range of topics in deep learning, covering mathematical and conceptual background, deep learning techniques used in industry, and research perspectives.',
    category: 'Artificial Intelligence',
    coverImage: 'https://images.unsplash.com/photo-1620712943543-bcc4688e7485?q=80&w=600&auto=format&fit=crop',
    rating: 4.7,
    pages: 800,
  },
  {
    id: 4,
    title: 'Atomic Habits',
    author: 'James Clear',
    description: 'No matter your goals, Atomic Habits offers a proven framework for improving--every day.',
    category: 'Productivity',
    coverImage: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?q=80&w=600&auto=format&fit=crop',
    rating: 4.8,
    pages: 320,
  },
  {
    id: 5,
    title: 'The Pragmatic Programmer',
    author: 'Andrew Hunt',
    description: 'The Pragmatic Programmer is one of those rare tech books you\'ll read, re-read, and read again over the years.',
    category: 'Software Engineering',
    coverImage: 'https://images.unsplash.com/photo-1542831371-29b0f74f9713?q=80&w=600&auto=format&fit=crop',
    rating: 4.9,
    pages: 352,
  },
];
