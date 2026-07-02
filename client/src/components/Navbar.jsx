import React, { useContext, useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
import './Navbar.css';

const Navbar = () => {
  const { user, logout } = useContext(AuthContext);
  const { unreadCount } = useNotification();
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
        const res = await fetch(`${window.API_BASE_URL || 'http://localhost:5000'}/api/auth/profile`, {
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
              {user.role === 'student' && (
                <>
                  <Link
                    to="/dashboard"
                    className={`nav-link ${location.pathname === '/dashboard' ? 'nav-link--active' : ''}`}
                  >
                    Dashboard
                  </Link>
                  <Link
                    to="/student/explore"
                    className={`nav-link ${location.pathname.startsWith('/student/explore') ? 'nav-link--active' : ''}`}
                  >
                    Explore
                  </Link>
                  <Link to="/dashboard/notifications">
                    <button className="nav-icon-btn" title="Notifications" aria-label="Notifications">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
                        stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
                        <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
                      </svg>
                      {unreadCount > 0 && (
                        <span className="notification-badge">{unreadCount}</span>
                      )}
                    </button>
                  </Link>
                </>
              )}
              {user.role === 'instructor' && (
                <>
                  <Link
                    to="/instructor/dashboard"
                    className={`nav-link ${location.pathname === '/instructor/dashboard' ? 'nav-link--active' : ''}`}
                  >
                    Dashboard
                  </Link>
                  <Link
                    to="/instructor/catalog"
                    className={`nav-link ${location.pathname === '/instructor/catalog' ? 'nav-link--active' : ''}`}
                  >
                    Courses
                  </Link>
                </>
              )}

              {/* Profile Icon Avatar */}
              <Link to="/profile" className="user-profile" style={{ textDecoration: 'none' }} title="View / Edit Profile">
                <div className="avatar" style={{ overflow: 'hidden', padding: 0 }}>
                  {avatarSrc
                    ? <img src={avatarSrc} alt="avatar"
                        style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} />
                    : initials}
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
