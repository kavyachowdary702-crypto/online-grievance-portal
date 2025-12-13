import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import NotificationCenter from './NotificationCenter';

const Navbar = () => {
  const { user, logout, isAdmin, isOfficer, isStaff } = useAuth();

  const getUserRole = () => {
    if (isAdmin()) return 'Administrator';
    if (isOfficer()) return 'Officer';
    return 'User';
  };

  // Debug: Log user roles
  React.useEffect(() => {
    if (user) {
      console.log('Current user:', user);
      console.log('User roles:', user.roles);
      console.log('isAdmin():', isAdmin());
      console.log('isOfficer():', isOfficer());
    }
  }, [user, isAdmin, isOfficer]);

  return (
    <div className="navbar">
      <div className="d-flex align-items-center gap-2">
        <h1>🎯 ResolveIT Smart</h1>
      </div>
      <nav>
        <Link to="/">🏠 Home</Link>
        
        {!user && (
          <>
            <Link to="/login">🔐 Login</Link>
            <Link to="/signup">📝 Sign Up</Link>
            <Link to="/anonymous">📝 Anonymous Report</Link>
          </>
        )}
        
        {/* Regular Users - Only show if user is NOT admin and NOT officer */}
        {user && !isAdmin() && !isOfficer() && (
          <>
            <Link to="/submit-complaint">📝 Submit Complaint</Link>
            <Link to="/my-complaints">📋 My Complaints</Link>
          </>
        )}
        
        {/* Admin Users - Show admin dashboard */}
        {user && isAdmin() && (
          <Link to="/admin/dashboard">👨‍💼 Admin Dashboard</Link>
        )}
        
        {/* Officer Users - Show officer dashboard (officers should not see user options) */}
        {user && isOfficer() && (
          <Link to="/officer/dashboard">👮‍♂️ Officer Dashboard</Link>
        )}
        
        {/* Reports - Show for Admin and Officer users */}
        {user && (isAdmin() || isOfficer()) && (
          <Link to="/reports">📊 Reports</Link>
        )}
        
        {user && (
          <div className="d-flex align-items-center gap-3" style={{ marginLeft: 'var(--space-4)' }}>
            <NotificationCenter />
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: 'var(--space-2)',
              padding: 'var(--space-2) var(--space-3)',
              backgroundColor: 'var(--primary-50)',
              borderRadius: 'var(--radius-lg)',
              border: '1px solid var(--primary-200)'
            }}>
              <div style={{
                width: 32,
                height: 32,
                borderRadius: '50%',
                background: 'linear-gradient(135deg, var(--primary-500), var(--primary-600))',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white',
                fontSize: 'var(--font-size-sm)',
                fontWeight: 600
              }}>
                {user.username?.charAt(0).toUpperCase()}
              </div>
              <div>
                <div style={{ 
                  fontWeight: 600, 
                  fontSize: 'var(--font-size-sm)',
                  color: 'var(--primary-700)'
                }}>
                  {user.username}
                </div>
                <div style={{ 
                  fontSize: 'var(--font-size-xs)', 
                  color: 'var(--primary-600)',
                  fontWeight: 500
                }}>
                  {getUserRole()}
                </div>
              </div>
            </div>
            <a 
              href="#" 
              onClick={logout} 
              style={{ cursor: 'pointer' }}
              className="btn btn-secondary btn-sm"
            >
              🚪 Logout
            </a>
          </div>
        )}
      </nav>
    </div>
  );
};

export default Navbar;
