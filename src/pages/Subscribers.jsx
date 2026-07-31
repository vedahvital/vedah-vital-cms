import { useEffect, useState } from 'react';
import { listSubscribers, deleteSubscriber } from '../api/cmsApi';
import { Mail, Search, Trash2, Download, RefreshCw, CheckCircle } from 'lucide-react';

export default function Subscribers() {
  const [subscribers, setSubscribers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [copied, setCopied] = useState(false);

  async function loadData() {
    setLoading(true);
    setError(null);
    try {
      const data = await listSubscribers();
      setSubscribers(data?.subscribers || []);
    } catch (err) {
      setError(err.message || 'Failed to load subscribers');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  async function handleDelete(id, email) {
    if (!window.confirm(`Are you sure you want to delete ${email}?`)) return;
    try {
      await deleteSubscriber(id);
      setSubscribers((prev) => prev.filter((s) => s._id !== id));
    } catch (err) {
      alert(err.message || 'Failed to delete subscriber');
    }
  }

  function exportCSV() {
    const headers = ['Email', 'Subscribed Date'];
    const rows = filteredSubscribers.map((s) => [
      s.email,
      new Date(s.createdAt).toLocaleDateString()
    ]);
    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `newsletter_subscribers_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  function copyAllEmails() {
    const emails = filteredSubscribers.map((s) => s.email).join(', ');
    navigator.clipboard.writeText(emails);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  const filteredSubscribers = subscribers.filter((s) =>
    s.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Newsletter Subscribers</h1>
          <p className="text-sm text-slate-500">
            Manage promotional email list collected from the website footer.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={copyAllEmails}
            disabled={filteredSubscribers.length === 0}
            className="flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:opacity-50"
          >
            {copied ? <CheckCircle size={16} className="text-emerald-600" /> : <Mail size={16} />}
            {copied ? 'Copied!' : 'Copy Emails'}
          </button>
          <button
            onClick={exportCSV}
            disabled={filteredSubscribers.length === 0}
            className="flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white shadow transition hover:bg-emerald-700 disabled:opacity-50"
          >
            <Download size={16} />
            Export CSV
          </button>
        </div>
      </div>

      {/* Stats Card */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            Total Subscribers
          </div>
          <div className="mt-2 text-3xl font-bold text-slate-800">{subscribers.length}</div>
        </div>
      </div>

      {/* Filter & Table Container */}
      <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
          <div className="relative w-full max-w-xs">
            <Search size={18} className="absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search by email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-lg border border-slate-300 pl-9 pr-4 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            />
          </div>
          <button
            onClick={loadData}
            title="Refresh List"
            className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-700"
          >
            <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>

        {error && (
          <div className="p-5 text-sm text-red-600 bg-red-50 border-b border-red-100">
            {error}
          </div>
        )}

        {loading ? (
          <div className="p-12 text-center text-sm text-slate-500">Loading subscribers...</div>
        ) : filteredSubscribers.length === 0 ? (
          <div className="p-12 text-center text-sm text-slate-500">
            {search ? 'No subscribers match your search.' : 'No subscribers found yet.'}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="border-b border-slate-200 bg-slate-50 text-xs font-semibold uppercase tracking-wider text-slate-500">
                <tr>
                  <th className="px-6 py-3.5">#</th>
                  <th className="px-6 py-3.5">Email Address</th>
                  <th className="px-6 py-3.5">Subscribed Date</th>
                  <th className="px-6 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredSubscribers.map((item, idx) => (
                  <tr key={item._id} className="hover:bg-slate-50 transition">
                    <td className="px-6 py-4 font-mono text-xs text-slate-400">{idx + 1}</td>
                    <td className="px-6 py-4 font-medium text-slate-800">{item.email}</td>
                    <td className="px-6 py-4 text-xs text-slate-500">
                      {new Date(item.createdAt).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => handleDelete(item._id, item.email)}
                        className="rounded-lg p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600 transition"
                        title="Delete Subscriber"
                      >
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
