import * as Sentry from '@sentry/react';

export const initSentry = () => {
  const dsn = import.meta.env.VITE_SENTRY_DSN;
  const environment = import.meta.env.VITE_SENTRY_ENVIRONMENT || 'development';
  
  if (!dsn) {
    console.warn('Sentry DSN not found. Error tracking will be disabled.');
    return;
  }

  Sentry.init({
    dsn,
    environment,
    integrations: [
      Sentry.browserTracingIntegration(),
      Sentry.replayIntegration({
        maskAllText: false,
        blockAllMedia: false,
      }),
    ],
    // Performance monitoring
    tracesSampleRate: environment === 'production' ? 0.1 : 1.0,
    // Session replay
    replaysSessionSampleRate: environment === 'production' ? 0.1 : 1.0,
    replaysOnErrorSampleRate: 1.0,
    // Additional configuration
    beforeSend(event, _hint) {
      // Filter out errors in development for testing
      if (environment === 'development') {
        console.log('Sentry event:', event);
      }
      return event;
    },
  });
};

// Temporarily disable Sentry functions for debugging
export const captureException = (error: any, context?: any) => {
  console.log('Sentry captureException (disabled):', error, context);
};
export const captureMessage = (message: string, level?: any) => {
  console.log('Sentry captureMessage (disabled):', message, level);
};
export const setUser = (user: any) => {
  console.log('Sentry setUser (disabled):', user);
};
export const setContext = (key: string, context: any) => {
  console.log('Sentry setContext (disabled):', key, context);
};
export const addBreadcrumb = (breadcrumb: any) => {
  console.log('Sentry addBreadcrumb (disabled):', breadcrumb);
};

// Custom error boundary component
export const SentryErrorBoundary = Sentry.ErrorBoundary;