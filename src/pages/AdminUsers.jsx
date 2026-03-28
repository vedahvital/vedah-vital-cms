import { useState, useEffect, useCallback } from 'react';
import { listAdmins, createAdminUser, toggleAdminUser } from '../api/cmsApi';
import { useAuth } from '../context/AuthContext';

export default function AdminUsers() {
  const { token } = useAuth();
  // Decode current user email from JWT payload (middle segment)
  const currentEmail = (() => {
    try {
      return JSON.parse(atob(token.split('.')[1])).email || '';
    } catch {
      return '';
    }
  })();

  const [admins, setAdmins] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [addLoading, setAddLoading] = useState(false);
  const [addError, setAddError] = useState('');
  const [togglingId, setTogglingId] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await listAdmins();
      setAdmins(data.items);
    } catch (err) {
      setError(err.message || 'Failed to load admins');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  async function handleAdd(e) {
    e.preventDefault();
    const email = newEmail.trim().toLowerCase();
    if (!email) return;
    setAddLoading(true);
    setAddError('');
    try {
      const added = await createAdminUser(email);
      setAdmins((prev) => {
        const exists = prev.find((a) => a.id === added.id);
        if (exists) return prev.map((a) => (a.id === added.id ? added : a));
        return [added, ...prev];
      });
      setNewEmail('');
    } catch (err) {
      setAddError(err.message || 'Failed to add admin');
    } finally {
      setAddLoading(false);
    }
  }

  async function handleToggle(admin) {
    setTogglingId(admin.id);
    setError('');
    try {
      const updated = await toggleAdminUser(admin.id, !admin.isActive);
      setAdmins((prev) => prev.map((a) => (a.id === updated.id ? updated : a)));
    } catch (err) {
      setError(err.message || 'Failed to update admin');
    } finally {
      setTogglingId(null);
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">Admin Users</h1>
        <p className="mt-1 text-sm text-slate-500">
          Add or disable email addresses that are allowed to log into the CMS.
        </p>
      </div>

      {/* Add admin form */}
      <form
        onSubmit={handleAdd}
        className="rounded-2xl border border-slate-200 bg-white p-5"
      >
        <label className="block text-sm font-medium text-slate-700">
          Add admin email
        </label>
        <div className="mt-2 flex flex-col gap-2 sm:flex-row">
          <input
            type="email"
            required
            value={newEmail}
            onChange={(e) => setNewEmail(e.target.value)}
            placeholder="newadmin@example.com"
            className="w-full flex-1 rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-emerald-400"
          />
          <button
            type="submit"
            disabled={addLoading}
            className="rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-60"
          >
            {addLoading ? 'Adding…' : 'Add Admin'}
          </button>
        </div>
        {addError && (
          <p className="mt-2 text-sm text-red-600">{addError}</p>
        )}
        <p className="mt-2 text-xs text-slate-400">
          If the email already exists but is disabled, it will be re-activated.
        </p>
      </form>

      {/* Error banner */}
      {error && (
        <div className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
      )}

      {/* Admin table */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50">
              <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                Email
              </th>
              <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                Status
              </th>
              <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                Added
              </th>
              <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                Action
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading ? (
              <tr>
                <td colSpan={4} className="px-5 py-10 text-center text-sm text-slate-400">
                  Loading…
                </td>
              </tr>
            ) : admins.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-5 py-10 text-center text-sm text-slate-400">
                  No admin accounts yet. Add one above.
                </td>
              </tr>
            ) : (
              admins.map((admin) => {
                const isSelf = admin.email === currentEmail;
                const toggling = togglingId === admin.id;

                return (
                  <tr key={admin.id} className="hover:bg-slate-50">
                    <td className="px-5 py-3 font-medium text-slate-800">
                      {admin.email}
                      {isSelf && (
                        <span className="ml-2 rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-semibold text-emerald-700">
                          you
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-3">
                      <span
                        className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                          admin.isActive
                            ? 'bg-emerald-100 text-emerald-700'
                            : 'bg-slate-100 text-slate-500'
                        }`}
                      >
                        {admin.isActive ? 'Active' : 'Disabled'}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-slate-500">
                      {new Date(admin.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-5 py-3">
                      {isSelf ? (
                        <span className="text-xs text-slate-400">—</span>
                      ) : (
                        <button
                          disabled={toggling}
                          onClick={() => handleToggle(admin)}
                          className={`rounded-lg border px-3 py-1 text-xs font-medium transition disabled:opacity-50 ${
                            admin.isActive
                              ? 'border-red-200 bg-white text-red-600 hover:bg-red-50'
                              : 'border-emerald-200 bg-white text-emerald-700 hover:bg-emerald-50'
                          }`}
                        >
                          {toggling
                            ? '…'
                            : admin.isActive
                            ? 'Disable'
                            : 'Enable'}
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
