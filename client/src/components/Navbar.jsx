import React, { useContext, useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import './Navbar.css';

const Navbar = () => {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const location = useLocation();
  const [scrolled, setScrolled] = useState(false);
  const [avatarSrc, setAvatarSrc] = useState(null);

  // Scroll glassmorphism effect
  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Fetch avatar whenever user changes or profile page is left
  useEffect(() => {
    if (!user) { setAvatarSrc(null); return; }
    const fetchAvatar = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await fetch('http://localhost:5000/api/auth/profile', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          setAvatarSrc(data.user.avatar || null);
        }
      } catch { /* silent */ }
    };
    fetchAvatar();
  }, [user, location.pathname]); // re-fetch every time route changes (catches post-save navigations)

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  if (location.pathname === '/login' || location.pathname === '/register') return null;

  const initials = user ? user.name.charAt(0).toUpperCase() : '?';

  return (
    <nav className={`navbar ${scrolled ? 'navbar-scrolled' : ''}`}>
      <div className="navbar-container">
        <div className="navbar-logo">
          <div className="logo-icon"></div>
          <span>Elevate</span>
        </div>

        <div className="navbar-menu">
          {user ? (
            <>
              <Link to="/profile" className="user-profile" style={{ textDecoration: 'none' }}
                title="View / Edit Profile">
                <div className="avatar" style={{ overflow: 'hidden', padding: 0 }}>
                  {avatarSrc
                    ? <img src={avatarSrc} alt="avatar"
                        style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} />
                    : initials}
                </div>
                <div className="user-details">
                  <span className="user-name">{user.name}</span>
                  <span className="user-role">{user.role}</span>
                </div>
              </Link>
              <button onClick={handleLogout} className="nav-btn-outline">
                Logout
              </button>
            </>
          ) : (
            <>
              <Link to="/login"    className="nav-link">Log in</Link>
              <Link to="/register" className="nav-btn-primary">Sign up</Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
