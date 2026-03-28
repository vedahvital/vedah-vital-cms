import { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const links = [
  { to: '/', label: 'Dashboard', end: true },
  { to: '/generate', label: 'Generate QR', end: false },
  { to: '/admins', label: 'Admin Users', end: false }
];

export default function Layout({ children }) {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const [showConfirm, setShowConfirm] = useState(false);

  function confirmLogout() {
    logout();
    navigate('/login');
  }

  return (
    <div className="flex min-h-screen bg-slate-100">
      {/* Sidebar */}
      <aside className="flex w-60 flex-col bg-slate-900 text-slate-300">
        <div className="border-b border-slate-700 px-5 py-5">
          <div className="flex items-center gap-3">
            {/* Logo with logout on hover */}
            <button
              onClick={() => setShowConfirm(true)}
              title="Logout"
              className="group relative flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-emerald-600 text-sm font-bold text-white transition hover:bg-red-500"
            >
              <span className="transition group-hover:opacity-0">VV</span>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="absolute h-4 w-4 opacity-0 transition group-hover:opacity-100"
              >
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                <polyline points="16 17 21 12 16 7" />
                <line x1="21" y1="12" x2="9" y2="12" />
              </svg>
            </button>
            <div>
              <div className="text-sm font-semibold text-white">Vedah Vital</div>
              <div className="text-xs text-slate-400">Admin CMS</div>
            </div>
          </div>
        </div>

        <nav className="flex-1 space-y-1 px-3 py-4">
          {links.map(({ to, label, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                `flex items-center rounded-lg px-3 py-2.5 text-sm font-medium transition ${
                  isActive
                    ? 'bg-emerald-600 text-white'
                    : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                }`
              }
            >
              {label}
            </NavLink>
          ))}
        </nav>

        <div className="border-t border-slate-700 px-3 py-4">
          <button
            onClick={() => setShowConfirm(true)}
            className="flex w-full items-center rounded-lg px-3 py-2.5 text-sm font-medium text-slate-400 transition hover:bg-slate-800 hover:text-white"
          >
            Logout
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-auto">
        <div className="mx-auto max-w-6xl px-6 py-8">{children}</div>
      </main>

      {/* Logout confirmation modal */}
      {showConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl">
            <div className="mb-1 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-100">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"
                  stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                  className="h-5 w-5 text-red-600">
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                  <polyline points="16 17 21 12 16 7" />
                  <line x1="21" y1="12" x2="9" y2="12" />
                </svg>
              </div>
              <h2 className="text-base font-semibold text-slate-900">Sign out?</h2>
            </div>
            <p className="mt-2 text-sm text-slate-500">
              You will be returned to the login screen.
            </p>
            <div className="mt-5 flex gap-3">
              <button
                onClick={confirmLogout}
                className="flex-1 rounded-xl bg-red-600 py-2.5 text-sm font-semibold text-white hover:bg-red-700"
              >
                Yes, sign out
              </button>
              <button
                onClick={() => setShowConfirm(false)}
                className="flex-1 rounded-xl border border-slate-200 bg-white py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
