import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { FiSearch, FiMenu, FiX, FiBookOpen, FiUser } from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';

export default function Navbar() {
  const { isAuthenticated, logout, user } = useAuthStore();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();
  const location = useLocation();

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery)}`);
      setSearchQuery('');
      setIsMenuOpen(false);
    }
  };

  return (
    <nav className="sticky top-0 z-50 bg-white border-b border-border shadow-[0_2px_15px_-3px_rgba(0,0,0,0.02)]">
      <div className="w-full px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* Logo & Desktop Nav */}
          <div className="flex items-center">
            <Link to="/" className="flex items-center gap-2">
              <FiBookOpen className="w-8 h-8 text-primary-500" />
              <span className="font-bold text-xl tracking-tight text-foreground">AI-ELibrary</span>
            </Link>
            
            <div className="hidden md:ml-10 md:flex md:space-x-8 h-full">
              <Link to="/" className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium transition-colors h-full ${location.pathname === '/' ? 'border-primary-500 text-primary-600' : 'border-transparent text-muted-foreground hover:text-foreground hover:border-gray-300'}`}>Home</Link>
              <Link to="/search" className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium transition-colors h-full ${location.pathname === '/search' && !location.search.includes('category=Audio') ? 'border-primary-500 text-primary-600' : 'border-transparent text-muted-foreground hover:text-foreground hover:border-gray-300'}`}>Browse</Link>
              <Link to="/search?category=Audio%20Books" className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium transition-colors h-full ${location.search.includes('category=Audio') ? 'border-primary-500 text-primary-600' : 'border-transparent text-muted-foreground hover:text-foreground hover:border-gray-300'}`}>Audio Books</Link>
              {isAuthenticated && (
                <Link to="/dashboard" className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium transition-colors h-full ${location.pathname === '/dashboard' ? 'border-primary-500 text-primary-600' : 'border-transparent text-muted-foreground hover:text-foreground hover:border-gray-300'}`}>Dashboard</Link>
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

            {isAuthenticated ? (
              <div className="flex items-center gap-4">
                <Link to="/bookmarks" className="text-sm font-medium text-muted-foreground hover:text-foreground">Bookmarks</Link>
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center text-primary-700">
                    <FiUser />
                  </div>
                  <button onClick={logout} className="text-sm font-medium text-muted-foreground hover:text-foreground">Logout</button>
                </div>
              </div>
            ) : (
              <div className="flex items-center space-x-4">
                <Link to="/login" className="text-sm font-medium text-muted-foreground hover:text-foreground">Login</Link>
                <Link to="/signup" className="text-sm font-medium bg-primary-500 hover:bg-primary-600 text-white px-4 py-2 rounded-full transition-colors">Sign Up</Link>
              </div>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="flex items-center md:hidden gap-4">
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
            className="md:hidden absolute top-full left-0 w-full bg-background shadow-md border-t border-border overflow-hidden z-50"
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
              
              <Link to="/" onClick={() => setIsMenuOpen(false)} className={`block px-3 py-2 rounded-md text-base font-medium ${location.pathname === '/' ? 'text-primary-600 bg-primary-50' : 'text-muted-foreground hover:text-foreground hover:bg-muted'}`}>Home</Link>
              <Link to="/search" onClick={() => setIsMenuOpen(false)} className={`block px-3 py-2 rounded-md text-base font-medium ${location.pathname === '/search' && !location.search.includes('category=Audio') ? 'text-primary-600 bg-primary-50' : 'text-muted-foreground hover:text-foreground hover:bg-muted'}`}>Browse Books</Link>
              <Link to="/search?category=Audio%20Books" onClick={() => setIsMenuOpen(false)} className={`block px-3 py-2 rounded-md text-base font-medium ${location.search.includes('category=Audio') ? 'text-primary-600 bg-primary-50' : 'text-muted-foreground hover:text-foreground hover:bg-muted'}`}>Audio Books</Link>
              <button 
                onClick={() => { 
                  setIsMenuOpen(false); 
                  document.dispatchEvent(new CustomEvent('toggleAIChat')); 
                  window.dispatchEvent(new Event('toggleAIChat')); 
                }} 
                className="block w-full text-left px-3 py-2 rounded-md text-base font-medium text-muted-foreground hover:text-foreground hover:bg-muted"
              >
                AI Chat
              </button>
              
              {isAuthenticated ? (
                <>
                  <Link to="/dashboard" onClick={() => setIsMenuOpen(false)} className={`block px-3 py-2 rounded-md text-base font-medium ${location.pathname === '/dashboard' ? 'text-primary-600 bg-primary-50' : 'text-muted-foreground hover:text-foreground hover:bg-muted'}`}>Dashboard</Link>
                  <Link to="/bookmarks" onClick={() => setIsMenuOpen(false)} className={`block px-3 py-2 rounded-md text-base font-medium ${location.pathname === '/bookmarks' ? 'text-primary-600 bg-primary-50' : 'text-muted-foreground hover:text-foreground hover:bg-muted'}`}>Bookmarks</Link>
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
