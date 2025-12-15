import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import MaterialButton from '../components/MaterialButton';

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
                  <MaterialButton variant="contained">Submit Anonymous Complaint</MaterialButton>
                </Link>
                <Link to="/login">
                  <MaterialButton variant="contained">Login to Track Complaints</MaterialButton>
                </Link>
                <Link to="/signup">
                  <MaterialButton variant="outlined">Create Account</MaterialButton>
                </Link>
              </div>
            </>
          )}
          
          {user && !isAdmin() && (
            <>
              <h3>User Dashboard:</h3>
              <div style={{ display: 'flex', gap: '10px', marginTop: '15px' }}>
                <Link to="/submit-complaint">
                  <MaterialButton variant="contained">Submit New Complaint</MaterialButton>
                </Link>
                <Link to="/my-complaints">
                  <MaterialButton variant="contained">View My Complaints</MaterialButton>
                </Link>
              </div>
            </>
          )}
          
          {user && isAdmin() && (
            <>
              <h3>Admin Panel:</h3>
              <div style={{ marginTop: '15px' }}>
                <Link to="/admin/dashboard">
                  <MaterialButton variant="contained">Go to Admin Dashboard</MaterialButton>
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
