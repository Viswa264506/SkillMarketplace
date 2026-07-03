import { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('user');
    return saved ? JSON.parse(saved) : null;
  });

  // Fetch full profile on mount if logged in
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) return;
    axios.get(`${import.meta.env.VITE_API_URL}/auth/profile`, {
      headers: { Authorization: `Bearer ${token}` }
    }).then(res => {
      const fullUser = {
        name: res.data.name,
        email: res.data.email,
        role: res.data.role,
        profileImageUrl: res.data.profileImageUrl,
        phoneNumber: res.data.phoneNumber,
      };
      localStorage.setItem('user', JSON.stringify(fullUser));
      setUser(fullUser);
    }).catch(() => {});
  }, []);

  const login = (userData, token, refreshToken) => {
    if (token) localStorage.setItem('token', token);
    if (refreshToken) localStorage.setItem('refreshToken', refreshToken);
    localStorage.setItem('user', JSON.stringify(userData));
    setUser(userData);
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, setUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
