import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiStar, FiUser, FiSend, FiTrash2, FiMessageSquare, FiClock } from 'react-icons/fi';
import { apiService } from '../services/api';
import toast from 'react-hot-toast';

export default function CommentSection({ bookId, initialRating, onRatingUpdate }) {
  const [comments, setComments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Form state
  const [name, setName] = useState('');
  const [rating, setRating] = useState(5);
  const [hoverRating, setHoverRating] = useState(0);
  const [commentText, setCommentText] = useState('');

  useEffect(() => {
    fetchComments();
  }, [bookId]);

  const fetchComments = async () => {
    setIsLoading(true);
    try {
      const data = await apiService.getComments(bookId);
      setComments(data);
    } catch (error) {
      console.error("Fetch comments error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim() || !commentText.trim()) {
      toast.error('Please fill in all fields');
      return;
    }

    const newComment = {
      user_name: name,
      comment_text: commentText,
      rating: rating,
      created_at: new Date().toISOString(), // Temporary for optimistic UI
      id: Date.now(), // Temporary ID
      isOptimistic: true
    };

    // Optimistic Update
    setComments([newComment, ...comments]);
    setIsSubmitting(true);
    
    // Clear form
    setName('');
    setCommentText('');
    setRating(5);

    try {
      const result = await apiService.postComment(bookId, {
        user_name: newComment.user_name,
        comment_text: newComment.comment_text,
        rating: newComment.rating
      });
      
      // Replace optimistic comment with real one
      setComments(prev => prev.map(c => c.id === newComment.id ? result : c));
      toast.success('Review posted!');
      
      // Trigger update of book details (average rating) if callback provided
      if (onRatingUpdate) onRatingUpdate();
      
    } catch (error) {
      // Revert optimistic update
      setComments(prev => prev.filter(c => c.id !== newComment.id));
      toast.error('Failed to post review');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    // Optimistic Delete
    const originalComments = [...comments];
    setComments(prev => prev.filter(c => c.id !== id));
    
    try {
      await apiService.deleteComment(id);
      toast.success('Comment deleted');
      if (onRatingUpdate) onRatingUpdate();
    } catch (error) {
      // Revert
      setComments(originalComments);
      toast.error('Could not delete comment');
    }
  };

  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return new Intl.DateTimeFormat('en-US', options).format(new Date(dateString));
  };

  const StarRating = ({ value, onHover, onClick, interactive = false }) => (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type={interactive ? "button" : "span"}
          onMouseEnter={() => interactive && onHover(star)}
          onMouseLeave={() => interactive && onHover(0)}
          onClick={() => interactive && onClick(star)}
          className={`transition-all duration-200 ${interactive ? "cursor-pointer transform hover:scale-110" : ""}`}
        >
          <FiStar
            className={`w-5 h-5 ${
              star <= (hoverRating || value)
                ? "fill-amber-400 text-amber-400"
                : "text-muted-foreground/30"
            }`}
          />
        </button>
      ))}
    </div>
  );

  return (
    <div className="space-y-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Community Reviews</h2>
          <p className="text-muted-foreground">Share your thoughts with other readers</p>
        </div>
        
        {/* Quick Summary Badge */}
        <div className="flex items-center gap-3 px-4 py-2 bg-muted/50 rounded-full border border-border">
          <div className="flex items-center gap-1 text-amber-500 font-bold">
            <FiStar className="fill-current" />
            <span>{initialRating || 0}</span>
          </div>
          <div className="w-1 h-1 rounded-full bg-muted-foreground/30" />
          <span className="text-sm font-medium text-muted-foreground">
            {comments.length} {comments.length === 1 ? 'Review' : 'Reviews'}
          </span>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-12">
        {/* Form Column */}
        <div className="lg:col-span-1">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-6 rounded-2xl bg-card border border-border shadow-sm sticky top-24"
          >
            <h3 className="text-lg font-semibold mb-6 flex items-center gap-2">
              <FiMessageSquare className="text-primary-600" /> Write a Review
            </h3>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1.5 ml-1">Your Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. John Doe"
                  className="w-full px-4 py-2.5 rounded-xl bg-muted/30 border border-border focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1.5 ml-1">Rating</label>
                <div className="px-4 py-2 bg-muted/30 rounded-xl border border-border inline-block">
                  <StarRating 
                    value={rating} 
                    onHover={setHoverRating} 
                    onClick={setRating} 
                    interactive 
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1.5 ml-1">Your Thoughts</label>
                <textarea
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  placeholder="What did you like about this book?"
                  rows={4}
                  className="w-full px-4 py-2.5 rounded-xl bg-muted/30 border border-border focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all outline-none resize-none"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3 bg-primary-600 hover:bg-primary-700 text-white rounded-xl font-bold transition-all shadow-lg shadow-primary-500/20 flex items-center justify-center gap-2 transform active:scale-[0.98]"
              >
                {isSubmitting ? (
                  <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <FiSend className="w-4 h-4" /> Post Review
                  </>
                )}
              </button>
            </form>
          </motion.div>
        </div>

        {/* List Column */}
        <div className="lg:col-span-2 space-y-6">
          {isLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-32 rounded-2xl bg-muted animate-pulse" />
              ))}
            </div>
          ) : comments.length === 0 ? (
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="text-center py-20 bg-muted/20 border border-dashed border-border rounded-3xl"
            >
              <div className="w-16 h-16 bg-muted/50 rounded-full flex items-center justify-center mx-auto mb-4">
                <FiMessageSquare className="w-8 h-8 text-muted-foreground/50" />
              </div>
              <h3 className="text-xl font-bold text-foreground mb-1">No reviews yet</h3>
              <p className="text-muted-foreground">Be the first to share your thoughts on this book!</p>
            </motion.div>
          ) : (
            <AnimatePresence initial={false}>
              {comments.map((comment) => (
                <motion.div
                  key={comment.id}
                  layout
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className={`group p-6 rounded-2xl bg-card border transition-all ${
                    comment.isOptimistic ? "border-primary-500/50 opacity-70" : "border-border hover:border-primary-500/30 shadow-sm"
                  }`}
                >
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center text-primary-600">
                        <FiUser />
                      </div>
                      <div>
                        <h4 className="font-bold text-foreground flex items-center gap-2">
                          {comment.user_name}
                          {comment.isOptimistic && <span className="text-[10px] uppercase tracking-wider bg-primary-100 text-primary-600 px-1.5 py-0.5 rounded italic">Saving...</span>}
                        </h4>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <FiClock className="w-3 h-3" />
                          <span>{formatDate(comment.created_at)}</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3">
                      <StarRating value={comment.rating} />
                      <button 
                        onClick={() => handleDelete(comment.id)}
                        className="p-2 rounded-lg text-muted-foreground hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors md:opacity-0 group-hover:opacity-100"
                        title="Delete review"
                      >
                        <FiTrash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  
                  <p className="text-muted-foreground leading-relaxed whitespace-pre-wrap pl-1">
                    {comment.comment_text}
                  </p>
                </motion.div>
              ))}
            </AnimatePresence>
          )}
        </div>
      </div>
    </div>
  );
}
