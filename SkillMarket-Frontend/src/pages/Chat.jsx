import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import axios from '../api/axios';

export default function Chat() {
  const { bookingId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [bookingInfo, setBookingInfo] = useState(null);
  const [error, setError] = useState('');
  const bottomRef = useRef(null);
  const pollRef = useRef(null);

  useEffect(() => {
    fetchMessages();
    fetchBookingInfo();
    // Poll every 3 seconds
    pollRef.current = setInterval(fetchMessages, 3000);
    return () => clearInterval(pollRef.current);
  }, [bookingId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const fetchMessages = async () => {
    try {
      const res = await axios.get(`/messages/${bookingId}`);
      setMessages(res.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const fetchBookingInfo = async () => {
  try {
    const res = await axios.get(`/bookings/my-bookings`);
    const booking = res.data.find(b => b.id === parseInt(bookingId));
    if (booking) setBookingInfo(booking);
  } catch (e) {
    // try provider bookings
    try {
      const res = await axios.get(`/bookings/provider-bookings`);
      const booking = res.data.find(b => b.id === parseInt(bookingId));
      if (booking) setBookingInfo(booking);
    } catch (e2) { console.error(e2); }
  }
};

  const sendMessage = async () => {
    const content = input.trim();
    if (!content) return;
    setSending(true);
    setInput('');
    try {
      const res = await axios.post(`/messages/${bookingId}`, { content });
      setMessages(prev => [...prev, res.data]);
    } catch (e) {
      setError('Failed to send message.');
      setInput(content);
    }
    setSending(false);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const formatTime = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
  };

  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    if (date.toDateString() === today.toDateString()) return 'Today';
    if (date.toDateString() === yesterday.toDateString()) return 'Yesterday';
    return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
  };

  // Group messages by date
  const groupedMessages = messages.reduce((groups, msg) => {
    const date = formatDate(msg.createdAt);
    if (!groups[date]) groups[date] = [];
    groups[date].push(msg);
    return groups;
  }, {});

  const otherPersonName = bookingInfo
  ? (user?.role === 'CLIENT' ? bookingInfo.providerName : bookingInfo.clientName)
  : 'Chat';

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">

      {/* Navbar */}
      <nav className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-3xl mx-auto px-6 h-16 flex items-center gap-4">
          <button onClick={() => navigate(-1)}
            className="text-gray-500 hover:text-gray-900 transition text-sm flex items-center gap-1 font-medium">
            ← Back
          </button>
          <div className="flex items-center gap-3 flex-1">
            <div className="w-9 h-9 bg-blue-100 rounded-xl flex items-center justify-center text-sm font-black text-blue-600">
              {otherPersonName?.charAt(0).toUpperCase()}
            </div>
            <div>
              <p className="text-sm font-bold text-gray-900">{otherPersonName}</p>
              <p className="text-xs text-gray-400">
                Booking #{bookingId} · {bookingInfo?.serviceName || '...'}
              </p>
            </div>
          </div>
          <span className="text-xs bg-green-100 text-green-700 border border-green-200 px-3 py-1 rounded-full font-semibold">
            ✓ ACCEPTED
          </span>
        </div>
      </nav>

      {/* Messages */}
      <div className="flex-1 max-w-3xl w-full mx-auto px-6 py-6 flex flex-col gap-4 overflow-y-auto">

        {loading ? (
          <div className="flex items-center justify-center flex-1 py-20">
            <div className="flex flex-col items-center gap-3">
              <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
              <p className="text-gray-400 text-sm">Loading messages...</p>
            </div>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center flex-1 py-20">
            <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center text-3xl mb-4">💬</div>
            <p className="text-gray-700 font-bold text-lg">Start the conversation</p>
            <p className="text-gray-400 text-sm mt-1">Send a message to {otherPersonName}</p>
          </div>
        ) : (
          Object.entries(groupedMessages).map(([date, msgs]) => (
            <div key={date}>
              {/* Date separator */}
              <div className="flex items-center gap-3 my-4">
                <div className="flex-1 h-px bg-gray-200" />
                <span className="text-xs text-gray-400 font-semibold bg-gray-100 px-3 py-1 rounded-full">{date}</span>
                <div className="flex-1 h-px bg-gray-200" />
              </div>

              <div className="flex flex-col gap-3">
                {msgs.map((msg, idx) => {
                  const isMe = msg.senderId === user?.id || msg.senderName === user?.name;
                  return (
                    <div key={msg.id || idx}
                      className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                      <div className={`flex items-end gap-2 max-w-[75%] ${isMe ? 'flex-row-reverse' : 'flex-row'}`}>
                        {/* Avatar */}
                        {!isMe && (
                          <div className="w-7 h-7 rounded-xl bg-gray-200 flex items-center justify-center text-xs font-black text-gray-600 shrink-0 mb-0.5">
                            {msg.senderName?.charAt(0).toUpperCase()}
                          </div>
                        )}
                        <div>
                          {!isMe && (
                            <p className="text-xs text-gray-400 font-medium mb-1 ml-1">{msg.senderName}</p>
                          )}
                          <div className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
                            isMe
                              ? 'bg-blue-600 text-white rounded-br-md'
                              : 'bg-white text-gray-800 border border-gray-100 rounded-bl-md shadow-sm'
                          }`}>
                            {msg.content}
                          </div>
                          <p className={`text-xs text-gray-400 mt-1 ${isMe ? 'text-right' : 'text-left ml-1'}`}>
                            {formatTime(msg.createdAt)}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))
        )}

        {error && (
          <p className="text-xs text-red-500 text-center">{error}</p>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="bg-white border-t border-gray-200 sticky bottom-0">
        <div className="max-w-3xl mx-auto px-6 py-4 pr-24">
          <div className="flex items-end gap-3">
            <div className="flex-1 bg-gray-100 rounded-2xl px-4 py-3 flex items-end gap-2">
              <textarea
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Type a message..."
                rows={1}
                className="flex-1 bg-transparent text-sm text-gray-800 placeholder-gray-400 outline-none resize-none max-h-32"
                style={{ scrollbarWidth: 'none' }}
              />
            </div>
            <button
              onClick={sendMessage}
              disabled={sending || !input.trim()}
              className="w-11 h-11 bg-blue-600 text-white rounded-2xl flex items-center justify-center hover:bg-blue-700 transition disabled:opacity-40 disabled:cursor-not-allowed shrink-0">
              {sending ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <svg className="w-5 h-5 rotate-90" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
              )}
            </button>
          </div>
          <p className="text-xs text-gray-400 mt-2 text-center">Press Enter to send · Shift+Enter for new line</p>
        </div>
      </div>
    </div>
  );
}