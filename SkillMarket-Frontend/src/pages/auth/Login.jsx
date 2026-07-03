import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
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

export default function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ email: '', password: '' });

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await API.post('/auth/login', form);
      login({ name: res.data.name, email: res.data.email, role: res.data.role }, res.data.token, res.data.refreshToken);
      navigate('/dashboard');
    } catch (err) {
      if (err.response?.data?.message === 'EMAIL_NOT_VERIFIED' || err.response?.data === 'EMAIL_NOT_VERIFIED') {
        navigate('/verify-otp', { state: { email: form.email } });
      } else {
        setError('Invalid email or password. Please try again.');
      }
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

      {/* Right — Login form */}
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
            <h1 className="text-2xl font-black text-gray-900 tracking-tight">Welcome back</h1>
            <p className="text-gray-400 mt-2 text-sm">Sign in to your SkillMarket account</p>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-100 text-red-600 px-4 py-2.5 rounded-xl text-sm font-medium mb-5">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <div className="flex justify-between items-baseline mb-1.5">
                <label className="text-xs font-bold text-gray-400 uppercase tracking-wide">Email</label>
                <Link to="/forgot-password" className="text-xs text-blue-600 hover:underline">Forgot password?</Link>
              </div>
              <input name="email" type="email" onChange={handleChange}
                placeholder="you@example.com"
                className="w-full border border-gray-300 px-4 py-2.5 rounded-xl text-sm text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                required />
            </div>

            <div>
              <label className="text-xs font-bold text-gray-400 uppercase tracking-wide block mb-1.5">Password</label>
              <input name="password" type="password" onChange={handleChange}
                placeholder="Enter your password"
                className="w-full border border-gray-300 px-4 py-2.5 rounded-xl text-sm text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                required />
            </div>

            <button type="submit" disabled={loading}
              className="w-full bg-blue-600 text-white py-2.5 rounded-xl hover:bg-blue-700 transition font-semibold text-sm disabled:opacity-60">
              {loading ? 'Signing in...' : 'Sign In →'}
            </button>
          </form>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200" />
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="bg-white px-3 text-gray-400 font-medium">or continue with</span>
            </div>
          </div>

          <a href={`${import.meta.env.VITE_API_URL.replace("/api", "")}/oauth2/authorization/google`}
            className="w-full flex items-center justify-center gap-3 border border-gray-300 py-2.5 rounded-xl hover:bg-gray-50 transition text-sm font-medium text-gray-700">
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Continue with Google
          </a>

          <p className="text-center text-sm mt-6 text-gray-400">
            Don't have an account?{' '}
            <Link to="/register" className="text-blue-600 font-semibold hover:underline">
              Create one free
            </Link>
          </p>

          <p className="text-center text-xs text-gray-400 mt-6">
            <Link to="/" className="hover:text-blue-600">← Back to home</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
