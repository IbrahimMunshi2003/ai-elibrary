import { useState, useRef, useEffect } from 'react';
import { FiX, FiSend, FiLoader, FiMessageSquare, FiCopy, FiRefreshCw, FiTrash2 } from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';
import { apiService } from '../services/api';
import toast from 'react-hot-toast';
import ReactMarkdown from 'react-markdown';

export default function AIChat({ bookContext, isOpen, onClose }) {
  const initialMessage = { id: 0, role: 'ai', text: `Hi! I'm your AI library assistant. Ask me anything about ${bookContext?.title || 'books'}!` };
  const [messages, setMessages] = useState([initialMessage]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);
  const [lastQuery, setLastQuery] = useState(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const fetchAIResponse = async (queryText) => {
    setIsLoading(true);
    setLastQuery(queryText);

    try {
      const contextPrefix = bookContext
        ? `We are discussing "${bookContext.title}" by ${bookContext.author}. `
        : "";

      console.log("Sending question:", queryText);
      const response = await apiService.askAI(contextPrefix + queryText);
      console.log("AI Response:", response.data);
      await apiService.trackActivity('ai_query');

      const answer = response?.data?.answer || "No response from AI";
      const cleanAnswer = answer.slice(0, 1000);

      setMessages(prev => [
        ...prev,
        { id: crypto.randomUUID(), role: 'ai', text: cleanAnswer }
      ]);
    } catch (error) {
      console.error("AI ERROR:", error);

      setMessages(prev => [
        ...prev,
        {
          id: crypto.randomUUID(),
          role: 'system',
          text: error?.response?.data?.error || "AI server error. Please try again.",
          isError: true
        }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userQuery = input.trim();
    setInput('');
    setMessages(prev => [...prev, { id: crypto.randomUUID(), role: 'user', text: userQuery }]);
    
    await fetchAIResponse(userQuery);
  };

  const handleRetry = () => {
    if (!lastQuery || isLoading) return;
    setMessages(prev => prev.filter(m => !m.isError));
    fetchAIResponse(lastQuery);
  };

  const clearChat = () => {
    setMessages([initialMessage]);
    setLastQuery(null);
    toast.success("Chat cleared!");
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard!');
  };

  // Utility to parse and enhance AI messages
  const parseAIMessage = (text) => {
    if (!text) return '';
    let parsedText = text;
    
    // Extract the first URL found in the text to use as the target for the Title
    const urlMatch = parsedText.match(/https?:\/\/[^\s\)]+/);
    if (urlMatch) {
      const url = urlMatch[0];
      // Convert "Title: Book Name" to "Title: [Book Name](url)" if not already a link
      parsedText = parsedText.replace(/(Title:\s*)([^\[\n]+)$/gm, `$1[$2](${url})`);
    }

    // Convert plain URLs to markdown links (ignoring those already inside markdown link syntax)
    parsedText = parsedText.replace(/(^|[^\]\(])(https?:\/\/[^\s\)]+)/g, '$1[$2]($2)');

    return parsedText;
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, x: 300, scale: 0.95 }}
          animate={{ opacity: 1, x: 0, scale: 1 }}
          exit={{ opacity: 0, x: 300, scale: 0.95 }}
          transition={{ type: "spring", damping: 25, stiffness: 200 }}
          className="fixed right-0 top-0 bottom-0 w-full sm:w-112.5 bg-card border-l border-border shadow-2xl z-100 flex flex-col"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-border bg-muted/50">
            <div className="flex items-center gap-2 text-primary-600 font-semibold">
              <FiMessageSquare className="w-5 h-5" />
              <span>AI Assistant</span>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={clearChat}
                title="Clear Chat"
                className="p-2 rounded-md hover:bg-red-500/10 text-muted-foreground hover:text-red-500 transition-colors"
              >
                <FiTrash2 className="w-4 h-4" />
              </button>
              <button 
                onClick={onClose}
                className="p-2 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                title="Close"
              >
                <FiX className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto w-full p-4 space-y-5 flex flex-col">
            <AnimatePresence initial={false}>
              {messages.map((msg) => (
                <motion.div 
                  key={msg.id}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex flex-col group ${msg.role === 'user' ? 'items-end' : 'items-start'}`}
                >
                  <div 
                    className={`relative max-w-[90%] rounded-2xl px-4 py-3 text-[15px] leading-relaxed shadow-sm ${
                      msg.role === 'user' 
                        ? 'bg-primary-500/10 text-primary-700 rounded-br-sm' 
                        : msg.role === 'system'
                          ? 'bg-red-50 text-red-600 border border-red-200 rounded-bl-sm'
                          : 'bg-white border border-border text-slate-700 rounded-bl-sm'
                    }`}
                  >
                    {msg.role === 'ai' ? (
                      <div className="prose prose-sm max-w-none prose-a:text-primary-500 prose-a:hover:text-primary-700 prose-a:transition-colors prose-a:-underline">
                        <ReactMarkdown
                          components={{
                            a: ({ node, ...props }) => (
                              <a 
                                {...props} 
                                target="_blank" 
                                rel="noopener noreferrer" 
                                className="text-primary-500 font-medium hover:text-primary-700 hover:underline transition-colors decoration-2 underline-offset-2" 
                              />
                            ),
                          }}
                        >
                          {parseAIMessage(msg.text)}
                        </ReactMarkdown>
                      </div>
                    ) : (
                      <p className="whitespace-pre-wrap">{msg.text}</p>
                    )}

                    {/* Copy Button for AI matches */}
                    {msg.role === 'ai' && (
                      <button
                        onClick={() => copyToClipboard(msg.text)}
                        className="absolute -right-10 top-2 p-2 opacity-0 group-hover:opacity-100 transition-opacity bg-background border border-border text-muted-foreground hover:text-foreground rounded-md shadow-sm"
                        title="Copy text"
                      >
                        <FiCopy className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                  
                  {/* Retry Button */}
                  {msg.isError && (
                    <button
                      onClick={handleRetry}
                      disabled={isLoading}
                      className="mt-2 text-sm flex items-center gap-1.5 text-primary-600 hover:text-primary-700 font-medium disabled:opacity-50"
                    >
                      <FiRefreshCw className="w-3.5 h-3.5" /> Retry 
                    </button>
                  )}
                </motion.div>
              ))}
            </AnimatePresence>

            {isLoading && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-start"
              >
                <div className="bg-muted border border-border text-foreground rounded-2xl rounded-bl-sm px-4 py-3.5 flex items-center gap-3 shadow-sm">
                  <div className="flex gap-1.5">
                    <motion.div className="w-1.5 h-1.5 bg-primary-500 rounded-full" animate={{ y: [0, -4, 0] }} transition={{ duration: 0.6, repeat: Infinity, delay: 0 }} />
                    <motion.div className="w-1.5 h-1.5 bg-primary-500 rounded-full" animate={{ y: [0, -4, 0] }} transition={{ duration: 0.6, repeat: Infinity, delay: 0.2 }} />
                    <motion.div className="w-1.5 h-1.5 bg-primary-500 rounded-full" animate={{ y: [0, -4, 0] }} transition={{ duration: 0.6, repeat: Infinity, delay: 0.4 }} />
                  </div>
                  <span className="text-sm font-medium text-muted-foreground mr-1">Thinking...</span>
                </div>
              </motion.div>
            )}
            <div ref={messagesEndRef} className="h-1" />
          </div>

          {/* Input Area */}
          <div className="p-4 border-t border-border bg-background shadow-[0_-10px_40px_-15px_rgba(0,0,0,0.1)]">
            {/* Suggested Prompts */}
            {messages.length === 1 && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="flex flex-wrap gap-2 mb-3"
              >
                {["Recommend me a book", "List available categories", "What are the most popular books?"].map((suggestion, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={(e) => {
                      // Instantly set input and trigger submission
                      e.preventDefault();
                      setInput(suggestion);
                      // Since setInput is async, we submit it manually to fetch AI right away
                      setMessages(prev => [...prev, { id: Date.now(), role: 'user', text: suggestion }]);
                      setInput('');
                      fetchAIResponse(suggestion);
                    }}
                    className="text-xs px-4 py-2 bg-white hover:bg-primary-50 hover:text-primary-700 rounded-full border border-primary-200 transition-all text-primary-600 font-medium whitespace-nowrap shadow-[0_2px_15px_-3px_rgba(0,0,0,0.05)] active:scale-95"
                  >
                    {suggestion}
                  </button>
                ))}
              </motion.div>
            )}
            
            <form onSubmit={handleSubmit} className="relative flex items-center">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={isLoading ? "Please wait..." : "Ask something..."}
                disabled={isLoading}
                className="w-full pl-5 pr-14 py-3.5 rounded-full bg-white border border-border focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10 outline-none text-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_2px_15px_-3px_rgba(0,0,0,0.04)]"
              />
              <button
                type="submit"
                disabled={!input.trim() || isLoading}
                className="absolute right-3 p-2.5 rounded-full bg-primary-500 text-white hover:bg-primary-600 disabled:opacity-50 disabled:hover:bg-primary-500 transition-all shadow-md active:scale-95"
              >
                <FiSend className="w-4 h-4" />
              </button>
            </form>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
