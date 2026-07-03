import { useState, useRef } from 'react';
import { useLocation2 } from '../context/LocationContext';

export default function LocationPicker({ onClose }) {
  const { saveLocation } = useLocation2();
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const debounceRef = useRef(null);

  const handleSearch = (value) => {
    setQuery(value);
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
    saveLocation({
      address: parts,
      latitude: parseFloat(item.lat),
      longitude: parseFloat(item.lon),
    });
    onClose();
  };

  const handleDetect = () => {
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
          saveLocation({ address: parts, latitude, longitude });
          onClose();
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

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4 bg-black/40 backdrop-blur-sm"
      onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6"
        onClick={(e) => e.stopPropagation()}>

        {/* Header */}
        <div className="flex justify-between items-center mb-5">
          <h3 className="text-lg font-black text-gray-900 tracking-tight">📍 Set your location</h3>
          <button onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition">
            ✕
          </button>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-100 text-red-600 text-sm font-medium px-4 py-2.5 rounded-xl mb-4">
            {error}
          </div>
        )}

        {/* Auto detect */}
        <button
          onClick={handleDetect}
          disabled={loading}
          className="w-full border border-blue-200 text-blue-600 py-2.5 rounded-xl hover:bg-blue-50 transition font-semibold text-sm mb-4 disabled:opacity-60"
        >
          {loading ? '⏳ Detecting...' : '🎯 Use My Current Location'}
        </button>

        {/* Divider */}
        <div className="flex items-center gap-3 mb-4">
          <div className="flex-1 h-px bg-gray-200" />
          <span className="text-xs text-gray-400 font-medium">or search</span>
          <div className="flex-1 h-px bg-gray-200" />
        </div>

        {/* Search */}
        <div className="relative">
          <input
            value={query}
            onChange={(e) => handleSearch(e.target.value)}
            placeholder="Search area e.g. Kattur, Trichy"
            className="w-full border border-gray-300 px-4 py-2.5 rounded-xl text-sm text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            autoFocus
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
      </div>
    </div>
  );
}