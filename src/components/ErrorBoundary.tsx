import { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#121212] flex items-center justify-center p-4">
          <div className="bg-[#1F1F1F] rounded-lg p-8 max-w-md w-full space-y-6 text-center">
            <div className="flex justify-center">
              <AlertTriangle className="w-16 h-16 text-red-500" />
            </div>
            <h1 className="text-2xl font-bold text-white">Something went wrong</h1>
            <p className="text-[#757575]">
              {this.state.error?.message || 'An unexpected error occurred'}
            </p>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-[#BB86FC] text-white rounded-lg hover:bg-opacity-90 transition-colors"
            >
              Reload Page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}