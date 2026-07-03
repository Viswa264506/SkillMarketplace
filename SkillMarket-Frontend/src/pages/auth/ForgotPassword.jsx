import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
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

export default function ForgotPassword() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1); // 1: email, 2: otp + new password
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSendOtp = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await API.post('/auth/forgot-password', { email });
      setSuccess('OTP sent to your email!');
      setStep(2);
    } catch (err) {
      setError(err.response?.data || 'Failed to send OTP.');
    }
    setLoading(false);
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await API.post('/auth/reset-password', { email, otp, newPassword });
      setSuccess('Password reset successfully! Redirecting to login...');
      setTimeout(() => navigate('/login'), 2000);
    } catch (err) {
      setError(err.response?.data || 'Failed to reset password.');
    }
    setLoading(false);
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

      {/* Right — Forgot password form */}
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
            <h1 className="text-2xl font-black text-gray-900 tracking-tight">
              {step === 1 ? 'Forgot Password' : 'Reset Password'}
            </h1>
            <p className="text-gray-400 mt-2 text-sm">
              {step === 1
                ? 'Enter your email to receive a reset OTP'
                : `Enter the OTP sent to ${email}`}
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

          {step === 1 ? (
            <form onSubmit={handleSendOtp} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-gray-400 uppercase tracking-wide block mb-1.5">Email address</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full border border-gray-300 px-4 py-2.5 rounded-xl text-sm text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>
              <button type="submit" disabled={loading}
                className="w-full bg-blue-600 text-white py-2.5 rounded-xl hover:bg-blue-700 transition font-semibold text-sm disabled:opacity-60">
                {loading ? 'Sending OTP...' : 'Send OTP →'}
              </button>
            </form>
          ) : (
            <form onSubmit={handleResetPassword} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-gray-400 uppercase tracking-wide block mb-1.5">OTP</label>
                <input
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  placeholder="Enter 6-digit OTP"
                  maxLength={6}
                  className="w-full border border-gray-300 px-4 py-2.5 rounded-xl text-sm text-center tracking-widest text-lg font-bold text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>
              <div>
                <label className="text-xs font-bold text-gray-400 uppercase tracking-wide block mb-1.5">New Password</label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Min. 6 characters"
                  className="w-full border border-gray-300 px-4 py-2.5 rounded-xl text-sm text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>
              <button type="submit" disabled={loading}
                className="w-full bg-blue-600 text-white py-2.5 rounded-xl hover:bg-blue-700 transition font-semibold text-sm disabled:opacity-60">
                {loading ? 'Resetting...' : 'Reset Password →'}
              </button>
              <button type="button" onClick={() => { setStep(1); setError(''); setSuccess(''); }}
                className="w-full border border-gray-300 text-gray-600 py-2.5 rounded-xl hover:bg-gray-50 transition text-sm font-medium">
                ← Change Email
              </button>
            </form>
          )}

          <p className="text-center text-sm mt-6 text-gray-400">
            Remember your password?{' '}
            <Link to="/login" className="text-blue-600 font-semibold hover:underline">Sign in</Link>
          </p>

          <p className="text-center text-xs text-gray-400 mt-6">
            <Link to="/" className="hover:text-blue-600">← Back to home</Link>
          </p>
        </div>
      </div>
    </div>
  );
}