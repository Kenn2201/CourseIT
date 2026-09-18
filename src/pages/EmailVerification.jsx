import React, { useEffect, useRef, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { completeEmailVerification } from '../lib/auth';

export default function EmailVerification() {
  const location = useLocation();
  const started = useRef(false);
  const [status, setStatus] = useState('Verifying your email…');
  const [error, setError] = useState(false);

  useEffect(() => {
    if (started.current) return;
    started.current = true;
    const params = new URLSearchParams(location.search);
    const userId = params.get('userId');
    const secret = params.get('secret');
    window.history.replaceState({}, document.title, window.location.pathname);
    if (!userId || !secret) {
      setStatus('The verification link is missing its credentials. Request a new email from Profile.');
      setError(true);
      return;
    }
    completeEmailVerification(userId, secret).then(() => {
      window.dispatchEvent(new Event('courseit_auth_changed'));
      setStatus('Your email is verified.');
    }).catch((err) => {
      setStatus(err.message || 'Verification failed. Request a new email from Profile.');
      setError(true);
    });
  }, [location.search]);

  return (
    <div className="min-h-[70vh] flex items-center justify-center p-4">
      <div className="glass-panel w-full max-w-md rounded-3xl p-8 text-center space-y-4">
        <h1 className="text-xl font-bold text-white">Email verification</h1>
        <p role={error ? 'alert' : 'status'} className={error ? 'text-rose-300' : 'text-slate-300'}>{status}</p>
        <Link to="/profile" className="inline-block rounded-xl bg-indigo-600 px-4 py-2 text-sm text-white">Go to Profile</Link>
      </div>
    </div>
  );
}
