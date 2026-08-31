import React from 'react';

interface State {
  hasError: boolean;
  error: Error | null;
  componentStack: string | null;
}

interface Props {
  children: React.ReactNode;
}

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null, componentStack: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, componentStack: null };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    this.setState({ componentStack: info.componentStack ?? null });
    console.error('[Xteon ErrorBoundary] Caught crash:', error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div
          style={{
            width: '100vw',
            height: '100vh',
            background: '#07090E',
            color: '#F8FAFC',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            fontFamily: 'monospace',
            padding: '40px',
            boxSizing: 'border-box',
            overflow: 'auto',
          }}
        >
          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
            <span style={{ fontSize: '28px' }}>⚡</span>
            <span style={{ fontSize: '20px', fontWeight: 'bold', color: '#06B6D4', letterSpacing: '0.1em' }}>
              XTEON
            </span>
            <span
              style={{
                fontSize: '11px',
                background: '#F43F5E22',
                border: '1px solid #F43F5E',
                color: '#F43F5E',
                borderRadius: '6px',
                padding: '2px 10px',
                letterSpacing: '0.12em',
                fontWeight: 'bold',
              }}
            >
              STARTUP ERROR
            </span>
          </div>

          {/* Error Card */}
          <div
            style={{
              background: '#121622',
              border: '1px solid #F43F5E55',
              borderRadius: '12px',
              padding: '28px 32px',
              maxWidth: '780px',
              width: '100%',
            }}
          >
            <p style={{ color: '#F43F5E', fontSize: '14px', fontWeight: 'bold', marginBottom: '10px' }}>
              🛑 React failed to render the application
            </p>
            <p style={{ color: '#94A3B8', fontSize: '12px', marginBottom: '18px', lineHeight: '1.6' }}>
              This is most likely a WebKit compatibility error on macOS. Copy the details below
              and send them to the Xteon development team.
            </p>

            {/* Error message */}
            <div
              style={{
                background: '#07090E',
                border: '1px solid #232B3E',
                borderRadius: '8px',
                padding: '14px 18px',
                marginBottom: '14px',
                wordBreak: 'break-all',
              }}
            >
              <p style={{ color: '#FCD34D', fontSize: '11px', fontWeight: 'bold', marginBottom: '6px' }}>
                ERROR MESSAGE
              </p>
              <p style={{ color: '#F8FAFC', fontSize: '12px', lineHeight: '1.6', margin: 0 }}>
                {this.state.error?.name}: {this.state.error?.message}
              </p>
            </div>

            {/* Stack trace */}
            {this.state.error?.stack && (
              <div
                style={{
                  background: '#07090E',
                  border: '1px solid #232B3E',
                  borderRadius: '8px',
                  padding: '14px 18px',
                  marginBottom: '14px',
                  maxHeight: '200px',
                  overflowY: 'auto',
                }}
              >
                <p style={{ color: '#FCD34D', fontSize: '11px', fontWeight: 'bold', marginBottom: '6px' }}>
                  STACK TRACE
                </p>
                <pre style={{ color: '#94A3B8', fontSize: '10px', lineHeight: '1.6', margin: 0, whiteSpace: 'pre-wrap' }}>
                  {this.state.error.stack}
                </pre>
              </div>
            )}

            {/* Component Stack */}
            {this.state.componentStack && (
              <div
                style={{
                  background: '#07090E',
                  border: '1px solid #232B3E',
                  borderRadius: '8px',
                  padding: '14px 18px',
                  marginBottom: '20px',
                  maxHeight: '160px',
                  overflowY: 'auto',
                }}
              >
                <p style={{ color: '#FCD34D', fontSize: '11px', fontWeight: 'bold', marginBottom: '6px' }}>
                  COMPONENT TREE
                </p>
                <pre style={{ color: '#94A3B8', fontSize: '10px', lineHeight: '1.6', margin: 0, whiteSpace: 'pre-wrap' }}>
                  {this.state.componentStack}
                </pre>
              </div>
            )}

            {/* Reload button */}
            <button
              onClick={() => window.location.reload()}
              style={{
                background: 'transparent',
                border: '1px solid #06B6D4',
                color: '#06B6D4',
                borderRadius: '8px',
                padding: '10px 24px',
                fontSize: '12px',
                fontFamily: 'monospace',
                fontWeight: 'bold',
                cursor: 'pointer',
                letterSpacing: '0.08em',
              }}
            >
              ↺ RELOAD APPLICATION
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
