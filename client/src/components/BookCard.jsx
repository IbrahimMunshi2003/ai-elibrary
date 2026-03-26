import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FiBookmark, FiStar } from 'react-icons/fi';
import { useBookmarkStore } from '../store/bookmarkStore';
import toast from 'react-hot-toast';

export default function BookCard({ book }) {
  const { isBookmarked, addBookmark, removeBookmark } = useBookmarkStore();
  const bookmarked = isBookmarked(book.id);

  const handleBookmark = (e) => {
    e.preventDefault(); // Prevent navigating to detail page
    if (bookmarked) {
      removeBookmark(book.id);
      toast.success('Removed from bookmarks');
    } else {
      addBookmark(book);
      toast.success('Added to bookmarks');
    }
  };

  return (
    <motion.div
      whileHover={{ y: -5 }}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="group flex flex-col h-full bg-card rounded-xl border border-border shadow-sm overflow-hidden hover:shadow-md transition-shadow relative"
    >
      <Link to={`/books/${book.id}`} className="flex flex-col h-full">
        {/* Image Container */}
        <div className="relative aspect-[3/4] overflow-hidden bg-muted">
          <img
            src={book.coverImage}
            alt={book.title}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
            loading="lazy"
          />
          <div className="absolute top-2 left-2">
            <span className="px-2 py-1 text-xs font-semibold bg-background/90 backdrop-blur-sm text-foreground rounded-md shadow-sm">
              {book.category}
            </span>
          </div>
          <button
            onClick={handleBookmark}
            className="absolute top-2 right-2 p-2 rounded-full bg-background/90 backdrop-blur-sm text-foreground shadow-sm hover:text-primary-600 transition-colors z-10"
            aria-label={bookmarked ? "Remove bookmark" : "Add bookmark"}
          >
            <FiBookmark className={bookmarked ? "fill-primary-600 text-primary-600" : ""} />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 flex flex-col flex-grow">
          <h3 className="font-semibold text-foreground line-clamp-1 mb-1">{book.title}</h3>
          <p className="text-sm text-muted-foreground mb-2">{book.author}</p>
          
          <div className="flex items-center gap-1 mb-3 text-sm font-medium text-amber-500">
            <FiStar className="fill-current" />
            <span>{book.rating}</span>
          </div>
          
          <p className="text-sm text-muted-foreground line-clamp-2 mt-auto">
            {book.description}
          </p>
        </div>
      </Link>
    </motion.div>
  );
}
