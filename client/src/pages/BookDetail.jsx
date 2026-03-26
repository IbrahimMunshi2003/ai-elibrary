import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FiStar, FiBookmark, FiArrowLeft, FiMessageSquare, FiCpu, FiBook } from 'react-icons/fi';
import { apiService } from '../services/api';
import { useBookmarkStore } from '../store/bookmarkStore';
import RecommendationCarousel from '../components/RecommendationCarousel';
import Loader from '../components/Loader';
import AIChat from '../components/AIChat';
import toast from 'react-hot-toast';

export default function BookDetail() {
  const { id } = useParams();
  const [book, setBook] = useState(null);
  const [recommendations, setRecommendations] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSummarizing, setIsSummarizing] = useState(false);
  const [summary, setSummary] = useState(null);
  const [isChatOpen, setIsChatOpen] = useState(false);
  
  const { isBookmarked, addBookmark, removeBookmark } = useBookmarkStore();
  const bookmarked = book ? isBookmarked(book.id) : false;

  useEffect(() => {
    const fetchBookData = async () => {
      setIsLoading(true);
      try {
        const [bookRes, recsRes] = await Promise.all([
          apiService.getBook(id),
          apiService.getBooks() // Using getBooks as standard recommendations for now
        ]);
        setBook(bookRes.data);
        // Filter out current book from recs
        setRecommendations(recsRes.data.filter(b => b.id.toString() !== id));
      } catch (error) {
        toast.error('Failed to load book details');
      } finally {
        setIsLoading(false);
      }
    };
    
    // Reset state on id change
    setSummary(null);
    setIsChatOpen(false);
    fetchBookData();
  }, [id]);

  const handleBookmark = () => {
    if (bookmarked) {
      removeBookmark(book.id);
      toast.success('Removed from bookmarks');
    } else {
      addBookmark(book);
      toast.success('Added to bookmarks');
    }
  };

  const generateSummary = async () => {
    setIsSummarizing(true);
    try {
      const res = await apiService.getAISummary(book.title, book.author);
      setSummary(res.data.answer);
    } catch (error) {
      toast.error('Failed to generate summary');
    } finally {
      setIsSummarizing(false);
    }
  };

  if (isLoading) return <Loader fullPage />;
  if (!book) return <div className="text-center py-20 text-xl font-medium">Book not found</div>;

  return (
    <motion.div 
      initial={{ opacity: 0 }} 
      animate={{ opacity: 1 }} 
      className="pb-12 pt-4"
    >
      <Link to="/search" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-8 transition-colors">
        <FiArrowLeft /> Back to Search
      </Link>

      <div className="flex flex-col lg:flex-row gap-8 lg:gap-12 pb-12 border-b border-border">
        {/* Left Col: Image */}
        <div className="w-full lg:w-1/3 max-w-sm mx-auto lg:mx-0 shrink-0">
          <motion.div 
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="aspect-[3/4] rounded-2xl overflow-hidden shadow-2xl relative"
          >
            <img src={book.coverImage} alt={book.title} className="w-full h-full object-cover" />
            <button
              onClick={handleBookmark}
              className="absolute top-4 right-4 p-3 rounded-full bg-background/90 backdrop-blur-sm text-foreground shadow-lg hover:text-primary-600 transition-colors z-10"
            >
              <FiBookmark className={`w-6 h-6 ${bookmarked ? "fill-primary-600 text-primary-600" : ""}`} />
            </button>
          </motion.div>
        </div>

        {/* Right Col: Details */}
        <div className="flex-1">
          <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.1 }}>
            <div className="inline-block px-3 py-1 rounded-full bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 font-semibold text-sm mb-4">
              {book.category}
            </div>
            <h1 className="text-4xl lg:text-5xl font-bold text-foreground mb-2 leading-tight">
              {book.title}
            </h1>
            <p className="text-xl text-muted-foreground mb-4 font-medium">by {book.author}</p>
            
            <div className="flex flex-wrap items-center gap-6 mb-8 text-sm font-medium">
              <div className="flex items-center gap-1 text-amber-500 bg-amber-500/10 px-3 py-1.5 rounded-full">
                <FiStar className="fill-current w-4 h-4" />
                <span>{book.rating}</span>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <FiBook className="w-5 h-5" />
                <span>{book.pages} Pages</span>
              </div>
            </div>

            <div className="prose prose-sm dark:prose-invert max-w-none mb-8">
              <h3 className="text-lg font-semibold text-foreground mb-2">Description</h3>
              <p className="text-muted-foreground leading-relaxed text-base">{book.description}</p>
            </div>

            {/* AI Actions */}
            <div className="flex flex-col sm:flex-row gap-4 pt-6 border-t border-border">
              <button
                onClick={generateSummary}
                disabled={isSummarizing || summary}
                className={`flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-semibold transition-all shadow-sm ${
                  summary 
                    ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 cursor-default' 
                    : 'bg-primary-600 hover:bg-primary-700 text-white shadow-primary-500/25'
                }`}
              >
                {isSummarizing ? (
                  <><FiCpu className="animate-spin" /> Generating...</>
                ) : summary ? (
                  <><FiCpu /> Summary Generated</>
                ) : (
                  <><FiCpu /> Generate AI Summary</>
                )}
              </button>

              <button
                onClick={() => setIsChatOpen(true)}
                className="flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-semibold bg-card border border-border hover:bg-muted text-foreground transition-colors shadow-sm"
              >
                <FiMessageSquare /> Chat about this book
              </button>
            </div>
          </motion.div>

          {/* AI Summary Result */}
          {summary && (
            <motion.div 
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              className="mt-6 p-6 rounded-2xl bg-gradient-to-br from-primary-50 to-primary-100 dark:from-primary-900/20 dark:to-primary-900/10 border border-primary-200 dark:border-primary-800"
            >
              <h3 className="flex items-center gap-2 text-lg font-bold text-primary-700 dark:text-primary-400 mb-3">
                <FiCpu /> AI Summary
              </h3>
              <div className="prose prose-sm dark:prose-invert max-w-none text-foreground">
                {summary.split('\n').map((paragraph, i) => (
                  <p key={i} className="mb-2 whitespace-pre-wrap">{paragraph}</p>
                ))}
              </div>
            </motion.div>
          )}
        </div>
      </div>

      {/* Recommendations */}
      <div className="mt-12">
        <RecommendationCarousel books={recommendations} title="Similar Books You Might Like" />
      </div>

      {/* Dedicated Book Chat */}
      <AIChat 
        bookContext={book} 
        isOpen={isChatOpen} 
        onClose={() => setIsChatOpen(false)} 
      />
    </motion.div>
  );
}
