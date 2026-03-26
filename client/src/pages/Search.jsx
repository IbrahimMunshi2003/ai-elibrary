import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { apiService } from '../services/api';
import SearchBar from '../components/SearchBar';
import BookCard from '../components/BookCard';
import { GridSkeleton } from '../components/Loader';
import { CATEGORIES } from '../utils/constants';

export default function Search() {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialQuery = searchParams.get('q') || '';
  
  const [books, setBooks] = useState([]);
  const [filteredBooks, setFilteredBooks] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [category, setCategory] = useState('All');
  const [sort, setSort] = useState('recent');

  useEffect(() => {
    const fetchResults = async () => {
      setIsLoading(true);
      try {
        const query = searchParams.get('q') || '';
        const response = await (query ? apiService.searchBooks(query) : apiService.getBooks());
        setBooks(response.data);
      } catch (error) {
        console.error("Search failed:", error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchResults();
  }, [searchParams]);

  // Handle client-side filtering and sorting since we are mocking
  useEffect(() => {
    let result = [...books];
    
    // Filter
    if (category !== 'All') {
      result = result.filter(b => b.category === category);
    }
    
    // Sort
    result.sort((a, b) => {
      if (sort === 'title_asc') return a.title.localeCompare(b.title);
      if (sort === 'title_desc') return b.title.localeCompare(a.title);
      return 0; // recent (default from mock data)
    });
    
    setFilteredBooks(result);
  }, [books, category, sort]);

  const handleSearch = (query) => {
    if (query) {
      setSearchParams({ q: query });
    } else {
      setSearchParams({});
    }
  };

  return (
    <div className="flex flex-col gap-8 pb-12 pt-6">
      {/* Header & Search */}
      <div className="text-center max-w-2xl mx-auto w-full mb-6">
        <h1 className="text-4xl font-bold mb-4">Library Catalog</h1>
        <p className="text-muted-foreground mb-8">Find exactly what you're looking for</p>
        <SearchBar 
          onSearch={handleSearch} 
          initialQuery={initialQuery}
          onCategoryChange={setCategory}
          onSortChange={setSort}
        />
      </div>

      {/* Results Meta */}
      <div className="flex items-center justify-between border-b border-border pb-4">
        <h2 className="text-xl font-semibold">
          {initialQuery ? `Search Results for "${initialQuery}"` : 'All Books'}
        </h2>
        <span className="text-sm font-medium text-muted-foreground bg-muted px-3 py-1 rounded-full">
          {isLoading ? '...' : filteredBooks.length} results
        </span>
      </div>

      {/* Results Grid */}
      {isLoading ? (
        <GridSkeleton count={8} />
      ) : filteredBooks.length === 0 ? (
        <div className="py-20 text-center flex flex-col items-center justify-center bg-card rounded-2xl border border-border border-dashed">
          <div className="text-6xl mb-4">📚</div>
          <h3 className="text-2xl font-bold mb-2">No books found</h3>
          <p className="text-muted-foreground">Try adjusting your search or filters to find what you're looking for.</p>
          <button 
            onClick={() => { setSearchParams({}); setCategory('All'); }}
            className="mt-6 text-primary-600 bg-primary-50 dark:bg-primary-900/20 px-6 py-2 rounded-lg hover:bg-primary-100 dark:hover:bg-primary-900/40 transition-colors"
          >
            Clear Filters & Search
          </button>
        </div>
      ) : (
        <motion.div layout className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          <AnimatePresence>
            {filteredBooks.map((book) => (
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
