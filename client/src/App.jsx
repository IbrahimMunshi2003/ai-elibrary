import { BrowserRouter, Routes, Route } from 'react-router-dom';
import ErrorBoundary from './components/ErrorBoundary';
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';

// Pages
import Home from './pages/Home';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Search from './pages/Search';
import BookDetail from './pages/BookDetail';
import Dashboard from './pages/Dashboard';
import Bookmarks from './pages/Bookmarks';
import AdminPanel from './pages/AdminPanel';

function App() {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <Routes>
          <Route element={<Layout />}>
            {/* Public Routes */}
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/search" element={<Search />} />
            <Route path="/books/:id" element={<BookDetail />} />

            {/* Protected Routes */}
            <Route element={<ProtectedRoute />}>
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/bookmarks" element={<Bookmarks />} />
              {/* Note: AdminPanel should ideally have role-based checking too, but we use ProtectedRoute for now */}
              <Route path="/admin" element={<AdminPanel />} />
            </Route>

            {/* 404 Fallback */}
            <Route path="*" element={
              <div className="py-32 text-center flex flex-col items-center justify-center">
                <h1 className="text-6xl font-bold text-primary-600 mb-4">404</h1>
                <h2 className="text-2xl font-bold text-foreground mb-4">Page Not Found</h2>
                <p className="text-muted-foreground mb-8">The page you're looking for doesn't exist or has been moved.</p>
                <a href="/" className="bg-primary-600 text-white px-6 py-3 rounded-lg hover:bg-primary-700 transition">Go Home</a>
              </div>
            } />
          </Route>
        </Routes>
      </BrowserRouter>
    </ErrorBoundary>
  );
}

export default App;
