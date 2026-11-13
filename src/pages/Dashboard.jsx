import { useState, useEffect, useCallback } from 'react';
import { listQr, getQrDetails, exportPdf } from '../api/cmsApi';
import QrDetailModal from '../components/QrDetailModal';

const PAGE_SIZE_OPTIONS = [10, 20, 50, 100, 500, 1000];

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
      setError(err.message || 'Failed to export');
    } finally {
      setExporting(false);
    }
  }

  const isAllSelected = selected.size === items.length && items.length > 0;
  const pageStart = page * pageSize + 1;
  const pageEnd = Math.min((page + 1) * pageSize, total);

  return (
    <>
      <div className="space-y-6">
        <h1 className="text-2xl font-semibold text-slate-800">Dashboard</h1>

        {/* Stats */}
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          <StatCard title="Total QR Codes" value={stats.totalAll} />
          <StatCard title="Total Used" value={stats.totalUsed} />
          <StatCard title="Total Unused" value={stats.totalUnused} />
        </div>

        {/* Filters and Actions */}
        <div className="space-y-4 rounded-lg bg-white p-4 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center border-b border-slate-200">
              {FILTER_TABS.map((tab) => (
                <button
                  key={tab.label}
                  onClick={() => setFilterAndReset(tab.value)}
                  className={`-mb-px border-b-2 px-4 py-2 text-sm font-medium transition ${
                    filter === tab.value
                      ? 'border-emerald-500 text-emerald-600'
                      : 'border-transparent text-slate-500 hover:border-slate-300 hover:text-slate-700'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <button
                onClick={handleExport}
                disabled={selected.size === 0 || exporting}
                className="flex items-center gap-2 rounded-md bg-emerald-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-emerald-700 disabled:opacity-50"
              >
                {exporting ? 'Exporting...' : `Export Selected (${selected.size})`}
              </button>
            </div>
          </div>

          {error && <div className="rounded-md bg-red-50 p-4 text-sm text-red-700">{error}</div>}

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200">
              <thead className="bg-slate-50">
                <tr>
                  <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-slate-900 sm:pl-6">
                    <input
                      type="checkbox"
                      className="h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                      checked={isAllSelected}
                      onChange={toggleSelectAll}
                    />
                  </th>
                  <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-slate-900">ID</th>
                  <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-slate-900">Status</th>
                  <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-slate-900">Used At</th>
                  <th scope="col" className="relative py-3.5 pl-3 pr-4 sm:pr-6">
                    <span className="sr-only">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 bg-white">
                {loading ? (
                  <tr>
                    <td colSpan="5" className="whitespace-nowrap px-3 py-4 text-center text-sm text-slate-500">
                      Loading...
                    </td>
                  </tr>
                ) : items.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="whitespace-nowrap px-3 py-4 text-center text-sm text-slate-500">
                      No QR codes found.
                    </td>
                  </tr>
                ) : (
                  items.map((item) => (
                    <tr key={item.id}>
                      <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-slate-900 sm:pl-6">
                        <input
                          type="checkbox"
                          className="h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                          checked={selected.has(item.id)}
                          onChange={() => toggleSelect(item.id)}
                        />
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-slate-500 font-mono">{item.id.slice(0, 8)}...</td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm">
                        {item.used ? (
                          <span className="inline-flex items-center rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-800">
                            Used
                          </span>
                        ) : (
                          <span className="inline-flex items-center rounded-full bg-yellow-100 px-2.5 py-0.5 text-xs font-medium text-yellow-800">
                            Unused
                          </span>
                        )}
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-slate-500">
                        {item.usedAt ? new Date(item.usedAt).toLocaleString() : 'N/A'}
                      </td>
                      <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
                        <button
                          onClick={() => handleViewDetails(item.id)}
                          className="text-emerald-600 hover:text-emerald-900"
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

          {/* Pagination */}
          <div className="flex flex-wrap items-center justify-between gap-4 pt-3">
            <div className="text-sm text-slate-700">
              Showing <span className="font-medium">{pageStart}</span> to <span className="font-medium">{pageEnd}</span> of{' '}
              <span className="font-medium">{total}</span> results
            </div>
            <div className="flex items-center gap-3">
              <select
                value={pageSize}
                onChange={(e) => setPageSize(Number(e.target.value))}
                className="block w-full rounded-md border-slate-300 py-1.5 pl-3 pr-10 text-base focus:border-emerald-500 focus:outline-none focus:ring-emerald-500 sm:text-sm"
              >
                {PAGE_SIZE_OPTIONS.map(size => <option key={size} value={size}>Show {size}</option>)}
              </select>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setPage(p => p - 1)}
                  disabled={page === 0}
                  className="rounded-md p-1.5 text-slate-500 hover:bg-slate-100 disabled:opacity-50"
                >
                  Previous
                </button>
                <button
                  onClick={() => setPage(p => p + 1)}
                  disabled={pageEnd >= total}
                  className="rounded-md p-1.5 text-slate-500 hover:bg-slate-100 disabled:opacity-50"
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {detailQr && (
        <QrDetailModal
          qr={detailQr}
          isOpen={!!detailQr}
          onClose={() => setDetailQr(null)}
          onUpdated={handleDetailUpdated}
          loading={detailLoading}
        />
      )}
    </>
  );
}

function StatCard({ title, value }) {
  return (
    <div className="rounded-lg bg-white p-5 shadow-sm">
      <dt className="truncate text-sm font-medium text-slate-500">{title}</dt>
      <dd className="mt-1 text-3xl font-semibold tracking-tight text-slate-900">{value}</dd>
    </div>
  );
}
