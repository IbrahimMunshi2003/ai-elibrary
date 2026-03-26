import { useEffect, useState } from 'react';
import { Outlet } from 'react-router-dom';
import Navbar from './Navbar';
import AIChat from './AIChat';
import { FiMessageSquare } from 'react-icons/fi';
import { useThemeStore } from '../store/themeStore';

export default function Layout() {
  const { initTheme } = useThemeStore();
  const [isChatOpen, setIsChatOpen] = useState(false);

  // Initialize dark mode on mount
  useEffect(() => {
    initTheme();
  }, [initTheme]);

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col transition-colors duration-200">
      <Navbar />
      
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 relative">
        <Outlet />
      </main>

      {/* Global Floating AI Button */}
      <button
        onClick={() => setIsChatOpen(!isChatOpen)}
        className="fixed bottom-6 right-6 p-4 rounded-full bg-primary-600 text-white shadow-lg shadow-primary-500/30 hover:bg-primary-700 hover:scale-105 transition-all z-40 flex items-center justify-center group"
        aria-label="Ask AI Assistant"
      >
        <FiMessageSquare className="w-6 h-6" />
        <span className="max-w-0 overflow-hidden whitespace-nowrap group-hover:max-w-xs group-hover:ml-2 transition-all duration-300 font-medium">
          Ask AI Assistant
        </span>
      </button>

      {/* Global AI Chat Panel */}
      <AIChat isOpen={isChatOpen} onClose={() => setIsChatOpen(false)} />
    </div>
  );
}
