import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { completePasswordReset } from '../lib/auth';

export default function PasswordRecovery() {
  const [token] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    return { userId: params.get('userId'), secret: params.get('secret') };
  });
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [working, setWorking] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    window.history.replaceState({}, document.title, window.location.pathname);
  }, []);

  async function submit(event) {
    event.preventDefault();
    if (password !== confirm) { setError('Passwords do not match.'); return; }
    setWorking(true);
    setError('');
    try {
      await completePasswordReset(token.userId, token.secret, password);
      setDone(true);
    } catch (failure) {
      setError(failure.message || 'The recovery link expired. Request a new one from Sign In.');
    } finally { setWorking(false); }
  }

  return <main className="mx-auto max-w-md px-6 py-24 text-slate-100">
    <h1 className="text-2xl font-bold mb-4">Reset your password</h1>
    {!token.userId || !token.secret ? <p role="alert">This recovery link is invalid. Request a new link from Sign In.</p>
      : done ? <p>Password updated. You can now sign in with your new password.</p>
        : <form onSubmit={submit} className="space-y-4">
          <label className="block">New password<input className="mt-1 w-full rounded bg-slate-800 p-3" type="password" autoComplete="new-password" minLength={8} required value={password} onChange={e => setPassword(e.target.value)} /></label>
          <label className="block">Confirm password<input className="mt-1 w-full rounded bg-slate-800 p-3" type="password" autoComplete="new-password" minLength={8} required value={confirm} onChange={e => setConfirm(e.target.value)} /></label>
          {error && <p role="alert" className="text-rose-300">{error}</p>}
          <button className="rounded bg-indigo-600 px-5 py-3 disabled:opacity-50" disabled={working}>{working ? 'Updating...' : 'Update password'}</button>
        </form>}
    <Link className="mt-6 inline-block text-indigo-300" to="/">Return to sign in</Link>
  </main>;
}
