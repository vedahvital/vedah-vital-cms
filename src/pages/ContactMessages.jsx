import { useEffect, useState } from 'react';
import { listContacts, updateContactStatus, deleteContact } from '../api/cmsApi';
import { Mail, Search, Trash2, RefreshCw, CheckCircle2, MessageSquare, Eye } from 'lucide-react';

export default function ContactMessages() {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [selectedMsg, setSelectedMsg] = useState(null);

  async function loadData() {
    setLoading(true);
    setError(null);
    try {
      const data = await listContacts();
      setMessages(data?.contacts || []);
    } catch (err) {
      setError(err.message || 'Failed to load messages');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  async function handleToggleStatus(msg) {
    const newStatus = msg.status === 'read' ? 'unread' : 'read';
    try {
      await updateContactStatus(msg._id, newStatus);
      setMessages((prev) =>
        prev.map((m) => (m._id === msg._id ? { ...m, status: newStatus } : m))
      );
      if (selectedMsg?._id === msg._id) {
        setSelectedMsg((prev) => ({ ...prev, status: newStatus }));
      }
    } catch (err) {
      alert(err.message || 'Failed to update status');
    }
  }

  async function handleDelete(id, name) {
    if (!window.confirm(`Are you sure you want to delete message from ${name}?`)) return;
    try {
      await deleteContact(id);
      setMessages((prev) => prev.filter((m) => m._id !== id));
      if (selectedMsg?._id === id) setSelectedMsg(null);
    } catch (err) {
      alert(err.message || 'Failed to delete message');
    }
  }

  function openDetail(msg) {
    setSelectedMsg(msg);
    if (msg.status === 'unread') {
      handleToggleStatus(msg);
    }
  }

  const filtered = messages.filter(
    (m) =>
      m.name.toLowerCase().includes(search.toLowerCase()) ||
      m.email.toLowerCase().includes(search.toLowerCase()) ||
      m.message.toLowerCase().includes(search.toLowerCase())
  );

  const unreadCount = messages.filter((m) => m.status === 'unread').length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Contact Form Messages</h1>
          <p className="text-sm text-slate-500">
            View inquiry submissions sent by visitors from the Contact page.
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            Total Messages
          </div>
          <div className="mt-2 text-3xl font-bold text-slate-800">{messages.length}</div>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            Unread Inquiries
          </div>
          <div className="mt-2 text-3xl font-bold text-emerald-600">{unreadCount}</div>
        </div>
      </div>

      {/* Filter & Table Container */}
      <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
          <div className="relative w-full max-w-xs">
            <Search size={18} className="absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search name, email, message..."
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
          <div className="p-12 text-center text-sm text-slate-500">Loading messages...</div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center text-sm text-slate-500">
            {search ? 'No messages match your search.' : 'No contact messages received yet.'}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="border-b border-slate-200 bg-slate-50 text-xs font-semibold uppercase tracking-wider text-slate-500">
                <tr>
                  <th className="px-6 py-3.5">Status</th>
                  <th className="px-6 py-3.5">Sender</th>
                  <th className="px-6 py-3.5">Message Snippet</th>
                  <th className="px-6 py-3.5">Received Date</th>
                  <th className="px-6 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((item) => (
                  <tr
                    key={item._id}
                    className={`hover:bg-slate-50 transition cursor-pointer ${
                      item.status === 'unread' ? 'bg-emerald-50/30 font-semibold' : ''
                    }`}
                    onClick={() => openDetail(item)}
                  >
                    <td className="px-6 py-4">
                      {item.status === 'unread' ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-medium text-emerald-800">
                          New
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-600">
                          Read
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-medium text-slate-800">{item.name}</div>
                      <div className="text-xs text-slate-500">{item.email}</div>
                    </td>
                    <td className="px-6 py-4 max-w-xs truncate text-slate-600">
                      {item.message}
                    </td>
                    <td className="px-6 py-4 text-xs text-slate-500">
                      {new Date(item.createdAt).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 text-right" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => openDetail(item)}
                          className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                          title="View Details"
                        >
                          <Eye size={16} />
                        </button>
                        <button
                          onClick={() => handleDelete(item._id, item.name)}
                          className="rounded-lg p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600 transition"
                          title="Delete Message"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Message Modal */}
      {selectedMsg && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-lg font-bold text-slate-800">{selectedMsg.name}</h3>
                <a
                  href={`mailto:${selectedMsg.email}`}
                  className="text-xs font-medium text-emerald-600 hover:underline flex items-center gap-1"
                >
                  <Mail size={12} /> {selectedMsg.email}
                </a>
              </div>
              <span className="text-xs text-slate-400">
                {new Date(selectedMsg.createdAt).toLocaleString()}
              </span>
            </div>

            <div className="rounded-xl bg-slate-50 p-4 text-sm text-slate-700 whitespace-pre-wrap min-h-[120px] max-h-[300px] overflow-y-auto">
              {selectedMsg.message}
            </div>

            <div className="flex justify-between items-center pt-2">
              <a
                href={`mailto:${selectedMsg.email}?subject=Re: Your Vedah Vital Inquiry`}
                className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white shadow hover:bg-emerald-700"
              >
                <MessageSquare size={16} /> Reply via Email
              </a>
              <button
                onClick={() => setSelectedMsg(null)}
                className="rounded-lg bg-slate-100 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-200"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
