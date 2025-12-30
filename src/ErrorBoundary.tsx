import React from 'react';

export default class ErrorBoundary extends React.Component<{children: React.ReactNode}, {error: Error | null}> {
  constructor(props: any) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { error };
  }

  componentDidCatch(error: Error, info: any) {
    // You can log error to a service here
    console.error('ErrorBoundary caught', error, info);
  }

  render() {
    if (this.state.error) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-white p-6">
          <div style={{maxWidth: 800}}>
            <h1 style={{color: '#b91c1c', fontSize: 24}}>An error occurred</h1>
            <pre style={{whiteSpace: 'pre-wrap', background: '#fff5f5', padding: 12, color: '#7f1d1d'}}>{String(this.state.error)}</pre>
          </div>
        </div>
      );
    }

    return this.props.children as JSX.Element;
  }
}
