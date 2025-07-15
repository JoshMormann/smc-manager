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

export const captureException = Sentry.captureException;
export const captureMessage = Sentry.captureMessage;
export const setUser = Sentry.setUser;
export const setContext = Sentry.setContext;
export const addBreadcrumb = Sentry.addBreadcrumb;

// Custom error boundary component
export const SentryErrorBoundary = Sentry.ErrorBoundary;