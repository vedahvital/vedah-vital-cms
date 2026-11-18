import { useState, useEffect } from 'react';
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
  const [previewImg, setPreviewImg] = useState(null);

  useEffect(() => {
    function handleKeyDown(e) {
      if (e.key === 'Escape') setPreviewImg(null);
    }
    if (previewImg) {
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
    }
  }, [previewImg]);

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
      <div className="w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl">
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
        {(p.name || p.brand || p.strength || p.blackPepperExtract || p.packSize || p.sku || p.batchNo || p.mfgDate || p.expDate || p.description) && (
          <div className="mt-5 rounded-xl bg-slate-50 p-4">
            <div className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-500">
              Product Info
            </div>
            <div className="grid grid-cols-2 gap-3">
              {p.name && <Field label="Name" value={p.name} />}
              {p.brand && <Field label="Brand" value={p.brand} />}
              {p.strength && <Field label="Strength" value={p.strength} />}
              {p.blackPepperExtract && <Field label="Black Pepper Extract" value={p.blackPepperExtract} />}
              {p.packSize && <Field label="Pack Size" value={p.packSize} />}
              {p.sku && <Field label="SKU" value={p.sku} mono />}
              {p.batchNo && <Field label="Batch No." value={p.batchNo} />}
              {p.mfgDate && <Field label="MFG Date" value={p.mfgDate} />}
              {p.expDate && <Field label="EXP Date" value={p.expDate} />}
              {p.description && <Field label="Description" value={p.description} full />}
            </div>
          </div>
        )}

        {/* Lab reports images preview */}
        {current.labReports && (
          (current.labReports.potency?.length > 0) ||
          (current.labReports.heavyMetalsMicrobial?.length > 0) ||
          (current.labReports.allergens?.length > 0) ||
          (current.labReports.heavyMetals?.length > 0) ||
          (current.labReports.microbial?.length > 0)
        ) && (
          <div className="mt-5 rounded-xl bg-slate-50 p-4">
            <div className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-500">
              Lab Analysis Certificates
            </div>
            <div className="space-y-4">
              {current.labReports.potency?.length > 0 && (
                <div>
                  <div className="text-xs font-medium text-slate-700 mb-1">
                    1. Active Potency Assay ({current.labReports.potency.length} images)
                  </div>
                  <div className="flex gap-2 overflow-x-auto pb-1">
                    {current.labReports.potency.map((img, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => setPreviewImg({ src: img, title: `Potency Assay Certificate #${i + 1}` })}
                        className="shrink-0 cursor-pointer rounded-lg overflow-hidden border border-slate-200 hover:ring-2 hover:ring-emerald-500 transition-all text-left"
                        title="Click to view full size"
                      >
                        <img src={img} alt="Potency" className="h-16 w-16 object-cover" />
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* 2. Heavy Metals & Microbial Screening (Combined) */}
              {((current.labReports.heavyMetalsMicrobial?.length > 0) || (current.labReports.heavyMetals?.length > 0) || (current.labReports.microbial?.length > 0)) && (
                <div>
                  {(() => {
                    const combined = [
                      ...(current.labReports.heavyMetalsMicrobial || []),
                      ...(current.labReports.heavyMetals || []),
                      ...(current.labReports.microbial || [])
                    ];
                    return (
                      <>
                        <div className="text-xs font-medium text-slate-700 mb-1">
                          2. Heavy Metals & Microbial Screening ({combined.length} images)
                        </div>
                        <div className="flex gap-2 overflow-x-auto pb-1">
                          {combined.map((img, i) => (
                            <button
                              key={i}
                              type="button"
                              onClick={() => setPreviewImg({ src: img, title: `Heavy Metals & Microbial Certificate #${i + 1}` })}
                              className="shrink-0 cursor-pointer rounded-lg overflow-hidden border border-slate-200 hover:ring-2 hover:ring-emerald-500 transition-all text-left"
                              title="Click to view full size"
                            >
                              <img src={img} alt="Heavy Metals & Microbial" className="h-16 w-16 object-cover" />
                            </button>
                          ))}
                        </div>
                      </>
                    );
                  })()}
                </div>
              )}

              {/* 3. Allergens Screening */}
              {current.labReports.allergens?.length > 0 && (
                <div>
                  <div className="text-xs font-medium text-slate-700 mb-1">
                    3. Allergens Screening ({current.labReports.allergens.length} images)
                  </div>
                  <div className="flex gap-2 overflow-x-auto pb-1">
                    {current.labReports.allergens.map((img, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => setPreviewImg({ src: img, title: `Allergens Screening Certificate #${i + 1}` })}
                        className="shrink-0 cursor-pointer rounded-lg overflow-hidden border border-slate-200 hover:ring-2 hover:ring-emerald-500 transition-all text-left"
                        title="Click to view full size"
                      >
                        <img src={img} alt="Allergens" className="h-16 w-16 object-cover" />
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Certificate Fullscreen Lightbox Modal */}
        {previewImg && (
          <div
            className="fixed inset-0 z-50 flex flex-col items-center justify-between bg-black/90 p-4 backdrop-blur-sm"
            onClick={() => setPreviewImg(null)}
          >
            <div
              className="flex w-full max-w-4xl items-center justify-between border-b border-white/20 pb-3 text-white"
              onClick={(e) => e.stopPropagation()}
            >
              <span className="font-semibold text-sm">{previewImg.title}</span>
              <div className="flex items-center gap-3">
                <a
                  href={previewImg.src}
                  download="lab-report-certificate.jpg"
                  className="rounded-lg bg-white/20 px-3 py-1 text-xs font-medium text-white hover:bg-white/30"
                >
                  Download
                </a>
                <button
                  type="button"
                  onClick={() => setPreviewImg(null)}
                  className="rounded-lg p-1 text-white/80 hover:bg-white/20 hover:text-white"
                >
                  ✕
                </button>
              </div>
            </div>
            <div
              className="my-auto flex max-h-[80vh] max-w-4xl items-center justify-center p-2"
              onClick={(e) => e.stopPropagation()}
            >
              <img
                src={previewImg.src}
                alt="Certificate full view"
                className="max-h-[78vh] max-w-full rounded-lg object-contain shadow-2xl"
              />
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
