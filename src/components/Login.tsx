import { useState } from 'preact/hooks';
import { useAuth } from '../hooks/useAuth';

export function Login() {
  const { login, loading, error } = useAuth();
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = async (e: Event) => {
    e.preventDefault();
    const success = await login(identifier, password);
    if (success) {
      window.location.reload();
    }
  };

  return (
    <div class="min-h-screen flex items-center justify-center bg-slate-100 p-4">
      <div class="w-full max-w-sm">
        <div class="bg-white rounded-xl shadow-lg p-8">
          <div class="text-center mb-8">
            <h1 class="text-2xl font-bold text-slate-800">Fanfare Inventory</h1>
            <p class="text-slate-500 mt-2">Sign in to manage equipment</p>
          </div>

          <form onSubmit={handleSubmit} class="space-y-4">
            {error && (
              <div class="bg-red-50 text-red-600 px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            <div>
              <label class="block text-sm font-medium text-slate-700 mb-1">
                Email or Username
              </label>
              <input
                type="text"
                value={identifier}
                onInput={(e) => setIdentifier((e.target as HTMLInputElement).value)}
                class="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-slate-500 outline-none transition-shadow"
                placeholder="you@example.com or username"
                required
                disabled={loading}
              />
            </div>

            <div>
              <label class="block text-sm font-medium text-slate-700 mb-1">
                Password
              </label>
              <input
                type="password"
                value={password}
                onInput={(e) => setPassword((e.target as HTMLInputElement).value)}
                class="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-slate-500 outline-none transition-shadow"
                placeholder="••••••••"
                required
                disabled={loading}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              class="w-full bg-slate-800 text-white py-3 rounded-lg font-medium hover:bg-slate-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Signing in...' : 'Sign in'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
