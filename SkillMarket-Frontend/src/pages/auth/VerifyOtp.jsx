import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import API from '../../api/axios';

const CATEGORIES = [
  { icon: '🔧', label: 'Plumbing' },
  { icon: '📚', label: 'Tutoring' },
  { icon: '🎨', label: 'Design' },
  { icon: '🧹', label: 'Cleaning' },
  { icon: '⚡', label: 'Electrical' },
];

function LogoMark({ size = 56 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" fill="none">
      <circle cx="24" cy="32" r="16" fill="#fff" opacity="0.9" />
      <circle cx="40" cy="32" r="16" fill="#fff" opacity="0.5" />
      <path d="M28 32l3 3 6-7" stroke="#1d4ed8" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" fill="none" />
    </svg>
  );
}

export default function VerifyOtp() {
  const navigate = useNavigate();
  const location = useLocation();
  const email = location.state?.email;
  const [otp, setOtp] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);

  const handleVerify = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await API.post('/auth/verify-otp', { email, otp });
      setSuccess('Email verified! Redirecting to login...');
      const role = location.state?.role;
      setTimeout(() => {
        if (role === 'PROVIDER') {
          navigate('/provider-setup', { state: { email } });
        } else {
          navigate('/login');
        }
      }, 2000);
    } catch (err) {
      setError(err.response?.data || 'Invalid or expired OTP.');
    }
    setLoading(false);
  };

  const handleResend = async () => {
    setError('');
    setSuccess('');
    setResendLoading(true);
    try {
      await API.post('/auth/resend-otp', { email });
      setSuccess('OTP resent! Check your email.');
    } catch (err) {
      setError(err.response?.data || 'Failed to resend OTP.');
    }
    setResendLoading(false);
  };

  return (
    <div className="min-h-screen flex bg-white">

      {/* Left — Brand panel */}
      <div className="hidden md:flex md:w-1/2 relative overflow-hidden bg-gradient-to-br from-blue-600 to-blue-800 items-center justify-center px-12">
        {/* Decorative blobs */}
        <div className="absolute -top-24 -left-24 w-72 h-72 bg-blue-400/30 rounded-full blur-3xl" />
        <div className="absolute -bottom-32 -right-16 w-96 h-96 bg-blue-900/40 rounded-full blur-3xl" />

        <div className="relative z-10 flex flex-col items-center text-center max-w-sm">
          {/* Logomark */}
          <div className="w-24 h-24 bg-white/10 border border-white/20 rounded-3xl flex items-center justify-center mb-6">
            <LogoMark size={56} />
          </div>

          <h2 className="text-4xl font-black tracking-tight text-white">SkillMarket</h2>
          <p className="text-blue-100 mt-3 text-sm leading-relaxed">
            Connecting verified local talent with the people who need them.
          </p>

          <div className="flex flex-wrap gap-2 justify-center mt-8">
            {CATEGORIES.map(c => (
              <span key={c.label}
                className="bg-white/10 border border-white/20 text-white text-xs font-semibold px-3 py-1.5 rounded-full backdrop-blur-sm">
                {c.icon} {c.label}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Right — Verify OTP form */}
      <div className="w-full md:w-1/2 flex items-center justify-center px-6 sm:px-10 lg:px-16 py-12">
        <div className="w-full max-w-sm">

          {/* Mobile logo (left panel is hidden below md) */}
          <div className="md:hidden flex items-center justify-center gap-2 mb-8">
            <div className="w-9 h-9 bg-blue-600 rounded-xl flex items-center justify-center">
              <LogoMark size={22} />
            </div>
            <span className="text-lg font-black tracking-tight text-gray-900">SkillMarket</span>
          </div>

          <div className="mb-8">
            <h1 className="text-2xl font-black text-gray-900 tracking-tight">Verify your email</h1>
            <p className="text-gray-400 mt-2 text-sm">
              We sent a 6-digit OTP to <span className="font-semibold text-blue-600">{email}</span>
            </p>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-100 text-red-600 px-4 py-2.5 rounded-xl text-sm font-medium mb-5">
              {error}
            </div>
          )}
          {success && (
            <div className="bg-green-50 border border-green-100 text-green-700 px-4 py-2.5 rounded-xl text-sm font-medium mb-5">
              {success}
            </div>
          )}

          <form onSubmit={handleVerify} className="space-y-4">
            <div>
              <label className="text-xs font-bold text-gray-400 uppercase tracking-wide block mb-1.5">Enter OTP</label>
              <input
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                placeholder="Enter 6-digit OTP"
                maxLength={6}
                className="w-full border border-gray-300 px-4 py-2.5 rounded-xl text-sm text-center tracking-widest text-lg font-bold text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>

            <button type="submit" disabled={loading}
              className="w-full bg-blue-600 text-white py-2.5 rounded-xl hover:bg-blue-700 transition font-semibold text-sm disabled:opacity-60">
              {loading ? 'Verifying...' : 'Verify Email →'}
            </button>
          </form>

          <div className="text-center mt-6">
            <p className="text-sm text-gray-400 mb-2">Didn't receive the OTP?</p>
            <button onClick={handleResend} disabled={resendLoading}
              className="text-blue-600 font-semibold text-sm hover:underline disabled:opacity-60">
              {resendLoading ? 'Sending...' : 'Resend OTP'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}