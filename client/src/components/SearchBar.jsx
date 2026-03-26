import { useState, useCallback } from 'react';
import { FiSearch, FiFilter } from 'react-icons/fi';
import { CATEGORIES, SORT_OPTIONS } from '../utils/constants';

export default function SearchBar({ onSearch, onCategoryChange, onSortChange, initialQuery = '' }) {
  const [query, setQuery] = useState(initialQuery);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSearch(query);
  };

  return (
    <div className="w-full max-w-4xl mx-auto flex flex-col gap-4">
      {/* Search Input Box */}
      <form onSubmit={handleSubmit} className="relative w-full shadow-sm">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by title, author, or keyword..."
          className="w-full pl-12 pr-4 py-4 rounded-xl border border-border bg-card text-foreground focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all shadow-sm text-lg"
        />
        <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground w-6 h-6" />
        <button 
          type="submit" 
          className="absolute right-2 top-1/2 -translate-y-1/2 bg-primary-600 hover:bg-primary-700 text-white px-6 py-2 rounded-lg font-medium transition-colors"
        >
          Search
        </button>
      </form>

      {/* Filters & Sorting */}
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
        <div className="flex items-center gap-2 overflow-x-auto w-full pb-2 sm:pb-0 hide-scrollbar">
          <FiFilter className="text-muted-foreground hidden sm:block shrink-0" />
          {CATEGORIES.map(category => (
            <button
              key={category}
              onClick={() => onCategoryChange(category)}
              className="whitespace-nowrap px-4 py-1.5 rounded-full text-sm font-medium border border-border bg-card hover:bg-muted hover:border-primary-500/50 transition-colors focus:ring-2 focus:ring-primary-500/20"
            >
              {category}
            </button>
          ))}
        </div>
        
        <div className="shrink-0 ml-auto flex items-center gap-2">
          <label htmlFor="sort" className="text-sm font-medium text-muted-foreground">Sort by:</label>
          <select 
            id="sort"
            onChange={(e) => onSortChange(e.target.value)}
            className="bg-card border border-border text-foreground text-sm rounded-lg focus:ring-primary-500 focus:border-primary-500 block p-2 outline-none"
          >
            {SORT_OPTIONS.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
}
