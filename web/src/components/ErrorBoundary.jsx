import { Component } from 'react';
import ErrorState from './ErrorState';

// Class component is required -- React has no hook equivalent for
// getDerivedStateFromError/componentDidCatch. Catches render-time crashes
// only (event handlers and async code already go through api.js/showToast
// or the ErrorState-based fetch handling elsewhere) -- this is the net for
// the literal "blank white screen" case those paths can't cover.
export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, info) {
    // eslint-disable-next-line no-console
    console.error('Retalla crashed:', error, info.componentStack);
  }

  handleReload = () => window.location.reload();

  render() {
    if (!this.state.hasError) return this.props.children;
    return (
      <main className="container">
        <ErrorState
          message="Something went wrong loading this page."
          onRetry={this.handleReload}
          retryLabel="Reload Page"
          secondaryAction={{ label: 'Go to Homepage', href: '/index.html' }}
        />
      </main>
    );
  }
}
