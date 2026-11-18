import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { generateQr } from '../api/cmsApi';

const emptyProduct = {
  name: 'KSM-66® Ashwagandha Root Extract',
  brand: 'VEDAH VITAL',
  strength: '500 mg',
  blackPepperExtract: '5 mg',
  packSize: '60 Vegan Capsules',
  sku: 'VV-ASH-001',
  batchNo: '',
  mfgDate: '',
  expDate: '',
  description: ''
};

export default function Generate() {
  const [count, setCount] = useState(1);
  const [product, setProduct] = useState({ ...emptyProduct });
  const [labReports, setLabReports] = useState({
    potency: [],
    heavyMetalsMicrobial: [],
    allergens: []
  });
  const [loading, setLoading] = useState(false);
  const [compressing, setCompressing] = useState(false);
  const [error, setError] = useState('');
  const [generated, setGenerated] = useState(null);
  const [previewImg, setPreviewImg] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    function handleKeyDown(e) {
      if (e.key === 'Escape') setPreviewImg(null);
    }
    if (previewImg) {
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
    }
  }, [previewImg]);

  function setField(key, value) {
    setProduct((prev) => ({ ...prev, [key]: value }));
  }

  // Multi-stage client compressor: guarantees crisp certificate readability while keeping
  // each image base64 under ~150KB (safely fits 15 full certificates into Vercel's 4.5MB request limit)
  function compressImage(file, maxWidth = 1000, maxHeight = 1400) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onerror = reject;
      reader.onload = (e) => {
        const img = new Image();
        img.onerror = reject;
        img.onload = () => {
          let { width, height } = img;
          if (width > maxWidth || height > maxHeight) {
            const ratio = Math.min(maxWidth / width, maxHeight / height);
            width = Math.round(width * ratio);
            height = Math.round(height * ratio);
          }

          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            return resolve(e.target?.result);
          }
          ctx.fillStyle = '#FFFFFF';
          ctx.fillRect(0, 0, width, height);
          ctx.drawImage(img, 0, 0, width, height);

          // Try 0.70 quality first
          let compressed = canvas.toDataURL('image/jpeg', 0.70);

          // If over 180,000 characters (~135KB binary), recompress at 0.55
          if (compressed.length > 180000) {
            compressed = canvas.toDataURL('image/jpeg', 0.55);
          }

          // If still over 180,000 characters (e.g. dense noisy smartphone camera photo), downscale
          if (compressed.length > 180000) {
            const downCanvas = document.createElement('canvas');
            downCanvas.width = Math.round(width * 0.75);
            downCanvas.height = Math.round(height * 0.75);
            const dCtx = downCanvas.getContext('2d');
            dCtx.fillStyle = '#FFFFFF';
            dCtx.fillRect(0, 0, downCanvas.width, downCanvas.height);
            dCtx.drawImage(canvas, 0, 0, downCanvas.width, downCanvas.height);
            compressed = downCanvas.toDataURL('image/jpeg', 0.55);
          }

          resolve(compressed);
        };
        img.src = e.target?.result;
      };
      reader.readAsDataURL(file);
    });
  }

  async function handleImageUpload(category, e) {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;

    const currentCount = labReports[category].length;
    if (currentCount + files.length > 5) {
      alert(`You can upload maximum 5 images for ${category} report. Currently ${currentCount} uploaded.`);
      return;
    }

    setCompressing(true);
    try {
      for (const file of files) {
        if (!file.type.match(/^image\/(jpeg|jpg|png|webp)$/)) {
          alert('Only JPG, PNG and WebP images are supported.');
          continue;
        }
        try {
          const compressedBase64 = await compressImage(file);
          setLabReports((prev) => ({
            ...prev,
            [category]: [...prev[category], compressedBase64].slice(0, 5)
          }));
        } catch (err) {
          console.error('Failed to process image:', err);
        }
      }
    } finally {
      setCompressing(false);
      e.target.value = '';
    }
  }

  function removeImage(category, index) {
    setLabReports((prev) => ({
      ...prev,
      [category]: prev[category].filter((_, i) => i !== index)
    }));
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
      const data = await generateQr({
        count: Number(count),
        product: clean,
        labReports
      });
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
    setLabReports({ potency: [], heavyMetalsMicrobial: [], allergens: [] });
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
              placeholder="e.g. KSM-66® Ashwagandha Root Extract"
            />
            <Field
              label="Brand"
              id="brand"
              value={product.brand}
              onChange={(v) => setField('brand', v)}
              placeholder="e.g. VEDAH VITAL"
            />
            <Field
              label="Strength"
              id="strength"
              value={product.strength}
              onChange={(v) => setField('strength', v)}
              placeholder="e.g. 500 mg"
            />
            <Field
              label="Black Pepper Extract"
              id="blackPepperExtract"
              value={product.blackPepperExtract}
              onChange={(v) => setField('blackPepperExtract', v)}
              placeholder="e.g. 5 mg"
            />
            <Field
              label="Pack Size"
              id="packSize"
              value={product.packSize}
              onChange={(v) => setField('packSize', v)}
              placeholder="e.g. 60 Vegan Capsules"
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

        {/* Lab Reports Upload (3 Types, 3-5 images each) */}
        <fieldset className="rounded-2xl border border-slate-200 bg-slate-50/50 p-5">
          <legend className="px-2 text-sm font-semibold text-slate-800">
            Lab Certificate of Analysis Reports (Upload 3-5 images each)
          </legend>
          <p className="mt-1 text-xs text-slate-500">
            Attach scan copies / images (JPG, PNG) for third-party lab verification reports.
          </p>

          <div className="mt-4 space-y-5">
            <ReportUploadSection
              title="1. Active Potency Assay Report"
              subtitle="Withanolides HPLC & Piperine absorption booster test sheets"
              category="potency"
              images={labReports.potency}
              disabled={compressing}
              onUpload={(e) => handleImageUpload('potency', e)}
              onRemove={(idx) => removeImage('potency', idx)}
              onPreview={(src, title) => setPreviewImg({ src, title })}
            />

            <ReportUploadSection
              title="2. Heavy Metals & Microbial Screening Report"
              subtitle="Lead, Mercury, Cadmium, Arsenic & Microbiology (E. Coli, Salmonella, Yeast & Mold) test results"
              category="heavyMetalsMicrobial"
              images={labReports.heavyMetalsMicrobial}
              disabled={compressing}
              onUpload={(e) => handleImageUpload('heavyMetalsMicrobial', e)}
              onRemove={(idx) => removeImage('heavyMetalsMicrobial', idx)}
              onPreview={(src, title) => setPreviewImg({ src, title })}
            />

            <ReportUploadSection
              title="3. Allergens Screening Report"
              subtitle="Gluten, Soy, Dairy, Solvents, Pesticides & Mycotoxins safety audit certificates"
              category="allergens"
              images={labReports.allergens}
              disabled={compressing}
              onUpload={(e) => handleImageUpload('allergens', e)}
              onRemove={(idx) => removeImage('allergens', idx)}
              onPreview={(src, title) => setPreviewImg({ src, title })}
            />
          </div>
        </fieldset>

        {compressing && (
          <div className="rounded-xl bg-emerald-50 px-4 py-2.5 text-xs font-medium text-emerald-800 flex items-center gap-2">
            <span className="inline-block h-2 w-2 rounded-full bg-emerald-600 animate-ping" />
            Optimizing lab report certificates for ultra-fast verification...
          </div>
        )}

        {error && (
          <div className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
        )}

        <div className="flex gap-3">
          <button
            type="submit"
            disabled={loading || compressing}
            className="rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-60"
          >
            {loading ? 'Generating…' : compressing ? 'Optimizing images…' : `Generate ${count > 1 ? count + ' codes' : '1 code'}`}
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

function ReportUploadSection({ title, subtitle, category, images, onUpload, onRemove, onPreview, disabled }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h4 className="text-sm font-semibold text-slate-800">{title}</h4>
          <p className="text-xs text-slate-500">{subtitle}</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-slate-500">
            {images.length}/5 uploaded
          </span>
          <label className={`cursor-pointer rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 ${images.length >= 5 || disabled ? 'pointer-events-none opacity-50' : ''}`}>
            + Add Images
            <input
              type="file"
              multiple
              accept="image/png,image/jpeg,image/jpg,image/webp"
              onChange={onUpload}
              disabled={images.length >= 5 || disabled}
              className="hidden"
            />
          </label>
        </div>
      </div>

      {/* Image previews */}
      {images.length > 0 ? (
        <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-5">
          {images.map((src, index) => (
            <div
              key={index}
              onClick={() => onPreview && onPreview(src, `${title} — Page ${index + 1}`)}
              className="group relative aspect-[3/4] cursor-pointer overflow-hidden rounded-lg border border-slate-200 bg-slate-100 shadow-sm transition-all hover:ring-2 hover:ring-emerald-500"
              title="Click to zoom / preview certificate"
            >
              <img
                src={src}
                alt={`${category} report ${index + 1}`}
                className="h-full w-full object-cover transition-transform duration-200 group-hover:scale-105"
              />
              <div className="absolute inset-0 flex items-center justify-center bg-black/0 transition-colors group-hover:bg-black/30">
                <span className="rounded bg-black/75 px-2 py-1 text-[11px] font-medium text-white opacity-0 shadow transition-opacity group-hover:opacity-100">
                  🔍 Preview
                </span>
              </div>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onRemove(index);
                }}
                className="absolute right-1 top-1 z-10 flex h-6 w-6 items-center justify-center rounded-full bg-red-600 text-xs font-bold text-white opacity-90 shadow transition-all hover:scale-110 hover:opacity-100"
                title="Remove image"
              >
                ✕
              </button>
              <div className="absolute bottom-1 left-1 rounded bg-black/60 px-1.5 py-0.5 text-[10px] text-white">
                #{index + 1}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="mt-3 rounded-lg border border-dashed border-slate-200 py-3 text-center text-xs text-slate-400">
          No lab report images attached yet (accepts 3-5 images in JPG, PNG).
        </div>
      )}
    </div>
  );
}
