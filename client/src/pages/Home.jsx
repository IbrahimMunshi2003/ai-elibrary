import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FiArrowRight, FiBook, FiCpu, FiTrendingUp } from 'react-icons/fi';
import { Link, useNavigate } from 'react-router-dom';
import { apiService } from '../services/api';
import BookCard from '../components/BookCard';
import RecommendationCarousel from '../components/RecommendationCarousel';
import Loader, { GridSkeleton } from '../components/Loader';

export default function Home() {
  const [books, setBooks] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const fetchBooks = async () => {
      try {
        const response = await apiService.getBooks();
        setBooks(response.data);
      } catch (error) {
        console.error("Error fetching books:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchBooks();
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery)}`);
    }
  };

  return (
    <div className="flex flex-col gap-16 pb-12">
      {/* Hero Section */}
      <section className="relative pt-12 pb-20 lg:pt-24 lg:pb-32 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary-500/10 via-transparent to-primary-600/5 dark:from-primary-900/20 dark:to-primary-900/10 pointer-events-none" />
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary-500/20 blur-[100px] rounded-full pointer-events-none transform translate-x-1/3 -translate-y-1/3" />
        
        <div className="relative z-10 text-center max-w-4xl mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 font-semibold mb-6 text-sm">
              <FiCpu className="w-4 h-4" /> Next-Gen Digital Library
            </span>
            <h1 className="text-5xl lg:text-7xl font-bold tracking-tight text-foreground mb-6 leading-tight">
              Unlock Knowledge with <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-600 to-primary-400">AI Power</span>
            </h1>
            <p className="text-xl text-muted-foreground mb-10 max-w-2xl mx-auto">
              Discover, read, and understand books faster than ever. Get AI-generated summaries and chat directly with your library.
            </p>
            
            <form onSubmit={handleSearch} className="max-w-xl mx-auto relative mb-8">
              <input
                type="text"
                placeholder="Search for your next great read..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-6 pr-32 py-4 rounded-full bg-card border border-border text-foreground shadow-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none text-lg"
              />
              <button
                type="submit"
                className="absolute right-2 top-2 bottom-2 bg-primary-600 hover:bg-primary-700 text-white px-6 rounded-full font-medium transition-colors flex items-center gap-2 shadow-md"
              >
                Search
              </button>
            </form>
            
            <div className="flex flex-wrap justify-center gap-4 text-sm text-muted-foreground">
              <span>Popular:</span>
              <button onClick={() => navigate('/search?q=react')} className="hover:text-primary-500 transition-colors">React</button>
              <button onClick={() => navigate('/search?q=ai')} className="hover:text-primary-500 transition-colors">AI</button>
              <button onClick={() => navigate('/search?q=python')} className="hover:text-primary-500 transition-colors">Python</button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Featured Books Grid */}
      <section className="px-4">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-3xl font-bold flex items-center gap-3">
              <FiTrendingUp className="text-primary-500" /> Trending Now
            </h2>
            <p className="text-muted-foreground mt-2">The most popular books this week</p>
          </div>
          <Link to="/search" className="hidden sm:flex items-center gap-2 text-primary-600 hover:text-primary-700 font-medium">
            View All <FiArrowRight />
          </Link>
        </div>

        {isLoading ? (
          <GridSkeleton count={4} />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {books.slice(0, 4).map((book, idx) => (
              <motion.div
                key={book.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.4, delay: idx * 0.1 }}
              >
                <BookCard book={book} />
              </motion.div>
            ))}
          </div>
        )}
        <Link to="/search" className="sm:hidden mt-6 flex items-center justify-center gap-2 text-primary-600 font-medium w-full py-3 bg-primary-50 dark:bg-primary-900/20 rounded-xl">
          View All Books <FiArrowRight />
        </Link>
      </section>

      {/* Recommendations Carousel */}
      <section className="bg-muted/30 -mx-4 sm:-mx-6 lg:-mx-8 px-4 sm:px-6 lg:px-8 py-12 rounded-3xl">
        <div className="max-w-7xl mx-auto">
          {isLoading ? (
            <div className="h-64 flex items-center justify-center">
              <Loader />
            </div>
          ) : (
            <RecommendationCarousel books={books} title="Handpicked For You" />
          )}
        </div>
      </section>
      
      {/* Features Outline */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-8 px-4 text-center">
        <div className="flex flex-col items-center bg-card p-8 rounded-2xl border border-border shadow-sm">
          <div className="w-16 h-16 bg-primary-100 dark:bg-primary-900/30 text-primary-600 mb-6 rounded-2xl flex items-center justify-center">
            <FiBook className="w-8 h-8" />
          </div>
          <h3 className="text-xl font-semibold mb-3">Vast Collection</h3>
          <p className="text-muted-foreground">Access thousands of books ranging from programming to business and beyond.</p>
        </div>
        <div className="flex flex-col items-center bg-card p-8 rounded-2xl border border-border shadow-sm">
          <div className="w-16 h-16 bg-primary-100 dark:bg-primary-900/30 text-primary-600 mb-6 rounded-2xl flex items-center justify-center">
            <FiCpu className="w-8 h-8" />
          </div>
          <h3 className="text-xl font-semibold mb-3">AI Summaries</h3>
          <p className="text-muted-foreground">Don't have time to read? Get instant, accurate summaries generated by our advanced AI.</p>
        </div>
        <div className="flex flex-col items-center justify-center p-8 bg-gradient-to-br from-primary-600 to-primary-800 text-white rounded-2xl shadow-lg relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full translate-x-1/2 -translate-y-1/2 blur-2xl block" />
          <h3 className="text-2xl font-bold mb-4 z-10">Start Your Journey</h3>
          <Link to="/signup" className="px-6 py-3 bg-white text-primary-700 font-bold rounded-full shadow-md hover:scale-105 transition-transform z-10 w-full mb-3 text-center">
            Create Free Account
          </Link>
          <p className="text-white/80 text-sm z-10 mt-2">No credit card required</p>
        </div>
      </section>
    </div>
  );
}
