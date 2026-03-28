import { useState } from 'react';
import { updateQrUsed } from '../api/cmsApi';

function Field({ label, value, mono, badge, full }) {
  if (!value && value !== 0) return null;

  const badgeClass =
    badge === 'used'
      ? 'inline-flex rounded-full bg-red-100 px-2 py-0.5 text-xs font-semibold text-red-700'
      : badge === 'unused'
      ? 'inline-flex rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-semibold text-emerald-700'
      : null;

  return (
    <div className={full ? 'col-span-2' : ''}>
      <div className="text-xs font-medium text-slate-500">{label}</div>
      {badgeClass ? (
        <span className={badgeClass}>{value}</span>
      ) : (
        <div className={`mt-0.5 text-sm text-slate-900 ${mono ? 'font-mono text-xs' : 'font-medium'}`}>
          {value}
        </div>
      )}
    </div>
  );
}

export default function QrDetailModal({ qr, onClose, onUpdated }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [current, setCurrent] = useState(qr);

  async function handleToggle() {
    setLoading(true);
    setError('');
    try {
      const updated = await updateQrUsed(current.id, !current.used);
      const merged = { ...current, ...updated };
      setCurrent(merged);
      onUpdated && onUpdated(merged);
    } catch (err) {
      setError(err.message || 'Update failed');
    } finally {
      setLoading(false);
    }
  }

  const p = current.product || {};

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-900">QR Code Details</h2>
          <button
            onClick={onClose}
            className="rounded-md p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
          >
            ✕
          </button>
        </div>

        {/* QR image */}
        {current.qrDataUrl && (
          <div className="mt-5 flex justify-center">
            <img
              src={current.qrDataUrl}
              alt={current.code}
              className="h-48 w-48 rounded-xl border border-slate-200 bg-slate-50"
            />
          </div>
        )}

        {/* Core fields */}
        <div className="mt-5 space-y-3">
          <Field label="Code" value={current.code} mono />
          <Field
            label="Status"
            value={current.used ? 'Used' : 'Unused'}
            badge={current.used ? 'used' : 'unused'}
          />
          {current.usedAt && (
            <Field label="Used At" value={new Date(current.usedAt).toLocaleString()} />
          )}
          <Field label="Created" value={new Date(current.createdAt).toLocaleString()} />
        </div>

        {/* Product details */}
        {(p.name || p.sku || p.batchNo || p.mfgDate || p.expDate || p.description) && (
          <div className="mt-5 rounded-xl bg-slate-50 p-4">
            <div className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-500">
              Product Info
            </div>
            <div className="grid grid-cols-2 gap-3">
              {p.name && <Field label="Name" value={p.name} />}
              {p.sku && <Field label="SKU" value={p.sku} mono />}
              {p.batchNo && <Field label="Batch No." value={p.batchNo} />}
              {p.mfgDate && <Field label="MFG Date" value={p.mfgDate} />}
              {p.expDate && <Field label="EXP Date" value={p.expDate} />}
              {p.description && <Field label="Description" value={p.description} full />}
            </div>
          </div>
        )}

        {error && (
          <div className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>
        )}

        {/* Footer actions */}
        <div className="mt-6 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            Close
          </button>
          <button
            disabled={loading}
            onClick={handleToggle}
            className={`rounded-xl px-4 py-2 text-sm font-medium text-white transition disabled:opacity-60 ${
              current.used
                ? 'bg-slate-600 hover:bg-slate-700'
                : 'bg-emerald-600 hover:bg-emerald-700'
            }`}
          >
            {loading ? 'Updating…' : current.used ? 'Mark as Unused' : 'Mark as Used'}
          </button>
        </div>
      </div>
    </div>
  );
}
