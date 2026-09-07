'use client';

import { useState } from 'react';
import { login } from './actions';

export default function LoginPage() {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setLoading(true);

    const formData = new FormData(event.currentTarget);
    const result = await login(formData);

    if (result?.error) {
      setError(result.error);
      setLoading(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-zinc-950 p-4 text-zinc-100">
      <div className="w-full max-w-sm space-y-6 rounded-lg border border-zinc-800 bg-zinc-900 p-6 shadow-md">
        <div className="space-y-1">
          <h1 className="text-xl font-bold tracking-tight text-white">N1 Auto Detailing</h1>
          <p className="text-xs text-zinc-400">Employee Management System</p>
        </div>

        {error && (
          <div className="rounded bg-red-950/50 border border-red-800 p-2 text-xs text-red-200">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1">
            <label className="text-xs font-medium text-zinc-300" htmlFor="email">
              Email Address
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              className="w-full rounded border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-white focus:border-zinc-500 focus:outline-none"
              placeholder="name@n1detailing.com"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium text-zinc-300" htmlFor="password">
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              required
              className="w-full rounded border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-white focus:border-zinc-500 focus:outline-none"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded bg-zinc-100 py-2 text-sm font-medium text-zinc-950 transition hover:bg-zinc-200 disabled:opacity-50"
          >
            {loading ? 'Authenticating...' : 'Sign In'}
          </button>
        </form>
      </div>
    </main>
  );
}