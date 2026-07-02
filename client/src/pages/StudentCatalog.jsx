import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, User, BookOpen, ArrowLeft, CheckCircle, Loader2, Trophy, Sparkles, Plus, Users, X, FileText, Video, Star, Briefcase } from 'lucide-react';
import './Student.css';



const StudentCatalog = () => {
  const [courses, setCourses] = useState([]);
  const [enrolledIds, setEnrolledIds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [enrolling, setEnrolling] = useState(null);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const navigate = useNavigate();

  useEffect(() => { fetchCatalogAndEnrollments(); }, []);

  const fetchCatalogAndEnrollments = async () => {
    try {
      const token = localStorage.getItem('token');
      const [catalogRes, enrollRes] = await Promise.all([
        fetch(`${window.API_BASE_URL || 'http://localhost:5000'}/api/student/courses`, { headers: { 'Authorization': `Bearer ${token}` } }),
        fetch(`${window.API_BASE_URL || 'http://localhost:5000'}/api/student/enrollments`, { headers: { 'Authorization': `Bearer ${token}` } })
      ]);
      if (catalogRes.ok && enrollRes.ok) {
        const catalogData = await catalogRes.json();
        const enrollData = await enrollRes.json();
        setCourses(catalogData);
        setEnrolledIds(enrollData.map(e => e.id));
      }
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const handleFreeEnroll = async (courseId) => {
    setEnrolling(courseId);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${window.API_BASE_URL || 'http://localhost:5000'}/api/student/courses/${courseId}/enroll`, {
        method: 'POST', headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) { navigate(`/student/courses/${courseId}`); }
      else { const d = await res.json(); alert(d.message || 'Failed to enroll'); setEnrolling(null); }
    } catch { alert('Error occurred'); setEnrolling(null); }
  };

  if (loading) return (
    <div className="dashboard-container" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
      <Loader2 className="animate-spin text-primary" size={40} />
    </div>
  );

  const filteredCourses = courses.filter(c => 
    c.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
    (c.description && c.description.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (c.instructor_name && c.instructor_name.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="dashboard-container student-container">
      <Link to="/dashboard" className="back-link"><ArrowLeft size={18} /> Back to Dashboard</Link>
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="dashboard-header" style={{ marginBottom: '1.5rem', borderBottom: 'none' }}>
        <div>
          <h1 style={{ fontSize: '2.5rem', fontWeight: '800' }}>Explore <span className="text-gradient">Catalog</span></h1>
          <p style={{ fontSize: '1.1rem', color: 'var(--text-secondary)' }}>Discover new skills and expand your horizons.</p>
        </div>
        <div style={{ position: 'relative', width: '350px' }}>
          <Search size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input 
            type="text" 
            placeholder="Search courses or instructors..." 
            className="input-field" 
            style={{ paddingLeft: '2.8rem', borderRadius: '30px', background: 'white', border: '1px solid var(--border-color)' }}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </motion.div>
      <div className="dashboard-tabs">
        <Link to="/dashboard" className="tab-item" style={{ textDecoration: 'none' }}>My Learning</Link>
        <div className="tab-item active"><Sparkles size={18} /> Discover Courses</div>
      </div>

      {filteredCourses.length === 0 ? (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="empty-state glass-panel">
          <div className="empty-state-icon"><Search size={48} /></div>
          <h2>No courses found</h2>
          <p>{searchTerm ? `No results for "${searchTerm}"` : 'Our instructors are crafting new content.'}</p>
        </motion.div>
      ) : (
        <div className="catalog-grid">
          {filteredCourses.map((course, index) => {
            const isEnrolled = enrolledIds.includes(course.id);
            return (
              <motion.div key={course.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.07 }} className="catalog-card glass-panel" whileHover={{ y: -8, boxShadow: 'var(--shadow-xl)' }}>
                <div style={{ position: 'relative', overflow: 'hidden', borderRadius: 'var(--radius-lg)', marginBottom: '1.25rem' }}>
                  {isEnrolled && <span className="course-badge" style={{ zIndex: 10, background: 'var(--secondary)' }}>Enrolled</span>}
                  <div style={{ height: '160px', background: 'linear-gradient(135deg,#10B981,#3B82F6)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}>
                    <Trophy size={64} opacity={0.6} />
                  </div>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                  <Link to={`/instructor/profile/${course.instructor_id}`} className="instructor-name" style={{ textDecoration: 'none' }}>
                    <User size={14} />{course.instructor_name}
                  </Link>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                    <Users size={14} className="text-primary" /> {course.total_enrolled || 0}
                  </div>
                </div>
                <h3 style={{ fontSize: '1.2rem', marginBottom: '0.75rem' }}>{course.title}</h3>
                
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '1rem' }}>
                    {course.average_rating > 0 ? (
                        <>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.1rem' }}>
                                {[1, 2, 3, 4, 5].map((s) => (
                                    <Star key={s} size={14} fill={course.average_rating >= s ? '#f59e0b' : 'none'} color={course.average_rating >= s ? '#f59e0b' : '#cbd5e1'} />
                                ))}
                            </div>
                            <span style={{ fontSize: '0.8rem', fontWeight: '700', color: 'var(--text-primary)' }}>{Number(course.average_rating).toFixed(1)}</span>
                            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>({course.total_ratings})</span>
                        </>
                    ) : (
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>New course • No ratings yet</span>
                    )}
                </div>

                <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '1.5rem', display: '-webkit-box', WebkitLineClamp: '2', WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                  {course.description || 'No description provided.'}
                </p>
                <div style={{ display: 'flex', gap: '0.75rem', marginTop: 'auto' }}>
                  {isEnrolled ? (
                    <button className="enroll-btn" onClick={() => navigate(`/student/courses/${course.id}`)} style={{ flexGrow: 1 }}>
                      <BookOpen size={18} style={{ marginRight: '0.5rem' }} /> Continue
                    </button>
                  ) : (
                    <>
                      <button className="nav-btn-outline" onClick={() => navigate(`/student/courses/${course.id}/preview`)}
                        style={{ flexGrow: 1, border: '1px solid var(--border-color)', padding: '0.8rem' }}>
                        Preview
                      </button>
                      <button className="enroll-btn" onClick={() => handleFreeEnroll(course.id)}
                        disabled={enrolling === course.id}
                        style={{ flexGrow: 2, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                        {enrolling === course.id ? <Loader2 className="animate-spin" size={18} /> : <Plus size={18} />} Enroll Now
                      </button>
                    </>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

    </div>
  );
};

export default StudentCatalog;
