import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getAllServices } from '../api/services';
import { createBooking } from '../api/bookings';
import { submitReview, getReviews } from '../api/reviews';
import { useAuth } from '../context/AuthContext';

export default function BookService() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [service, setService] = useState(null);
  const [form, setForm] = useState({ bookingDate: '', notes: '' });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [reviews, setReviews] = useState([]);
  const [avgRating, setAvgRating] = useState(0);
  const [totalReviews, setTotalReviews] = useState(0);
  const [reviewForm, setReviewForm] = useState({ rating: 0, comment: '' });
  const [hoverStar, setHoverStar] = useState(0);
  const [reviewError, setReviewError] = useState('');
  const [reviewSuccess, setReviewSuccess] = useState('');

  useEffect(() => {
    getAllServices().then(res => {
      const found = res.data.find(s => s.id === parseInt(id));
      setService(found);
    });
    fetchReviews();
  }, [id]);

  const fetchReviews = async () => {
    try {
      const res = await getReviews(id);
      setReviews(res.data.reviews);
      setAvgRating(res.data.averageRating);
      setTotalReviews(res.data.totalReviews);
    } catch (err) { console.error(err); }
  };

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await createBooking({
        serviceId: parseInt(id),
        bookingDate: form.bookingDate + ':00',
        notes: form.notes
      });
      setSuccess('Booking successful! Redirecting...');
      setTimeout(() => navigate('/my-bookings'), 2000);
    } catch (err) {
      setError('Booking failed. Please try again.');
    }
  };

  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    setReviewError('');
    setReviewSuccess('');
    if (reviewForm.rating === 0) {
      setReviewError('Please select a star rating.');
      return;
    }
    try {
      await submitReview(id, reviewForm);
      setReviewSuccess('Review submitted successfully!');
      setReviewForm({ rating: 0, comment: '' });
      fetchReviews();
    } catch (err) {
      setReviewError(err.response?.data || 'Failed to submit review.');
    }
  };

  const renderStars = (rating, size = 'text-xl') => {
    return [1, 2, 3, 4, 5].map(star => (
      <span key={star} className={`${size} ${star <= rating ? 'text-blue-600' : 'text-gray-300'}`}>★</span>
    ));
  };

  if (!service) return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
        <p className="text-gray-500 text-sm">Loading service...</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-100">

      {/* Navbar */}
      <nav className="bg-gray-100 border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-8 py-4 flex items-center justify-between">
          <span className="text-xl font-black tracking-tight text-gray-900 cursor-pointer"
            onClick={() => navigate('/dashboard')}>
            SkillMarket
          </span>
          <button onClick={() => navigate('/services')}
            className="text-sm text-gray-600 font-medium hover:text-gray-900 transition bg-white border border-gray-300 px-4 py-2 rounded-lg">
            ← Back to Services
          </button>
        </div>
      </nav>

      <div className="max-w-5xl mx-auto px-8 py-10 grid grid-cols-1 lg:grid-cols-2 gap-8">

        {/* Left — Booking Form */}
        <div className="space-y-6">

          {/* Service Info */}
          <div className="bg-white rounded-2xl shadow-sm p-6">
            {service.imageUrl && (
              <img src={service.imageUrl} alt={service.title}
                className="w-full h-44 object-cover rounded-xl mb-4" />
            )}
            <p className="text-xs text-blue-600 font-bold uppercase tracking-wide">{service.category}</p>
            <h2 className="text-xl font-black text-gray-900 tracking-tight mt-1">{service.title}</h2>
            <p className="text-gray-400 text-sm mt-1 mb-3">{service.description}</p>
            <div className="flex justify-between items-center">
              <span className="text-blue-600 font-black text-xl">₹{service.price}</span>
              <span className="text-xs text-gray-400">by {service.providerName}</span>
            </div>

            {/* Average Rating */}
            {totalReviews > 0 && (
              <div className="flex items-center gap-2 mt-3 pt-3 border-t border-gray-100">
                <div className="flex">{renderStars(Math.round(avgRating), 'text-base')}</div>
                <span className="text-sm font-bold text-gray-900">{avgRating}</span>
                <span className="text-xs text-gray-400">({totalReviews} review{totalReviews !== 1 ? 's' : ''})</span>
              </div>
            )}
          </div>

          {/* Booking Form */}
          <div className="bg-white rounded-2xl shadow-sm p-8">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Schedule</p>
            <h3 className="text-lg font-black text-gray-900 tracking-tight mb-6">Book This Service</h3>

            {error && <div className="bg-red-50 border border-red-100 text-red-600 text-sm font-medium px-4 py-2.5 rounded-xl mb-4">{error}</div>}
            {success && <div className="bg-green-50 border border-green-100 text-green-700 text-sm font-medium px-4 py-2.5 rounded-xl mb-4">{success}</div>}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-gray-400 uppercase tracking-wide block mb-1.5">Select Date &amp; Time</label>
                <input type="datetime-local" name="bookingDate"
                  value={form.bookingDate} onChange={handleChange} required
                  className="w-full border border-gray-300 px-4 py-2.5 rounded-xl text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
              </div>
              <div>
                <label className="text-xs font-bold text-gray-400 uppercase tracking-wide block mb-1.5">Notes (optional)</label>
                <textarea name="notes" value={form.notes} onChange={handleChange} rows={3}
                  placeholder="Any special requirements..."
                  className="w-full border border-gray-300 px-4 py-2.5 rounded-xl text-sm text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
              </div>
              <button type="submit"
                className="w-full bg-blue-600 text-white py-2.5 rounded-xl hover:bg-blue-700 font-semibold text-sm transition">
                Confirm Booking
              </button>
            </form>
          </div>
        </div>

        {/* Right — Reviews */}
        <div className="space-y-8">

          {/* Submit Review */}
          {user?.role === 'CLIENT' && (
            <div className="bg-white rounded-2xl shadow-sm p-8">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Your review</p>
              <h3 className="text-lg font-black text-gray-900 tracking-tight mb-1">Leave a Review</h3>
              <p className="text-xs text-gray-400 mb-6">Only available after a completed booking.</p>

              {reviewError && <div className="bg-red-50 border border-red-100 text-red-600 text-sm font-medium px-4 py-2.5 rounded-xl mb-4">{reviewError}</div>}
              {reviewSuccess && <div className="bg-green-50 border border-green-100 text-green-700 text-sm font-medium px-4 py-2.5 rounded-xl mb-4">{reviewSuccess}</div>}

              <form onSubmit={handleReviewSubmit} className="space-y-4">
                {/* Star Picker */}
                <div>
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-wide block mb-2">Rating</label>
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map(star => (
                      <button key={star} type="button"
                        onClick={() => setReviewForm({ ...reviewForm, rating: star })}
                        onMouseEnter={() => setHoverStar(star)}
                        onMouseLeave={() => setHoverStar(0)}
                        className="text-3xl transition-transform hover:scale-110">
                        <span className={star <= (hoverStar || reviewForm.rating) ? 'text-blue-600' : 'text-gray-300'}>★</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-wide block mb-1.5">Comment (optional)</label>
                  <textarea
                    value={reviewForm.comment}
                    onChange={(e) => setReviewForm({ ...reviewForm, comment: e.target.value })}
                    rows={3} placeholder="Share your experience..."
                    className="w-full border border-gray-300 px-4 py-2.5 rounded-xl text-sm text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
                </div>

                <button type="submit"
                  className="w-full bg-blue-600 text-white py-2.5 rounded-xl hover:bg-blue-700 font-semibold text-sm transition">
                  Submit Review
                </button>
              </form>
            </div>
          )}

          {/* Reviews List */}
          <div>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Feedback</p>
            <h2 className="text-2xl font-black text-gray-900 tracking-tight mb-6">
              Reviews
              {totalReviews > 0 && <span className="text-base font-medium text-gray-400 ml-2">({totalReviews})</span>}
            </h2>

            {reviews.length === 0 ? (
              <div className="bg-white rounded-2xl p-10 text-center shadow-sm">
                <p className="text-4xl mb-3">⭐</p>
                <p className="text-gray-800 font-bold text-lg mb-1">No reviews yet</p>
                <p className="text-gray-400 text-sm">Be the first to share your experience.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {reviews.map(review => (
                  <div key={review.id} className="bg-white rounded-2xl p-5 shadow-sm hover:shadow-md transition">
                    <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-blue-100 flex items-center justify-center font-black text-sm text-blue-600">
                          {review.clientName?.charAt(0).toUpperCase()}
                        </div>
                        <span className="font-bold text-gray-900 text-sm">{review.clientName}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="flex">{renderStars(review.rating, 'text-sm')}</div>
                        <span className="text-xs text-gray-400">
                          {new Date(review.createdAt).toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' })}
                        </span>
                      </div>
                    </div>
                    {review.comment && (
                      <p className="text-gray-600 text-sm leading-relaxed">{review.comment}</p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}