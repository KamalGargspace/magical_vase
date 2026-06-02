import React from 'react';
import { logger } from '../utils/logger';

const log = logger.create('ErrorBoundary');

/**
 * ErrorBoundary — Catches render/lifecycle errors in child components
 * and displays a graceful fallback UI instead of a white crash screen.
 *
 * Wraps the entire app (including 3D Canvas) to catch WebGL errors,
 * shader compilation failures, and missing asset loads.
 */
export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    log.error('Uncaught error in component tree:', error);
    log.error('Component stack:', errorInfo?.componentStack);
    this.setState({ errorInfo });
  }

  handleRetry = () => {
    log.info('User triggered retry — resetting error state');
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div style={styles.container}>
          <div style={styles.card}>
            <div style={styles.icon}>✦</div>
            <h1 style={styles.title}>Something went wrong</h1>
            <p style={styles.message}>
              The experience encountered an unexpected error.
              {this.state.error?.message && (
                <span style={styles.detail}>
                  <br />
                  {this.state.error.message}
                </span>
              )}
            </p>
            <button style={styles.button} onClick={this.handleRetry}>
              Try Again
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

const styles = {
  container: {
    position: 'fixed',
    inset: 0,
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    background: 'radial-gradient(ellipse at center, #0a0515 0%, #000000 100%)',
    zIndex: 99999,
    fontFamily: "'Inter', sans-serif",
  },
  card: {
    textAlign: 'center',
    maxWidth: '420px',
    padding: '48px 36px',
  },
  icon: {
    fontSize: '42px',
    color: '#d4b8ff',
    marginBottom: '24px',
    textShadow: '0 0 30px rgba(168, 85, 247, 0.5)',
  },
  title: {
    fontFamily: "'Playfair Display', serif",
    fontSize: '1.6rem',
    fontWeight: 400,
    letterSpacing: '0.08em',
    color: '#ffffff',
    marginBottom: '16px',
  },
  message: {
    fontSize: '0.85rem',
    lineHeight: 1.8,
    color: 'rgba(255, 255, 255, 0.5)',
    letterSpacing: '0.03em',
    marginBottom: '32px',
  },
  detail: {
    color: 'rgba(255, 100, 100, 0.6)',
    fontSize: '0.75rem',
  },
  button: {
    background: 'transparent',
    border: '1px solid rgba(212, 184, 255, 0.3)',
    color: '#d4b8ff',
    padding: '12px 36px',
    fontSize: '0.7rem',
    letterSpacing: '0.25em',
    textTransform: 'uppercase',
    cursor: 'pointer',
    borderRadius: '2px',
    transition: 'all 0.4s ease',
    fontFamily: "'Inter', sans-serif",
  },
};
