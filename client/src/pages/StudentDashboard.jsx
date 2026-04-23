import React, { useState, useEffect, useContext } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, AreaChart, Area
} from 'recharts';
import { 
  Search, 
  BookOpen, 
  User, 
  TrendingUp, 
  GraduationCap, 
  ArrowRight,
  Loader2,
  PieChart as PieChartIcon,
  Sparkles,
  Users,
  LogOut,
  Trash2,
  CreditCard
} from 'lucide-react';
import { AuthContext } from '../context/AuthContext';
import './Student.css';

const StudentDashboard = () => {
  const { user } = useContext(AuthContext);
  const [enrollments, setEnrollments] = useState([]);
  const [allCourses, setAllCourses] = useState([]);
  const [loading, setLoading]           = useState(true);
  const [unenrollingId, setUnenrollingId] = useState(null);
  const [activityData, setActivityData]   = useState([]);

  const fetchData = async () => {
    try {
      const token = localStorage.getItem('token');
      const [enrollRes, catalogRes] = await Promise.all([
        fetch('http://localhost:5000/api/student/enrollments', {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch('http://localhost:5000/api/student/courses', {
          headers: { 'Authorization': `Bearer ${token}` }
        })
      ]);

      if (enrollRes.ok && catalogRes.ok) {
        const enrollData = await enrollRes.json();
        const catalogData = await catalogRes.json();
        setEnrollments(enrollData);
        setAllCourses(catalogData);
      }

      // Fetch activity data
      const actRes = await fetch('http://localhost:5000/api/student/activity', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (actRes.ok) setActivityData(await actRes.json());
    } catch (err) {
      console.error('Failed to fetch data', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleUnenroll = async (enrollmentId) => {
    if (!window.confirm('Are you sure you want to unenroll? This will permanently delete your progress.')) return;
    
    setUnenrollingId(enrollmentId);
    try {
      const token = localStorage.getItem('token');
      // Using POST for maximum compatibility
      const res = await fetch(`http://localhost:5000/api/student/enrollments/${enrollmentId}/delete`, {
        method: 'POST',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      const data = await res.json();
      
      if (res.ok) {
        alert('Successfully unenrolled!');
        // Optimistic update
        setEnrollments(prev => prev.filter(e => e.enrollment_id !== enrollmentId));
        fetchData(); 
      } else {
        alert(`Unenroll failed: ${data.message || 'Unknown error'}`);
      }
    } catch (err) {
      console.error(err);
      alert('Network error during unenrollment. Please check your connection.');
    } finally {
      setUnenrollingId(null);
    }
  };

  const enrolledIds = enrollments.map(e => e.id);
  const recommendedCourses = allCourses.filter(c => !enrolledIds.includes(c.id)).slice(0, 6);

  const COLORS = ['#6366F1', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'];

  if (loading) {
    return (
      <div className="dashboard-container" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
        <Loader2 className="animate-spin text-primary" size={40} />
      </div>
    );
  }

  return (
    <div className="dashboard-container student-container">
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="dashboard-header" 
        style={{ marginBottom: '2.5rem', borderBottom: 'none' }}
      >
        <div>
          <h1 style={{ fontSize: '2.5rem', fontWeight: '800', letterSpacing: '-0.02em' }}>
            Hello, <span className="text-gradient">{user?.name.split(' ')[0]}</span>! ✨
          </h1>
          <p style={{ fontSize: '1.15rem', color: 'var(--text-secondary)', marginTop: '0.5rem' }}>
            {enrollments.length > 0 
              ? "Ready to pick up where you left off?" 
              : "Welcome to your learning journey. Let's find something exciting to learn today!"}
          </p>
        </div>
        <Link to="/student/catalog" className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', borderRadius: 'var(--radius-lg)' }}>
          <Search size={20} /> Browse Full Catalog
        </Link>
      </motion.div>

      {enrollments.length > 0 && (
        <div style={{ marginBottom: '4rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
            <h2 style={{ fontSize: '1.5rem', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <TrendingUp className="text-primary" size={24} /> My Learning
            </h2>
          </div>
          
          <div className="catalog-grid">
            {enrollments.map((course, index) => (
              <motion.div 
                key={course.id} 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="catalog-card glass-panel"
                whileHover={{ y: -8, boxShadow: 'var(--shadow-xl)' }}
              >
                <div style={{ position: 'relative', overflow: 'hidden', borderRadius: 'var(--radius-lg)', marginBottom: '1.25rem' }}>
                  <span className="course-badge" style={{ zIndex: 10 }}>In Progress</span>
                  <div style={{ height: '160px', background: 'linear-gradient(135deg, var(--primary), var(--primary-light))', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}>
                      <BookOpen size={64} opacity={0.5} />
                  </div>
                  <button 
                    onClick={(e) => { e.preventDefault(); handleUnenroll(course.enrollment_id); }}
                    className="unenroll-btn-icon"
                    title="Unenroll"
                    disabled={unenrollingId === course.enrollment_id}
                  >
                    {unenrollingId === course.enrollment_id ? <Loader2 className="animate-spin" size={14} /> : <Trash2 size={14} />}
                  </button>
                </div>
                
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                  <div className="instructor-name">
                    <User size={14} />
                    {course.instructor_name}
                  </div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                    <Users size={14} className="text-primary" /> {course.total_enrolled || 0} students
                  </div>
                </div>
                <h3 style={{ fontSize: '1.3rem', marginBottom: '0.75rem' }}>{course.title}</h3>
                
                <div className="progress-container" style={{ marginBottom: '1.5rem', marginTop: 'auto' }}>
                  <div className="progress-header">
                    <span>Course Progress</span>
                    <span style={{ color: 'var(--primary)', fontWeight: '800' }}>{course.progress_percentage || 0}%</span>
                  </div>
                  <div className="progress-bar-bg" style={{ height: '8px' }}>
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${course.progress_percentage || 0}%` }}
                      className="progress-bar-fill" 
                    ></motion.div>
                  </div>
                </div>
                
                <Link to={`/student/courses/${course.id}`} style={{textDecoration: 'none'}}>
                  <button className="enroll-btn" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', width: '100%' }}>
                    Continue <ArrowRight size={18} />
                  </button>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* Discovery Section */}
      <div style={{ marginBottom: '3rem' }}>
        <style>{`
          .horizontal-scroll-grid {
            display: flex !important;
            overflow-x: auto;
            gap: 2rem;
            padding: 0.5rem 0.5rem 1.5rem;
            margin: -0.5rem;
            scroll-snap-type: x mandatory;
            scrollbar-width: thin;
            scrollbar-color: var(--primary-light) transparent;
          }
          .horizontal-scroll-grid::-webkit-scrollbar {
            height: 6px;
          }
          .horizontal-scroll-grid::-webkit-scrollbar-track {
            background: transparent;
          }
          .horizontal-scroll-grid::-webkit-scrollbar-thumb {
            background-color: var(--primary-light);
            border-radius: 20px;
          }
          .horizontal-scroll-grid > div {
            flex: 0 0 320px;
            scroll-snap-align: start;
          }
          @media (max-width: 480px) {
            .horizontal-scroll-grid > div {
              flex: 0 0 280px;
            }
          }
        `}</style>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <h2 style={{ fontSize: '1.5rem', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <Sparkles className="text-accent" size={24} /> {enrollments.length === 0 ? "Recommended Courses" : "Expand Your Skills"}
          </h2>
          {enrollments.length > 0 && <Link to="/student/catalog" style={{ color: 'var(--primary)', fontWeight: '600', textDecoration: 'none', fontSize: '0.9rem' }}>See all courses →</Link>}
        </div>

        {recommendedCourses.length === 0 ? (
          <div className="glass-panel" style={{ padding: '3rem', textAlign: 'center', borderRadius: 'var(--radius-xl)' }}>
            <p style={{ color: 'var(--text-secondary)' }}>You've enrolled in everything we have! Amazing job. 🏆</p>
          </div>
        ) : (
          <div className="catalog-grid horizontal-scroll-grid">
            {recommendedCourses.map((course, index) => (
              <motion.div 
                key={course.id} 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 + (index * 0.1) }}
                className="catalog-card glass-panel"
                whileHover={{ y: -8, boxShadow: 'var(--shadow-xl)' }}
              >
                <div style={{ position: 'relative', overflow: 'hidden', borderRadius: 'var(--radius-lg)', marginBottom: '1.25rem' }}>
                  {course.is_paid === 1 && (
                    <span style={{ position: 'absolute', top: '0.75rem', right: '0.75rem', zIndex: 10, background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', color: 'white', padding: '0.3rem 0.8rem', borderRadius: '20px', fontSize: '0.75rem', fontWeight: '800' }}>
                      ₹{Number(course.price).toLocaleString('en-IN')}
                    </span>
                  )}
                  {!course.is_paid && (
                    <span style={{ position: 'absolute', top: '0.75rem', right: '0.75rem', zIndex: 10, background: 'linear-gradient(135deg, #10b981, #059669)', color: 'white', padding: '0.3rem 0.8rem', borderRadius: '20px', fontSize: '0.75rem', fontWeight: '800' }}>
                      FREE
                    </span>
                  )}
                  <div style={{ height: '160px', background: course.is_paid ? 'linear-gradient(135deg, #6366f1, #8b5cf6)' : 'linear-gradient(135deg, #F59E0B, #EF4444)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}>
                      {course.is_paid ? <CreditCard size={64} opacity={0.5} /> : <GraduationCap size={64} opacity={0.5} />}
                  </div>
                </div>
                
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                  <div className="instructor-name">
                    <User size={14} />
                    {course.instructor_name}
                  </div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                    <Users size={14} className="text-primary" /> {course.total_enrolled || 0}
                  </div>
                </div>

                <h3 style={{ fontSize: '1.3rem', marginBottom: '0.75rem' }}>{course.title}</h3>
                <p style={{ marginBottom: '2rem', fontSize: '0.95rem', color: 'var(--text-secondary)', display: '-webkit-box', WebkitLineClamp: '2', WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                  {course.description || "No description provided."}
                </p>
                
                <Link to={`/student/courses/${course.id}/preview`} style={{textDecoration: 'none', marginTop: 'auto'}}>
                  <button className="enroll-btn" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', width: '100%', background: 'var(--bg-subtle)', color: 'var(--text-primary)', border: '1px solid var(--border-color)', boxShadow: 'none' }}>
                    View Details
                  </button>
                </Link>
              </motion.div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
};

export default StudentDashboard;
