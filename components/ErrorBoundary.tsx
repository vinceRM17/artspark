/**
 * Error boundary component
 *
 * Catches unhandled errors in the component tree and shows a graceful
 * fallback UI instead of a crash. Provides retry and go-home options.
 */

import React, { Component, type ErrorInfo, type PropsWithChildren } from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';

type ErrorBoundaryState = {
  hasError: boolean;
  error: Error | null;
};

type ErrorBoundaryProps = PropsWithChildren<{
  fallback?: React.ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}>;

export default class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught:', error, errorInfo);
    this.props.onError?.(error, errorInfo);
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <View
          style={{
            flex: 1,
            backgroundColor: '#FFF8F0',
            justifyContent: 'center',
            alignItems: 'center',
            padding: 32,
          }}
        >
          <Text style={{ fontSize: 40, marginBottom: 16 }}>{'\uD83C\uDF3F'}</Text>
          <Text
            style={{
              fontSize: 20,
              fontWeight: '700',
              color: '#111827',
              textAlign: 'center',
              marginBottom: 8,
            }}
          >
            Something went wrong
          </Text>
          <Text
            style={{
              fontSize: 15,
              color: '#6B7280',
              textAlign: 'center',
              lineHeight: 22,
              marginBottom: 24,
            }}
          >
            Don't worry — your data is safe. Try refreshing, and if the problem persists, restart the app.
          </Text>

          {__DEV__ && this.state.error && (
            <ScrollView
              style={{
                maxHeight: 120,
                width: '100%',
                backgroundColor: '#FEF2F2',
                borderRadius: 12,
                padding: 12,
                marginBottom: 24,
              }}
            >
              <Text style={{ fontSize: 12, color: '#991B1B', fontFamily: 'monospace' }}>
                {this.state.error.message}
              </Text>
            </ScrollView>
          )}

          <TouchableOpacity
            onPress={this.handleRetry}
            style={{
              backgroundColor: '#7C9A72',
              borderRadius: 14,
              paddingVertical: 14,
              paddingHorizontal: 32,
              width: '100%',
            }}
            activeOpacity={0.85}
            accessibilityRole="button"
            accessibilityLabel="Try again"
            accessibilityHint="Attempts to reload the screen"
          >
            <Text
              style={{
                color: '#FFFFFF',
                textAlign: 'center',
                fontSize: 16,
                fontWeight: '600',
              }}
            >
              Try Again
            </Text>
          </TouchableOpacity>
        </View>
      );
    }

    return this.props.children;
  }
}
