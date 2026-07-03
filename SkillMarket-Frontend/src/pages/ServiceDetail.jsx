import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getReviews } from '../api/reviews';
import { getServiceById } from '../api/services';
import { useLocation2 } from '../context/LocationContext';

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

function StarRating({ rating = 0, size = 'w-4 h-4' }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1,2,3,4,5].map(s => (
        <svg key={s} className={`${size} ${s <= Math.round(rating) ? 'text-blue-600' : 'text-gray-300'}`}
          fill="currentColor" viewBox="0 0 20 20">
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
        </svg>
      ))}
    </div>
  );
}

export default function ServiceDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { location: clientLocation } = useLocation2();

  const [service, setService] = useState(null);
  const [loading, setLoading] = useState(true);
  const [reviews, setReviews] = useState({ reviews: [], averageRating: 0, totalReviews: 0 });
  const [error, setError] = useState(false);

  useEffect(() => {
    window.scrollTo(0, 0);
    fetchService();
  }, [id]);

  const fetchService = async () => {
    setLoading(true); setError(false);
    try {
      const res = await getServiceById(id);
      setService(res.data);
      const revRes = await getReviews(id);
      setReviews(revRes.data);
    } catch (e) {
      console.error(e);
      setError(true);
    }
    setLoading(false);
  };

  const distanceKm = service && clientLocation?.latitude && service.providerLatitude
    ? haversineDistance(clientLocation.latitude, clientLocation.longitude, service.providerLatitude, service.providerLongitude)
    : null;

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-gray-400 text-sm">Loading service...</p>
        </div>
      </div>
    );
  }

  if (error || !service) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <p className="text-5xl mb-4">😕</p>
          <p className="text-gray-800 font-bold text-lg">Service not found</p>
          <button onClick={() => navigate('/dashboard')}
            className="mt-4 bg-blue-600 text-white px-6 py-2.5 rounded-xl text-sm font-semibold hover:bg-blue-700 transition">
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">

      {/* Navbar */}
      <nav className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-6 h-16 flex items-center justify-between">
          <span className="text-lg font-black text-gray-900 cursor-pointer" onClick={() => navigate('/dashboard')}>
            Skill<span className="text-blue-600">Market</span>
          </span>
          <div className="flex items-center gap-3">
            <button onClick={() => navigate(-1)}
              className="text-sm text-gray-600 font-medium hover:text-gray-900 transition bg-gray-100 px-4 py-2 rounded-lg">
              ← Back
            </button>
            {user && (
              <button onClick={() => navigate('/profile')}
                className="w-9 h-9 rounded-full overflow-hidden border-2 border-gray-200 hover:border-blue-300 transition shrink-0">
                {user?.profileImageUrl ? (
                  <img src={user.profileImageUrl} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-blue-100 flex items-center justify-center">
                    <span className="text-blue-700 font-bold text-sm">{user?.name?.charAt(0).toUpperCase()}</span>
                  </div>
                )}
              </button>
            )}
          </div>
        </div>
      </nav>

      <div className="max-w-5xl mx-auto px-6 py-8">

        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-xs text-gray-400 mb-6">
          <button onClick={() => navigate('/dashboard')} className="hover:text-gray-700 transition">Dashboard</button>
          <span>/</span>
          <button onClick={() => navigate(`/search?category=${service.category}`)} className="hover:text-gray-700 transition">{service.category}</button>
          <span>/</span>
          <span className="text-gray-700">{service.title}</span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

          {/* Left: Image + Details */}
          <div className="lg:col-span-2 space-y-6">

            {/* Hero Image */}
            <div className={`w-full h-72 sm:h-96 rounded-3xl overflow-hidden ${CATEGORY_BG[service.category]||'bg-gray-100'} flex items-center justify-center relative shadow-sm`}>
              {service.imageUrl ? (
                <img src={service.imageUrl} alt={service.title} className="w-full h-full object-cover" />
              ) : (
                <span className="text-8xl">{CATEGORY_ICONS[service.category]||'🛠️'}</span>
              )}
              {distanceKm != null && (
                <div className="absolute top-4 right-4 bg-white/95 backdrop-blur text-blue-600 text-sm px-4 py-1.5 rounded-full font-bold shadow-sm">
                  📍 {distanceKm.toFixed(1)} km away
                </div>
              )}
            </div>

            {/* Title block */}
            <div>
              <p className="text-xs text-blue-600 font-bold uppercase tracking-widest mb-2">{service.category}</p>
              <h1 className="text-3xl font-black text-gray-900 tracking-tight mb-3">{service.title}</h1>
              <div className="flex items-center gap-3 flex-wrap">
                <div className="flex items-center gap-2">
                  <StarRating rating={service.averageRating} />
                  <span className="text-sm font-bold text-gray-900">{service.averageRating?.toFixed(1) || '0.0'}</span>
                </div>
                <span className="text-gray-300">|</span>
                <span className="text-sm text-gray-500">{service.totalReviews || 0} review{service.totalReviews !== 1 ? 's' : ''}</span>
                {service.providerAddress && (
                  <>
                    <span className="text-gray-300">|</span>
                    <span className="text-sm text-gray-500">📍 {service.providerAddress.split(',').slice(0,2).join(',')}</span>
                  </>
                )}
              </div>
            </div>

            {/* Description */}
            <div className="bg-white rounded-2xl p-6 shadow-sm">
              <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wide mb-3">About this service</h3>
              <p className="text-gray-600 text-sm leading-relaxed">{service.description || 'No description provided.'}</p>
            </div>

            {/* Reviews */}
            <div className="bg-white rounded-2xl p-6 shadow-sm">
              <div className="flex items-center justify-between mb-5">
                <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wide">Reviews</h3>
                {reviews.totalReviews > 0 && (
                  <div className="flex items-center gap-2">
                    <StarRating rating={reviews.averageRating} />
                    <span className="text-sm font-bold text-gray-900">{reviews.averageRating?.toFixed(1)}</span>
                    <span className="text-xs text-gray-400">({reviews.totalReviews})</span>
                  </div>
                )}
              </div>

              {reviews.reviews?.length === 0 ? (
                <div className="text-center py-10">
                  <p className="text-3xl mb-2">📝</p>
                  <p className="text-gray-400 text-sm">No reviews yet. Be the first to book and review!</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {reviews.reviews.map((r, idx) => (
                    <div key={idx} className="border-b border-gray-100 last:border-0 pb-4 last:pb-0">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-blue-100 flex items-center justify-center font-black text-sm text-blue-600">
                            {r.clientName?.charAt(0).toUpperCase()}
                          </div>
                          <span className="font-bold text-gray-900 text-sm">{r.clientName}</span>
                        </div>
                        <StarRating rating={r.rating} size="w-3.5 h-3.5" />
                      </div>
                      <p className="text-gray-600 text-sm leading-relaxed ml-12">{r.comment}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right: Sticky booking card */}
          <div className="lg:col-span-1">
            <div className="sticky top-24 space-y-4">

              {/* Price + Book card */}
              <div className="bg-white rounded-2xl p-6 shadow-sm">
                <p className="text-xs text-gray-400 mb-1">Starting from</p>
                <p className="text-3xl font-black text-blue-600 mb-5">₹{service.price?.toLocaleString()}</p>
                <button onClick={() => navigate(`/book/${service.id}`)}
                  className="w-full bg-blue-600 text-white py-3.5 rounded-xl text-sm font-bold hover:bg-blue-700 transition mb-3">
                  Book Now
                </button>
                <button onClick={() => navigate(`/provider/${service.providerId}`)}
                  className="w-full bg-white text-gray-700 border border-gray-200 py-3 rounded-xl text-sm font-semibold hover:border-gray-300 transition">
                  View Provider Profile
                </button>
              </div>

              {/* Provider mini card */}
              <div className="bg-white rounded-2xl p-6 shadow-sm">
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-4">Service Provider</p>
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 rounded-2xl bg-blue-100 flex items-center justify-center font-black text-lg text-blue-600">
                    {service.providerName?.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <button onClick={() => navigate(`/provider/${service.providerId}`)}
                      className="font-bold text-gray-900 text-sm hover:text-blue-600 transition">
                      {service.providerName}
                    </button>
                    {service.providerAddress && (
                      <p className="text-xs text-gray-400 mt-0.5">📍 {service.providerAddress.split(',')[0]}</p>
                    )}
                  </div>
                </div>
                <button onClick={() => navigate(`/provider/${service.providerId}`)}
                  className="w-full text-center text-xs text-blue-600 font-semibold hover:underline">
                  View full profile →
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
