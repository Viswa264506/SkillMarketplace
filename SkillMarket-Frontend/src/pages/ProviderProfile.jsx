import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getProviderProfile } from "../api/providers";

function StarRating({ rating }) {
  return (
    <div className="flex gap-0.5">
      {[1,2,3,4,5].map(star => (
        <svg key={star} className={`w-4 h-4 ${star <= rating ? 'text-blue-600' : 'text-gray-300'}`}
          fill="currentColor" viewBox="0 0 20 20">
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
        </svg>
      ))}
    </div>
  );
}

const CATEGORY_BG = {
  Plumbing: 'bg-blue-50', Tutoring: 'bg-purple-50', Design: 'bg-yellow-50',
  Cleaning: 'bg-green-50', Electrical: 'bg-emerald-50', Other: 'bg-gray-100',
};

const CATEGORY_ICONS = {
  Plumbing: '🔧', Tutoring: '📚', Design: '🎨',
  Cleaning: '🧹', Electrical: '⚡', Other: '🛠️',
};

export default function ProviderProfile() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [provider, setProvider] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getProviderProfile(id)
      .then(res => setProvider(res.data))
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
        <p className="text-gray-500 text-sm">Loading provider profile...</p>
      </div>
    </div>
  );

  if (!provider) return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center">
      <div className="text-center">
        <p className="text-4xl mb-3">😕</p>
        <p className="text-gray-800 font-bold text-lg">Provider not found</p>
        <button onClick={() => navigate(-1)}
          className="mt-4 text-blue-600 text-sm font-medium hover:underline">
          ← Go back
        </button>
      </div>
    </div>
  );

  const memberYear = new Date(provider.memberSince).getFullYear();

  return (
    <div className="min-h-screen bg-gray-100">

      {/* Navbar */}
      <nav className="bg-gray-100 border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-8 py-4 flex items-center justify-between">
          <span className="text-xl font-black tracking-tight text-gray-900 cursor-pointer"
            onClick={() => navigate('/dashboard')}>
            SkillMarket
          </span>
          <button onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-sm text-gray-600 font-medium hover:text-gray-900 transition bg-white border border-gray-300 px-4 py-2 rounded-lg">
            ← Back
          </button>
        </div>
      </nav>

      <div className="max-w-5xl mx-auto px-8 py-10 space-y-8">

        {/* Provider Header */}
        <div className="bg-white rounded-2xl p-8 shadow-sm">
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">

            {/* Avatar */}
            <div className="shrink-0">
              {provider.profileImageUrl ? (
                <img src={provider.profileImageUrl} alt={provider.name}
                  className="w-24 h-24 rounded-2xl object-cover shadow-md" />
              ) : (
                <div className="w-24 h-24 rounded-2xl bg-blue-100 flex items-center justify-center text-4xl font-black text-blue-600 shadow-md">
                  {provider.name.charAt(0).toUpperCase()}
                </div>
              )}
            </div>

            {/* Info */}
            <div className="flex-1 text-center sm:text-left">
              <div className="flex items-center gap-3 justify-center sm:justify-start flex-wrap mb-2">
                <h1 className="text-3xl font-black text-gray-900 tracking-tight">{provider.name}</h1>
                {provider.isProviderVerified && (
                  <span className="bg-green-100 text-green-700 border border-green-200 text-xs px-3 py-1 rounded-full font-bold">
                    ✓ Verified
                  </span>
                )}
              </div>

              <p className="text-gray-400 text-sm mb-3">Member since {memberYear}</p>

              {/* Rating */}
              <div className="flex items-center gap-2 justify-center sm:justify-start mb-3">
                <StarRating rating={Math.round(provider.averageRating)} />
                <span className="text-blue-600 font-bold text-sm">{provider.averageRating.toFixed(1)}</span>
                <span className="text-gray-400 text-xs">({provider.totalReviews} review{provider.totalReviews !== 1 ? 's' : ''})</span>
              </div>

              {/* Meta */}
              <div className="flex flex-wrap gap-3 justify-center sm:justify-start">
                {provider.phoneNumber && (
                  <span className="flex items-center gap-1.5 text-xs text-gray-500 bg-gray-100 px-3 py-1.5 rounded-lg font-medium">
                    📞 {provider.phoneNumber}
                  </span>
                )}
                {provider.address && (
                  <span className="flex items-center gap-1.5 text-xs text-gray-500 bg-gray-100 px-3 py-1.5 rounded-lg font-medium">
                    📍 {provider.address.split(',')[0]}
                  </span>
                )}
                <span className="flex items-center gap-1.5 text-xs text-gray-500 bg-gray-100 px-3 py-1.5 rounded-lg font-medium">
                  🛠️ {provider.services?.length || 0} service{provider.services?.length !== 1 ? 's' : ''}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Services */}
        <div>
          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Offerings</p>
          <h2 className="text-2xl font-black text-gray-900 tracking-tight mb-6">Services Offered</h2>

          {provider.services.length === 0 ? (
            <div className="bg-white rounded-2xl p-10 text-center shadow-sm">
              <p className="text-gray-400 text-sm">No active services yet.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {provider.services.map(service => (
                <div key={service.id}
                  className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-200 group">
                  <div className={`h-36 ${CATEGORY_BG[service.category]||'bg-gray-100'} flex items-center justify-center relative`}>
                    {service.imageUrl
                      ? <img src={service.imageUrl} alt={service.title} className="w-full h-full object-cover group-hover:scale-105 transition duration-300" />
                      : <span className="text-5xl">{CATEGORY_ICONS[service.category]||'🛠️'}</span>
                    }
                    <div className="absolute bottom-2 right-2 bg-gray-900 text-white text-xs font-bold px-2.5 py-1 rounded-lg">
                      ₹{service.price?.toLocaleString()}
                    </div>
                  </div>
                  <div className="p-4">
                    <p className="text-xs text-blue-600 font-bold uppercase tracking-wide mb-1">{service.category}</p>
                    <h3 className="font-bold text-gray-900 text-sm mb-3 leading-snug">{service.title}</h3>
                    <button onClick={() => navigate(`/book/${service.id}`)}
                      className="w-full bg-blue-600 text-white py-2 rounded-xl text-sm font-semibold hover:bg-blue-700 transition">
                      Book Now
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Reviews */}
        <div>
          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Feedback</p>
          <h2 className="text-2xl font-black text-gray-900 tracking-tight mb-6">Recent Reviews</h2>

          {provider.recentReviews.length === 0 ? (
            <div className="bg-white rounded-2xl p-10 text-center shadow-sm">
              <p className="text-gray-400 text-sm">No reviews yet.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {provider.recentReviews.map((review, idx) => (
                <div key={idx} className="bg-white rounded-2xl p-5 shadow-sm hover:shadow-md transition">
                  <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-blue-100 flex items-center justify-center font-black text-sm text-blue-600">
                        {review.clientName.charAt(0).toUpperCase()}
                      </div>
                      <span className="font-bold text-gray-900 text-sm">{review.clientName}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <StarRating rating={review.rating} />
                      <span className="text-xs text-gray-400">
                        {new Date(review.createdAt).toLocaleDateString('en-IN', { year:'numeric', month:'short', day:'numeric' })}
                      </span>
                    </div>
                  </div>
                  <p className="text-gray-600 text-sm leading-relaxed">{review.comment}</p>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}