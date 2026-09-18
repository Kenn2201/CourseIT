import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import { ErrorBoundary } from './lib/observability.js';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ErrorBoundary fallback={<div role="alert" className="min-h-screen p-8 text-center">CourseIT hit an unexpected error. Reload the page to try again.</div>}>
      <App />
    </ErrorBoundary>
  </React.StrictMode>
);
