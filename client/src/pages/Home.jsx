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

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery)}`);
    }
  };

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
              Hi, I'm your AI Library Assistant
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground mb-12 max-w-2xl">
              Can I help you find a book, summarize a PDF, or explain a complex topic today?
            </p>
            
            {/* Copilot-style Chatbox */}
            <div className="w-full max-w-3xl relative group">
              <div className="absolute -inset-1 bg-gradient-to-r from-primary-400 to-purple-400 rounded-3xl blur opacity-20 group-hover:opacity-30 transition duration-1000 group-hover:duration-200"></div>
              <form onSubmit={handleSearch} className="relative flex flex-col sm:flex-row items-center w-full bg-white rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-200 p-2 overflow-hidden">
                <button type="button" className="hidden sm:flex items-center justify-center p-4 text-muted-foreground hover:text-primary-600 transition-colors">
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                  </svg>
                </button>
                <input
                  type="text"
                  placeholder="Ask anything about books, PDFs, or summaries..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-transparent border-none outline-none px-4 py-4 sm:py-0 text-foreground text-lg placeholder-slate-400 flex-1"
                />
                <button
                  type="submit"
                  className="w-full sm:w-auto mt-2 sm:mt-0 flex items-center justify-center gap-2 bg-foreground text-background hover:bg-zinc-800 px-6 py-4 rounded-2xl sm:rounded-full font-medium transition-colors shadow-md"
                >
                  <span>Search</span>
                  <FiArrowRight className="w-5 h-5" />
                </button>
              </form>
            </div>
            
            {/* Quick Prompts */}
            <div className="flex flex-wrap justify-center gap-3 mt-10 w-full px-2">
              <button type="button" onClick={() => setSearchQuery("Find books about artificial intelligence")} className="px-4 py-2 bg-muted hover:bg-slate-200 text-sm text-foreground rounded-full transition-colors whitespace-nowrap overflow-hidden text-ellipsis border border-border">
                "Find books about artificial intelligence"
              </button>
              <button type="button" onClick={() => setSearchQuery("Summarize clean code principles")} className="px-4 py-2 bg-muted hover:bg-slate-200 text-sm text-foreground rounded-full transition-colors whitespace-nowrap overflow-hidden text-ellipsis border border-border">
                "Summarize clean code principles"
              </button>
              <button type="button" onClick={() => setSearchQuery("Best self-help audiobooks")} className="px-4 py-2 bg-muted hover:bg-slate-200 text-sm text-foreground rounded-full transition-colors whitespace-nowrap overflow-hidden text-ellipsis hidden md:block border border-border">
                "Best self-help audiobooks"
              </button>
            </div>
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
