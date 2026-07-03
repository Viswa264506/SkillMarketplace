import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getProfile, updateProfile } from '../api/profile';
import { uploadImage } from '../api/upload';
import API from '../api/axios';

async function reverseGeocode(lat, lng) {
  try {
    const res = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`, { headers: { 'Accept-Language': 'en' } });
    const data = await res.json();
    const a = data.address || {};
    const parts = [a.suburb || a.neighbourhood || a.village || a.county, a.city || a.town || a.district, a.state].filter(Boolean);
    return parts.slice(0, 2).join(', ') || data.display_name?.split(',')[0] || `${lat}, ${lng}`;
  } catch { return `${lat}, ${lng}`; }
}

async function searchPlaces(query) {
  if (!query.trim()) return [];
  try {
    const res = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=5&countrycodes=in`, { headers: { 'Accept-Language': 'en' } });
    return await res.json();
  } catch { return []; }
}

export default function Profile() {
  const { user, logout, setUser } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', phoneNumber: '', profileImageUrl: '' });
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [verifyForm, setVerifyForm] = useState({ aadhaarNumber: '', panNumber: '' });
  const [verifySuccess, setVerifySuccess] = useState('');
  const [verifyError, setVerifyError] = useState('');
  const [verifyLoading, setVerifyLoading] = useState(false);
  const [locationStatus, setLocationStatus] = useState('');
  const [locationLoading, setLocationLoading] = useState(false);
  const [savedLocation, setSavedLocation] = useState(null);
  const [locationSearch, setLocationSearch] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const searchTimeout = useRef(null);
  const [showImageModal, setShowImageModal] = useState(false);

  useEffect(() => {
    getProfile().then(async res => {
      setForm({ name: res.data.name || '', phoneNumber: res.data.phoneNumber || '', profileImageUrl: res.data.profileImageUrl || '' });
      if (res.data.latitude && res.data.longitude) {
        const areaName = await reverseGeocode(res.data.latitude, res.data.longitude);
        setSavedLocation({ lat: res.data.latitude, lng: res.data.longitude, areaName });
      }
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    try {
      let profileImageUrl = form.profileImageUrl;
      if (imageFile) {
        setUploading(true);
        profileImageUrl = await uploadImage(imageFile);
        setUploading(false);
      }
      await updateProfile({ ...form, profileImageUrl });
      setForm(f => ({ ...f, profileImageUrl }));
      setImageFile(null);
      setImagePreview(null);

      const updatedUser = { ...user, name: form.name, profileImageUrl };
      localStorage.setItem('user', JSON.stringify(updatedUser));
      setUser(updatedUser);

      setSuccess('Profile updated successfully!');
    } catch {
      setUploading(false);
      setError('Failed to update profile.');
    }
  };

  const handleVerificationSubmit = async (e) => {
    e.preventDefault(); setVerifyError(''); setVerifySuccess(''); setVerifyLoading(true);
    try { const res = await API.put('/auth/verification-details', verifyForm); setVerifySuccess(res.data); }
    catch { setVerifyError('Failed to submit verification details.'); }
    setVerifyLoading(false);
  };

  const saveLocation = async (lat, lng) => {
    setLocationLoading(true); setLocationStatus('');
    try {
      await updateProfile({ ...form, latitude: lat, longitude: lng });
      const areaName = await reverseGeocode(lat, lng);
      setSavedLocation({ lat, lng, areaName });
      setLocationStatus('success');
      setSuggestions([]); setLocationSearch('');
    } catch { setLocationStatus('error'); }
    setLocationLoading(false);
  };

  const handleDetectLocation = () => {
    if (!navigator.geolocation) { setLocationStatus('error'); return; }
    setLocationLoading(true); setLocationStatus('detecting');
    navigator.geolocation.getCurrentPosition(
      pos => saveLocation(parseFloat(pos.coords.latitude.toFixed(6)), parseFloat(pos.coords.longitude.toFixed(6))),
      () => { setLocationLoading(false); setLocationStatus('denied'); },
      { enableHighAccuracy: true }
    );
  };

  const handleLocationSearchChange = (e) => {
    const q = e.target.value; setLocationSearch(q); setSuggestions([]);
    if (searchTimeout.current) clearTimeout(searchTimeout.current);
    if (!q.trim()) return;
    setSearchLoading(true);
    searchTimeout.current = setTimeout(async () => {
      const results = await searchPlaces(q);
      setSuggestions(results); setSearchLoading(false);
    }, 500);
  };

  return (
    <div className="min-h-screen bg-gray-100">

      {/* Navbar */}
      <nav className="bg-gray-100 border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-8 py-4 flex items-center justify-between">
          <span className="text-xl font-black tracking-tight text-gray-900 cursor-pointer"
            onClick={() => navigate('/dashboard')}>
            Skill<span className="text-blue-600">Market</span>
          </span>
          <div className="flex items-center gap-3">
            <button onClick={() => navigate('/dashboard')}
              className="text-sm text-gray-600 font-medium hover:text-gray-900 transition bg-white border border-gray-300 px-4 py-2 rounded-lg">
              Dashboard
            </button>
            <button onClick={() => { logout(); navigate('/login'); }}
              className="text-sm text-red-600 font-medium hover:text-red-700 transition bg-white border border-gray-300 px-4 py-2 rounded-lg">
              Logout
            </button>
          </div>
        </div>
      </nav>

      <div className="max-w-5xl mx-auto px-8 py-10 space-y-8">

        {/* Page header */}
        <div>
          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Account</p>
          <h1 className="text-2xl font-black text-gray-900 tracking-tight">My Profile</h1>
          <p className="text-gray-400 text-sm mt-2">Manage your account information and settings</p>
        </div>

        {/* Avatar + info */}
        <div className="bg-white rounded-2xl shadow-sm p-8 flex items-center gap-6">
          <div className="relative shrink-0">
            {imagePreview ? (
              <img src={imagePreview} alt="Preview"
                className="w-24 h-24 rounded-2xl object-cover shadow-md cursor-pointer hover:opacity-90 transition"
                onClick={() => setShowImageModal(true)} />
            ) : form.profileImageUrl ? (
              <img src={form.profileImageUrl} alt="Profile"
                className="w-24 h-24 rounded-2xl object-cover shadow-md cursor-pointer hover:opacity-90 transition"
                onClick={() => setShowImageModal(true)} />
            ) : (
              <div className="w-24 h-24 rounded-2xl bg-blue-100 flex items-center justify-center shadow-md">
                <span className="text-3xl text-blue-600 font-black">{user?.name?.charAt(0).toUpperCase()}</span>
              </div>
            )}
            <label htmlFor="avatarUpload"
              className="absolute -bottom-2 -right-2 w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center cursor-pointer hover:bg-blue-700 transition shadow-md">
              <span className="text-white text-xs">📷</span>
            </label>
            <input type="file" accept="image/*" onChange={e => { const f = e.target.files[0]; if (f) { setImageFile(f); setImagePreview(URL.createObjectURL(f)); } }}
              className="hidden" id="avatarUpload" />
          </div>
          <div>
            <h2 className="text-xl font-black text-gray-900 tracking-tight">{user?.name}</h2>
            <p className="text-gray-400 text-sm mt-0.5">{user?.email}</p>
            <span className="inline-block mt-2 text-xs bg-blue-50 text-blue-700 px-3 py-1 rounded-full font-bold uppercase tracking-wide">
              {user?.role}
            </span>
          </div>
        </div>

        {/* Image Lightbox Modal */}
        {showImageModal && (imagePreview || form.profileImageUrl) && (
          <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center px-4"
            onClick={() => setShowImageModal(false)}>
            <div className="relative max-w-lg w-full" onClick={e => e.stopPropagation()}>
              <img
                src={imagePreview || form.profileImageUrl}
                alt="Profile"
                className="w-full rounded-2xl shadow-2xl object-contain max-h-[80vh]"
              />
              <button onClick={() => setShowImageModal(false)}
                className="absolute top-3 right-3 w-8 h-8 bg-black/50 rounded-full flex items-center justify-center text-white hover:bg-black/70 transition text-sm">
                ✕
              </button>
            </div>
          </div>
        )}

        {/* Edit Profile */}
        <div className="bg-white rounded-2xl shadow-sm p-8">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Settings</p>
          <h2 className="text-lg font-black text-gray-900 tracking-tight mb-6">Edit Profile</h2>

          {success && <div className="bg-green-50 border border-green-100 text-green-700 text-sm font-medium px-4 py-2.5 rounded-xl mb-4">{success}</div>}
          {error && <div className="bg-red-50 border border-red-100 text-red-600 text-sm font-medium px-4 py-2.5 rounded-xl mb-4">{error}</div>}

          {loading ? (
            <div className="space-y-3">{[1, 2, 3].map(i => <div key={i} className="h-11 bg-gray-100 rounded-xl animate-pulse" />)}</div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-gray-400 uppercase tracking-wide block mb-1.5">Full Name</label>
                <input name="name" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })}
                  placeholder="Your full name"
                  className="w-full border border-gray-300 px-4 py-2.5 rounded-xl text-sm text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
              </div>
              <div>
                <label className="text-xs font-bold text-gray-400 uppercase tracking-wide block mb-1.5">Email</label>
                <input value={user?.email} disabled
                  className="w-full border border-gray-200 px-4 py-2.5 rounded-xl bg-gray-50 text-gray-400 cursor-not-allowed text-sm" />
              </div>
              <div>
                <label className="text-xs font-bold text-gray-400 uppercase tracking-wide block mb-1.5">Phone Number</label>
                <input name="phoneNumber" value={form.phoneNumber} onChange={e => setForm({ ...form, phoneNumber: e.target.value })}
                  placeholder="Your phone number"
                  className="w-full border border-gray-300 px-4 py-2.5 rounded-xl text-sm text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
              </div>
              {imageFile && <p className="text-xs text-blue-600 font-medium">📎 {imageFile.name} ready to upload</p>}
              <button type="submit" disabled={uploading}
                className="w-full bg-blue-600 text-white py-2.5 rounded-xl hover:bg-blue-700 font-semibold text-sm disabled:opacity-50 transition">
                {uploading ? 'Uploading photo...' : 'Save Changes'}
              </button>
            </form>
          )}
        </div>

        {/* Provider Verification */}
        {user?.role === 'PROVIDER' && (
          <div className="bg-white rounded-2xl shadow-sm p-8">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Trust &amp; safety</p>
            <h2 className="text-lg font-black text-gray-900 tracking-tight mb-1">Provider Verification</h2>
            <p className="text-sm text-gray-400 mb-6">Submit your Aadhaar or PAN for admin verification. Verified providers get a trust badge.</p>

            {verifySuccess && <div className="bg-green-50 border border-green-100 text-green-700 text-sm font-medium px-4 py-2.5 rounded-xl mb-4">{verifySuccess}</div>}
            {verifyError && <div className="bg-red-50 border border-red-100 text-red-600 text-sm font-medium px-4 py-2.5 rounded-xl mb-4">{verifyError}</div>}

            <form onSubmit={handleVerificationSubmit} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-gray-400 uppercase tracking-wide block mb-1.5">Aadhaar Number</label>
                <input value={verifyForm.aadhaarNumber}
                  onChange={e => setVerifyForm({ ...verifyForm, aadhaarNumber: e.target.value })}
                  placeholder="12-digit Aadhaar number" maxLength={12}
                  className="w-full border border-gray-300 px-4 py-2.5 rounded-xl text-sm text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
              </div>
              <div>
                <label className="text-xs font-bold text-gray-400 uppercase tracking-wide block mb-1.5">PAN Number</label>
                <input value={verifyForm.panNumber}
                  onChange={e => setVerifyForm({ ...verifyForm, panNumber: e.target.value.toUpperCase() })}
                  placeholder="e.g. ABCDE1234F" maxLength={10}
                  className="w-full border border-gray-300 px-4 py-2.5 rounded-xl text-sm text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
              </div>
              <button type="submit" disabled={verifyLoading}
                className="w-full bg-green-600 text-white py-2.5 rounded-xl hover:bg-green-700 font-semibold text-sm disabled:opacity-50 transition">
                {verifyLoading ? 'Submitting...' : 'Submit for Verification'}
              </button>
            </form>
          </div>
        )}

        {/* Location (PROVIDER only) */}
        {user?.role === 'PROVIDER' && (
          <div className="bg-white rounded-2xl shadow-sm p-8">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Visibility</p>
            <h2 className="text-lg font-black text-gray-900 tracking-tight mb-1">📍 My Service Location</h2>
            <p className="text-sm text-gray-400 mb-6">Set your location so clients can find you nearby.</p>

            {/* Saved location */}
            {savedLocation && (
              <div className="flex items-center gap-3 mb-4 bg-blue-50 border border-blue-100 rounded-xl px-4 py-3">
                <div className="w-9 h-9 bg-blue-100 rounded-xl flex items-center justify-center text-lg shrink-0">📍</div>
                <div>
                  <p className="text-blue-700 text-sm font-bold">{savedLocation.areaName}</p>
                  <p className="text-blue-400 text-xs">{savedLocation.lat.toFixed(4)}, {savedLocation.lng.toFixed(4)}</p>
                </div>
              </div>
            )}

            {locationStatus === 'success' && (
              <div className="bg-green-50 border border-green-100 text-green-700 text-sm font-medium px-4 py-2.5 rounded-xl mb-4">✅ Location saved successfully!</div>
            )}
            {locationStatus === 'error' && (
              <div className="bg-red-50 border border-red-100 text-red-600 text-sm font-medium px-4 py-2.5 rounded-xl mb-4">❌ Failed to save location.</div>
            )}
            {locationStatus === 'denied' && (
              <div className="bg-amber-50 border border-amber-100 text-amber-700 text-sm font-medium px-4 py-2.5 rounded-xl mb-4">⚠️ Location access denied. Search your area below.</div>
            )}

            <button onClick={handleDetectLocation} disabled={locationLoading}
              className="w-full border border-blue-200 text-blue-600 py-2.5 rounded-xl hover:bg-blue-50 transition font-semibold text-sm disabled:opacity-50 mb-4 flex items-center justify-center gap-2">
              {locationLoading && locationStatus === 'detecting'
                ? <><span className="w-4 h-4 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />Detecting...</>
                : <><span>🎯</span>Use My Current Location</>
              }
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="flex-1 h-px bg-gray-200" />
              <span className="text-xs text-gray-400 font-medium">or search your area</span>
              <div className="flex-1 h-px bg-gray-200" />
            </div>

            <div className="relative">
              <div className="flex items-center gap-2 border border-gray-300 rounded-xl px-3 py-2.5 focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-transparent">
                <span className="text-gray-400">🔍</span>
                <input value={locationSearch} onChange={handleLocationSearchChange}
                  placeholder="Search area, city, street..."
                  className="flex-1 text-sm text-gray-700 placeholder-gray-400 outline-none bg-transparent" />
                {searchLoading && <span className="text-xs text-blue-500 animate-pulse">searching...</span>}
                {locationSearch && !searchLoading && (
                  <button onClick={() => { setLocationSearch(''); setSuggestions([]); }} className="text-gray-400 hover:text-gray-600 text-xs">✕</button>
                )}
              </div>
              {suggestions.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-lg z-20 overflow-hidden">
                  {suggestions.map((place, i) => (
                    <button key={i}
                      onClick={() => saveLocation(parseFloat(place.lat), parseFloat(place.lon))}
                      className="w-full text-left px-4 py-3 hover:bg-blue-50 border-b border-gray-100 last:border-0 transition">
                      <p className="text-sm font-semibold text-gray-800 truncate">{place.display_name.split(',')[0]}</p>
                      <p className="text-xs text-gray-400 truncate mt-0.5">{place.display_name.split(',').slice(1, 3).join(',')}</p>
                    </button>
                  ))}
                </div>
              )}
            </div>
            <p className="text-xs text-gray-400 mt-4 text-center">💡 Your location helps clients find you in the nearby services feed</p>
          </div>
        )}
      </div>
    </div>
  );
}