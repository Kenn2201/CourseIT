import * as Sentry from '@sentry/node';

if (process.env.SENTRY_DSN) {
  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    environment: process.env.CONTEXT || process.env.NODE_ENV || 'unknown',
    sendDefaultPii: false,
    tracesSampleRate: 0,
    beforeSend(event) {
      delete event.request;
      delete event.breadcrumbs;
      delete event.extra;
      delete event.contexts;
      delete event.user;
      delete event.message;
      for (const exception of event.exception?.values || []) {
        exception.value = 'Unexpected API failure';
      }
      return event;
    }
  });
}

export function captureUnexpectedError(error) {
  if (process.env.SENTRY_DSN) Sentry.captureException(error);
}
