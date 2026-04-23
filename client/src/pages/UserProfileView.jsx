import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  User, Mail, BookOpen, Award, Users, 
  ArrowLeft, Loader2, Globe, MapPin, Briefcase,
  Star, TrendingUp, Calendar, GraduationCap
} from 'lucide-react';
import './Student.css';

const UserProfileView = () => {
  const { userId } = useParams();
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [courses, setCourses] = useState([]);

  useEffect(() => {
    const fetch_ = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await fetch(`http://localhost:5000/api/auth/profile/public/${userId}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
            const userData = await res.json();
            setUser(userData);
            
            // If instructor, also fetch their courses
            if (userData.role === 'instructor') {
                const resC = await fetch(`http://localhost:5000/api/instructor/public/${userId}`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (resC.ok) {
                    const dataC = await resC.json();
                    setCourses(dataC.courses || []);
                }
            }
        }
      } catch (e) { console.error(e); }
      finally { setLoading(false); }
    };
    fetch_();
  }, [userId]);

  if (loading) return (
    <div className="dashboard-container" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
      <Loader2 className="animate-spin text-primary" size={40} />
    </div>
  );

  if (!user) return (
    <div className="dashboard-container"><div className="empty-state"><h2>User not found</h2><Link to="/dashboard" className="btn-primary" style={{ marginTop: '1rem' }}>Back Home</Link></div></div>
  );

  const formatJoinDate = (isoStr) => {
    if (!isoStr) return 'Unknown';
    try {
      return new Date(isoStr).toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' });
    } catch {
      return 'Unknown';
    }
  };

  const initials = user.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  const joinDate = formatJoinDate(user.created_at);

  return (
    <div className="dashboard-container student-container" style={{ maxWidth: '1200px', padding: '100px 2rem 2rem' }}>
      
      {/* ── Back Navigation ── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem', flexWrap: 'wrap' }}>
        <Link 
          to="#"
          onClick={(e) => { 
            e.preventDefault(); 
            e.stopPropagation();
            navigate(-1); 
          }} 
          className="back-link" 
          style={{ 
            background: 'rgba(99,102,241,0.08)', 
            border: 'none', 
            cursor: 'pointer', 
            padding: '0.6rem 1.2rem', 
            borderRadius: '12px',
            display: 'flex', 
            alignItems: 'center', 
            gap: '0.6rem', 
            color: 'var(--primary)',
            fontWeight: '700',
            fontSize: '0.9rem',
            transition: 'all 0.2s',
            textDecoration: 'none',
            position: 'relative',
            zIndex: 10
          }}
        >
          <ArrowLeft size={18} /> Back to Dashboard
        </Link>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{ height: '20px', width: '1px', background: 'var(--border-color)' }}></span>
          <span style={{ fontWeight: '800', fontSize: '1.2rem', letterSpacing: '-0.02em' }}>
            <span style={{ color: 'var(--primary)' }}>E</span>levate
          </span>
        </div>
      </div>
 
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 320px), 1fr))', gap: '2.5rem', alignItems: 'start' }}>
        
        {/* Sidebar: Profile Info */}
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="glass-panel" style={{ padding: '2.5rem', textAlign: 'center', position: 'sticky', top: '2rem' }}>
          <div style={{ width: '120px', height: '120px', borderRadius: '50%', background: user.role === 'instructor' ? 'linear-gradient(135deg, #6366f1, #4f46e5)' : 'linear-gradient(135deg, #10b981, #059669)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2.5rem', fontWeight: '900', color: 'white', margin: '0 auto 1.5rem', boxShadow: '0 20px 40px rgba(0,0,0,0.1)', overflow: 'hidden', border: '4px solid white' }}>
              {user.avatar ? <img src={user.avatar} alt="avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : initials}
          </div>
          
          <h1 style={{ fontSize: '1.6rem', fontWeight: '900', marginBottom: '0.5rem', lineHeight: '1.2' }}>{user.name}</h1>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '2rem' }}>
            <span style={{ 
              padding: '0.3rem 1rem', 
              background: user.role === 'instructor' ? 'rgba(99,102,241,0.1)' : 'rgba(16,185,129,0.1)', 
              color: user.role === 'instructor' ? 'var(--primary)' : '#10b981', 
              borderRadius: '20px', fontSize: '0.75rem', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.05em' 
            }}>{user.role}</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', textAlign: 'left', marginTop: '1rem', paddingTop: '2rem', borderTop: '1px solid var(--border-color)' }}>
            {user.headline && (
              <InfoItem icon={<Briefcase size={16} />} label="Designation" value={user.headline} color="var(--primary)" />
            )}
            {user.experience && (
              <InfoItem icon={<Award size={16} />} label="Experience" value={user.experience} color="#10b981" />
            )}
            {user.location && (
              <InfoItem icon={<MapPin size={16} />} label="Location" value={user.location} color="#f43f5e" />
            )}
            {user.website && (
              <div style={{ display: 'flex', alignItems: 'start', gap: '0.75rem' }}>
                <Globe size={16} className="text-primary" style={{ marginTop: '2px', color: 'var(--primary)' }} />
                <div>
                  <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Website</div>
                  <a href={user.website.startsWith('http') ? user.website : `https://${user.website}`} target="_blank" rel="noopener noreferrer" style={{ fontSize: '0.88rem', fontWeight: '600', color: 'var(--primary)', textDecoration: 'none', wordBreak: 'break-all' }}>
                    {user.website.replace(/^https?:\/\//, '')}
                  </a>
                </div>
              </div>
            )}
            <InfoItem icon={<Calendar size={16} />} label="Member Since" value={joinDate} color="var(--text-muted)" />
          </div>
        </motion.div>

        {/* Main Content */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2.5rem' }}>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="glass-panel" style={{ padding: '2.5rem' }}>
            <h2 style={{ marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}><User size={24} className="text-primary" /> About {user.role === 'instructor' ? 'Instructor' : 'Student'}</h2>
            <p style={{ fontSize: '1.1rem', lineHeight: '1.8', color: 'var(--text-secondary)', margin: 0 }}>
              {user.bio || (user.role === 'instructor' ? "This instructor is dedicated to sharing knowledge." : "This student is on a learning journey.")}
            </p>
          </motion.div>

          {user.role === 'instructor' && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', margin: 0 }}><TrendingUp size={24} className="text-primary" /> Published Courses</h2>
                <div style={{ fontSize: '0.9rem', color: 'var(--text-muted)', fontWeight: '600' }}>Showing {courses.length} courses</div>
                </div>
                
                {courses.length === 0 ? (
                <div className="glass-panel" style={{ padding: '4rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                    <BookOpen size={48} style={{ margin: '0 auto 1.25rem', opacity: 0.2 }} />
                    <p style={{ fontSize: '1.1rem', margin: 0 }}>This instructor hasn't published any courses yet.</p>
                </div>
                ) : (
                <div className="catalog-grid">
                    {courses.map((course, idx) => (
                    <motion.div key={course.id} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 + (idx * 0.1) }}
                        className="catalog-card glass-panel" whileHover={{ y: -8 }}>
                        <div style={{ height: '160px', background: course.is_paid ? 'linear-gradient(135deg, #6366f1, #8b5cf6)' : 'linear-gradient(135deg, #10b981, #059669)', borderRadius: '12px', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', position: 'relative' }}>
                            <BookOpen size={56} opacity={0.3} />
                        </div>
                        <h3 style={{ fontSize: '1.2rem', marginBottom: '0.75rem', fontWeight: '800' }}>{course.title}</h3>
                        <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '1.5rem', display: '-webkit-box', WebkitLineClamp: '2', WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{course.description}</p>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'auto', paddingTop: '1.25rem', borderTop: '1px solid var(--border-color)' }}>
                            <span style={{ fontWeight: '900', fontSize: '1.2rem', color: course.is_paid ? 'var(--primary)' : '#10b981' }}>
                                {course.is_paid ? `₹${Number(course.price).toLocaleString('en-IN')}` : 'FREE'}
                            </span>
                            <Link to={`/student/courses/${course.id}/preview`} className="enroll-btn" style={{ fontSize: '0.85rem', padding: '0.6rem 1.2rem', boxShadow: 'none', width: 'auto' }}>View Details</Link>
                        </div>
                    </motion.div>
                    ))}
                </div>
                )}
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
};

// ── Sub-components ─────────────────────────────────────────────────────────────
const InfoItem = ({ icon, label, value, color }) => (
  <div style={{ display: 'flex', alignItems: 'start', gap: '0.75rem' }}>
    <div style={{ color: color, marginTop: '2px' }}>{icon}</div>
    <div>
      <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</div>
      <div style={{ fontSize: '0.9rem', fontWeight: '600', color: 'var(--text-primary)' }}>{value}</div>
    </div>
  </div>
);

export default UserProfileView;
