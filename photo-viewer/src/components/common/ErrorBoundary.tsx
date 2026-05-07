import React from 'react';

interface State {
  error: Error | null;
}

/**
 * Generic error boundary that renders a static fallback. Logs the error to
 * the console only — never to the network (Constitution IV).
 */
export class ErrorBoundary extends React.Component<React.PropsWithChildren, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    // eslint-disable-next-line no-console
    console.error('[ErrorBoundary]', error, info.componentStack);
  }

  reset = () => this.setState({ error: null });

  render() {
    if (!this.state.error) return this.props.children;
    return (
      <div role="alert" style={{ padding: 24, color: 'var(--pv-text-primary)' }}>
        <h2>Something went wrong.</h2>
        <p style={{ color: 'var(--pv-text-secondary)' }}>
          {this.state.error.message || 'An unexpected error occurred.'}
        </p>
        <button type="button" className="pv-iconbtn" onClick={this.reset}>
          Try again
        </button>
      </div>
    );
  }
}
