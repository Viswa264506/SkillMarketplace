import { useEffect, useState, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { searchServices, getByCategory, getAllServices } from '../api/services';
import { getReviews } from '../api/reviews';
import { useLocation2 } from '../context/LocationContext';
import LocationPicker from '../components/LocationPicker';

function haversineDistance(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a = Math.sin(dLat/2)*Math.sin(dLat/2) +
    Math.cos((lat1*Math.PI)/180)*Math.cos((lat2*Math.PI)/180)*
    Math.sin(dLon/2)*Math.sin(dLon/2);
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
}

const CATEGORY_ICONS = { Plumbing:'🔧', Tutoring:'📚', Design:'🎨', Cleaning:'🧹', Electrical:'⚡', Other:'🛠️' };
const CATEGORY_BG = { Plumbing:'bg-blue-50', Tutoring:'bg-purple-50', Design:'bg-yellow-50', Cleaning:'bg-green-50', Electrical:'bg-emerald-50', Other:'bg-gray-100' };
const CATEGORIES = ['Plumbing', 'Tutoring', 'Design', 'Cleaning', 'Electrical', 'Other'];
const GROQ_API_KEY = import.meta.env.VITE_GROQ_API_KEY;

async function nlpExtract(userQuery) {
  try {
    const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${GROQ_API_KEY}` },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        max_tokens: 100,
        messages: [
          { role: 'system', content: `You are a service search assistant. Given a user query, extract the most relevant service category and a short search keyword. Available categories: Plumbing, Tutoring, Design, Cleaning, Electrical, Other. Respond ONLY with a JSON object like: {"category": "Electrical", "keyword": "light repair"}. Never include any explanation or extra text.` },
          { role: 'user', content: userQuery },
        ],
      }),
    });
    const data = await res.json();
    const text = data.choices?.[0]?.message?.content?.trim() || '';
    return JSON.parse(text.replace(/```json|```/g, '').trim());
  } catch { return { category: null, keyword: userQuery }; }
}

function StarRating({ rating = 4 }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1,2,3,4,5].map(s => (
        <svg key={s} className={`w-3.5 h-3.5 ${s <= Math.round(rating) ? 'text-blue-600' : 'text-gray-300'}`}
          fill="currentColor" viewBox="0 0 20 20">
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
        </svg>
      ))}
    </div>
  );
}

export default function SearchResults() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { location: clientLocation } = useLocation2();

  const query = searchParams.get('q') || '';
  const category = searchParams.get('category') || '';

  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [nlpLoading, setNlpLoading] = useState(false);
  const [nlpResult, setNlpResult] = useState(null);
  const [searchInput, setSearchInput] = useState(query);
  const [selectedService, setSelectedService] = useState(null);
  const [serviceReviews, setServiceReviews] = useState({ reviews:[], averageRating:0, totalReviews:0 });
  const [rankMode, setRankMode] = useState('urgent');
  const [showLocationPicker, setShowLocationPicker] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => { fetchResults(); }, [query, category]);

  const fetchResults = async () => {
    setLoading(true); setNlpResult(null);
    try {
      let res;
      if (query) {
        setNlpLoading(true);
        const extracted = await nlpExtract(query);
        setNlpLoading(false);
        setNlpResult(extracted);
        if (extracted.category && extracted.category !== 'Other') {
          res = await getByCategory(extracted.category);
          if (extracted.keyword) {
            const kw = extracted.keyword.toLowerCase();
            const filtered = { data: res.data.filter(s =>
              s.title.toLowerCase().includes(kw) || s.description?.toLowerCase().includes(kw) || s.category.toLowerCase().includes(kw)
            )};
            res = filtered.data.length > 0 ? filtered : res;
          }
        } else {
          res = await searchServices(extracted.keyword || query);
        }
      } else if (category) {
        res = await getByCategory(category);
      } else {
        res = await getAllServices();
      }
      setServices(res.data);
    } catch(e) { console.error(e); }
    setNlpLoading(false);
    setLoading(false);
  };

  const fetchServiceReviews = async (id) => {
    try { const res = await getReviews(id); setServiceReviews(res.data); }
    catch { setServiceReviews({ reviews:[], averageRating:0, totalReviews:0 }); }
  };

  const sortedServices = useMemo(() => {
    const withDist = services.map(s => ({
      ...s,
      distanceKm: clientLocation?.latitude && s.providerLatitude && s.providerLongitude
        ? haversineDistance(clientLocation.latitude, clientLocation.longitude, s.providerLatitude, s.providerLongitude)
        : null,
    }));
    return [...withDist].sort((a,b) => {
      if (rankMode === 'budget') return a.price - b.price;
      if (a.distanceKm===null && b.distanceKm===null) return 0;
      if (a.distanceKm===null) return 1;
      if (b.distanceKm===null) return -1;
      return a.distanceKm - b.distanceKm;
    });
  }, [services, clientLocation, rankMode]);

  const handleSearch = () => {
    const kw = searchInput.trim();
    if (!kw) return;
    setSearchParams({ q: kw });
  };

  const navLinks = [
    { label: 'My Bookings', path: '/my-bookings', roles: ['CLIENT'] },
    { label: 'My Services', path: '/my-services', roles: ['PROVIDER'] },
    { label: 'Bookings', path: '/provider-bookings', roles: ['PROVIDER'] },
  ].filter(l => l.roles.includes(user?.role));

  return (
    <div className="min-h-screen bg-gray-100 text-gray-900">

      {/* Navbar */}
      <nav className="bg-gray-100 sticky top-0 z-50 border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-8 h-16 flex items-center justify-between gap-4">

          {/* Logo */}
          <span
            className="text-xl font-black tracking-tight text-gray-900 cursor-pointer shrink-0"
            onClick={() => navigate('/dashboard')}
          >
            Skill<span className="text-blue-600">Market</span>
          </span>

          {/* Search bar */}
          <div className="flex-1 max-w-lg hidden md:flex items-center gap-2">
            <div className="flex-1 flex items-center bg-white border border-gray-300 rounded-xl px-3 py-2 gap-2">
              <span className="text-gray-400 text-sm">🔍</span>
              <input
                value={searchInput}
                onChange={e => setSearchInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSearch()}
                placeholder="Search services..."
                className="flex-1 bg-transparent text-sm text-gray-700 placeholder-gray-400 outline-none"
              />
              {searchInput && (
                <button onClick={() => setSearchInput('')} className="text-gray-400 text-xs hover:text-gray-600">✕</button>
              )}
            </div>
            <button
              onClick={handleSearch}
              className="bg-blue-600 text-white px-5 py-2 rounded-xl text-sm font-semibold hover:bg-blue-700 transition"
            >
              Search
            </button>
          </div>

          {/* Nav links */}
          <div className="hidden md:flex items-center gap-1 shrink-0">
            {navLinks.map(l => (
              <button
                key={l.path}
                onClick={() => navigate(l.path)}
                className="text-sm text-gray-500 font-medium px-4 py-2 rounded-lg hover:bg-white hover:text-gray-900 transition"
              >
                {l.label}
              </button>
            ))}
            {user?.role === 'CLIENT' && (
              <button
                onClick={() => setShowLocationPicker(true)}
                className="flex items-center gap-1.5 text-sm font-medium px-3 py-2 rounded-lg hover:bg-white transition text-gray-500 hover:text-gray-900 max-w-[160px]"
              >
                <span>📍</span>
                <span className="truncate text-xs">{clientLocation ? clientLocation.address.split(',')[0] : 'Set Location'}</span>
                <span className="text-gray-400 text-xs">▾</span>
              </button>
            )}
          </div>

          {/* Right */}
          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={() => navigate('/profile')}
              className="w-9 h-9 rounded-full overflow-hidden border-2 border-gray-300 hover:border-blue-600 transition"
            >
              {user?.profileImageUrl ? (
                <img src={user.profileImageUrl} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-blue-100 flex items-center justify-center">
                  <span className="text-blue-700 font-bold text-sm">{user?.name?.charAt(0).toUpperCase()}</span>
                </div>
              )}
            </button>
            <button
              onClick={() => { logout(); navigate('/login'); }}
              className="hidden md:block text-sm text-gray-900 font-semibold px-4 py-2 border border-gray-300 rounded-lg hover:border-gray-400 hover:text-red-500 transition"
            >
              Logout
            </button>
            <button
              className="md:hidden p-2 rounded-lg hover:bg-white transition"
              onClick={() => setMenuOpen(!menuOpen)}
            >
              <span className="text-gray-600 text-xl">☰</span>
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {menuOpen && (
          <div className="md:hidden border-t border-gray-200 bg-gray-100 px-8 py-4 flex flex-col gap-2">
            <div className="flex gap-2 mb-2">
              <input
                value={searchInput}
                onChange={e => setSearchInput(e.target.value)}
                onKeyDown={e => { if(e.key==='Enter'){handleSearch();setMenuOpen(false);}}}
                placeholder="Search services..."
                className="flex-1 border border-gray-300 bg-white px-3 py-2 rounded-xl text-sm outline-none"
              />
              <button
                onClick={() => { handleSearch(); setMenuOpen(false); }}
                className="bg-blue-600 text-white px-4 py-2 rounded-xl text-sm font-semibold"
              >
                Go
              </button>
            </div>
            {navLinks.map(l => (
              <button
                key={l.path}
                onClick={() => { navigate(l.path); setMenuOpen(false); }}
                className="text-sm text-gray-700 font-medium py-2 text-left hover:text-blue-600"
              >
                {l.label}
              </button>
            ))}
            <button
              onClick={() => { logout(); navigate('/login'); }}
              className="text-sm text-red-500 font-medium py-2 text-left"
            >
              Logout
            </button>
          </div>
        )}
      </nav>

      {/* Search Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-8 py-8">

          {/* AI badge / result title */}
          {query ? (
            <>
              {nlpLoading ? (
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                  <span className="text-sm text-blue-600 font-medium">Analyzing your search with AI...</span>
                </div>
              ) : nlpResult && (
                <div className="flex items-center gap-2 mb-4">
                  <span className="text-xs bg-blue-100 text-blue-700 px-3 py-1 rounded-full font-bold uppercase tracking-wide">
                    🧠 AI matched: {nlpResult.category}
                  </span>
                  {nlpResult.keyword && nlpResult.keyword !== query && (
                    <span className="text-xs bg-gray-100 text-gray-600 px-3 py-1 rounded-full border border-gray-200">
                      keyword: "{nlpResult.keyword}"
                    </span>
                  )}
                </div>
              )}
              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Search Results</p>
              <h2 className="text-3xl font-black text-gray-900 tracking-tight">
                Results for "<span className="text-blue-600">{query}</span>"
              </h2>
              <p className="text-gray-400 text-sm mt-1">
                {loading ? 'Searching...' : `${sortedServices.length} service${sortedServices.length!==1?'s':''} found${clientLocation ? ' · sorted by distance' : ''}`}
              </p>
            </>
          ) : category ? (
            <>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Category</p>
              <h2 className="text-3xl font-black text-gray-900 tracking-tight">
                {CATEGORY_ICONS[category]||'🛠️'} <span className="text-blue-600">{category}</span>
              </h2>
              <p className="text-gray-400 text-sm mt-1">
                {loading ? 'Loading...' : `${sortedServices.length} service${sortedServices.length!==1?'s':''} found`}
              </p>
            </>
          ) : (
            <>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Browse</p>
              <h2 className="text-3xl font-black text-gray-900 tracking-tight">All Services</h2>
            </>
          )}

          {/* Category pills + rank toggle */}
          <div className="flex flex-wrap items-center justify-between gap-3 mt-6">
            <div className="flex gap-2 flex-wrap">
              <button
                onClick={() => navigate('/dashboard')}
                className="px-4 py-1.5 rounded-full text-sm font-semibold border bg-white border-gray-300 text-gray-600 hover:border-gray-400 hover:text-gray-900 transition"
              >
                ← Dashboard
              </button>
              {CATEGORIES.map(cat => (
                <button
                  key={cat}
                  onClick={() => setSearchParams({ category: cat })}
                  className={`flex items-center gap-1.5 px-4 py-1.5 rounded-full text-sm font-semibold transition border ${
                    category === cat
                      ? 'bg-blue-600 text-white border-blue-600'
                      : 'bg-white border-gray-300 text-gray-600 hover:border-gray-400 hover:text-gray-900'
                  }`}
                >
                  {CATEGORY_ICONS[cat]} {cat}
                </button>
              ))}
            </div>
            {clientLocation && (
              <div className="flex items-center bg-gray-100 border border-gray-200 rounded-xl p-1">
                <button
                  onClick={() => setRankMode('urgent')}
                  className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition ${rankMode==='urgent' ? 'bg-blue-600 text-white' : 'text-gray-500 hover:text-gray-700'}`}
                >
                  🚀 Urgent
                </button>
                <button
                  onClick={() => setRankMode('budget')}
                  className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition ${rankMode==='budget' ? 'bg-blue-600 text-white' : 'text-gray-500 hover:text-gray-700'}`}
                >
                  💰 Budget
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Results grid */}
      <div className="max-w-6xl mx-auto px-8 py-10">

        {/* Service Detail Modal */}
        {selectedService && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4"
            onClick={() => { setSelectedService(null); setServiceReviews({ reviews:[], averageRating:0, totalReviews:0 }); }}
          >
            <div
              className="bg-white rounded-2xl w-full max-w-md shadow-xl overflow-hidden max-h-[90vh] overflow-y-auto"
              onClick={e => e.stopPropagation()}
            >
              {selectedService.imageUrl
                ? <img src={selectedService.imageUrl} alt={selectedService.title} className="w-full h-52 object-cover" />
                : <div className={`w-full h-52 ${CATEGORY_BG[selectedService.category]||'bg-gray-100'} flex items-center justify-center`}>
                    <span className="text-6xl">{CATEGORY_ICONS[selectedService.category]||'🛠️'}</span>
                  </div>
              }
              <div className="p-6 space-y-4">
                <div>
                  <span className="text-xs text-blue-600 font-bold uppercase tracking-wide">{selectedService.category}</span>
                  <h3 className="text-xl font-black text-gray-900 mt-1">{selectedService.title}</h3>
                  {selectedService.distanceKm != null && (
                    <p className="text-xs text-gray-400 mt-0.5">📍 {selectedService.distanceKm.toFixed(1)} km away</p>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <StarRating rating={Math.round(serviceReviews.averageRating)} />
                  <span className="text-blue-600 font-semibold text-sm">{serviceReviews.averageRating?.toFixed(1)}</span>
                  <span className="text-gray-400 text-xs">({serviceReviews.totalReviews} review{serviceReviews.totalReviews!==1?'s':''})</span>
                </div>
                <div className="bg-gray-100 rounded-xl p-4">
                  <p className="text-xs text-gray-400 font-bold uppercase tracking-wide mb-1">About this service</p>
                  <p className="text-gray-600 text-sm leading-relaxed">{selectedService.description||'No description provided.'}</p>
                </div>
                <div className="flex justify-between items-center bg-gray-100 rounded-xl p-4">
                  <div>
                    <p className="text-xs text-gray-400 mb-0.5">Price</p>
                    <p className="text-blue-600 font-black text-xl">₹{selectedService.price?.toLocaleString()}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-gray-400 mb-0.5">Provider</p>
                    <button
                      onClick={() => navigate(`/provider/${selectedService.providerId}`)}
                      className="text-sm text-blue-600 font-semibold hover:underline transition"
                    >
                      {selectedService.providerName} →
                    </button>
                    {selectedService.providerAddress && (
                      <p className="text-xs text-gray-400 mt-0.5">📍 {selectedService.providerAddress.split(',')[0]}</p>
                    )}
                  </div>
                </div>
                {serviceReviews.reviews?.length > 0 && (
                  <div>
                    <p className="text-xs text-gray-400 font-bold uppercase tracking-wide mb-2">Recent Reviews</p>
                    <div className="space-y-2">
                      {serviceReviews.reviews.slice(0,3).map((r,idx) => (
                        <div key={idx} className="bg-gray-100 rounded-xl p-3">
                          <div className="flex justify-between items-center mb-1">
                            <span className="text-sm font-semibold text-gray-700">{r.clientName}</span>
                            <StarRating rating={r.rating} />
                          </div>
                          <p className="text-gray-500 text-xs">{r.comment}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                <div className="flex gap-3 pt-1">
                  <button
                    onClick={() => { setSelectedService(null); setServiceReviews({ reviews:[], averageRating:0, totalReviews:0 }); }}
                    className="flex-1 border border-gray-300 text-gray-600 py-2.5 rounded-xl text-sm font-semibold hover:bg-gray-100 transition"
                  >
                    Close
                  </button>
                  <button
                    onClick={() => navigate(`/book/${selectedService.id}`)}
                    className="flex-1 bg-blue-600 text-white py-2.5 rounded-xl text-sm font-semibold hover:bg-blue-700 transition"
                  >
                    Book Now
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {[1,2,3,4,5,6,7,8].map(i => (
              <div key={i} className="bg-white rounded-2xl h-64 animate-pulse border border-gray-200" />
            ))}
          </div>
        ) : sortedServices.length === 0 ? (
          <div className="text-center py-24">
            <p className="text-5xl mb-4">🔍</p>
            <p className="text-gray-900 font-black text-xl tracking-tight mb-1">No services found</p>
            <p className="text-gray-400 text-sm">Try a different keyword or category</p>
            <button
              onClick={() => navigate('/dashboard')}
              className="mt-6 bg-blue-600 text-white px-7 py-3 rounded-xl text-sm font-semibold hover:bg-blue-700 transition"
            >
              Back to Dashboard
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {sortedServices.map(service => (
              <div
                key={service.id}
                onClick={() => { setSelectedService(service); fetchServiceReviews(service.id); }}
                className="bg-white rounded-2xl overflow-hidden border border-gray-200 shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-200 group cursor-pointer relative"
              >
                <div className={`h-36 ${CATEGORY_BG[service.category]||'bg-gray-100'} flex items-center justify-center relative`}>
                  {service.imageUrl
                    ? <img src={service.imageUrl} alt={service.title} className="w-full h-full object-cover group-hover:scale-105 transition duration-300" />
                    : <span className="text-5xl">{CATEGORY_ICONS[service.category]||'🛠️'}</span>
                  }
                  <div className="absolute bottom-2 right-2 bg-gray-900 text-white text-xs font-bold px-2.5 py-1 rounded-lg">
                    ₹{service.price?.toLocaleString()}
                  </div>
                  {service.distanceKm != null && (
                    <div className="absolute top-2 right-2 bg-white/90 text-blue-600 text-xs px-2 py-0.5 rounded-full font-semibold border border-gray-200">
                      📍 {service.distanceKm.toFixed(1)} km
                    </div>
                  )}
                </div>
                <div className="p-4">
                  <p className="text-xs text-blue-600 font-bold uppercase tracking-wide mb-1">{service.category}</p>
                  <h4 className="font-bold text-gray-900 text-sm mb-2 leading-snug line-clamp-1">{service.title}</h4>
                  <div className="flex items-center gap-1.5 mb-3">
                    <StarRating rating={Math.round(service.averageRating || 0)} />
<span className="text-xs text-gray-400">
  {service.totalReviews > 0 ? `(${service.averageRating?.toFixed(1)})` : '(No reviews yet)'}
</span>
                  </div>
                  {service.providerAddress && (
                    <p className="text-xs text-gray-400 mb-3">📍 {service.providerAddress.split(',').slice(0,2).join(',')}</p>
                  )}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center text-xs font-bold text-blue-600">
                        {service.providerName?.charAt(0).toUpperCase()}
                      </div>
                      <span className="text-xs text-gray-500">{service.providerName}</span>
                    </div>
                    <button
                      onClick={e => { e.stopPropagation(); navigate(`/book/${service.id}`); }}
                      className="text-xs bg-blue-600 text-white px-3 py-1.5 rounded-lg hover:bg-blue-700 transition font-semibold"
                    >
                      Book Now
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      <footer className="bg-gray-100 border-t border-gray-200 py-12 px-8 mt-4">
        <div className="max-w-6xl mx-auto grid grid-cols-2 sm:grid-cols-4 gap-10 mb-8">
         <a href="/dashboard"> <div>
            <h3 className="text-lg font-black text-gray-900 mb-2">Skill<span className="text-blue-600">Market</span></h3>
            <p className="text-xs text-gray-400 leading-relaxed">2026 © SkillMarket<br />All rights reserved.</p>
          </div>
          </a>
          <div>
            <h4 className="text-xs font-bold text-gray-900 uppercase tracking-widest mb-4">Pages</h4>
            <ul className="space-y-2">
              {[{label:'Dashboard',path:'/dashboard'},{label:'Profile',path:'/profile'},{label:'Bookings',path:'/my-bookings'}].map(l => (
                <li key={l.path}>
                  <button onClick={() => navigate(l.path)} className="text-sm text-gray-500 hover:text-gray-900 transition">{l.label}</button>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h4 className="text-xs font-bold text-gray-900 uppercase tracking-widest mb-4">Categories</h4>
            <ul className="space-y-2">
              {['Plumbing', 'Electrical', 'Cleaning', 'Tutoring', 'Design'].map(cat => (
                <li key={cat}>
                  <button onClick={() => setSearchParams({ category: cat })} className="text-sm text-gray-500 hover:text-gray-900 transition">{cat}</button>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h4 className="text-xs font-bold text-gray-900 uppercase tracking-widest mb-4">Legal</h4>
            <ul className="space-y-2">
              {['Privacy Policy', 'Terms of Service'].map(l => (
                <li key={l}><button className="text-sm text-gray-500 hover:text-gray-900 transition">{l}</button></li>
              ))}
            </ul>
          </div>
        </div>
        <div className="border-t border-gray-200 pt-6 text-center">
          <p className="text-xs text-gray-400">Built with Spring Boot + React + Tailwind CSS</p>
        </div>
      </footer>

      {showLocationPicker && <LocationPicker onClose={() => setShowLocationPicker(false)} />}
    </div>
  );
}