import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { FiClock, FiBookmark, FiThumbsUp } from 'react-icons/fi';
import { useAuthStore } from '../store/authStore';
import { useBookmarkStore } from '../store/bookmarkStore';
import { apiService } from '../services/api';
import BookCard from '../components/BookCard';
import RecommendationCarousel from '../components/RecommendationCarousel';
import Loader from '../components/Loader';

export default function Dashboard() {
  const { user } = useAuthStore();
  const { bookmarks } = useBookmarkStore();
  const [recommendations, setRecommendations] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Fetch generic recommendations for dashboard
    const fetchRecs = async () => {
      try {
        const res = await apiService.getBooks();
        setRecommendations(res.data);
      } catch (err) {
        console.error('Failed to load Dashboard recommendations');
      } finally {
        setIsLoading(false);
      }
    };
    fetchRecs();
  }, []);

  if (isLoading) return <Loader />;

  return (
    <div className="pb-12">
      {/* Header */}
      <div className="mb-10">
        <h1 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary-600 to-primary-400 mb-2">
          Welcome back, {user?.name?.split(' ')[0] || 'Reader'}!
        </h1>
        <p className="text-muted-foreground text-lg">Here's what's happening in your library today.</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
        <motion.div 
          initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          className="bg-card p-6 rounded-2xl border border-border shadow-sm flex items-center gap-4"
        >
          <div className="w-12 h-12 bg-primary-100 dark:bg-primary-900/30 text-primary-600 rounded-full flex items-center justify-center shrink-0">
            <FiBookmark className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm font-medium text-muted-foreground">Saved Books</p>
            <p className="text-2xl font-bold text-foreground">{bookmarks.length}</p>
          </div>
        </motion.div>
        
        <motion.div 
          initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
          className="bg-card p-6 rounded-2xl border border-border shadow-sm flex items-center gap-4"
        >
          <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 text-green-600 rounded-full flex items-center justify-center shrink-0">
            <FiClock className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm font-medium text-muted-foreground">Hours Read</p>
            <p className="text-2xl font-bold text-foreground">12.5 h</p>
          </div>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
          className="bg-card p-6 rounded-2xl border border-border shadow-sm flex items-center gap-4"
        >
          <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 text-blue-600 rounded-full flex items-center justify-center shrink-0">
            <FiThumbsUp className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm font-medium text-muted-foreground">Books Finished</p>
            <p className="text-2xl font-bold text-foreground">4</p>
          </div>
        </motion.div>
      </div>

      {/* Continue Reading / Recent Bookmarks */}
      <div className="mb-12">
        <h2 className="text-2xl font-bold text-foreground mb-6 flex items-center gap-2">
          <FiBookmark className="text-primary-500" /> Recently Saved
        </h2>
        {bookmarks.length === 0 ? (
          <div className="bg-muted px-6 py-12 rounded-2xl text-center border border-border border-dashed">
            <p className="text-muted-foreground">You haven't saved any books yet.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {bookmarks.slice(0, 4).map(book => (
              <BookCard key={`dash-bm-${book.id}`} book={book} />
            ))}
          </div>
        )}
      </div>

      {/* AI Recommendations */}
      <div className="bg-primary-50 dark:bg-primary-900/10 -mx-4 sm:-mx-6 lg:-mx-8 px-4 sm:px-6 lg:px-8 py-10 rounded-3xl">
        <div className="max-w-7xl mx-auto">
          <RecommendationCarousel books={recommendations} title="AI Recommends for You" />
        </div>
      </div>
    </div>
  );
}
