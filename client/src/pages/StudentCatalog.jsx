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
        fetch('https://learningmanagementsystem-backend-lms.onrender.com/api/student/courses', { headers: { 'Authorization': `Bearer ${token}` } }),
        fetch('https://learningmanagementsystem-backend-lms.onrender.com/api/student/enrollments', { headers: { 'Authorization': `Bearer ${token}` } })
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
      const res = await fetch(`https://learningmanagementsystem-backend-lms.onrender.com/api/student/courses/${courseId}/enroll`, {
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
                      <button className="nav-btn-outline" onClick={() => setSelectedCourse(course)}
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

      <AnimatePresence>
        {selectedCourse && (
          <CoursePreviewModal course={selectedCourse} onClose={() => setSelectedCourse(null)}
            onEnroll={handleFreeEnroll} 
            isEnrolling={enrolling === selectedCourse?.id} />
        )}
      </AnimatePresence>
    </div>
  );
};

const CoursePreviewModal = ({ course, onClose, onEnroll, isEnrolling }) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDetails = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await fetch(`https://learningmanagementsystem-backend-lms.onrender.com/api/student/courses/${course.id}/public`, { headers: { 'Authorization': `Bearer ${token}` } });
        if (res.ok) setData(await res.json());
      } catch (err) { console.error(err); }
      finally { setLoading(false); }
    };
    fetchDetails();
  }, [course.id]);

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="modal-overlay" onClick={onClose}>
      <motion.div initial={{ y: 50, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 50, opacity: 0 }}
        className="modal-content glass-panel" onClick={e => e.stopPropagation()}
        style={{ maxWidth: '800px', width: '95%', padding: '0', overflow: 'hidden', maxHeight: '90vh', display: 'flex', flexDirection: 'column' }}>
        {loading ? (
          <div style={{ padding: '4rem', textAlign: 'center' }}><Loader2 className="animate-spin text-primary" size={40} /></div>
        ) : data && (
          <>
            <div style={{ height: '180px', background: 'linear-gradient(135deg,var(--primary),var(--secondary))', padding: '2rem', color: 'white', position: 'relative', flexShrink: 0 }}>
              <button onClick={onClose} style={{ position: 'absolute', top: '1rem', right: '1rem', background: 'rgba(0,0,0,0.2)', border: 'none', color: 'white', borderRadius: '50%', padding: '0.5rem', cursor: 'pointer', display: 'flex' }}><X size={20} /></button>
              <h2 style={{ fontSize: '1.6rem', marginBottom: '0.5rem' }}>{data.course.title}</h2>
              <div style={{ display: 'flex', gap: '1.5rem', opacity: 0.9, fontSize: '0.9rem' }}>
                <Link to={`/instructor/profile/${data.course.instructor_id}`} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'white', textDecoration: 'none' }}><User size={15} />{data.course.instructor_name}</Link>
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}><Users size={15} />{data.course.total_enrolled} enrolled</span>
              </div>
            </div>
            <div style={{ padding: '2rem', overflowY: 'auto', flexGrow: 1 }}>
              <div style={{ display: 'flex', gap: '2rem' }}>
                <div style={{ flex: 2 }}>
                  <h3 style={{ marginBottom: '1rem' }}>Course Overview</h3>
                  <p style={{ color: 'var(--text-secondary)', lineHeight: '1.7', marginBottom: '1.5rem' }}>{data.course.description || 'No description provided.'}</p>
                  
                  {(() => {
                      try {
                          const benefits = JSON.parse(data.course.benefits || '[]');
                          if (Array.isArray(benefits) && benefits.length > 0) {
                              return (
                                <div style={{ marginBottom: '2rem' }}>
                                    <h3 style={{ marginBottom: '1rem' }}>What you'll learn</h3>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                                        {benefits.map((b, i) => (
                                            <div key={i} style={{ display: 'flex', gap: '0.5rem', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                                                <CheckCircle size={16} className="text-secondary" style={{ flexShrink: 0, marginTop: '2px' }} />
                                                {b}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                              );
                          }
                      } catch(e) {}
                      return null;
                  })()}

                  <h3 style={{ marginBottom: '1rem' }}>Curriculum ({data.lessons.length} lessons)</h3>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', maxHeight: '250px', overflowY: 'auto' }}>
                    {data.lessons.map((lesson, idx) => (
                      <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '0.75rem 1rem', background: 'var(--bg-subtle)', borderRadius: '10px' }}>
                        <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.7rem', fontWeight: 'bold', color: 'white', flexShrink: 0 }}>
                          {idx + 1}
                        </div>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontWeight: '600', fontSize: '0.9rem' }}>{lesson.title}</div>
                          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'capitalize' }}>{lesson.type}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                <div style={{ flex: 1 }}>
                  <div className="glass-panel" style={{ padding: '1.5rem', background: 'var(--bg-subtle)', border: '1px solid var(--border-color)', position: 'sticky', top: 0 }}>
                        <div style={{ textAlign: 'center', marginBottom: '1.25rem' }}>
                          <div style={{ fontSize: '2rem', fontWeight: '900', color: 'var(--secondary)' }}>FREE</div>
                        </div>
                        <button className="enroll-btn" onClick={() => onEnroll(data.course.id)} disabled={isEnrolling} style={{ width: '100%', padding: '1rem' }}>
                          {isEnrolling ? <Loader2 className="animate-spin" size={18} /> : 'Enroll Now'}
                        </button>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </motion.div>
    </motion.div>
  );
};

export default StudentCatalog;
