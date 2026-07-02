import React, { useState, useEffect, useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area 
} from 'recharts';
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
  TrendingUp,
  Tag,
  Trash2,
  Search
} from 'lucide-react';
import { AuthContext } from '../context/AuthContext';
import './Instructor.css';

const InstructorDashboard = () => {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activityData, setActivityData] = useState([]);
  const [editingCourse, setEditingCourse] = useState(null);
  const [editTitle, setEditTitle] = useState('');
  const [editDesc, setEditDesc] = useState('');
  const [editBenefits, setEditBenefits] = useState(['']);
  const [profile, setProfile] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [error, setError] = useState('');
  const [analyticsData, setAnalyticsData] = useState({
    revenue: { totalCourses: 0, totalEnrollments: 0, grossRevenue: 0, instructorShare: 0 },
    dropoff: [],
    testScores: []
  });

  useEffect(() => {
    fetchCourses();
    fetchActivity();
    fetchProfile();
    if (user?.id) fetchAnalytics();
  }, [user]);

  const fetchAnalytics = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${window.API_BASE_URL || 'http://localhost:5000'}/api/analytics/instructor-dashboard/${user.id}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setAnalyticsData(data);
      }
    } catch (err) {
      console.error('Failed to fetch analytics', err);
    }
  };

  const fetchCourses = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${window.API_BASE_URL || 'http://localhost:5000'}/api/instructor/courses`, {
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

  const fetchActivity = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${window.API_BASE_URL || 'http://localhost:5000'}/api/instructor/activity`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        setActivityData(await res.json());
      }
    } catch (err) { console.error(err); }
  };

  const fetchProfile = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${window.API_BASE_URL || 'http://localhost:5000'}/api/auth/profile`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setProfile(data.user);
      }
    } catch (err) { console.error(err); }
  };

  const handleEditCourse = async (e) => {
    e.preventDefault();
    
    // Check title and description
    if (!editTitle || !editDesc) {
       setError('Please fill in all fields');
       return;
    }

    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${window.API_BASE_URL || 'http://localhost:5000'}/api/instructor/courses/${editingCourse.id}/edit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ 
          title: editTitle, 
          description: editDesc, 
          benefits: editBenefits.filter(b => b.trim() !== '')
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setEditingCourse(null);
        fetchCourses();
      } else {
        setError(data.message || 'Failed to update course');
      }
    } catch (err) {
      setError('An error occurred. Please try again.');
    }
  };

  const handleDeleteCourse = async (courseId) => {
    if (!window.confirm('Are you sure you want to delete this course? This action cannot be undone.')) return;
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${window.API_BASE_URL || 'http://localhost:5000'}/api/instructor/courses/${courseId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) {
        fetchCourses();
      } else {
        alert(data.message || 'Failed to delete course');
      }
    } catch (err) { alert('Error occurred'); }
  };

  const filteredCourses = courses.filter(c => 
    c.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
    (c.instructor_name && c.instructor_name.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const myCourses = filteredCourses.filter(c => c.instructor_id === user.id);
  const otherCourses = filteredCourses.filter(c => c.instructor_id !== user.id);

  if (loading) {
    return (
      <div className="dashboard-container" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
        <Loader2 className="animate-spin text-primary" size={40} />
      </div>
    );
  }

  return (
    <div className="dashboard-container instructor-container instructor-dashboard-view">
      <style>{`
        .instructor-dashboard-view {
          padding: 100px 2rem 2rem;
        }
        .stats-main-grid {
          display: grid; 
          grid-template-columns: 3fr 1fr; 
          gap: 2rem; 
          margin-bottom: 3rem;
        }
        @media (max-width: 1024px) {
          .stats-main-grid {
            grid-template-columns: 1fr;
          }
          .instructor-dashboard-view { padding: 90px 1.5rem 1.5rem; }
        }
        @media (max-width: 768px) {
          .instructor-dashboard-view { padding: 85px 1rem 1rem; }
          .dashboard-header {
            flex-direction: column;
            align-items: stretch !important;
            text-align: center;
          }
          .dashboard-header > div { text-align: left; }
          .btn-primary { justify-content: center; }
        }
      `}</style>
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
      </motion.div>

      {/* Quick Stats – 3-column balanced grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1.5rem', marginBottom: '2.5rem' }}>
        <div className="stat-card glass-panel" style={{ padding: '1.75rem' }}>
          <div style={{ color: 'var(--primary)', marginBottom: '0.75rem' }}><Users size={26} /></div>
          <div style={{ fontSize: '2rem', fontWeight: '800', lineHeight: 1 }}>{myCourses.reduce((acc, c) => acc + (c.total_students || 0), 0)}</div>
          <div style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', marginTop: '0.4rem' }}>My Total Students</div>
        </div>
        <div className="stat-card glass-panel" style={{ padding: '1.75rem' }}>
          <div style={{ color: 'var(--secondary)', marginBottom: '0.75rem' }}><BookOpen size={26} /></div>
          <div style={{ fontSize: '2rem', fontWeight: '800', lineHeight: 1 }}>{myCourses.length}</div>
          <div style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', marginTop: '0.4rem' }}>My Active Courses</div>
        </div>
        <div className="stat-card glass-panel" style={{ padding: '1.75rem' }}>
          <div style={{ color: 'var(--accent)', marginBottom: '0.75rem' }}><Globe size={26} /></div>
          <div style={{ fontSize: '2rem', fontWeight: '800', lineHeight: 1 }}>{courses.length}</div>
          <div style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', marginTop: '0.4rem' }}>Global Library Count</div>
        </div>
      </div>          {/* Activity Graphs Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '2rem', marginBottom: '3rem' }}>
            {activityData.length > 0 && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass-panel" style={{ padding: '2rem' }}>
                 <h3 style={{ fontSize: '1.25rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                   <TrendingUp size={20} className="text-primary" /> Student Engagement Trends
                 </h3>
                 <div style={{ height: '240px', width: '100%' }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={activityData} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                        <defs>
                          <linearGradient id="colorEngage" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="var(--secondary)" stopOpacity={0.3}/>
                            <stop offset="95%" stopColor="var(--secondary)" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(0,0,0,0.05)" />
                        <XAxis dataKey="date" label={{ value: 'Date', position: 'insideBottom', offset: -10, fontSize: 10 }} tick={{ fontSize: 10 }} />
                        <YAxis label={{ value: 'Engagements', angle: -90, position: 'insideLeft', fontSize: 10 }} tick={{ fontSize: 10 }} />
                        <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 25px rgba(0,0,0,0.1)' }} />
                        <Area type="monotone" dataKey="count" stroke="var(--secondary)" strokeWidth={3} fillOpacity={1} fill="url(#colorEngage)" />
                      </AreaChart>
                    </ResponsiveContainer>
                 </div>
              </motion.div>
            )}

            {analyticsData.dropoff && analyticsData.dropoff.length > 0 && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass-panel" style={{ padding: '2rem' }}>
                 <h3 style={{ fontSize: '1.25rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                   <BarChart2 size={20} className="text-primary" /> Student Completion Drop-offs
                 </h3>
                 <div style={{ height: '240px', width: '100%' }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={analyticsData.dropoff} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(0,0,0,0.05)" />
                        <XAxis dataKey="lectureId" tick={{ fontSize: 10 }} />
                        <YAxis tick={{ fontSize: 10 }} />
                        <Tooltip />
                        <Bar dataKey="studentCount" fill="var(--primary)" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                 </div>
              </motion.div>
            )}

            {analyticsData.testScores && analyticsData.testScores.length > 0 && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass-panel" style={{ padding: '2rem' }}>
                 <h3 style={{ fontSize: '1.25rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                   <TrendingUp size={20} className="text-secondary" /> Quiz Average Scores
                 </h3>
                 <div style={{ height: '240px', width: '100%' }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={analyticsData.testScores} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(0,0,0,0.05)" />
                        <XAxis dataKey="title" tick={{ fontSize: 10 }} />
                        <YAxis tick={{ fontSize: 10 }} />
                        <Tooltip />
                        <Area type="monotone" dataKey="averageScore" stroke="var(--secondary)" fill="rgba(16,185,129,0.2)" />
                      </AreaChart>
                    </ResponsiveContainer>
                 </div>
              </motion.div>
            )}
          </div>

      <div className="section-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.75rem', marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <TrendingUp size={24} className="text-primary" />
          <h2 style={{ fontSize: '1.75rem' }}>My Courses</h2>
        </div>
        <Link to="/instructor/courses/new" className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', textDecoration: 'none', padding: '0.6rem 1.25rem', fontSize: '0.9rem', borderRadius: '10px' }}>
          <Plus size={17} /> Create New Course
        </Link>
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
                      try {
                        const b = JSON.parse(course.benefits || '[]');
                        setEditBenefits(b.length > 0 ? b : ['']);
                      } catch { setEditBenefits(['']); }
                    }} className="icon-btn" style={{ padding: '0.5rem', borderRadius: '50%', background: 'var(--bg-subtle)' }}>
                      <Edit size={16} />
                    </button>
                  </div>
                  <button 
                    onClick={(e) => { e.preventDefault(); handleDeleteCourse(course.id); }}
                    className="icon-btn" 
                    style={{ position: 'absolute', top: '1.5rem', right: '4rem', padding: '0.5rem', borderRadius: '50%', background: 'rgba(239,68,68,0.1)', color: '#ef4444' }}
                    title="Delete Course"
                  >
                    <Trash2 size={16} />
                  </button>
                <h3 style={{ fontSize: '1.25rem', marginBottom: '0.5rem' }}>{course.title}</h3>
                <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '1.5rem', minHeight: '3em' }}>{course.description || "No description provided."}</p>
                <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
                  <div style={{ fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.4rem', background: 'var(--bg-subtle)', padding: '0.2rem 0.6rem', borderRadius: '6px' }}>
                    <Users size={14} className="text-primary" /> {course.total_students || 0}
                  </div>
                  <div style={{ fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.4rem', background: 'var(--bg-subtle)', padding: '0.2rem 0.6rem', borderRadius: '6px' }}>
                    <FileText size={14} className="text-secondary" /> {course.total_lessons || 0}
                  </div>
                  {course.average_rating > 0 && (
                    <div style={{ fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.4rem', background: 'var(--bg-subtle)', padding: '0.2rem 0.6rem', borderRadius: '6px', color: '#f59e0b', fontWeight: '800' }}>
                      ⭐ {Number(course.average_rating).toFixed(1)}
                    </div>
                  )}
                </div>
                <Link to={`/instructor/courses/${course.id}`} className="btn-primary" style={{ width: '100%', textDecoration: 'none', display: 'flex', justifyContent: 'center', gap: '0.5rem' }}>
                  View Details <ArrowRight size={18} />
                </Link>
              </div>
            </motion.div>
          ))}
        </div>
      )}



      {/* Edit Course Modal */}
      <AnimatePresence>
        {editingCourse && (
          <div className="modal-overlay" onClick={() => { setEditingCourse(null); setError(''); }}>
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
                <button onClick={() => { setEditingCourse(null); setError(''); }} className="close-btn"><X size={24} /></button>
              </div>
              
              {error && (
                <div style={{ color: '#ef4444', fontSize: '0.85rem', marginBottom: '1.5rem', padding: '1rem', background: '#fef2f2', borderRadius: '10px', border: '1px solid #fee2e2', fontWeight: '600' }}>
                  {error}
                </div>
              )}

              <form onSubmit={handleEditCourse}>
                <div style={{ marginBottom: '1.5rem' }}>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600' }}>Course Title</label>
                  <input className="input-field" value={editTitle} onChange={e => setEditTitle(e.target.value)} required />
                </div>
                <div style={{ marginBottom: '1.5rem' }}>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600' }}>Description</label>
                  <textarea className="input-field" value={editDesc} onChange={e => setEditDesc(e.target.value)} rows="4" required style={{ resize: 'vertical' }} />
                </div>
                <div style={{ marginBottom: '1.5rem' }}>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600' }}>Benefits</label>
                  {editBenefits.map((b, i) => (
                    <div key={i} style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem' }}>
                        <input className="input-field" value={b} onChange={e => {
                            const nb = [...editBenefits];
                            nb[i] = e.target.value;
                            setEditBenefits(nb);
                        }} />
                        {editBenefits.length > 1 && <button type="button" onClick={() => setEditBenefits(editBenefits.filter((_, idx) => idx !== i))} className="close-btn" style={{ padding: '0.5rem' }}>✕</button>}
                    </div>
                  ))}
                  <button type="button" onClick={() => setEditBenefits([...editBenefits, ''])} className="nav-btn-outline" style={{ fontSize: '0.8rem', padding: '0.3rem 0.8rem' }}>+ Add Benefit</button>
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
