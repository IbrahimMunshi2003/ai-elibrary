import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FiBook, FiCpu, FiTrendingUp } from 'react-icons/fi';
import { Link } from 'react-router-dom';
import { apiService } from '../services/api';
import BookCard from '../components/BookCard';
import RecommendationCarousel from '../components/RecommendationCarousel';
import Loader, { GridSkeleton } from '../components/Loader';
import HomeAssistant from '../components/HomeAssistant';

export default function Home() {
  const [books, setBooks] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  useEffect(() => {
    const fetchBooks = async () => {
      try {
        const data = await apiService.getBooks();
        setBooks(data);
        console.log("Books:", data);
      } catch (error) {
        console.error("Error fetching books:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchBooks();
  }, []);

  // Group books by category
  const groupedBooks = books.reduce((acc, book) => {
    const categoryName = typeof book.category === 'string' ? book.category : (book.category?.name || "Others");
    if (!acc[categoryName]) acc[categoryName] = [];
    acc[categoryName].push(book);
    return acc;
  }, {});

  return (
    <div className="flex flex-col gap-16 pb-12">
      {/* Hero Section */}
      <section className="relative pt-20 pb-24 lg:pt-32 lg:pb-36 overflow-hidden flex flex-col items-center justify-center min-h-[70vh]">
        {/* Subtle Background Glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary-500/10 blur-[120px] rounded-full pointer-events-none animate-[pulse_4s_ease-in-out_infinite]" />
        
        <div className="relative z-10 w-full max-w-4xl mx-auto px-4 sm:px-6 flex flex-col items-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="w-full flex flex-col items-center text-center"
          >
            <h1 className="text-4xl md:text-6xl font-bold tracking-tight text-foreground mb-6">
             Welcome to AI-ELibrary: Your Ultimate AI-Powered Book Companion
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground mb-12 max-w-2xl">
              Can I help you find a book, summarize a PDF, or explain a complex topic today?
            </p>
            
            <HomeAssistant />
          </motion.div>
        </div>
      </section>

      {/* Dynamic Category Sections */}
      <section className="px-4">
        {isLoading ? (
          <GridSkeleton count={4} />
        ) : (
          <div className="flex flex-col gap-12">
            {Object.keys(groupedBooks).map(category => (
              <motion.div 
                key={category} 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="category-section"
              >
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold border-l-4 border-primary-500 pl-4">{category}</h2>
                  <Link to={`/search?q=${category}`} className="text-sm font-medium text-primary-600 hover:underline">
                    Explore All
                  </Link>
                </div>

                <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
                  {groupedBooks[category].map(book => (
                    <BookCard key={book.id} book={book} />
                  ))}
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </section>

      {/* Recommendations Carousel */}
      <section className="bg-muted/30 -mx-4 sm:-mx-6 lg:-mx-8 px-4 sm:px-6 lg:px-8 py-12 rounded-3xl">
        <div className="w-full">
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
          <div className="w-16 h-16 bg-primary-100 text-primary-600 mb-6 rounded-2xl flex items-center justify-center">
            <FiBook className="w-8 h-8" />
          </div>
          <h3 className="text-xl font-semibold mb-3">Vast Collection</h3>
          <p className="text-muted-foreground">Access thousands of books ranging from programming to business and beyond.</p>
        </div>
        <div className="flex flex-col items-center bg-card p-8 rounded-2xl border border-border shadow-sm">
          <div className="w-16 h-16 bg-primary-100 text-primary-600 mb-6 rounded-2xl flex items-center justify-center">
            <FiCpu className="w-8 h-8" />
          </div>
          <h3 className="text-xl font-semibold mb-3">AI Summaries</h3>
          <p className="text-muted-foreground">Don't have time to read? Get instant, accurate summaries generated by our advanced AI.</p>
        </div>
        <div className="flex flex-col items-center justify-center p-8 bg-primary-500 text-white rounded-2xl shadow-[0_2px_15px_-3px_rgba(0,0,0,0.07)] relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full translate-x-1/2 -translate-y-1/2 blur-2xl block" />
          <h3 className="text-2xl font-bold mb-4 z-10">Start Your Journey</h3>
          <Link to="/signup" className="px-6 py-3 bg-white text-primary-600 font-bold rounded-full shadow-md hover:scale-105 transition-transform z-10 w-full mb-3 text-center">
            Create Free Account
          </Link>
          <p className="text-white/80 text-sm z-10 mt-2">No credit card required</p>
        </div>
      </section>
    </div>
  );
}
