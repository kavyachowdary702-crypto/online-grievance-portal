import React, { createContext, useState, useContext, useEffect } from 'react';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState(null);

  useEffect(() => {
    const storedToken = localStorage.getItem('token');
    const userData = localStorage.getItem('user');

    if (storedToken && userData) {
      setToken(storedToken);
      setUser(JSON.parse(userData));
    }

    setLoading(false);
  }, []);

  // ✅ Log token whenever it changes
  useEffect(() => {
    if (token) {
      console.log('Current JWT Token:', token);
    } 
  }, [token]);

  const login = (newToken, userData) => {
    localStorage.setItem('token', newToken);
    localStorage.setItem('user', JSON.stringify(userData));
    setToken(newToken);
    setUser(userData);
    console.log('JWT token stored:', newToken);
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setToken(null);
    setUser(null);
    console.log('User logged out, JWT token cleared');
  };

  const isAdmin = () => user?.roles?.includes('ADMIN');
  const isOfficer = () => user?.roles?.includes('OFFICER');
  const isStaff = () => isAdmin() || isOfficer();

  return (
    <AuthContext.Provider value={{ 
      user, 
      token, 
      login, 
      logout, 
      isAdmin, 
      isOfficer,
      isStaff,
      loading 
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
