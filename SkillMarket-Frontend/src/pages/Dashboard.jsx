import { useEffect, useState, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getClientStats, getProviderStats } from '../api/stats';
import { getAllServices } from '../api/services';
import { getReviews } from '../api/reviews';
import { getRecommendations } from '../api/services';
import { useLocation2 } from '../context/LocationContext';
import LocationPicker from '../components/LocationPicker';
import NotificationBell from '../components/NotificationBell';

function haversineDistance(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a = Math.sin(dLat/2)*Math.sin(dLat/2) +
    Math.cos((lat1*Math.PI)/180)*Math.cos((lat2*Math.PI)/180)*
    Math.sin(dLon/2)*Math.sin(dLon/2);
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
}

const DISTANCE_BANDS = [
  { label: '📍 Under 5 km', key: 'under5', min: 0, max: 5 },
  { label: '🛵 5 – 20 km', key: '5to20', min: 5, max: 20 },
  { label: '🚗 20 – 50 km', key: '20to50', min: 20, max: 50 },
  { label: '🌍 50+ km', key: '50plus', min: 50, max: 150 },
];

const CATEGORY_ICONS = {
  Plumbing: '🔧', Tutoring: '📚', Design: '🎨',
  Cleaning: '🧹', Electrical: '⚡', PestControl: '🐛', Painting: '🖌️', Patchwork: '🔨', ACService: '❄️', Gardening: '🌿', Bathroom: '🚿',
};

const CATEGORY_BG = {
  Plumbing: 'bg-blue-50', Tutoring: 'bg-purple-50', Design: 'bg-yellow-50',
  Cleaning: 'bg-green-50', Electrical: 'bg-emerald-50', PestControl: 'bg-amber-50', Painting: 'bg-pink-50', Patchwork: 'bg-cyan-50', ACService: 'bg-blue-50', Gardening: 'bg-green-50', Bathroom: 'bg-blue-50',
};

const SERVICE_CATS = [
  { icon: '🔧', name: 'Plumbing', cat: 'Plumbing' },
  { icon: '⚡', name: 'Electrical', cat: 'Electrical' },
  { icon: '🧹', name: 'Cleaning', cat: 'Cleaning' },
  { icon: '📚', name: 'Tutoring', cat: 'Tutoring' },
  { icon: '🎨', name: 'Design', cat: 'Design' },
  { icon: '🐛', name: 'Pest Control', cat: 'Pest Control' },
  { icon: '🖌️', name: 'Painting', cat: 'Painting' },
  { icon: '🔨', name: 'Patchwork', cat: 'Patchwork' },
  { icon: '❄️', name: 'AC Service', cat: 'AC Service' },
  { icon: '🌿', name: 'Gardening', cat: 'Gardening' },
  { icon: '🚿', name: 'Bathroom', cat: 'Bathroom' },
  { icon: '🛠️', name: 'Other', cat: 'Other' },
];

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

export default function Dashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { location: clientLocation } = useLocation2();

  const [stats, setStats] = useState(null);
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [menuOpen, setMenuOpen] = useState(false);
  const [selectedService, setSelectedService] = useState(null);
  const [serviceReviews, setServiceReviews] = useState({ reviews: [], averageRating: 0, totalReviews: 0 });
  const [recommendations, setRecommendations] = useState([]);
  const [showLocationPicker, setShowLocationPicker] = useState(false);
  const [rankMode, setRankMode] = useState('urgent');
  const [searchInput, setSearchInput] = useState('');

  useEffect(() => { fetchStats(); fetchRecommendations(); fetchAll(); }, []);

  const fetchStats = async () => {
    try {
      const res = user?.role === 'CLIENT' ? await getClientStats() : await getProviderStats();
      setStats(res.data);
    } catch(e) {}
  };

  const fetchAll = async () => {
    setLoading(true);
    try { const res = await getAllServices(); setServices(res.data); } catch(e) {}
    setLoading(false);
  };

  const fetchRecommendations = async () => {
    if (user?.role !== 'CLIENT') return;
    try { const res = await getRecommendations(); setRecommendations(res.data); } catch(e) {}
  };

  const fetchServiceReviews = async (id) => {
    try { const res = await getReviews(id); setServiceReviews(res.data); }
    catch { setServiceReviews({ reviews: [], averageRating: 0, totalReviews: 0 }); }
  };

  const handleSearch = () => {
    const kw = searchInput.trim();
    if (!kw) return;
    navigate(`/search?q=${encodeURIComponent(kw)}`);
  };

  const handleCategory = (cat) => navigate(`/search?category=${encodeURIComponent(cat)}`);

  const servicesWithDistance = useMemo(() => {
    if (!clientLocation?.latitude || !clientLocation?.longitude)
      return services.map(s => ({ ...s, distanceKm: null }));
    return services.map(s => ({
      ...s,
      distanceKm: s.providerLatitude && s.providerLongitude
        ? haversineDistance(clientLocation.latitude, clientLocation.longitude, s.providerLatitude, s.providerLongitude)
        : null,
    }));
  }, [services, clientLocation]);

  const bandedServices = useMemo(() => {
    if (!clientLocation?.latitude) return null;
    const withDist = servicesWithDistance.filter(s => s.distanceKm !== null);
    const noLocation = servicesWithDistance.filter(s => s.distanceKm === null);
    const sorted = arr => rankMode === 'urgent'
      ? [...arr].sort((a,b) => a.distanceKm - b.distanceKm)
      : [...arr].sort((a,b) => a.price - b.price);
    const bands = DISTANCE_BANDS.map(band => ({
      ...band,
      services: sorted(withDist.filter(s => s.distanceKm >= band.min && s.distanceKm < band.max)),
    })).filter(b => b.services.length > 0);
    return { bands, noLocation };
  }, [servicesWithDistance, clientLocation, rankMode]);

  const clientCards = [
    { label: 'Total Bookings', key: 'totalBookings', icon: '📋' },
    { label: 'Pending', key: 'pending', icon: '⏳' },
    { label: 'Accepted', key: 'accepted', icon: '✅' },
    { label: 'Completed', key: 'completed', icon: '🎉' },
  ];
  const providerCards = [
    { label: 'My Services', key: 'totalServices', icon: '🛠️' },
    { label: 'Total Bookings', key: 'totalBookings', icon: '📅' },
    { label: 'Pending', key: 'pending', icon: '⏳' },
    { label: 'Completed', key: 'completed', icon: '🎉' },
  ];
  const cards = user?.role === 'CLIENT' ? clientCards : providerCards;

  const navLinks = [
    { label: 'My Bookings', path: '/my-bookings', roles: ['CLIENT'] },
    { label: 'My Services', path: '/my-services', roles: ['PROVIDER'] },
    { label: 'Bookings', path: '/provider-bookings', roles: ['PROVIDER'] },
    { label: 'Admin Panel', path: '/admin', roles: ['ADMIN'] },
  ].filter(l => l.roles.includes(user?.role));

  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning';
    if (h < 17) return 'Good afternoon';
    return 'Good evening';
  };

  const ServiceCard = ({ service, badge }) => (
    <div
      onClick={() => navigate(`/service/${service.id}`)}
      className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-200 group cursor-pointer relative border border-gray-200"
    >
      {badge && (
        <div className="absolute top-2 left-2 z-10">
          <span className="bg-blue-600 text-white text-xs px-2 py-0.5 rounded-full font-semibold">{badge}</span>
        </div>
      )}
      <div className={`h-36 ${CATEGORY_BG[service.category] || 'bg-gray-100'} flex items-center justify-center relative`}>
        {service.imageUrl
          ? <img src={service.imageUrl} alt={service.title} className="w-full h-full object-cover group-hover:scale-105 transition duration-300" />
          : <span className="text-5xl">{CATEGORY_ICONS[service.category] || '🛠️'}</span>
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
            <button
              onClick={e => { e.stopPropagation(); navigate(`/provider/${service.providerId}`); }}
              className="text-xs text-gray-500 hover:text-blue-600 hover:underline transition"
            >
              {service.providerName}
            </button>
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
  );

  return (
    <div className="min-h-screen bg-gray-100 text-gray-900">

      {/* Navbar */}
      <nav className="bg-gray-100 sticky top-0 z-50 border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-8 h-16 flex items-center justify-between gap-4">

          {/* Logo */}
          <a href="/dashboard">
            <span
              className="text-xl font-black tracking-tight text-gray-900 cursor-pointer shrink-0"
            >
              Skill<span className="text-blue-600">Market</span>
            </span>
          </a>

          {/* Search — CLIENT only */}
          {(user?.role === 'CLIENT' || user?.role === 'PROVIDER') && (
            <div className="flex-1 max-w-md hidden md:flex items-center gap-2">
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
          )}

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
            {(user?.role === 'CLIENT' || user?.role === 'PROVIDER') && (
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

          {/* Right actions */}
          <div className="flex items-center gap-3 shrink-0">
            {(user?.role === 'CLIENT' || user?.role === 'PROVIDER') && <NotificationBell />}
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
            {(user?.role === 'CLIENT' || user?.role === 'PROVIDER') && (
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
            )}
            {navLinks.map(l => (
              <button
                key={l.path}
                onClick={() => { navigate(l.path); setMenuOpen(false); }}
                className="text-sm text-gray-700 font-medium py-2 text-left hover:text-blue-600"
              >
                {l.label}
              </button>
            ))}
            {user?.role === 'CLIENT' && (
              <button
                onClick={() => { setShowLocationPicker(true); setMenuOpen(false); }}
                className="text-sm text-blue-600 font-medium py-2 text-left"
              >
                📍 {clientLocation ? clientLocation.address.split(',')[0] : 'Set Location'}
              </button>
            )}
            <button
              onClick={() => { logout(); navigate('/login'); }}
              className="text-sm text-red-500 font-medium py-2 text-left"
            >
              Logout
            </button>
          </div>
        )}
      </nav>

      {/* Hero / Greeting Banner */}
      <section className="border-b border-gray-200 bg-gray-100">
        <div className="max-w-6xl mx-auto px-8 py-12 flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="flex-1">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">— {user?.role}</p>
            <h2 className="text-4xl font-black text-gray-900 leading-tight tracking-tight mb-3">
              {greeting()}, <span className="text-blue-600">{user?.name}!</span>
            </h2>
            <p className="text-gray-500 text-sm mb-6">
              {user?.role === 'CLIENT'
                ? 'Find and book local skills around you.'
                : 'Manage your services and incoming bookings.'}
            </p>
            {user?.role === 'CLIENT' && (
              <button
                onClick={() => setShowLocationPicker(true)}
                className="inline-flex items-center gap-2 bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-xl text-sm font-medium hover:border-gray-400 transition"
              >
                📍 {clientLocation ? clientLocation.address.split(',')[0] : 'Set your location'}
                <span className="text-gray-400 text-xs">▾</span>
              </button>
            )}
            {user?.role === 'PROVIDER' && (
              <button
                onClick={() => navigate('/my-services')}
                className="bg-blue-600 text-white px-6 py-2.5 rounded-xl font-semibold hover:bg-blue-700 transition text-sm"
              >
                + Add New Service
              </button>
            )}
          </div>

          {/* Stats grid */}
          <div className="grid grid-cols-2 gap-3 shrink-0">
            {stats ? cards.map(card => (
              <div key={card.key} className="bg-white border border-gray-200 rounded-2xl px-6 py-4 text-center min-w-[120px] shadow-sm">
                <p className="text-2xl mb-1">{card.icon}</p>
                <p className="text-2xl font-black text-blue-600">{stats[card.key] ?? 0}</p>
                <p className="text-gray-400 text-xs mt-0.5">{card.label}</p>
              </div>
            )) : [1,2,3,4].map(i => (
              <div key={i} className="bg-white rounded-2xl h-24 animate-pulse min-w-[120px]" />
            ))}
          </div>
        </div>
      </section>

      {/* Category Icon Grid */}
      <div className="bg-white border-b border-gray-200 py-6 px-8">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-6 sm:grid-cols-12 gap-4">
            {SERVICE_CATS.map(cat => (
              <button
                key={cat.name}
                onClick={() => handleCategory(cat.cat)}
                className="flex flex-col items-center gap-2 group"
              >
                <div className="w-12 h-12 bg-gray-100 rounded-2xl flex items-center justify-center text-2xl group-hover:bg-blue-600 group-hover:scale-110 transition-all duration-200 border border-gray-200">
                  {cat.icon}
                </div>
                <span className="text-xs font-semibold text-gray-500 group-hover:text-blue-600 text-center leading-tight hidden sm:block">
                  {cat.name}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="max-w-6xl mx-auto px-8 py-12">

        {/* Recommendations */}
        {(user?.role === 'CLIENT' || user?.role === 'PROVIDER') && recommendations.length > 0 && (
          <div className="mb-12">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">For You</p>
            <h3 className="text-2xl font-black text-gray-900 tracking-tight mb-1">
              ✨ Recommended <span className="text-blue-600">for You</span>
            </h3>
            <p className="text-gray-400 text-sm mb-6">Based on your booking history.</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {recommendations.map(service => (
                <ServiceCard key={service.id} service={service} badge="✨ For You" />
              ))}
            </div>
          </div>
        )}

        {/* Rank toggle + section title */}
        {user?.role === 'CLIENT' && (
          <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
            <div>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Live Listings</p>
              <h3 className="text-2xl font-black text-gray-900 tracking-tight">
                {clientLocation ? '🗺️ Services Near You' : 'All Services'}
              </h3>
              {clientLocation && <p className="text-xs text-gray-400 mt-0.5">{clientLocation.address?.split(',')[0]}</p>}
            </div>
            {clientLocation?.latitude && (
              <div className="flex items-center bg-white border border-gray-300 rounded-xl p-1">
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
        )}

        {/* No location hint */}
        {user?.role === 'CLIENT' || user?.role === 'PROVIDER' && !clientLocation && (
          <div className="bg-white border border-gray-200 rounded-2xl p-5 mb-8 flex items-center justify-between shadow-sm">
            <div>
              <p className="text-sm font-bold text-gray-900">📍 Set your location</p>
              <p className="text-xs text-gray-400 mt-0.5">See services sorted by distance from you</p>
            </div>
            <button
              onClick={() => setShowLocationPicker(true)}
              className="bg-blue-600 text-white px-5 py-2 rounded-xl text-sm font-semibold hover:bg-blue-700 transition"
            >
              Set Location
            </button>
          </div>
        )}

        {/* Services grid */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {[1,2,3,4,5,6,7,8].map(i => (
              <div key={i} className="bg-white rounded-2xl h-64 animate-pulse border border-gray-200" />
            ))}
          </div>
        ) : bandedServices ? (
          <div className="space-y-10">
            {bandedServices.bands.map(band => (
              <div key={band.key}>
                <div className="flex items-center gap-3 mb-5">
                  <h4 className="text-sm font-bold text-gray-700">{band.label}</h4>
                  <div className="flex-1 h-px bg-gray-200" />
                  <span className="text-xs text-gray-400 bg-white border border-gray-200 px-2.5 py-0.5 rounded-full">
                    {band.services.length} service{band.services.length!==1?'s':''}
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                  {band.services.map(service => <ServiceCard key={service.id} service={service} />)}
                </div>
              </div>
            ))}
            {bandedServices.noLocation.length > 0 && (
              <div>
                <div className="flex items-center gap-3 mb-5">
                  <h4 className="text-sm font-bold text-gray-500">📦 Other Services</h4>
                  <div className="flex-1 h-px bg-gray-200" />
                  <span className="text-xs text-gray-400 bg-white border border-gray-200 px-2.5 py-0.5 rounded-full">
                    {bandedServices.noLocation.length}
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                  {bandedServices.noLocation.map(service => <ServiceCard key={service.id} service={service} />)}
                </div>
              </div>
            )}
          </div>
        ) : (
          services.length === 0 ? (
            <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center shadow-sm">
              <p className="text-gray-400 text-sm">No services available yet.</p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                {services.slice(0,8).map(service => <ServiceCard key={service.id} service={service} />)}
              </div>
              <div className="text-center mt-8">
                <button
                  onClick={() => navigate('/search')}
                  className="bg-white text-gray-900 border border-gray-300 font-semibold px-8 py-3 rounded-xl hover:border-gray-400 transition text-sm"
                >
                  View All Services →
                </button>
              </div>
            </>
          )
        )}

        {/* Quick Actions */}
        <div className="mt-14">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Quick Access</p>
          <h3 className="text-2xl font-black text-gray-900 tracking-tight mb-6">Quick Actions</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {user?.role === 'CLIENT' && [
              { icon: '📋', title: 'My Bookings', desc: 'View and manage your bookings', path: '/my-bookings' },
              { icon: '👤', title: 'My Profile', desc: 'Update your profile info', path: '/profile' },
              { icon: '💬', title: 'AI Assistant', desc: 'Get help finding the right service', path: null },
            ].map(action => (
              <button
                key={action.title}
                onClick={() => action.path && navigate(action.path)}
                className="bg-white border border-gray-200 rounded-2xl p-6 text-left hover:shadow-md hover:-translate-y-1 transition-all duration-200 shadow-sm"
              >
                <p className="text-3xl mb-3">{action.icon}</p>
                <p className="font-bold text-gray-900 text-sm">{action.title}</p>
                <p className="text-xs text-gray-400 mt-1">{action.desc}</p>
              </button>
            ))}
            {user?.role === 'PROVIDER' && [
              { icon: '🛠️', title: 'My Services', desc: 'Add or manage your services', path: '/my-services' },
              { icon: '📅', title: 'Incoming Bookings', desc: 'Accept or reject requests', path: '/provider-bookings' },
              { icon: '👤', title: 'My Profile', desc: 'Update your profile info', path: '/profile' },
            ].map(action => (
              <button
                key={action.title}
                onClick={() => navigate(action.path)}
                className="bg-white border border-gray-200 rounded-2xl p-6 text-left hover:shadow-md hover:-translate-y-1 transition-all duration-200 shadow-sm"
              >
                <p className="text-3xl mb-3">{action.icon}</p>
                <p className="font-bold text-gray-900 text-sm">{action.title}</p>
                <p className="text-xs text-gray-400 mt-1">{action.desc}</p>
              </button>
            ))}
          </div>
        </div>
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
              {[
                { label: 'Dashboard', path: '/dashboard' },
                { label: 'Profile', path: '/profile' },
              ].map(l => (
                <li key={l.label}>
                  <button onClick={() => navigate(l.path)} className="text-sm text-gray-500 hover:text-gray-900 transition">{l.label}</button>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h4 className="text-xs font-bold text-gray-900 uppercase tracking-widest mb-4">Categories</h4>
            <ul className="space-y-2">
              {['Plumbing', 'Electrical', 'Cleaning', 'Tutoring', 'Design'].map(l => (
                <li key={l}>
                  <button onClick={() => handleCategory(l)} className="text-sm text-gray-500 hover:text-gray-900 transition">{l}</button>
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