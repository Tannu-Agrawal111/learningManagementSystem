import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  User, Mail, BookOpen, Award, Users, 
  ArrowLeft, Loader2, Globe, MapPin, Briefcase,
  Star, TrendingUp, Calendar
} from 'lucide-react';
import './Student.css';

const InstructorProfileView = () => {
  const { instructorId } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch_ = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await fetch(`http://localhost:5000/api/instructor/public/${instructorId}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) setData(await res.json());
      } catch (e) { console.error(e); }
      finally { setLoading(false); }
    };
    fetch_();
  }, [instructorId]);

  if (loading) return (
    <div className="dashboard-container" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
      <Loader2 className="animate-spin text-primary" size={40} />
    </div>
  );

  if (!data) return (
    <div className="dashboard-container"><div className="empty-state"><h2>Instructor not found</h2><Link to="/student/catalog" className="btn-primary" style={{ marginTop: '1rem' }}>Back to Catalog</Link></div></div>
  );

  const { instructor, courses } = data;
  const initials = instructor.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);

  return (
    <div className="dashboard-container student-container" style={{ maxWidth: '1200px', padding: '100px 2rem 2rem' }}>
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
          marginBottom: '2rem', 
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
      <style>{`
        .instructor-profile-grid {
          display: grid;
          grid-template-columns: 1fr 3fr;
          gap: 2.5rem;
          align-items: start;
        }
        @media (max-width: 1024px) {
          .instructor-profile-grid {
            grid-template-columns: 1fr;
          }
          .instructor-sidebar {
            position: static !important;
            margin-bottom: 2rem;
          }
        }
        @media (max-width: 768px) {
          .student-container { padding: 80px 1rem 1rem !important; }
        }
      `}</style>
 
      <div className="instructor-profile-grid">
        {/* Sidebar: Profile Info */}
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="glass-panel instructor-sidebar" style={{ padding: '2.5rem', textAlign: 'center', position: 'sticky', top: '2rem' }}>
          <div style={{ width: '140px', height: '140px', borderRadius: '50%', background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '3rem', fontWeight: '900', color: 'white', margin: '0 auto 1.5rem', boxShadow: '0 20px 40px rgba(99,102,241,0.2)', overflow: 'hidden', border: '4px solid white' }}>
              {instructor.avatar ? <img src={instructor.avatar} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : initials}
          </div>
          
          <h1 style={{ fontSize: '1.8rem', fontWeight: '900', marginBottom: '0.5rem', lineHeight: '1.2' }}>{instructor.name}</h1>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1.5rem' }}>
            <span style={{ padding: '0.3rem 0.8rem', background: 'rgba(99,102,241,0.1)', color: 'var(--primary)', borderRadius: '20px', fontSize: '0.7rem', fontWeight: '800', textTransform: 'uppercase' }}>Expert Instructor</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', textAlign: 'left', marginTop: '2rem', paddingTop: '2rem', borderTop: '1px solid var(--border-color)' }}>
            {instructor.headline && (
              <div style={{ display: 'flex', alignItems: 'start', gap: '0.75rem' }}>
                <Briefcase size={18} className="text-primary" style={{ marginTop: '2px' }} />
                <div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: '700', textTransform: 'uppercase' }}>Designation</div>
                  <div style={{ fontSize: '0.9rem', fontWeight: '600' }}>{instructor.headline}</div>
                </div>
              </div>
            )}
            {instructor.experience && (
              <div style={{ display: 'flex', alignItems: 'start', gap: '0.75rem' }}>
                <Award size={18} className="text-secondary" style={{ marginTop: '2px' }} />
                <div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: '700', textTransform: 'uppercase' }}>Experience</div>
                  <div style={{ fontSize: '0.9rem', fontWeight: '600' }}>{instructor.experience}</div>
                </div>
              </div>
            )}
          </div>

          <div style={{ marginTop: '2rem', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="glass-panel" style={{ padding: '1rem', background: 'var(--bg-subtle)' }}>
              <div style={{ fontSize: '1.2rem', fontWeight: '900', color: 'var(--primary)' }}>{instructor.total_courses || courses.length}</div>
              <div style={{ fontSize: '0.65rem', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Courses</div>
            </div>
            <div className="glass-panel" style={{ padding: '1rem', background: 'var(--bg-subtle)' }}>
              <div style={{ fontSize: '1.2rem', fontWeight: '900', color: 'var(--secondary)' }}>{instructor.total_students || 0}</div>
              <div style={{ fontSize: '0.65rem', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Students</div>
            </div>
          </div>
        </motion.div>

        {/* Main Content */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2.5rem' }}>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="glass-panel" style={{ padding: '2.5rem' }}>
            <h2 style={{ marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}><User size={24} className="text-primary" /> About Me</h2>
            <p style={{ fontSize: '1.1rem', lineHeight: '1.8', color: 'var(--text-secondary)', margin: 0 }}>
              {instructor.bio || "This instructor is dedicated to sharing high-quality knowledge and helping students achieve their career goals through practical, project-based learning."}
            </p>
          </motion.div>

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
                    <div style={{ height: '160px', background: 'linear-gradient(135deg, #10b981, #059669)', borderRadius: '12px', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', position: 'relative', overflow: 'hidden' }}>
                        <div style={{ position: 'absolute', inset: 0, background: 'url("https://www.transparenttextures.com/patterns/cubes.png")', opacity: 0.2 }}></div>
                        <BookOpen size={56} opacity={0.3} style={{ position: 'relative', zIndex: 1 }} />
                        {course.average_rating > 0 && (
                            <div style={{ position: 'absolute', top: '0.75rem', left: '0.75rem', background: 'rgba(255,255,255,0.95)', color: '#f59e0b', padding: '0.25rem 0.75rem', borderRadius: '20px', fontSize: '0.8rem', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '0.3rem', boxShadow: '0 4px 6px rgba(0,0,0,0.05)', zIndex: 2 }}>
                                <Star size={14} fill="#f59e0b" /> {Number(course.average_rating).toFixed(1)}
                            </div>
                        )}
                    </div>
                    <h3 style={{ fontSize: '1.2rem', marginBottom: '0.75rem', fontWeight: '800', lineHeight: '1.3' }}>{course.title}</h3>
                    <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '1.5rem', display: '-webkit-box', WebkitLineClamp: '2', WebkitBoxOrient: 'vertical', overflow: 'hidden', lineHeight: '1.5' }}>{course.description}</p>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'auto', paddingTop: '1.25rem', borderTop: '1px solid var(--border-color)' }}>
                        <span style={{ fontWeight: '900', fontSize: '1.2rem', color: '#10b981' }}>
                            FREE
                        </span>
                        <Link to={`/student/courses/${course.id}/preview`} className="enroll-btn" style={{ fontSize: '0.85rem', padding: '0.6rem 1.2rem', boxShadow: 'none', width: 'auto' }}>View Details</Link>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default InstructorProfileView;
