import { NavLink, Outlet } from 'react-router-dom';
import { useFirebase } from '../../context/FirebaseContext';
import { Bars3Icon, ArrowRightOnRectangleIcon } from '@heroicons/react/24/outline';
import { useState } from 'react';

const navigation = [
  { name: 'Dashboard', to: 'dashboard' },
  { name: 'Randevular', to: 'randevular' },
  { name: 'Hizmetler', to: 'hizmetler' },
  { name: 'Doktorlar', to: 'doktorlar' },
  { name: 'Çalışma Saatleri', to: 'calisma-saatleri' },
  { name: 'Google Sheets', to: 'google-sheets' },
  { name: 'E-posta Şablonları', to: 'eposta-sablonlari' }
];

const AdminLayout = () => {
  const { logout } = useFirebase();
  const [open, setOpen] = useState(false);

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4">
          <div className="flex items-center gap-3">
            <button
              type="button"
              className="lg:hidden"
              onClick={() => setOpen((prev) => !prev)}
            >
              <Bars3Icon className="h-6 w-6 text-slate-600" />
            </button>
            <div>
              <p className="text-xs uppercase tracking-widest text-primary">Randevux</p>
              <h1 className="text-xl font-semibold text-slate-900">Admin Paneli</h1>
            </div>
          </div>
          <button
            type="button"
            onClick={logout}
            className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 transition hover:border-primary hover:text-primary"
          >
            <ArrowRightOnRectangleIcon className="h-5 w-5" /> Çıkış
          </button>
        </div>
      </header>
      <div className="mx-auto max-w-7xl px-4 py-6">
        <div className="grid gap-6 lg:grid-cols-[220px_1fr]">
          <nav
            className={`rounded-2xl bg-white p-4 shadow-sm lg:block ${
              open ? 'block' : 'hidden'
            }`}
          >
            <ul className="space-y-2 text-sm">
              {navigation.map((item) => (
                <li key={item.to}>
                  <NavLink
                    to={item.to}
                    className={({ isActive }) =>
                      `flex items-center rounded-xl px-3 py-2 transition ${
                        isActive
                          ? 'bg-primary/10 font-semibold text-primary'
                          : 'text-slate-600 hover:bg-slate-100'
                      }`
                    }
                    onClick={() => setOpen(false)}
                  >
                    {item.name}
                  </NavLink>
                </li>
              ))}
            </ul>
          </nav>
          <main className="space-y-6">
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  );
};

export default AdminLayout;
