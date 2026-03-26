import { motion, AnimatePresence } from 'framer-motion';
import { FiBookmark } from 'react-icons/fi';
import { Link } from 'react-router-dom';
import { useBookmarkStore } from '../store/bookmarkStore';
import BookCard from '../components/BookCard';

export default function Bookmarks() {
  const { bookmarks } = useBookmarkStore();

  return (
    <div className="py-8">
      <div className="flex items-center gap-3 mb-8">
        <div className="w-12 h-12 bg-primary-100 dark:bg-primary-900/30 text-primary-600 rounded-2xl flex items-center justify-center">
          <FiBookmark className="w-6 h-6" />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-foreground">Your Bookmarks</h1>
          <p className="text-muted-foreground">Manage your reading list</p>
        </div>
      </div>

      {bookmarks.length === 0 ? (
        <div className="py-20 text-center flex flex-col items-center justify-center bg-card rounded-2xl border border-border border-dashed">
          <div className="text-6xl mb-4 opacity-50">🔖</div>
          <h3 className="text-2xl font-bold mb-2 text-foreground">No bookmarks yet</h3>
          <p className="text-muted-foreground max-w-sm">
            Save books you want to read later by clicking the bookmark icon on any book card.
          </p>
          <Link 
            to="/search"
            className="mt-6 text-primary-600 bg-primary-50 dark:bg-primary-900/20 px-6 py-2 rounded-lg hover:bg-primary-100 dark:hover:bg-primary-900/40 transition-colors font-medium"
          >
            Browse Books
          </Link>
        </div>
      ) : (
        <motion.div layout className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          <AnimatePresence>
            {bookmarks.map((book) => (
              <motion.div
                key={book.id}
                layout
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.2 }}
              >
                <BookCard book={book} />
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>
      )}
    </div>
  );
}
