import { useEffect, useRef, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import {
  FiBookOpen,
  FiChevronDown,
  FiChevronRight,
  FiMenu,
  FiSearch,
  FiUser,
  FiX,
} from 'react-icons/fi';
import { AnimatePresence, motion } from 'framer-motion';

const BOOK_GROUPS = [
  {
    name: 'History',
    children: ['Ancient History', 'World History', 'Indian History'],
  },
  {
    name: 'Science',
    children: ['Physics', 'Chemistry', 'Biology', 'Space & Astronomy'],
  },
  {
    name: 'Islamic',
    children: ['Quran', 'Hadith', 'Seerah', 'Islamic History', 'Islamic Books'],
  },
  {
    name: 'Comics',
    children: ['Superhero Comics', 'Manga', 'Kids Comics'],
  },
  {
    name: 'Fiction',
    children: ['Fantasy', 'Mystery', 'Thriller', 'Romance'],
  },
  {
    name: 'Education',
    children: ['Programming', 'Mathematics', 'Computer Science'],
  },
  { name: 'Biography' },
  { name: 'Technology' },
  { name: 'Audiobooks' },
];

const navLinkClass = (active) =>
  `inline-flex h-full items-center border-b-2 px-1 pt-1 text-sm font-medium transition-colors ${
    active
      ? 'border-primary-500 text-primary-600'
      : 'border-transparent text-muted-foreground hover:border-gray-300 hover:text-foreground'
  }`;

const mobileLinkClass = (active) =>
  `block rounded-md px-3 py-2 text-base font-medium ${
    active
      ? 'bg-primary-50 text-primary-600'
      : 'text-muted-foreground hover:bg-muted hover:text-foreground'
  }`;

export default function Navbar() {
  const { isAuthenticated, logout } = useAuthStore();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isBooksOpen, setIsBooksOpen] = useState(false);
  const [openDesktopGroups, setOpenDesktopGroups] = useState({});
  const [openMobileGroups, setOpenMobileGroups] = useState({});
  const [searchQuery, setSearchQuery] = useState('');
  const navbarRef = useRef(null);
  const navigate = useNavigate();
  const location = useLocation();

  const closeMenus = () => {
    setIsMenuOpen(false);
    setIsBooksOpen(false);
    setOpenDesktopGroups({});
    setOpenMobileGroups({});
  };

  useEffect(() => {
    const closeTimer = window.setTimeout(() => {
      closeMenus();
    }, 0);
    return () => window.clearTimeout(closeTimer);
  }, [location.pathname, location.search]);

  useEffect(() => {
    const handleOutsideClick = (event) => {
      if (navbarRef.current && !navbarRef.current.contains(event.target)) {
        setIsBooksOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  const handleSearch = (event) => {
    event.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
      setSearchQuery('');
      closeMenus();
    }
  };

  const openAiAssistant = () => {
    closeMenus();
    document.dispatchEvent(new CustomEvent('toggleAIChat'));
    window.dispatchEvent(new Event('toggleAIChat'));
  };

  const categoryPath = (category) =>
    `/search?category=${encodeURIComponent(category)}`;

  const isCategoryActive = (category) =>
    location.pathname === '/search' &&
    location.search.includes(`category=${encodeURIComponent(category)}`);

  return (
    <nav
      ref={navbarRef}
      className="sticky top-0 z-50 border-b border-border bg-white shadow-[0_2px_15px_-3px_rgba(0,0,0,0.02)]"
    >
      <div className="w-full px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 justify-between">
          <div className="flex items-center">
            <Link to="/" className="flex items-center gap-2" onClick={closeMenus}>
              <FiBookOpen className="h-8 w-8 text-primary-500" />
              <span className="text-xl font-bold tracking-tight text-foreground">
                AI-ELibrary
              </span>
            </Link>

            <div className="ml-10 hidden h-full items-center space-x-8 md:flex">
              <Link to="/" onClick={closeMenus} className={navLinkClass(location.pathname === '/')}>
                Home
              </Link>
              <div
                className="relative h-full"
                onMouseEnter={() => setIsBooksOpen(true)}
                onMouseLeave={() => setIsBooksOpen(false)}
              >
                <button
                  type="button"
                  aria-haspopup="menu"
                  aria-expanded={isBooksOpen}
                  onClick={() => setIsBooksOpen((open) => !open)}
                  onKeyDown={(event) => {
                    if (event.key === 'Escape') setIsBooksOpen(false);
                  }}
                  className={navLinkClass(location.pathname === '/search')}
                >
                  Books <FiChevronDown className="ml-1 h-4 w-4" aria-hidden="true" />
                </button>
                <AnimatePresence>
                  {isBooksOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 8 }}
                      role="menu"
                      className="absolute left-0 top-full z-50 mt-0 w-64 rounded-xl border border-border bg-background p-2 shadow-xl"
                    >
                      {BOOK_GROUPS.map((group) =>
                        group.children ? (
                          <div key={group.name} className="group relative">
                            <button
                              type="button"
                              role="menuitem"
                              aria-haspopup="menu"
                              aria-expanded={Boolean(openDesktopGroups[group.name])}
                              onClick={() =>
                                setOpenDesktopGroups((open) => ({
                                  ...open,
                                  [group.name]: !open[group.name],
                                }))
                              }
                              className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm font-medium text-foreground hover:bg-muted"
                            >
                              {group.name}
                              <FiChevronRight className="h-4 w-4" aria-hidden="true" />
                            </button>
                            <div
                              role="menu"
                              className={`invisible absolute left-full top-0 ml-1 w-56 rounded-xl border border-border bg-background p-2 opacity-0 shadow-xl transition-all group-hover:visible group-hover:opacity-100 group-focus-within:visible group-focus-within:opacity-100 ${
                                openDesktopGroups[group.name] ? 'visible opacity-100' : ''
                              }`}
                            >
                              {group.children.map((child) => (
                                <Link
                                  key={child}
                                  role="menuitem"
                                  to={categoryPath(child)}
                                  onClick={closeMenus}
                                  className={`block rounded-lg px-3 py-2 text-sm hover:bg-muted ${
                                    isCategoryActive(child)
                                      ? 'bg-primary-50 text-primary-600'
                                      : 'text-foreground'
                                  }`}
                                >
                                  {child}
                                </Link>
                              ))}
                            </div>
                          </div>
                        ) : (
                          <Link
                            key={group.name}
                            role="menuitem"
                            to={categoryPath(group.name)}
                            onClick={closeMenus}
                            className={`block rounded-lg px-3 py-2 text-sm hover:bg-muted ${
                              isCategoryActive(group.name)
                                ? 'bg-primary-50 text-primary-600'
                                : 'text-foreground'
                            }`}
                          >
                            {group.name}
                          </Link>
                        ),
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
              {isAuthenticated && (
                <Link
                  to="/dashboard"
                  onClick={closeMenus}
                  className={navLinkClass(location.pathname === '/dashboard')}
                >
                  Dashboard
                </Link>
              )}
              <button
                type="button"
                onClick={openAiAssistant}
                className="inline-flex h-full items-center border-b-2 border-transparent px-1 pt-1 text-sm font-medium text-muted-foreground transition-colors hover:border-gray-300 hover:text-foreground"
              >
                AI Assistant
              </button>
            </div>
          </div>

          <div className="hidden items-center md:flex">
            {isAuthenticated ? (
              <div className="flex items-center gap-4">
                <Link to="/bookmarks" onClick={closeMenus} className="text-sm font-medium text-muted-foreground hover:text-foreground">
                  Bookmarks
                </Link>
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary-100 text-primary-700">
                    <FiUser />
                  </div>
                  <button type="button" onClick={logout} className="text-sm font-medium text-muted-foreground hover:text-foreground">
                    Logout
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex items-center space-x-4">
                <Link to="/login" onClick={closeMenus} className="text-sm font-medium text-muted-foreground hover:text-foreground">Login</Link>
                <Link to="/signup" onClick={closeMenus} className="rounded-full bg-primary-500 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-primary-600">Sign Up</Link>
              </div>
            )}
          </div>

          <div className="flex items-center gap-4 md:hidden">
            <button
              type="button"
              aria-label={isMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
              aria-expanded={isMenuOpen}
              onClick={() => setIsMenuOpen((open) => !open)}
              className="rounded-md p-2 text-muted-foreground hover:bg-muted hover:text-foreground"
            >
              {isMenuOpen ? <FiX className="h-6 w-6" /> : <FiMenu className="h-6 w-6" />}
            </button>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {isMenuOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="absolute left-0 top-full z-50 w-full overflow-hidden border-t border-border bg-background shadow-md md:hidden"
          >
            <div className="space-y-1 px-4 pb-4 pt-2">
              <form onSubmit={handleSearch} className="relative mb-4 mt-2">
                <input
                  type="search"
                  aria-label="Search books"
                  placeholder="Search books..."
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                  className="w-full rounded-md border-transparent bg-muted py-2 pl-10 pr-4 outline-none focus:border-primary-500 focus:bg-background focus:ring-2 focus:ring-primary-500/20"
                />
                <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              </form>

              <Link to="/" onClick={closeMenus} className={mobileLinkClass(location.pathname === '/')}>Home</Link>
              <div>
                <button
                  type="button"
                  aria-expanded={isBooksOpen}
                  onClick={() => setIsBooksOpen((open) => !open)}
                  className={`${mobileLinkClass(location.pathname === '/search')} flex w-full items-center justify-between`}
                >
                  Books <FiChevronDown className={`h-5 w-5 transition-transform ${isBooksOpen ? 'rotate-180' : ''}`} />
                </button>
                <AnimatePresence>
                  {isBooksOpen && (
                    <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} className="overflow-hidden pl-3">
                      {BOOK_GROUPS.map((group) => (
                        <div key={group.name}>
                          {group.children ? (
                            <>
                              <button
                                type="button"
                                aria-expanded={Boolean(openMobileGroups[group.name])}
                                onClick={() => setOpenMobileGroups((open) => ({ ...open, [group.name]: !open[group.name] }))}
                                className="flex w-full items-center justify-between rounded-md px-3 py-2 text-left text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground"
                              >
                                {group.name}
                                <FiChevronRight className={`h-4 w-4 transition-transform ${openMobileGroups[group.name] ? 'rotate-90' : ''}`} />
                              </button>
                              <AnimatePresence>
                                {openMobileGroups[group.name] && (
                                  <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} className="overflow-hidden pl-3">
                                    {group.children.map((child) => (
                                      <Link key={child} to={categoryPath(child)} onClick={closeMenus} className={mobileLinkClass(isCategoryActive(child))}>
                                        {child}
                                      </Link>
                                    ))}
                                  </motion.div>
                                )}
                              </AnimatePresence>
                            </>
                          ) : (
                            <Link to={categoryPath(group.name)} onClick={closeMenus} className={mobileLinkClass(isCategoryActive(group.name))}>
                              {group.name}
                            </Link>
                          )}
                        </div>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
              <button type="button" onClick={openAiAssistant} className="block w-full rounded-md px-3 py-2 text-left text-base font-medium text-muted-foreground hover:bg-muted hover:text-foreground">
                AI Assistant
              </button>

              {isAuthenticated ? (
                <>
                  <Link to="/dashboard" onClick={closeMenus} className={mobileLinkClass(location.pathname === '/dashboard')}>Dashboard</Link>
                  <Link to="/bookmarks" onClick={closeMenus} className={mobileLinkClass(location.pathname === '/bookmarks')}>Bookmarks</Link>
                  <button type="button" onClick={() => { logout(); closeMenus(); }} className="block w-full rounded-md px-3 py-2 text-left text-base font-medium text-red-500 hover:bg-muted">Logout</button>
                </>
              ) : (
                <div className="mt-4 flex flex-col gap-2 border-t border-border pt-4">
                  <Link to="/login" onClick={closeMenus} className="block rounded-md border border-border px-4 py-2 text-center text-foreground">Login</Link>
                  <Link to="/signup" onClick={closeMenus} className="block rounded-md bg-primary-600 px-4 py-2 text-center text-white">Sign Up</Link>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}
