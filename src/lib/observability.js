import * as Sentry from '@sentry/react';
import { CURRENT_VERSION } from '../constants/version';

const dsn = import.meta.env.VITE_SENTRY_DSN;

if (dsn) {
  Sentry.init({
    dsn,
    release: `courseit@${CURRENT_VERSION}`,
    environment: import.meta.env.MODE,
    sendDefaultPii: false,
    beforeSend(event) {
      // The app processes private documentation, OCR text and one-time auth links.
      // Keep only error type and stack; never ship request contents or breadcrumbs.
      delete event.request;
      delete event.breadcrumbs;
      delete event.extra;
      delete event.contexts;
      delete event.user;
      delete event.message;
      for (const exception of event.exception?.values || []) {
        exception.value = 'Unexpected application error';
      }
      return event;
    }
  });
}

export const ErrorBoundary = Sentry.ErrorBoundary;
