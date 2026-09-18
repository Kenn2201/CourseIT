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

export async function captureUnexpectedError(error, tags = {}) {
  if (!process.env.SENTRY_DSN) return;
  try {
    Sentry.withScope(scope => {
      for (const [key, value] of Object.entries(tags)) {
        if (/^[a-zA-Z_]{1,32}$/.test(key) && /^[a-zA-Z0-9_./-]{1,100}$/.test(String(value))) {
          scope.setTag(key, String(value));
        }
      }
      Sentry.captureException(error);
    });
    await Sentry.flush(2000);
  } catch { console.warn('Sentry delivery unavailable for unexpected error.'); }
}
