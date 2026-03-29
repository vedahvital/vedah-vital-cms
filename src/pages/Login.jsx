import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { requestOtp, verifyOtp } from '../api/cmsApi';
import { useAuth } from '../context/AuthContext';

const RESEND_COOLDOWN = 30;

export default function Login() {
  const [email, setEmail]     = useState('');
  const [otp, setOtp]         = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');
  const [info, setInfo]       = useState('');
  const timerRef = useRef(null);
  const { login } = useAuth();
  const navigate = useNavigate();

  // Cleanup interval on unmount
  useEffect(() => () => clearInterval(timerRef.current), []);

  function startCooldown() {
    setCooldown(RESEND_COOLDOWN);
    clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setCooldown(prev => {
        if (prev <= 1) { clearInterval(timerRef.current); return 0; }
        return prev - 1;
      });
    }, 1000);
  }

  async function handleSendOtp() {
    setSending(true);
    setError('');
    setInfo('');
    try {
      await requestOtp(email.trim());
      setOtpSent(true);
      setOtp('');
      setInfo('OTP sent! Check your inbox — valid for 5 minutes.');
      startCooldown();
    } catch (err) {
      setError(err.message || 'Failed to send OTP. Please try again.');
      setOtpSent(false); // revert to "Send OTP" on error
    } finally {
      setSending(false);
    }
  }

  async function handleLogin(e) {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const { token } = await verifyOtp(email.trim(), otp.trim());
      login(token);
      navigate('/');
    } catch (err) {
      setError(err.message || 'Invalid OTP.');
    } finally {
      setLoading(false);
    }
  }

  function handleEmailChange(e) {
    setEmail(e.target.value);
    setOtpSent(false);
    setOtp('');
    setInfo('');
    setError('');
    setCooldown(0);
    clearInterval(timerRef.current);
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-900 px-4">
      <div className="w-full max-w-sm">
        {/* Brand */}
        <div className="mb-8 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-600 text-2xl font-bold text-white">
            VV
          </div>
          <h1 className="mt-4 text-xl font-semibold text-white">Vedah Vital Admin</h1>
          <p className="mt-1 text-sm text-slate-400">Sign in to the CMS dashboard</p>
        </div>

        <div className="rounded-2xl bg-white p-6 shadow-xl space-y-4">
          {/* Email + Send OTP */}
          <div>
            <label className="block text-sm font-medium text-slate-700">Email address</label>
            <div className="mt-1 flex flex-col gap-2 sm:flex-row">
              <input
                type="email"
                required
                autoFocus
                value={email}
                onChange={handleEmailChange}
                placeholder="admin@example.com"
                className="flex-1 rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-emerald-400"
              />
              {!otpSent ? (
                <button
                  type="button"
                  onClick={handleSendOtp}
                  disabled={sending || !email}
                  className="rounded-xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-50 whitespace-nowrap"
                >
                  {sending ? '…' : 'Send OTP'}
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleSendOtp}
                  disabled={sending || cooldown > 0}
                  className="rounded-xl bg-slate-100 px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-200 disabled:opacity-50 whitespace-nowrap"
                >
                  {sending ? '…' : cooldown > 0 ? `Resend (${cooldown}s)` : 'Resend OTP'}
                </button>
              )}
            </div>
          </div>

          {/* OTP field — only visible after OTP is sent */}
          {otpSent && (
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700">
                  Enter OTP
                  <span className="ml-2 text-xs text-emerald-600 font-normal">(6-digit code)</span>
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  autoFocus
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                  placeholder="······"
                  className="mt-1 w-full rounded-xl border border-slate-200 px-4 py-3 text-center text-2xl tracking-[0.5em] outline-none focus:border-emerald-400"
                />
              </div>

              {info && <p className="text-sm text-emerald-600">{info}</p>}
              {error && <p className="text-sm text-red-600">{error}</p>}

              <button
                type="submit"
                disabled={loading || otp.length < 6}
                className="w-full rounded-xl bg-emerald-600 py-3 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
              >
                {loading ? 'Verifying…' : 'Sign In'}
              </button>
            </form>
          )}

          {!otpSent && (
            <>
              {info && <p className="text-sm text-emerald-600">{info}</p>}
              {error && <p className="text-sm text-red-600">{error}</p>}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

