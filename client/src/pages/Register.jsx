import React, { useState, useContext } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import authBg from '../assets/auth-bg.png';
import './Auth.css';

const Register = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('student');
  const [error, setError] = useState('');
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    try {
      const res = await fetch(`${window.API_BASE_URL || 'http://localhost:5000'}/api/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name, email, password, role }),
      });

      const data = await res.json();

      if (res.ok) {
        login(data.user, data.token);
        if (data.user.role === 'instructor') {
          navigate('/instructor/dashboard');
        } else {
          navigate('/dashboard');
        }
      } else {
        setError(data.message || 'Registration failed');
      }
    } catch (err) {
      setError('An error occurred. Please try again later.');
    }
  };

  return (
    <div className="auth-page-wrapper">
      <div className="auth-hero-section">
        <img src={authBg} alt="Abstract Background" className="auth-bg-image" />
        <div className="auth-hero-overlay"></div>
        <div className="auth-hero-content">
          <h1>Start Your Journey.</h1>
          <p>Join a community of ambitious learners and expert instructors. Unleash your full potential.</p>
        </div>
      </div>

      <div className="auth-form-section">
        <div className="auth-card">
          <div className="auth-header">
            <h2>Create Account</h2>
            <p className="auth-subtitle">Join us to start learning or teaching today.</p>
          </div>
          
          {error && <div className="auth-error">
            <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
            {error}
          </div>}
          
          <form onSubmit={handleSubmit} className="auth-form">
            <div className="form-group">
              <label htmlFor="name">Full Name</label>
              <input
                type="text"
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="John Doe"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="email">Email address</label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
                required
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="password">Password</label>
              <input
                type="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Create a strong password"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="role">I want to:</label>
              <select 
                id="role" 
                value={role} 
                onChange={(e) => setRole(e.target.value)}
                className="role-select"
              >
                <option value="student">Learn (Student)</option>
                <option value="instructor">Teach (Instructor)</option>
              </select>
            </div>
            
            <button type="submit" className="auth-button">Create Account</button>
          </form>
          
          <div className="auth-footer">
            <p>Already have an account? <Link to="/login">Log in</Link></p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;
