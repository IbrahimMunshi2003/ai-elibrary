import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useThemeStore } from '../store/themeStore';
import { useAuthStore } from '../store/authStore';
import { FiSun, FiMoon, FiSearch, FiMenu, FiX, FiBookOpen, FiUser } from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';

export default function Navbar() {
  const { isDarkMode, toggleDarkMode } = useThemeStore();
  const { isAuthenticated, logout, user } = useAuthStore();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery)}`);
      setSearchQuery('');
      setIsMenuOpen(false);
    }
  };

  return (
    <nav className="sticky top-0 z-50 glass-card">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* Logo & Desktop Nav */}
          <div className="flex items-center">
            <Link to="/" className="flex items-center gap-2">
              <FiBookOpen className="w-8 h-8 text-primary-600 dark:text-primary-500" />
              <span className="font-bold text-xl tracking-tight text-foreground">AI-ELibrary</span>
            </Link>
            
            <div className="hidden md:ml-10 md:flex md:space-x-8">
              <Link to="/" className="text-muted-foreground hover:text-foreground inline-flex items-center px-1 pt-1 text-sm font-medium transition-colors">Home</Link>
              <Link to="/search" className="text-muted-foreground hover:text-foreground inline-flex items-center px-1 pt-1 text-sm font-medium transition-colors">Browse</Link>
              {isAuthenticated && (
                <Link to="/dashboard" className="text-muted-foreground hover:text-foreground inline-flex items-center px-1 pt-1 text-sm font-medium transition-colors">Dashboard</Link>
              )}
            </div>
          </div>

          {/* Desktop Right Side */}
          <div className="hidden md:flex items-center space-x-6">
            <form onSubmit={handleSearch} className="relative">
              <input
                type="text"
                placeholder="Search books..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-64 pl-10 pr-4 py-2 rounded-full bg-muted border-transparent focus:bg-background focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 outline-none text-sm transition-all"
              />
              <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            </form>

            <button
              onClick={toggleDarkMode}
              className="p-2 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
              aria-label="Toggle Dark Mode"
            >
              {isDarkMode ? <FiSun className="w-5 h-5" /> : <FiMoon className="w-5 h-5" />}
            </button>

            {isAuthenticated ? (
              <div className="flex items-center gap-4">
                <Link to="/bookmarks" className="text-sm font-medium text-muted-foreground hover:text-foreground">Bookmarks</Link>
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-primary-100 dark:bg-primary-900 flex items-center justify-center text-primary-700 dark:text-primary-300">
                    <FiUser />
                  </div>
                  <button onClick={logout} className="text-sm font-medium text-muted-foreground hover:text-foreground">Logout</button>
                </div>
              </div>
            ) : (
              <div className="flex items-center space-x-4">
                <Link to="/login" className="text-sm font-medium text-muted-foreground hover:text-foreground">Login</Link>
                <Link to="/signup" className="text-sm font-medium bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-full transition-colors">Sign Up</Link>
              </div>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="flex items-center md:hidden gap-4">
            <button onClick={toggleDarkMode} className="text-muted-foreground">
              {isDarkMode ? <FiSun className="w-5 h-5" /> : <FiMoon className="w-5 h-5" />}
            </button>
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="p-2 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted"
            >
              {isMenuOpen ? <FiX className="w-6 h-6" /> : <FiMenu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isMenuOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="md:hidden border-t border-border overflow-hidden bg-background"
          >
            <div className="px-4 pt-2 pb-4 space-y-1">
              <form onSubmit={handleSearch} className="relative mb-4 mt-2">
                <input
                  type="text"
                  placeholder="Search books..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 rounded-md bg-muted border-transparent focus:bg-background focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 outline-none"
                />
                <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              </form>
              
              <Link to="/" onClick={() => setIsMenuOpen(false)} className="block px-3 py-2 rounded-md text-base font-medium text-foreground hover:bg-muted">Home</Link>
              <Link to="/search" onClick={() => setIsMenuOpen(false)} className="block px-3 py-2 rounded-md text-base font-medium text-muted-foreground hover:text-foreground hover:bg-muted">Browse Books</Link>
              
              {isAuthenticated ? (
                <>
                  <Link to="/dashboard" onClick={() => setIsMenuOpen(false)} className="block px-3 py-2 rounded-md text-base font-medium text-muted-foreground hover:text-foreground hover:bg-muted">Dashboard</Link>
                  <Link to="/bookmarks" onClick={() => setIsMenuOpen(false)} className="block px-3 py-2 rounded-md text-base font-medium text-muted-foreground hover:text-foreground hover:bg-muted">Bookmarks</Link>
                  <button onClick={() => { logout(); setIsMenuOpen(false); }} className="block w-full text-left px-3 py-2 rounded-md text-base font-medium text-red-500 hover:bg-muted">Logout</button>
                </>
              ) : (
                <div className="pt-4 mt-4 border-t border-border flex flex-col gap-2">
                  <Link to="/login" onClick={() => setIsMenuOpen(false)} className="block text-center px-4 py-2 border border-border rounded-md text-foreground">Login</Link>
                  <Link to="/signup" onClick={() => setIsMenuOpen(false)} className="block text-center px-4 py-2 bg-primary-600 text-white rounded-md">Sign Up</Link>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}
