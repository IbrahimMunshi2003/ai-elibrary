import { Component } from 'react';
import { FiAlertTriangle } from 'react-icons/fi';

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    // We could log the error to an error reporting service here
    console.error("Uncaught runtime error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-background p-4 text-center">
          <div className="bg-red-500/10 text-red-500 p-4 rounded-full mb-6">
            <FiAlertTriangle className="w-12 h-12" />
          </div>
          <h1 className="text-3xl font-bold text-foreground mb-4">Something went wrong</h1>
          <p className="text-muted-foreground max-w-md mb-8">
            An unexpected error occurred in the application. Please try refreshing the page.
          </p>
          <div className="flex gap-4">
            <button
              onClick={() => window.location.reload()}
              className="px-6 py-2 bg-primary-600 hover:bg-primary-700 text-white font-medium rounded-lg transition-colors"
            >
              Refresh Page
            </button>
            <button
              onClick={() => window.location.href = '/'}
              className="px-6 py-2 bg-card border border-border hover:bg-muted text-foreground font-medium rounded-lg transition-colors"
            >
              Go Home
            </button>
          </div>
          
          {process.env.NODE_ENV === 'development' && this.state.error && (
            <div className="mt-12 bg-muted p-6 rounded-lg text-left max-w-3xl w-full mx-auto overflow-auto">
              <p className="text-red-500 font-mono text-sm mb-2">{this.state.error.toString()}</p>
              <pre className="text-muted-foreground font-mono text-xs">{this.state.error.stack}</pre>
            </div>
          )}
        </div>
      );
    }

    return this.props.children;
  }
}
