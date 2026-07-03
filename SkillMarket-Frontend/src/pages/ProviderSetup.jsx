import { useState, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import API from '../api/axios';

export default function ProviderSetup() {
  const navigate = useNavigate();
  const location = useLocation();
  const email = location.state?.email;

  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const debounceRef = useRef(null);

  const handleSearch = (value) => {
    setQuery(value);
    setSelected(null);
    if (value.length < 3) { setSuggestions([]); return; }
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(value)}&format=json&addressdetails=1&limit=8&countrycodes=in`,
          { headers: { 'Accept-Language': 'en' } }
        );
        const data = await res.json();
        setSuggestions(data);
      } catch {
        setSuggestions([]);
      }
      setLoading(false);
    }, 500);
  };

  const handleSelect = (item) => {
    const parts = item.display_name.split(',').slice(0, 4).join(',').trim();
    setSelected({
      address: parts,
      latitude: parseFloat(item.lat),
      longitude: parseFloat(item.lon),
    });
    setQuery(parts);
    setSuggestions([]);
  };

  const handleDetectLocation = () => {
    if (!navigator.geolocation) {
      setError('Geolocation not supported.');
      return;
    }
    setLoading(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json&addressdetails=1`,
            { headers: { 'Accept-Language': 'en' } }
          );
          const data = await res.json();
          const parts = data.display_name.split(',').slice(0, 4).join(',').trim();
          setQuery(parts);
          setSelected({ address: parts, latitude, longitude });
        } catch {
          setError('Could not detect area. Try searching manually.');
        }
        setLoading(false);
      },
      () => {
        setLoading(false);
        setError('Location access denied. Please search manually.');
      }
    );
  };

  const handleSave = async () => {
    if (!selected) { setError('Please select a location first.'); return; }
    setSaving(true);
    setError('');
    try {
      await API.post('/auth/provider-setup', {
        email,
        address: selected.address,
        latitude: selected.latitude,
        longitude: selected.longitude,
      });
      navigate('/login', { state: { message: 'Account setup complete! Please login.' } });
    } catch {
      setError('Failed to save location. Please try again.');
    }
    setSaving(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-slate-50 flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-md">

        <div className="text-center mb-8">
          <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-md">
            <span className="text-white font-bold text-xl">📍</span>
          </div>
          <h1 className="text-2xl font-black text-gray-900 tracking-tight">Set your work location</h1>
          <p className="text-gray-400 mt-2 text-sm">
            Help clients find you. Set the area where you currently offer services.
          </p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm p-8">

          {error && (
            <div className="bg-red-50 border border-red-100 text-red-600 px-4 py-2.5 rounded-xl text-sm font-medium mb-5">
              {error}
            </div>
          )}

          <button
            onClick={handleDetectLocation}
            disabled={loading}
            className="w-full border border-blue-200 text-blue-600 py-2.5 rounded-xl hover:bg-blue-50 transition font-semibold text-sm mb-4 disabled:opacity-60"
          >
            {loading ? '⏳ Detecting...' : '🎯 Use My Current Location'}
          </button>

          <div className="flex items-center gap-3 mb-4">
            <div className="flex-1 h-px bg-gray-200" />
            <span className="text-xs text-gray-400 font-medium">or search manually</span>
            <div className="flex-1 h-px bg-gray-200" />
          </div>

          <div className="relative">
            <input
              value={query}
              onChange={(e) => handleSearch(e.target.value)}
              placeholder="e.g. Kattur, Trichy"
              className="w-full border border-gray-300 px-4 py-2.5 rounded-xl text-sm text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            {loading && (
              <div className="absolute right-3 top-3">
                <div className="w-4 h-4 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
              </div>
            )}
            {suggestions.length > 0 && (
              <div className="absolute z-10 w-full bg-white border border-gray-200 rounded-xl shadow-lg mt-1 overflow-hidden max-h-60 overflow-y-auto">
                {suggestions.map((item, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSelect(item)}
                    className="w-full text-left px-4 py-3 text-sm font-medium text-gray-700 hover:bg-blue-50 hover:text-blue-600 border-b border-gray-100 last:border-0 transition"
                  >
                    <span className="mr-2">📍</span>
                    {item.display_name.split(',').slice(0, 4).join(',')}
                  </button>
                ))}
              </div>
            )}
          </div>

          {selected && (
            <div className="mt-4 bg-green-50 border border-green-100 rounded-xl px-4 py-3 flex items-center gap-3">
              <span className="text-green-500 text-lg">✅</span>
              <div>
                <p className="text-green-700 font-bold text-sm">{selected.address}</p>
                <p className="text-green-500 text-xs mt-0.5">
                  {selected.latitude.toFixed(4)}, {selected.longitude.toFixed(4)}
                </p>
              </div>
            </div>
          )}

          <button
            onClick={handleSave}
            disabled={saving || !selected}
            className="w-full bg-blue-600 text-white py-2.5 rounded-xl hover:bg-blue-700 transition font-semibold text-sm disabled:opacity-50 mt-6"
          >
            {saving ? 'Saving...' : 'Complete Setup →'}
          </button>

          <button
            onClick={() => navigate('/login')}
            className="w-full text-center text-sm font-medium text-gray-400 hover:text-gray-600 mt-3 transition"
          >
            Skip for now (set later in Profile)
          </button>
        </div>
      </div>
    </div>
  );
}