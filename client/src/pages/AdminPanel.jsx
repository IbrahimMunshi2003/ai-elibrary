import { useState, useEffect } from 'react';
import { FiSettings, FiUsers, FiBook, FiPlus, FiEdit2, FiTrash2 } from 'react-icons/fi';
import { apiService } from '../services/api';
import Loader from '../components/Loader';
import toast from 'react-hot-toast';

export default function AdminPanel() {
  const [activeTab, setActiveTab] = useState('books');
  const [books, setBooks] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Users Mock Data (as there's no backend for this yet)
  const [users] = useState([
    { id: 1, name: 'Admin User', email: 'admin@example.com', role: 'admin' },
    { id: 2, name: 'Jane Doe', email: 'jane@example.com', role: 'user' },
    { id: 3, name: 'John Smith', email: 'john@example.com', role: 'user' },
  ]);

  useEffect(() => {
    const fetchBooks = async () => {
      try {
        const res = await apiService.getBooks();
        setBooks(res.data);
      } catch (err) {
        toast.error('Failed to load books');
      } finally {
        setIsLoading(false);
      }
    };
    fetchBooks();
  }, []);

  const handleDeleteMock = (id) => {
    if (window.confirm('Are you sure you want to delete this book?')) {
      setBooks(books.filter(b => b.id !== id));
      toast.success('Book deleted successfully');
    }
  };

  return (
    <div className="py-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
            <FiSettings className="text-primary-600" /> Admin Dashboard
          </h1>
          <p className="text-muted-foreground mt-1">Manage library inventory and users</p>
        </div>
        
        {activeTab === 'books' && (
          <button className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white font-medium rounded-lg hover:bg-primary-700 transition-colors shadow-sm self-start sm:self-auto">
            <FiPlus /> Add New Book
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex border-b border-border mb-6">
        <button
          onClick={() => setActiveTab('books')}
          className={`px-6 py-3 font-medium text-sm flex items-center gap-2 border-b-2 transition-colors ${
            activeTab === 'books' 
              ? 'border-primary-600 text-primary-600' 
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          <FiBook /> Manage Books
        </button>
        <button
          onClick={() => setActiveTab('users')}
          className={`px-6 py-3 font-medium text-sm flex items-center gap-2 border-b-2 transition-colors ${
            activeTab === 'users' 
              ? 'border-primary-600 text-primary-600' 
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          <FiUsers /> Manage Users
        </button>
      </div>

      {/* Content */}
      <div className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden">
        {isLoading ? (
          <Loader />
        ) : activeTab === 'books' ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-muted text-muted-foreground text-xs uppercase font-semibold">
                <tr>
                  <th className="px-6 py-4 rounded-tl-xl">Title</th>
                  <th className="px-6 py-4">Author</th>
                  <th className="px-6 py-4">Category</th>
                  <th className="px-6 py-4 text-right rounded-tr-xl">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {books.map((book) => (
                  <tr key={book.id} className="hover:bg-muted/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <img src={book.coverImage} alt={book.title} className="w-10 h-10 rounded object-cover shadow-sm bg-muted" />
                        <span className="font-medium text-foreground">{book.title}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-muted-foreground">{book.author}</td>
                    <td className="px-6 py-4">
                      <span className="px-2 py-1 bg-background border border-border rounded-md text-xs font-medium">
                        {book.category}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button className="p-2 text-blue-500 bg-blue-50 dark:bg-blue-900/20 rounded hover:bg-blue-100 dark:hover:bg-blue-900/40 transition-colors">
                          <FiEdit2 />
                        </button>
                        <button 
                          onClick={() => handleDeleteMock(book.id)}
                          className="p-2 text-red-500 bg-red-50 dark:bg-red-900/20 rounded hover:bg-red-100 dark:hover:bg-red-900/40 transition-colors"
                        >
                          <FiTrash2 />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-muted text-muted-foreground text-xs uppercase font-semibold">
                <tr>
                  <th className="px-6 py-4 rounded-tl-xl">Name</th>
                  <th className="px-6 py-4">Email</th>
                  <th className="px-6 py-4">Role</th>
                  <th className="px-6 py-4 text-right rounded-tr-xl">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {users.map((u) => (
                  <tr key={u.id} className="hover:bg-muted/50 transition-colors">
                    <td className="px-6 py-4 font-medium text-foreground">{u.name}</td>
                    <td className="px-6 py-4 text-muted-foreground">{u.email}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded-md text-xs font-medium ${
                        u.role === 'admin' 
                          ? 'bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-400' 
                          : 'bg-muted text-muted-foreground'
                      }`}>
                        {u.role}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button className="text-sm font-medium text-blue-500 hover:text-blue-600 transition-colors">Edit Role</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
