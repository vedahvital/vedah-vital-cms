import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { generateQr } from '../api/cmsApi';

const emptyProduct = {
  name: '',
  sku: '',
  batchNo: '',
  mfgDate: '',
  expDate: '',
  description: ''
};

export default function Generate() {
  const [count, setCount] = useState(1);
  const [product, setProduct] = useState({ ...emptyProduct });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [generated, setGenerated] = useState(null);
  const navigate = useNavigate();

  function setField(key, value) {
    setProduct((prev) => ({ ...prev, [key]: value }));
  }

  async function handleGenerate(e) {
    e.preventDefault();
    setLoading(true);
    setError('');
    setGenerated(null);
    try {
      const clean = Object.fromEntries(
        Object.entries(product).filter(([, v]) => v.trim() !== '')
      );
      const data = await generateQr({ count: Number(count), product: clean });
      setGenerated(data.items);
    } catch (err) {
      setError(err.message || 'Generation failed');
    } finally {
      setLoading(false);
    }
  }

  function handleReset() {
    setGenerated(null);
    setProduct({ ...emptyProduct });
    setCount(1);
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6 px-4 py-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">Generate QR Codes</h1>
        <p className="mt-1 text-sm text-slate-500">
          Create one or more QR codes with optional product information.
        </p>
      </div>

      <form
        onSubmit={handleGenerate}
        className="space-y-6 rounded-2xl border border-slate-200 bg-white p-6"
      >
        {/* Count */}
        <div>
          <label className="block text-sm font-medium text-slate-700">
            Number of QR codes
          </label>
          <input
            type="number"
            required
            min={1}
            max={1000}
            value={count}
            onChange={(e) => setCount(e.target.value)}
            className="mt-1 w-40 rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-emerald-400"
          />
          <p className="mt-1 text-xs text-slate-400">Max 1000 per batch.</p>
        </div>

        {/* Product info */}
        <fieldset>
          <legend className="text-sm font-medium text-slate-700">
            Product info{' '}
            <span className="font-normal text-slate-400">(optional)</span>
          </legend>

          <div className="mt-3 grid gap-4 md:grid-cols-2">
            <Field
              label="Product name"
              id="name"
              value={product.name}
              onChange={(v) => setField('name', v)}
              placeholder="e.g. Ashwagandha Capsules"
            />
            <Field
              label="SKU"
              id="sku"
              value={product.sku}
              onChange={(v) => setField('sku', v)}
              placeholder="e.g. VV-ASH-001"
            />
            <Field
              label="Batch No."
              id="batchNo"
              value={product.batchNo}
              onChange={(v) => setField('batchNo', v)}
              placeholder="e.g. B2026-01"
            />
            <Field
              label="MFG Date"
              id="mfgDate"
              value={product.mfgDate}
              onChange={(v) => setField('mfgDate', v)}
              placeholder="e.g. 2026-01-01"
            />
            <Field
              label="EXP Date"
              id="expDate"
              value={product.expDate}
              onChange={(v) => setField('expDate', v)}
              placeholder="e.g. 2028-01-01"
            />
            <Field
              label="Description"
              id="description"
              value={product.description}
              onChange={(v) => setField('description', v)}
              placeholder="Short product description"
            />
          </div>
        </fieldset>

        {error && (
          <div className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
        )}

        <div className="flex gap-3">
          <button
            type="submit"
            disabled={loading}
            className="rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-60"
          >
            {loading ? 'Generating…' : `Generate ${count > 1 ? count + ' codes' : '1 code'}`}
          </button>
          {generated && (
            <>
              <button
                type="button"
                onClick={handleReset}
                className="rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                Generate more
              </button>
              <button
                type="button"
                onClick={() => navigate('/')}
                className="rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                Go to Dashboard
              </button>
            </>
          )}
        </div>
      </form>

      {/* Generated result */}
      {generated && (
        <div className="space-y-3">
          <h2 className="text-base font-semibold text-slate-900">
            Generated {generated.length} QR code{generated.length > 1 ? 's' : ''}
          </h2>

          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50">
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Code
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Product
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {generated.map((item) => (
                  <tr key={item.id}>
                    <td className="px-4 py-3 font-mono text-xs text-slate-700">{item.code}</td>
                    <td className="px-4 py-3 text-slate-700">{item.product?.name || '—'}</td>
                    <td className="px-4 py-3">
                      <span className="inline-flex rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-semibold text-emerald-700">
                        Unused
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

function Field({ label, id, value, onChange, placeholder }) {
  return (
    <div>
      <label htmlFor={id} className="block text-sm font-medium text-slate-700">
        {label}
      </label>
      <input
        id={id}
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="mt-1 w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-emerald-400"
      />
    </div>
  );
}
