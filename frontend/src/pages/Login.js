import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import MaterialButton from '../components/MaterialButton';
import { authService } from '../services/api';

const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    try {
      const response = await authService.login(username, password);
      const { token, id, username: user, email, roles } = response.data;
          // console.log("AuthProvider loaded with token:", token);
      login(token, { id, username: user, email, roles });
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid credentials');
    }
  };

  return (
    <div className="container">
      <div className="card" style={{ maxWidth: '500px', margin: '50px auto' }}>
        <h2>Login</h2>
        <form onSubmit={handleSubmit}>
          <div className={`md-field ${username ? 'has-value' : ''}`}>
            <input
              id="login-username"
              className="md-input"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
            <label className="md-label" htmlFor="login-username">Username</label>
          </div>
          <div className={`md-field ${password ? 'has-value' : ''}`}>
            <input
              id="login-password"
              className="md-input"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <label className="md-label" htmlFor="login-password">Password</label>
          </div>
          {error && <div className="error">{error}</div>}
          <MaterialButton type="submit" variant="contained" fullWidth>
            Login
          </MaterialButton>
        </form>
        <p style={{ marginTop: '20px', textAlign: 'center' }}>
          Don't have an account? <Link  to="/signup">Sign Up</Link>
        </p>
      </div>
    </div>
  );
};

export default Login;
