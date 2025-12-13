import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import Login from './pages/Login';
import Signup from './pages/Signup';
import AnonymousComplaint from './pages/AnonymousComplaint';
import SubmitComplaint from './pages/SubmitComplaint';
import MyComplaints from './pages/MyComplaints';
import AdminDashboard from './pages/AdminDashboard';
import OfficerDashboard from './pages/OfficerDashboard';
import Reports from './pages/Reports';

const PrivateRoute = ({ children, adminOnly = false, officerOnly = false, adminOrOfficer = false }) => {
  const { user, isAdmin, isOfficer, loading } = useAuth();
  
  if (loading) return <div>Loading...</div>;
  
  if (!user) {
    return <Navigate to="/login" />;
  }
  
  if (adminOnly && !isAdmin()) {
    return <Navigate to="/" />;
  }
  
  if (officerOnly && !isOfficer()) {
    return <Navigate to="/" />;
  }
  
  if (adminOrOfficer && !isAdmin() && !isOfficer()) {
    return <Navigate to="/" />;
  }
  
  return children;
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <Navbar />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/anonymous" element={<AnonymousComplaint />} />
          <Route 
            path="/submit-complaint" 
            element={
              <PrivateRoute>
                <SubmitComplaint />
              </PrivateRoute>
            } 
          />
          <Route 
            path="/my-complaints" 
            element={
              <PrivateRoute>
                <MyComplaints />
              </PrivateRoute>
            } 
          />
          <Route 
            path="/admin/dashboard" 
            element={
              <PrivateRoute adminOnly={true}>
                <AdminDashboard />
              </PrivateRoute>
            } 
          />
          <Route 
            path="/officer/dashboard" 
            element={
              <PrivateRoute officerOnly={true}>
                <OfficerDashboard />
              </PrivateRoute>
            } 
          />
          <Route 
            path="/reports" 
            element={
              <PrivateRoute adminOrOfficer={true}>
                <Reports />
              </PrivateRoute>
            } 
          />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
