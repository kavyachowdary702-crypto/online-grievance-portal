import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Home = () => {
  const { user, isAdmin } = useAuth();

  // Debug information
  React.useEffect(() => {
    if (user) {
      console.log('DEBUG - Home page user:', user);
      console.log('DEBUG - User roles:', user.roles);
      console.log('DEBUG - isAdmin():', isAdmin());
    }
  }, [user, isAdmin]);

  return (
    <div className="container">
      <div className="card">
        <h1>Welcome to ResolveIT</h1>
        <p style={{ fontSize: '18px', marginTop: '20px' }}>
          Smart Grievance and Feedback Management System
        </p>
        <p style={{ marginTop: '20px' }}>
          ResolveIT provides a transparent and efficient platform for managing institutional 
          grievances. Submit complaints anonymously or with your verified account, and track 
          them in real-time.
        </p>
        
        <div style={{ marginTop: '30px' }}>
          {!user && (
            <>
              <h3>Get Started:</h3>
              <div style={{ display: 'flex', gap: '10px', marginTop: '15px' }}>
                <Link to="/anonymous">
                  <button className="btn btn-primary">Submit Anonymous Complaint</button>
                </Link>
                <Link to="/login">
                  <button className="btn btn-success">Login to Track Complaints</button>
                </Link>
                <Link to="/signup">
                  <button className="btn" style={{ backgroundColor: '#6c757d', color: 'white' }}>
                    Create Account
                  </button>
                </Link>
              </div>
            </>
          )}
          
          {user && !isAdmin() && (
            <>
              <h3>User Dashboard:</h3>
              <div style={{ display: 'flex', gap: '10px', marginTop: '15px' }}>
                <Link to="/submit-complaint">
                  <button className="btn btn-primary">Submit New Complaint</button>
                </Link>
                <Link to="/my-complaints">
                  <button className="btn btn-success">View My Complaints</button>
                </Link>
              </div>
            </>
          )}
          
          {user && isAdmin() && (
            <>
              <h3>Admin Panel:</h3>
              <div style={{ marginTop: '15px' }}>
                <Link to="/admin/dashboard">
                  <button className="btn btn-primary">Go to Admin Dashboard</button>
                </Link>
              </div>
            </>
          )}
        </div>
        
      
      </div>
    </div>
  );
};

export default Home;
