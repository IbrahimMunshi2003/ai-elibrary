import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FiBookmark, FiStar } from 'react-icons/fi';
import { useBookmarkStore } from '../store/bookmarkStore';
import { apiService, getFullUrl } from '../services/api';
import toast from 'react-hot-toast';

export default function BookCard({ book }) {
  const { isBookmarked, addBookmark, removeBookmark } = useBookmarkStore();
  const bookmarked = isBookmarked(book.id);

  const cover = getFullUrl(book.cover_image || book.cover_image_url);

  const handleBookmark = async (e) => {
    e.preventDefault(); // Prevent navigating to detail page
    if (bookmarked) {
      removeBookmark(book.id);
      toast.success('Removed from bookmarks');
      await apiService.removeBookmark(book.id);
    } else {
      addBookmark(book);
      toast.success('Added to bookmarks');
      await apiService.addBookmark(book.id);
      await apiService.trackActivity('bookmark');
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
        <div className="relative overflow-hidden bg-muted">
          <img
            src={cover}
            alt={book.title}
            className="w-full h-48 object-cover transition-transform duration-300 group-hover:scale-105"
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
        <div className="p-4 flex flex-col grow">
          <h3 className="font-semibold text-foreground line-clamp-1 mb-1">{book.title}</h3>
          <p className="text-sm text-muted-foreground mb-2">{book.author}</p>
          
          <div className="flex items-center gap-1.5 mb-3 text-sm font-medium">
            <div className="flex items-center gap-1 text-amber-500">
              <FiStar className="fill-current" />
              <span>{book.rating || 0}</span>
            </div>
            {book.commentCount > 0 && (
              <span className="text-muted-foreground text-xs font-normal">
                ({book.commentCount})
              </span>
            )}
          </div>
          
          <p className="text-sm text-muted-foreground line-clamp-2 mt-auto mb-4">
            {book.description || "No description available."}
          </p>

          <div className="flex flex-col gap-2">
            <Link 
              to={`/books/${book.id}`}
              className="w-full py-2 bg-primary-600 hover:bg-primary-700 text-white text-center rounded-lg text-sm font-semibold transition-colors"
            >
              View Details
            </Link>
            
            {book.pdfUrl && (
              <a 
                href={book.pdfUrl}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="w-full py-2 bg-muted hover:bg-muted/80 text-foreground text-center rounded-lg text-sm font-semibold transition-colors border border-border"
              >
                Read PDF
              </a>
            )}
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
