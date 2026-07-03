import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getUnreadCount, getUnreadByBooking } from '../api/messages';

export default function NotificationBell() {
  const [unreadCount, setUnreadCount] = useState(0);
  const [bookings, setBookings] = useState([]);
  const [open, setOpen] = useState(false);
  const [loadingDropdown, setLoadingDropdown] = useState(false);
  const navigate = useNavigate();
  const wrapperRef = useRef(null);
  const pollRef = useRef(null);

  useEffect(() => {
    fetchUnreadCount();
    pollRef.current = setInterval(fetchUnreadCount, 8000);
    return () => clearInterval(pollRef.current);
  }, []);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchUnreadCount = async () => {
    try {
      const res = await getUnreadCount();
      setUnreadCount(res.data.unreadCount || 0);
    } catch (e) {
      console.error(e);
    }
  };

  const toggleOpen = async () => {
    const next = !open;
    setOpen(next);
    if (next) {
      setLoadingDropdown(true);
      try {
        const res = await getUnreadByBooking();
        setBookings(res.data);
      } catch (e) {
        console.error(e);
      }
      setLoadingDropdown(false);
    }
  };

  const goToChat = (bookingId) => {
    setOpen(false);
    navigate(`/chat/${bookingId}`);
  };

  return (
    <div className="relative" ref={wrapperRef}>
      <button
        onClick={toggleOpen}
        className="relative w-9 h-9 bg-white border border-gray-300 rounded-full flex items-center justify-center hover:bg-gray-50 transition"
      >
        <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        </svg>
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 bg-blue-600 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-80 bg-white border border-gray-200 rounded-2xl shadow-lg z-50 overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100">
            <p className="text-sm font-bold text-gray-900">Messages</p>
          </div>

          <div className="max-h-80 overflow-y-auto">
            {loadingDropdown ? (
              <div className="flex items-center justify-center py-8">
                <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : bookings.length === 0 ? (
              <div className="px-4 py-8 text-center">
                <p className="text-sm text-gray-400">No unread messages</p>
              </div>
            ) : (
              bookings.map((b) => (
                <button
                  key={b.bookingId}
                  onClick={() => goToChat(b.bookingId)}
                  className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition text-left border-b border-gray-50 last:border-0"
                >
                  <div className="w-9 h-9 bg-blue-100 rounded-xl flex items-center justify-center text-sm font-black text-blue-600 shrink-0">
                    {b.otherPersonName?.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900 truncate">{b.otherPersonName}</p>
                    <p className="text-xs text-gray-400 truncate">{b.serviceName}</p>
                  </div>
                  <span className="min-w-[20px] h-5 px-1.5 bg-blue-600 text-white text-[11px] font-bold rounded-full flex items-center justify-center shrink-0">
                    {b.unreadCount}
                  </span>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}