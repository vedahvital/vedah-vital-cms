import { useState, useEffect, useCallback } from 'react';
import { listQr, getQrDetails, exportPdf } from '../api/cmsApi';
import QrDetailModal from '../components/QrDetailModal';

const PAGE_SIZE_OPTIONS = [10, 20, 50, 100, 500];

const FILTER_TABS = [
  { label: 'All', value: undefined },
  { label: 'Unused', value: false },
  { label: 'Used', value: true }
];

export default function Dashboard() {
  const [filter, setFilter] = useState(undefined);
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [stats, setStats] = useState({ totalAll: 0, totalUsed: 0, totalUnused: 0 });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [selected, setSelected] = useState(new Set());
  const [detailQr, setDetailQr] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [exporting, setExporting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await listQr({ used: filter, limit: pageSize, skip: page * pageSize });
      setItems(data.items);
      setTotal(data.total);
      setStats({
        totalAll:    data.totalAll    ?? 0,
        totalUsed:   data.totalUsed   ?? 0,
        totalUnused: data.totalUnused ?? 0
      });
      setSelected(new Set());
    } catch (err) {
      setError(err.message || 'Failed to load QR codes');
    } finally {
      setLoading(false);
    }
  }, [filter, page, pageSize]);

  useEffect(() => { load(); }, [load]);

  function setFilterAndReset(val) {
    setFilter(val);
    setPage(0);
  }

  function toggleSelect(id) {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  function toggleSelectAll() {
    if (selected.size === items.length && items.length > 0) {
      setSelected(new Set());
    } else {
      setSelected(new Set(items.map((i) => i.id)));
    }
  }

  async function handleViewDetails(id) {
    setDetailLoading(true);
    try {
      const data = await getQrDetails(id);
      setDetailQr(data);
    } catch (err) {
      setError(err.message || 'Failed to load details');
    } finally {
      setDetailLoading(false);
    }
  }

  function handleDetailUpdated(updated) {
    setItems((prev) =>
      prev.map((i) =>
        i.id === updated.id ? { ...i, used: updated.used, usedAt: updated.usedAt } : i
      )
    );
    setDetailQr((prev) => (prev ? { ...prev, ...updated } : prev));
  }

  async function handleExport() {
    if (selected.size === 0) return;
    setExporting(true);
    try {
      const blob = await exportPdf(Array.from(selected));
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'vedah-vital-qrcodes.pdf';
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      setError(err.message || 'Export failed');
    } finally {
      setExporting(false);
    }
  }

  const totalPages = Math.ceil(total / pageSize);
  const allChecked = items.length > 0 && selected.size === items.length;
  const someChecked = selected.size > 0 && selected.size < items.length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">QR Codes</h1>
          <p className="mt-1 text-sm text-slate-500">{stats.totalAll} total record{stats.totalAll !== 1 ? 's' : ''}</p>
        </div>

        <div className="flex gap-3">
          {selected.size > 0 && (
            <button
              disabled={exporting}
              onClick={handleExport}
              className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-60"
            >
              {exporting ? 'Exporting…' : `Export PDF (${selected.size})`}
            </button>
          )}
          <button
            onClick={load}
            disabled={loading}
            className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-60"
          >
            Refresh
          </button>
        </div>
      </div>

      {/* Stat cards — overall counts, not page-specific */}
      <div className="grid grid-cols-3 gap-4">
        <StatCard label="Total" value={stats.totalAll} color="slate" />
        <StatCard label="Unused" value={stats.totalUnused} color="emerald" />
        <StatCard label="Used" value={stats.totalUsed} color="red" />
      </div>

      {/* Filter tabs */}
      <div className="flex w-fit gap-1 rounded-xl bg-slate-200 p-1">
        {FILTER_TABS.map(({ label, value }) => (
          <button
            key={label}
            onClick={() => setFilterAndReset(value)}
            className={`rounded-lg px-4 py-1.5 text-sm font-medium transition ${
              filter === value
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Error banner */}
      {error && (
        <div className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
      )}

      {/* Table */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50">
              <th className="w-10 px-4 py-3">
                <input
                  type="checkbox"
                  checked={allChecked}
                  ref={(el) => { if (el) el.indeterminate = someChecked; }}
                  onChange={toggleSelectAll}
                  className="cursor-pointer rounded"
                />
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                Code
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                Status
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                Product
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                Created
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading ? (
              <tr>
                <td colSpan={6} className="px-4 py-12 text-center text-sm text-slate-400">
                  Loading…
                </td>
              </tr>
            ) : items.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-12 text-center text-sm text-slate-400">
                  No QR codes found.
                </td>
              </tr>
            ) : (
              items.map((item) => (
                <tr key={item.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3">
                    <input
                      type="checkbox"
                      checked={selected.has(item.id)}
                      onChange={() => toggleSelect(item.id)}
                      className="cursor-pointer rounded"
                    />
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-slate-700">{item.code}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                        item.used
                          ? 'bg-red-100 text-red-700'
                          : 'bg-emerald-100 text-emerald-700'
                      }`}
                    >
                      {item.used ? 'Used' : 'Unused'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-700">{item.product?.name || '—'}</td>
                  <td className="px-4 py-3 text-slate-500">
                    {new Date(item.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3">
                    <button
                      disabled={detailLoading}
                      onClick={() => handleViewDetails(item.id)}
                      className="rounded-lg border border-slate-200 bg-white px-3 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                    >
                      View
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination + page size selector */}
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm text-slate-600 shadow-sm">
        {/* Rows per page */}
        <div className="flex items-center gap-3">
          <span className="font-medium text-slate-500">Rows per page</span>
          <div className="flex gap-1">
            {PAGE_SIZE_OPTIONS.map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => { setPageSize(n); setPage(0); }}
                className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                  pageSize === n
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'border border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                {n}
              </button>
            ))}
          </div>
        </div>

        {/* Page navigation */}
        <div className="flex items-center gap-3">
          <span className="text-slate-500">
            <span className="font-semibold text-slate-900">{page * pageSize + 1}–{Math.min((page + 1) * pageSize, total)}</span>
            {' '}of{' '}
            <span className="font-semibold text-slate-900">{total}</span>
          </span>
          <div className="flex gap-1">
            <button
              disabled={page === 0}
              onClick={() => setPage(0)}
              title="First page"
              className="rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs font-medium hover:bg-slate-50 disabled:opacity-40"
            >
              «
            </button>
            <button
              disabled={page === 0}
              onClick={() => setPage((p) => p - 1)}
              className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium hover:bg-slate-50 disabled:opacity-40"
            >
              ‹ Prev
            </button>
            <span className="flex items-center rounded-lg bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-700">
              {page + 1} / {totalPages || 1}
            </span>
            <button
              disabled={page + 1 >= totalPages}
              onClick={() => setPage((p) => p + 1)}
              className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium hover:bg-slate-50 disabled:opacity-40"
            >
              Next ›
            </button>
            <button
              disabled={page + 1 >= totalPages}
              onClick={() => setPage(totalPages - 1)}
              title="Last page"
              className="rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs font-medium hover:bg-slate-50 disabled:opacity-40"
            >
              »
            </button>
          </div>
        </div>
      </div>

      {/* QR Detail modal */}
      {detailQr && (
        <QrDetailModal
          qr={detailQr}
          onClose={() => setDetailQr(null)}
          onUpdated={handleDetailUpdated}
        />
      )}
    </div>
  );
}

function StatCard({ label, value, color }) {
  const colors = {
    slate: 'bg-slate-50 text-slate-900',
    emerald: 'bg-emerald-50 text-emerald-700',
    red: 'bg-red-50 text-red-700'
  };

  return (
    <div className={`rounded-xl border border-slate-200 bg-white p-4`}>
      <div className="text-xs font-medium text-slate-500">{label}</div>
      <div className={`mt-1 text-2xl font-semibold ${colors[color]?.split(' ')[1] || 'text-slate-900'}`}>
        {value}
      </div>
    </div>
  );
}
