import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { authService } from '../services/api';
import MaterialButton from '../components/MaterialButton';

const Signup = () => {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    fullName: '',
    role: 'USER'
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    try {
      const roles = [formData.role];
      await authService.signup(
        formData.username,
        formData.email,
        formData.password,
        formData.fullName,
        roles
      );
      setSuccess('Account created successfully! Redirecting to login...');
      setTimeout(() => navigate('/login'), 2000);
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed');
    }
  };

  return (
    <div className="container">
      <div className="card" style={{ maxWidth: '500px', margin: '50px auto' }}>
        <h2 style={{  }}>Sign Up</h2>
        <form onSubmit={handleSubmit}>
          <div className={`md-field ${formData.username ? 'has-value' : ''}`}>
            <input id="signup-username" className="md-input" type="text" name="username" value={formData.username} onChange={handleChange} required minLength="3" />
            <label className="md-label" htmlFor="signup-username">Username</label>
          </div>
          <div className={`md-field ${formData.email ? 'has-value' : ''}`}>
            <input id="signup-email" className="md-input" type="email" name="email" value={formData.email} onChange={handleChange} required />
            <label className="md-label" htmlFor="signup-email">Email</label>
          </div>
          <div className={`md-field ${formData.fullName ? 'has-value' : ''}`}>
            <input id="signup-fullname" className="md-input" type="text" name="fullName" value={formData.fullName} onChange={handleChange} required />
            <label className="md-label" htmlFor="signup-fullname">Full Name</label>
          </div>
          <div className={`md-field ${formData.password ? 'has-value' : ''}`}>
            <input id="signup-password" className="md-input" type="password" name="password" value={formData.password} onChange={handleChange} required minLength="6" />
            <label className="md-label" htmlFor="signup-password">Password</label>
          </div>
          <div className={`md-field ${formData.role ? 'has-value' : ''}`}>
            <select id="signup-role" className="md-input" name="role" value={formData.role} onChange={handleChange}>
              <option value="USER">User</option>
              <option value="ADMIN">Admin</option>
              <option value="OFFICER">Officer</option>
            </select>
            <label className="md-label" htmlFor="signup-role">Role</label>
          </div>
          {error && <div className="error">{error}</div>}
          {success && <div className="success">{success}</div>}
          <MaterialButton type="submit" variant="contained" fullWidth>
            Sign Up
          </MaterialButton>
        </form>
        <p style={{ marginTop: '20px', textAlign: 'center' }}>
          Already have an account? <Link to="/login">Login</Link>
        </p>
      </div>
    </div>
  );
};

export default Signup;
