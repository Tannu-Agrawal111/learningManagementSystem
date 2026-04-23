import React, { useState, useEffect, useContext } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Plus, 
  Users, 
  FileText, 
  BarChart2, 
  ArrowRight, 
  BookOpen,
  LayoutDashboard,
  Loader2,
  Globe,
  Edit,
  X,
  ExternalLink,
  ChevronRight,
  TrendingUp
} from 'lucide-react';
import { AuthContext } from '../context/AuthContext';
import './Instructor.css';

const InstructorDashboard = () => {
  const { user } = useContext(AuthContext);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingCourse, setEditingCourse] = useState(null);
  const [editTitle, setEditTitle] = useState('');
  const [editDesc, setEditDesc] = useState('');

  useEffect(() => {
    fetchCourses();
  }, []);

  const fetchCourses = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('http://localhost:5000/api/instructor/courses', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setCourses(data);
      }
    } catch (err) {
      console.error('Failed to fetch courses', err);
    } finally {
      setLoading(false);
    }
  };

  const handleEditCourse = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`http://localhost:5000/api/instructor/courses/${editingCourse.id}/edit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ title: editTitle, description: editDesc }),
      });
      if (res.ok) {
        setEditingCourse(null);
        fetchCourses();
      }
    } catch (err) {
      alert('Failed to update course');
    }
  };

  const myCourses = courses.filter(c => c.instructor_id === user.id);
  const otherCourses = courses.filter(c => c.instructor_id !== user.id);

  if (loading) {
    return (
      <div className="dashboard-container" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
        <Loader2 className="animate-spin text-primary" size={40} />
      </div>
    );
  }

  return (
    <div className="dashboard-container instructor-container">
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="dashboard-header"
        style={{ marginBottom: '2rem' }}
      >
        <div>
          <h1 style={{ fontSize: '2.5rem', fontWeight: '800' }}>Instructor <span className="text-gradient">Hub</span></h1>
          <p style={{ fontSize: '1.1rem', color: 'var(--text-secondary)' }}>Welcome back, {user.name}. Manage your academy and explore others.</p>
        </div>
        <Link to="/instructor/courses/new" className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Plus size={20} /> Create New Course
        </Link>
      </motion.div>

      {/* Quick Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem', marginBottom: '3rem' }}>
        <div className="stat-card glass-panel" style={{ padding: '1.5rem' }}>
          <div style={{ color: 'var(--primary)', marginBottom: '0.5rem' }}><Users size={24} /></div>
          <div style={{ fontSize: '1.5rem', fontWeight: '800' }}>{myCourses.reduce((acc, c) => acc + (c.total_students || 0), 0)}</div>
          <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>My Total Students</div>
        </div>
        <div className="stat-card glass-panel" style={{ padding: '1.5rem' }}>
          <div style={{ color: 'var(--secondary)', marginBottom: '0.5rem' }}><BookOpen size={24} /></div>
          <div style={{ fontSize: '1.5rem', fontWeight: '800' }}>{myCourses.length}</div>
          <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>My Active Courses</div>
        </div>
        <div className="stat-card glass-panel" style={{ padding: '1.5rem' }}>
          <div style={{ color: 'var(--accent)', marginBottom: '0.5rem' }}><Globe size={24} /></div>
          <div style={{ fontSize: '1.5rem', fontWeight: '800' }}>{courses.length}</div>
          <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Global Library Count</div>
        </div>
      </div>

      <div className="section-header" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
        <TrendingUp size={24} className="text-primary" />
        <h2 style={{ fontSize: '1.75rem' }}>My Courses</h2>
      </div>

      {myCourses.length === 0 ? (
        <div className="empty-state glass-panel" style={{ padding: '3rem', textAlign: 'center', marginBottom: '3rem' }}>
          <LayoutDashboard size={48} style={{ margin: '0 auto 1rem', color: 'var(--text-muted)' }} />
          <h3>No courses created yet</h3>
          <p>Start by creating your first educational masterpiece.</p>
        </div>
      ) : (
        <div className="courses-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '2rem', marginBottom: '4rem' }}>
          {myCourses.map((course, index) => (
            <motion.div 
              key={course.id} 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="course-card-premium glass-panel"
            >
              <div style={{ padding: '1.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                  <div className="course-icon-wrapper" style={{ background: 'var(--primary-light)', color: 'white', padding: '0.75rem', borderRadius: 'var(--radius-lg)' }}>
                    <BookOpen size={20} />
                  </div>
                  <button onClick={() => {
                    setEditingCourse(course);
                    setEditTitle(course.title);
                    setEditDesc(course.description);
                  }} className="icon-btn" style={{ padding: '0.5rem', borderRadius: '50%', background: 'var(--bg-subtle)' }}>
                    <Edit size={16} />
                  </button>
                </div>
                <h3 style={{ fontSize: '1.25rem', marginBottom: '0.5rem' }}>{course.title}</h3>
                <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '1.5rem', minHeight: '3em' }}>{course.description || "No description provided."}</p>
                <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem' }}>
                  <div style={{ fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <Users size={14} className="text-primary" /> {course.total_students || 0} Students
                  </div>
                  <div style={{ fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <FileText size={14} className="text-secondary" /> {course.total_lessons || 0} Lessons
                  </div>
                </div>
                <Link to={`/instructor/courses/${course.id}`} className="btn-primary" style={{ width: '100%', textDecoration: 'none', display: 'flex', justifyContent: 'center', gap: '0.5rem' }}>
                  Manage Content <ArrowRight size={18} />
                </Link>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      <div className="section-header" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
        <Globe size={24} className="text-secondary" />
        <h2 style={{ fontSize: '1.75rem' }}>Global Instructor Feed</h2>
      </div>

      <div className="courses-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '2rem' }}>
        {otherCourses.map((course, index) => (
          <motion.div 
            key={course.id} 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: index * 0.1 }}
            className="course-card-premium glass-panel"
            style={{ opacity: 0.85 }}
          >
            <div style={{ padding: '1.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: '700', background: 'var(--bg-subtle)', padding: '0.25rem 0.75rem', borderRadius: '100px', color: 'var(--text-secondary)' }}>
                  By {course.instructor_name}
                </span>
                <Globe size={16} className="text-muted" />
              </div>
              <h3 style={{ fontSize: '1.25rem', marginBottom: '0.5rem' }}>{course.title}</h3>
              <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>{course.description || "No description provided."}</p>
              <Link to={`/instructor/courses/${course.id}`} className="nav-btn-outline" style={{ width: '100%', justifyContent: 'center', gap: '0.5rem', textDecoration: 'none' }}>
                View Curriculum <ExternalLink size={18} />
              </Link>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Edit Course Modal */}
      <AnimatePresence>
        {editingCourse && (
          <div className="modal-overlay" onClick={() => setEditingCourse(null)}>
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="modal-content glass-panel" 
              onClick={e => e.stopPropagation()}
              style={{ maxWidth: '500px', padding: '2rem' }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <h3 style={{ fontSize: '1.5rem' }}>Edit Course Details</h3>
                <button onClick={() => setEditingCourse(null)} className="close-btn"><X size={24} /></button>
              </div>
              <form onSubmit={handleEditCourse}>
                <div style={{ marginBottom: '1.5rem' }}>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600' }}>Course Title</label>
                  <input className="input-field" value={editTitle} onChange={e => setEditTitle(e.target.value)} required />
                </div>
                <div style={{ marginBottom: '1.5rem' }}>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600' }}>Description</label>
                  <textarea className="input-field" value={editDesc} onChange={e => setEditDesc(e.target.value)} rows="4" required style={{ resize: 'vertical' }} />
                </div>
                <button type="submit" className="btn-primary" style={{ width: '100%', padding: '1rem' }}>Save Changes</button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default InstructorDashboard;
