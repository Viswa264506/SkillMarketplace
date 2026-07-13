import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import Dashboard from './pages/Dashboard';
import MyServices from './pages/MyServices';
import BookService from './pages/BookService';
import MyBookings from './pages/MyBookings';
import ProviderBookings from './pages/ProviderBookings';
import LandingPage from './pages/LandingPage';
import Profile from './pages/Profile';
import AdminPanel from "./pages/AdminPanel";
import ProviderProfile from "./pages/ProviderProfile";
import VerifyOtp from './pages/auth/VerifyOtp';
import ForgotPassword from './pages/auth/ForgotPassword';
import OAuthCallback from './pages/auth/OAuthCallback';
import ChatWidget from "./components/ChatWidget";
import ProviderSetup from './pages/ProviderSetup';
import SearchResults from './pages/SearchResults';
import Chat from './pages/Chat';
import ServiceDetail from './pages/ServiceDetail';

function App() {

  useEffect(() => {
    fetch("https://your-backend.onrender.com/");
}, []);
  
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* Protected Routes */}
          <Route path="/dashboard" element={
            <ProtectedRoute><Dashboard /></ProtectedRoute>
          } />
          <Route path="/services" element={<Navigate to="/dashboard" replace />} />
          <Route path="/my-services" element={
            <ProtectedRoute><MyServices /></ProtectedRoute>
          } />
          <Route path="/book/:id" element={
            <ProtectedRoute><BookService /></ProtectedRoute>
          } />
          <Route path="/my-bookings" element={
            <ProtectedRoute><MyBookings /></ProtectedRoute>
          } />
          <Route path="/provider-bookings" element={
            <ProtectedRoute><ProviderBookings /></ProtectedRoute>
          } />
          <Route path="/profile" element={
  <ProtectedRoute><Profile /></ProtectedRoute>
} />

<Route path="/admin" element={
  <ProtectedRoute>
    <AdminPanel />
  </ProtectedRoute>
} />
<Route path="/provider/:id" element={<ProtectedRoute><ProviderProfile /></ProtectedRoute>} />
<Route path="/verify-otp" element={<VerifyOtp />} />
<Route path="/forgot-password" element={<ForgotPassword />} />
<Route path="/oauth/callback" element={<OAuthCallback />} />
<Route path="/provider-setup" element={<ProviderSetup />} />
<Route path="/search" element={<ProtectedRoute><SearchResults /></ProtectedRoute>} />
<Route path="/chat/:bookingId" element={<ProtectedRoute><Chat /></ProtectedRoute>} />
<Route path="/service/:id" element={<ServiceDetail />} />
        </Routes>
        <ChatWidget />
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
