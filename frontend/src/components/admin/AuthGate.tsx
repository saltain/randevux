import { useState, type ReactNode } from 'react';
import { useFirebase } from '../../context/FirebaseContext';

const AuthGate = ({ children }: { children: ReactNode }) => {
  const { user, loading, login } = useFirebase();
  const [form, setForm] = useState({ username: '', password: '' });
  const [error, setError] = useState('');

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');
    try {
      await login(`${form.username}@randevux.local`, form.password);
    } catch (err) {
      setError('Giriş başarısız. Lütfen bilgilerinizi kontrol edin.');
      console.error(err);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <p className="text-sm text-slate-500">Yükleniyor...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <form
          onSubmit={handleSubmit}
          className="w-full max-w-md space-y-6 rounded-3xl bg-white p-8 shadow-lg"
        >
          <div>
            <h1 className="text-2xl font-semibold text-slate-900">Admin Girişi</h1>
            <p className="text-sm text-slate-500">Devam etmek için lütfen giriş yapınız.</p>
          </div>
          <div className="space-y-4">
            <label className="space-y-1">
              <span className="text-sm font-medium text-slate-700">Kullanıcı Adı</span>
              <input
                type="text"
                required
                value={form.username}
                onChange={(e) => setForm((prev) => ({ ...prev, username: e.target.value }))}
                placeholder="salih"
                className="w-full rounded-lg border border-slate-200 px-4 py-3 focus:border-primary focus:ring-2 focus:ring-primary/20"
              />
            </label>
            <label className="space-y-1">
              <span className="text-sm font-medium text-slate-700">Şifre</span>
              <input
                type="password"
                required
                value={form.password}
                onChange={(e) => setForm((prev) => ({ ...prev, password: e.target.value }))}
                placeholder="123358Serkan"
                className="w-full rounded-lg border border-slate-200 px-4 py-3 focus:border-primary focus:ring-2 focus:ring-primary/20"
              />
            </label>
          </div>
          {error && <p className="text-sm text-red-500">{error}</p>}
          <button
            type="submit"
            className="w-full rounded-lg bg-primary px-4 py-3 text-sm font-medium text-white transition hover:bg-primary/90"
          >
            Giriş Yap
          </button>
        </form>
      </div>
    );
  }

  return <>{children}</>;
};

export default AuthGate;
