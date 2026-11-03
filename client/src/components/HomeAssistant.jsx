import { useEffect, useRef, useState } from 'react';
import { FiBookOpen, FiLoader, FiSend, FiUser } from 'react-icons/fi';
import { Link } from 'react-router-dom';
import { apiService } from '../services/api';
import CoverImage from './CoverImage';

const welcomeMessage = {
  id: 'welcome',
  role: 'assistant',
  text: 'Welcome! Ask me about books, categories, or any learning topic, and I will help you explore the library.',
};

const getCategoryName = (category) => (
  typeof category === 'string' ? category : category?.name
);

export default function HomeAssistant() {
  const [messages, setMessages] = useState([welcomeMessage]);
  const [categories, setCategories] = useState([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    let isMounted = true;

    apiService.getCategories().then((data) => {
      if (!isMounted) return;
      const categoryList = Array.isArray(data) ? data : data?.results || [];
      setCategories(categoryList.map(getCategoryName).filter(Boolean));
    });

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const findCategory = (question) => {
    const normalizedQuestion = question.toLowerCase();
    return categories.find((category) => (
      normalizedQuestion.includes(category.toLowerCase())
    ));
  };

  const sendMessage = async (question) => {
    const trimmedQuestion = question.trim();
    if (!trimmedQuestion || isLoading) return;

    setInput('');
    setMessages((current) => [
      ...current,
      { id: crypto.randomUUID(), role: 'user', text: trimmedQuestion },
    ]);
    setIsLoading(true);

    const category = findCategory(trimmedQuestion);
    const [assistantResult, booksResult] = await Promise.allSettled([
      apiService.askAI(trimmedQuestion),
      category
        ? apiService.searchBooks('', { category })
        : apiService.searchBooks(trimmedQuestion),
    ]);

    const answer = assistantResult.status === 'fulfilled'
      ? assistantResult.value?.data?.answer
      : null;
    const recommendations = booksResult.status === 'fulfilled'
      ? booksResult.value.slice(0, 6)
      : [];

    let responseText = answer || 'I could not reach the assistant right now. Please try again.';
    if (category && recommendations.length === 0) {
      responseText = `${responseText}\n\nThere are no books currently listed in the ${category} category.`;
    }

    setMessages((current) => [
      ...current,
      {
        id: crypto.randomUUID(),
        role: 'assistant',
        text: responseText,
        recommendations,
      },
    ]);
    setIsLoading(false);
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    sendMessage(input);
  };

  const handleInputKeyDown = (event) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      sendMessage(input);
    }
  };

  return (
    <section className="relative px-4 sm:px-6 lg:px-8" aria-labelledby="assistant-heading">
      <div className="mx-auto max-w-4xl overflow-hidden rounded-3xl border border-border bg-card shadow-sm">
        <div className="border-b border-border bg-muted/40 px-5 py-5 sm:px-8">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary-500/10 text-primary-600">
              <FiBookOpen className="h-5 w-5" />
            </div>
            <div>
              <h2 id="assistant-heading" className="text-xl font-semibold text-foreground">
                Ask the Library Assistant
              </h2>
              <p className="text-sm text-muted-foreground">
                Explore books and learn with help from your AI library companion.
              </p>
            </div>
          </div>
        </div>

        <div className="max-h-[34rem] min-h-72 space-y-4 overflow-y-auto p-4 sm:p-8">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex gap-3 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              {message.role === 'assistant' && (
                <div className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary-500/10 text-primary-600">
                  <FiBookOpen className="h-4 w-4" />
                </div>
              )}
              <div className={`max-w-[90%] ${message.role === 'user' ? 'items-end' : 'items-start'}`}>
                <div className={`rounded-2xl px-4 py-3 text-sm leading-6 ${
                  message.role === 'user'
                    ? 'rounded-br-sm bg-primary-600 text-white'
                    : 'rounded-bl-sm border border-border bg-muted/50 text-foreground'
                }`}>
                  <p className="whitespace-pre-wrap">{message.text}</p>
                </div>
                {message.recommendations?.length > 0 && (
                  <div className="mt-3 grid gap-3 sm:grid-cols-2">
                    {message.recommendations.map((book) => (
                      <Link
                        key={book.id}
                        to={`/books/${book.id}`}
                        className="flex gap-3 rounded-xl border border-border bg-card p-3 transition-colors hover:border-primary-400"
                      >
                        <CoverImage
                          src={book.coverImage}
                          alt=""
                          className="h-16 w-11 shrink-0 rounded object-cover"
                        />
                        <span className="min-w-0">
                          <span className="block truncate text-sm font-semibold text-foreground">{book.title}</span>
                          <span className="block truncate text-xs text-muted-foreground">{book.author}</span>
                        </span>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
              {message.role === 'user' && (
                <div className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-foreground/10 text-foreground">
                  <FiUser className="h-4 w-4" />
                </div>
              )}
            </div>
          ))}
          {isLoading && (
            <div className="flex items-center gap-3 text-sm text-muted-foreground">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary-500/10 text-primary-600">
                <FiBookOpen className="h-4 w-4" />
              </div>
              <span className="flex items-center gap-2">
                Thinking <FiLoader className="h-4 w-4 animate-spin" />
              </span>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        <div className="border-t border-border p-4 sm:p-6">
          <div className="mb-4 flex gap-2 overflow-x-auto pb-1">
            {categories.map((category) => (
              <button
                key={category}
                type="button"
                onClick={() => sendMessage(`Recommend books from the ${category} category`)}
                className="shrink-0 rounded-full border border-border bg-muted px-3 py-1.5 text-xs text-foreground transition-colors hover:border-primary-400 hover:bg-primary-500/10"
              >
                Recommend {category} books
              </button>
            ))}
          </div>
          <form onSubmit={handleSubmit} className="flex items-end gap-2 rounded-2xl border border-border bg-background p-2 focus-within:border-primary-400">
            <textarea
              value={input}
              onChange={(event) => setInput(event.target.value)}
              onKeyDown={handleInputKeyDown}
              rows={1}
              placeholder="Ask about books or a learning topic..."
              aria-label="Message the library assistant"
              className="max-h-32 min-h-11 flex-1 resize-none bg-transparent px-3 py-3 text-sm text-foreground outline-none placeholder:text-muted-foreground"
            />
            <button
              type="submit"
              disabled={isLoading || !input.trim()}
              aria-label="Send message"
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary-600 text-white transition-colors hover:bg-primary-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <FiSend className="h-4 w-4" />
            </button>
          </form>
          <p className="mt-2 text-center text-xs text-muted-foreground">
            Press Enter to send. Use Shift + Enter for a new line.
          </p>
        </div>
      </div>
    </section>
  );
}
