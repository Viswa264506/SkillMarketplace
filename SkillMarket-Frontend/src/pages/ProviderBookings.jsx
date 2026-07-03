import { useEffect, useState, useRef } from 'react';
import { getProviderBookings, updateBookingStatus } from '../api/bookings';
import axios from '../api/axios';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import NotificationBell from '../components/NotificationBell';

const REJECTION_REASONS = [
  'Not available at that time',
  'Location too far',
  'Fully booked for the day',
  'Service no longer offered',
  'Price doesn\'t match the request',
  'Need more details from client',
  'Other',
];

const STATUS_STYLES = {
  PENDING:   { bg: 'bg-amber-50',  text: 'text-amber-700',  border: 'border-amber-100',  dot: 'bg-amber-400' },
  ACCEPTED:  { bg: 'bg-blue-50',   text: 'text-blue-700',   border: 'border-blue-100',   dot: 'bg-blue-500' },
  REJECTED:  { bg: 'bg-red-50',    text: 'text-red-700',    border: 'border-red-100',    dot: 'bg-red-400' },
  COMPLETED: { bg: 'bg-green-50',  text: 'text-green-700',  border: 'border-green-100',  dot: 'bg-green-500' },
  CANCELLED: { bg: 'bg-gray-50',   text: 'text-gray-500',   border: 'border-gray-200',   dot: 'bg-gray-400' },
};

export default function ProviderBookings() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sharingId, setSharingId] = useState(null);
  const [locationError, setLocationError] = useState(null);
  const [activeTab, setActiveTab] = useState('ALL');
  const [rejectingBooking, setRejectingBooking] = useState(null);
  const [selectedReason, setSelectedReason] = useState('');
  const [customReason, setCustomReason] = useState('');
  const [rejecting, setRejecting] = useState(false);
  const intervalRef = useRef(null);
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  useEffect(() => { fetchBookings(); return () => stopSharing(); }, []);

  const fetchBookings = async () => {
    setLoading(true);
    try { const res = await getProviderBookings(); setBookings(res.data); } catch(e) { console.error(e); }
    setLoading(false);
  };

  const handleStatus = async (id, status) => {
    try { await updateBookingStatus(id, status); fetchBookings(); } catch(e) { console.error(e); }
  };

  const confirmReject = async () => {
    const reason = selectedReason === 'Other' ? customReason.trim() : selectedReason;
    if (!reason) return;
    setRejecting(true);
    try {
      await axios.put(`/bookings/${rejectingBooking}/reject`, { reason });
      setRejectingBooking(null);
      setSelectedReason('');
      setCustomReason('');
      fetchBookings();
    } catch(e) { console.error(e); }
    setRejecting(false);
  };

  const pushLocation = (bookingId) => {
    if (!navigator.geolocation) { setLocationError('Geolocation not supported.'); return; }
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          await axios.put(`/bookings/${bookingId}/location`, { lat: pos.coords.latitude, lng: pos.coords.longitude });
          setLocationError(null);
        } catch(e) { console.error(e); }
      },
      (err) => setLocationError('GPS error: ' + err.message),
      { enableHighAccuracy: true }
    );
  };

  const startSharing = (bookingId) => {
    setSharingId(bookingId); setLocationError(null);
    pushLocation(bookingId);
    intervalRef.current = setInterval(() => pushLocation(bookingId), 30000);
  };

  const stopSharing = () => {
    if (intervalRef.current) { clearInterval(intervalRef.current); intervalRef.current = null; }
    setSharingId(null);
  };

  const TABS = ['ALL', 'PENDING', 'ACCEPTED', 'COMPLETED', 'REJECTED'];
  const filtered = activeTab === 'ALL' ? bookings : bookings.filter(b => b.status === activeTab);
  const tabCounts = TABS.reduce((acc, t) => {
    acc[t] = t === 'ALL' ? bookings.length : bookings.filter(b => b.status === t).length;
    return acc;
  }, {});

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
            <button onClick={() => navigate('/my-services')}
              className="text-sm text-gray-600 font-medium hover:text-gray-900 transition bg-white border border-gray-300 px-4 py-2 rounded-lg">
              My Services
            </button>
            <NotificationBell />
            <button onClick={() => navigate('/profile')}
              className="w-9 h-9 bg-blue-100 rounded-full flex items-center justify-center hover:bg-blue-200 transition">
              <span className="text-blue-700 font-bold text-sm">{user?.name?.charAt(0).toUpperCase()}</span>
            </button>
            <button onClick={() => { logout(); navigate('/login'); }}
              className="text-sm text-red-600 font-medium hover:text-red-700 transition bg-white border border-gray-300 px-4 py-2 rounded-lg">
              Logout
            </button>
          </div>
        </div>
      </nav>

      <div className="max-w-5xl mx-auto px-8 py-10 space-y-8">

        {/* Header */}
        <div>
          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Dashboard</p>
          <h1 className="text-2xl font-black text-gray-900 tracking-tight">Incoming Bookings</h1>
          <p className="text-gray-400 text-sm mt-2">Accept, reject or complete client booking requests</p>
        </div>

        {/* Live sharing banner */}
        {locationError && (
          <div className="bg-red-50 border border-red-100 text-red-600 text-sm font-medium px-4 py-2.5 rounded-xl flex items-center gap-2">
            ⚠️ {locationError}
          </div>
        )}
        {sharingId && (
          <div className="bg-blue-50 border border-blue-100 text-blue-700 text-sm font-medium px-4 py-2.5 rounded-xl flex justify-between items-center">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 bg-blue-500 rounded-full animate-ping" />
              Sharing live location every 30 seconds...
            </div>
            <button onClick={stopSharing}
              className="text-xs bg-blue-600 text-white px-3 py-1.5 rounded-lg hover:bg-blue-700 transition font-semibold">
              Stop Sharing
            </button>
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-2 flex-wrap">
          {TABS.map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)}
              className={`flex items-center gap-1.5 px-4 py-1.5 rounded-full text-sm font-semibold transition border ${
                activeTab === tab
                  ? 'bg-blue-600 text-white border-blue-600'
                  : 'bg-white border-gray-300 text-gray-600 hover:border-blue-300 hover:text-blue-600'
              }`}>
              {tab}
              {tabCounts[tab] > 0 && (
                <span className={`text-xs px-1.5 py-0.5 rounded-full font-semibold ${activeTab===tab ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-500'}`}>
                  {tabCounts[tab]}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Bookings list */}
        {loading ? (
          <div className="space-y-4">
            {[1,2,3].map(i => <div key={i} className="bg-white rounded-2xl shadow-sm h-28 animate-pulse" />)}
          </div>
        ) : filtered.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-sm p-12 text-center">
            <p className="text-4xl mb-3">📅</p>
            <p className="text-gray-800 font-bold text-lg">No bookings found</p>
            <p className="text-gray-400 text-sm mt-1">
              {activeTab === 'ALL' ? "You haven't received any bookings yet." : `No ${activeTab.toLowerCase()} bookings.`}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filtered.map(booking => {
              const s = STATUS_STYLES[booking.status] || STATUS_STYLES.PENDING;
              return (
                <div key={booking.id}
                  className="bg-white rounded-2xl shadow-sm p-5 hover:shadow-md transition">
                  <div className="flex justify-between items-start gap-4 flex-wrap">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <h3 className="font-bold text-gray-900 text-sm">{booking.serviceName}</h3>
                        <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full border ${s.bg} ${s.text} ${s.border}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />
                          {booking.status}
                        </span>
                      </div>
                      <p className="text-sm text-gray-500">
                        Client: <span className="font-medium text-gray-700">{booking.clientName}</span>
                        <span className="text-gray-400 ml-1">({booking.clientEmail})</span>
                      </p>
                      <p className="text-sm text-gray-400 mt-0.5">
                        📅 {new Date(booking.bookingDate).toLocaleString()}
                      </p>
                      {booking.notes && (
                        <p className="text-xs text-gray-400 mt-1 bg-gray-50 rounded-lg px-3 py-1.5 inline-block">
                          💬 {booking.notes}
                        </p>
                      )}
                      {booking.status === 'REJECTED' && booking.rejectionReason && (
                        <p className="text-xs text-red-600 mt-2 bg-red-50 border border-red-100 rounded-lg px-3 py-2 inline-block">
                          ⚠️ Reason: {booking.rejectionReason}
                        </p>
                      )}
                    </div>

                    <div className="flex flex-col gap-2 items-end shrink-0">
                      {booking.status === 'PENDING' && (
                        <div className="flex gap-2">
                          <button onClick={() => handleStatus(booking.id, 'ACCEPTED')}
                            className="text-sm bg-blue-50 text-blue-600 border border-blue-100 px-4 py-1.5 rounded-xl hover:bg-blue-100 transition font-medium">
                            ✓ Accept
                          </button>
                          <button onClick={() => setRejectingBooking(booking.id)}
                            className="text-sm bg-red-50 text-red-600 border border-red-100 px-4 py-1.5 rounded-xl hover:bg-red-100 transition font-medium">
                            ✕ Reject
                          </button>
                        </div>
                      )}
                      {booking.status === 'ACCEPTED' && (
  <>
    <button onClick={() => handleStatus(booking.id, 'COMPLETED')}
      className="text-sm bg-green-50 text-green-700 border border-green-100 px-4 py-1.5 rounded-xl hover:bg-green-100 transition font-medium">
      ✓ Mark Complete
    </button>
    {sharingId === booking.id ? (
      <button onClick={stopSharing}
        className="flex items-center gap-1.5 text-sm bg-red-50 text-red-600 border border-red-100 px-4 py-1.5 rounded-xl hover:bg-red-100 transition font-medium">
        <span className="w-2 h-2 bg-red-500 rounded-full animate-ping" />
        Stop Location
      </button>
    ) : (
      <button onClick={() => startSharing(booking.id)}
        disabled={sharingId !== null && sharingId !== booking.id}
        className="flex items-center gap-1.5 text-sm bg-blue-50 text-blue-600 border border-blue-100 px-4 py-1.5 rounded-xl hover:bg-blue-100 transition font-medium disabled:opacity-40 disabled:cursor-not-allowed">
        📍 Share Location
      </button>
    )}
    {/* ← Add this back */}
    <button onClick={() => navigate(`/chat/${booking.id}`)}
      className="flex items-center gap-1.5 text-sm bg-gray-100 text-gray-700 border border-gray-200 px-4 py-1.5 rounded-xl hover:bg-gray-200 transition font-medium">
      💬 Chat
    </button>
  </>
)}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Rejection Reason Modal */}
      {rejectingBooking && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center px-4"
          onClick={() => { setRejectingBooking(null); setSelectedReason(''); setCustomReason(''); }}>
          <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-2xl" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-black text-gray-900 tracking-tight mb-1">Reject Booking</h3>
            <p className="text-sm text-gray-400 mb-5">Let the client know why you're rejecting this booking.</p>

            <div className="space-y-2 mb-4">
              {REJECTION_REASONS.map(reason => (
                <button key={reason}
                  onClick={() => setSelectedReason(reason)}
                  className={`w-full text-left px-4 py-3 rounded-xl text-sm font-medium border transition ${
                    selectedReason === reason
                      ? 'bg-blue-50 border-blue-300 text-blue-700'
                      : 'bg-white border-gray-300 text-gray-600 hover:border-gray-400'
                  }`}>
                  {reason}
                </button>
              ))}
            </div>

            {selectedReason === 'Other' && (
              <textarea
                value={customReason}
                onChange={e => setCustomReason(e.target.value)}
                placeholder="Please specify the reason..."
                rows={3}
                className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm text-gray-800 placeholder:text-gray-400 outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent mb-4 resize-none"
              />
            )}

            <div className="flex gap-3">
              <button onClick={() => { setRejectingBooking(null); setSelectedReason(''); setCustomReason(''); }}
                className="flex-1 border border-gray-300 text-gray-600 py-2.5 rounded-xl text-sm font-medium hover:bg-gray-50 transition">
                Cancel
              </button>
              <button onClick={confirmReject}
                disabled={!selectedReason || (selectedReason === 'Other' && !customReason.trim()) || rejecting}
                className="flex-1 bg-red-600 text-white py-2.5 rounded-xl text-sm font-semibold hover:bg-red-700 transition disabled:opacity-40 disabled:cursor-not-allowed">
                {rejecting ? 'Rejecting...' : 'Confirm Reject'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}