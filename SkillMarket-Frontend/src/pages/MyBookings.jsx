import { useEffect, useState, useRef } from 'react';
import { getMyBookings, cancelBooking } from '../api/bookings';
import axios from '../api/axios';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import NotificationBell from '../components/NotificationBell';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

const providerIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34],
});

function RecenterMap({ lat, lng }) {
  const map = useMap();
  useEffect(() => { if (lat && lng) map.setView([lat, lng], 15); }, [lat, lng]);
  return null;
}

const STATUS_STYLES = {
  PENDING:   { bg: 'bg-amber-50',   text: 'text-amber-700',   border: 'border-amber-100',   dot: 'bg-amber-400' },
  ACCEPTED:  { bg: 'bg-blue-50',    text: 'text-blue-700',    border: 'border-blue-100',    dot: 'bg-blue-500' },
  REJECTED:  { bg: 'bg-red-50',     text: 'text-red-700',     border: 'border-red-100',     dot: 'bg-red-400' },
  COMPLETED: { bg: 'bg-green-50',   text: 'text-green-700',   border: 'border-green-100',   dot: 'bg-green-500' },
  CANCELLED: { bg: 'bg-gray-50',    text: 'text-gray-500',    border: 'border-gray-200',    dot: 'bg-gray-400' },
};

export default function MyBookings() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [trackingId, setTrackingId] = useState(null);
  const [liveLocation, setLiveLocation] = useState(null);
  const [locationError, setLocationError] = useState(null);
  const [activeTab, setActiveTab] = useState('ALL');
  const intervalRef = useRef(null);
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  useEffect(() => { fetchBookings(); return () => stopTracking(); }, []);

  const fetchBookings = async () => {
    setLoading(true);
    try { const res = await getMyBookings(); setBookings(res.data); } catch(e) { console.error(e); }
    setLoading(false);
  };

  const pollLocation = async (bookingId) => {
    try {
      const res = await axios.get(`/bookings/${bookingId}/location`);
      const { providerLat, providerLng, locationUpdatedAt } = res.data;
      if (providerLat && providerLng) {
        setLiveLocation({ lat: providerLat, lng: providerLng, updatedAt: locationUpdatedAt });
        setLocationError(null);
      } else { setLocationError('Provider has not shared their location yet.'); }
    } catch { setLocationError('Could not fetch provider location.'); }
  };

  const startTracking = (bookingId) => {
    setTrackingId(bookingId); setLiveLocation(null); setLocationError(null);
    pollLocation(bookingId);
    intervalRef.current = setInterval(() => pollLocation(bookingId), 30000);
  };

  const stopTracking = () => {
    if (intervalRef.current) { clearInterval(intervalRef.current); intervalRef.current = null; }
    setTrackingId(null); setLiveLocation(null); setLocationError(null);
  };

  const handleCancel = async (id) => {
    if (!window.confirm('Cancel this booking?')) return;
    try { await cancelBooking(id); fetchBookings(); } catch(e) { console.error(e); }
  };

  const TABS = ['ALL', 'PENDING', 'ACCEPTED', 'COMPLETED', 'CANCELLED'];
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
            <button onClick={() => navigate('/dashboard')}
              className="text-sm text-gray-600 font-medium hover:text-gray-900 transition bg-white border border-gray-300 px-4 py-2 rounded-lg">
              Dashboard
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

        {/* Page Header */}
        <div>
          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Dashboard</p>
          <h1 className="text-2xl font-black text-gray-900 tracking-tight">My Bookings</h1>
          <p className="text-gray-400 text-sm mt-2">Track and manage all your service bookings</p>
        </div>

        {/* Live Tracking Map */}
        {trackingId && (
          <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
            <div className="flex justify-between items-center px-5 py-4 border-b border-gray-100">
              <div>
                <h3 className="font-bold text-gray-900 text-sm flex items-center gap-2">
                  <span className="w-2 h-2 bg-green-500 rounded-full animate-ping inline-block" />
                  Live Provider Location
                </h3>
                {liveLocation?.updatedAt && (
                  <p className="text-xs text-gray-400 mt-0.5">Last updated: {new Date(liveLocation.updatedAt).toLocaleTimeString()}</p>
                )}
              </div>
              <button onClick={stopTracking}
                className="text-sm bg-red-50 text-red-600 border border-red-100 px-4 py-1.5 rounded-xl hover:bg-red-100 transition font-medium">
                Stop Tracking
              </button>
            </div>
            {locationError ? (
              <div className="px-5 py-10 text-center">
                <p className="text-gray-400 text-sm">{locationError}</p>
                <p className="text-xs text-gray-300 mt-1">Polling every 30s...</p>
              </div>
            ) : liveLocation ? (
              <div style={{ height: '280px' }}>
                <MapContainer center={[liveLocation.lat, liveLocation.lng]} zoom={15}
                  style={{ height:'100%', width:'100%' }}>
                  <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution='&copy; OpenStreetMap contributors' />
                  <RecenterMap lat={liveLocation.lat} lng={liveLocation.lng} />
                  <Marker position={[liveLocation.lat, liveLocation.lng]} icon={providerIcon}>
                    <Popup>Provider is here 📍</Popup>
                  </Marker>
                </MapContainer>
              </div>
            ) : (
              <div className="px-5 py-10 text-center">
                <div className="animate-pulse text-gray-300 text-sm">Fetching provider location...</div>
              </div>
            )}
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

        {/* Bookings */}
        {loading ? (
          <div className="space-y-4">
            {[1,2,3].map(i => <div key={i} className="bg-white rounded-2xl shadow-sm h-28 animate-pulse" />)}
          </div>
        ) : filtered.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-sm p-12 text-center">
            <p className="text-4xl mb-3">📋</p>
            <p className="text-gray-800 font-bold text-lg">No bookings found</p>
            <p className="text-gray-400 text-sm mt-1">
              {activeTab === 'ALL' ? "You haven't booked any services yet." : `No ${activeTab.toLowerCase()} bookings.`}
            </p>
            {activeTab === 'ALL' && (
              <button onClick={() => navigate('/dashboard')}
                className="mt-4 bg-blue-600 text-white px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-blue-700 transition">
                Browse Services
              </button>
            )}
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
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-bold text-gray-900 text-sm">{booking.serviceName}</h3>
                        <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full border ${s.bg} ${s.text} ${s.border}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />
                          {booking.status}
                        </span>
                      </div>
                      <p className="text-sm text-gray-500">Provider: <span className="font-medium text-gray-700">{booking.providerName}</span></p>
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
                        <button onClick={() => handleCancel(booking.id)}
                          className="text-sm bg-red-50 text-red-600 border border-red-100 px-4 py-1.5 rounded-xl hover:bg-red-100 transition font-medium">
                          Cancel
                        </button>
                      )}
                      {booking.status === 'ACCEPTED' && (
  <>
    {trackingId === booking.id ? (
      <button onClick={stopTracking}
        className="flex items-center gap-1.5 text-sm bg-red-50 text-red-600 border border-red-100 px-4 py-1.5 rounded-xl hover:bg-red-100 transition font-medium">
        <span className="w-2 h-2 bg-red-500 rounded-full animate-ping" />
        Stop Tracking
      </button>
    ) : (
      <button onClick={() => startTracking(booking.id)}
        disabled={trackingId !== null}
        className="flex items-center gap-1.5 text-sm bg-blue-50 text-blue-600 border border-blue-100 px-4 py-1.5 rounded-xl hover:bg-blue-100 transition font-medium disabled:opacity-40 disabled:cursor-not-allowed">
        🗺️ Track Provider
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
    </div>
  );
}