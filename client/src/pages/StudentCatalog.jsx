import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Search, 
  User, 
  BookOpen, 
  ArrowLeft,
  CheckCircle,
  Loader2,
  Trophy,
  Sparkles,
  Plus,
  Users,
  X,
  Play,
  FileText,
  Video
} from 'lucide-react';
import { AnimatePresence } from 'framer-motion';
import './Student.css';

const StudentCatalog = () => {
  const [courses, setCourses] = useState([]);
  const [enrolledIds, setEnrolledIds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [enrolling, setEnrolling] = useState(null);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetchCatalogAndEnrollments();
  }, []);

  const fetchCatalogAndEnrollments = async () => {
    try {
      const token = localStorage.getItem('token');
      const catalogRes = await fetch('http://localhost:5000/api/student/courses', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const enrollRes = await fetch('http://localhost:5000/api/student/enrollments', {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (catalogRes.ok && enrollRes.ok) {
        const catalogData = await catalogRes.json();
        const enrollData = await enrollRes.json();
        setCourses(catalogData);
        setEnrolledIds(enrollData.map(e => e.id));
      }
    } catch (err) {
      console.error('Failed to fetch data', err);
    } finally {
      setLoading(false);
    }
  };

  const handleEnroll = async (courseId) => {
    setEnrolling(courseId);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`http://localhost:5000/api/student/courses/${courseId}/enroll`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (res.ok) {
        navigate(`/student/courses/${courseId}`);
      } else {
        const data = await res.json();
        alert(data.message || 'Failed to enroll');
        setEnrolling(null);
      }
    } catch (err) {
      alert('An error occurred. Please try again.');
      setEnrolling(null);
    }
  };

  if (loading) {
    return (
      <div className="dashboard-container" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
        <Loader2 className="animate-spin text-primary" size={40} />
      </div>
    );
  }

  return (
    <div className="dashboard-container student-container">
      <Link to="/dashboard" className="back-link">
        <ArrowLeft size={18} /> Back to Dashboard
      </Link>

      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="dashboard-header" 
        style={{ marginBottom: '2rem', borderBottom: 'none' }}
      >
        <div>
          <h1 style={{ fontSize: '2.5rem', fontWeight: '800' }}>Explore <span className="text-gradient">Catalog</span></h1>
          <p style={{ fontSize: '1.1rem', color: 'var(--text-secondary)' }}>Discover new skills and expand your horizons.</p>
        </div>
      </motion.div>

      <div className="dashboard-tabs">
        <Link to="/dashboard" className="tab-item" style={{textDecoration: 'none'}}>My Learning</Link>
        <div className="tab-item active"><Sparkles size={18} /> Discover Courses</div>
      </div>

      {courses.length === 0 ? (
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="empty-state glass-panel"
        >
          <div className="empty-state-icon" style={{ background: 'var(--bg-subtle)', color: 'var(--text-muted)' }}>
            <Search size={48} />
          </div>
          <h2>No courses available yet</h2>
          <p style={{ color: 'var(--text-secondary)' }}>Check back soon! Our instructors are crafting new content.</p>
        </motion.div>
      ) : (
        <div className="catalog-grid">
          {courses.map((course, index) => {
            const isEnrolled = enrolledIds.includes(course.id);
            return (
              <motion.div 
                key={course.id} 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="catalog-card glass-panel"
                whileHover={{ y: -8, boxShadow: 'var(--shadow-xl)' }}
              >
                <div style={{ position: 'relative', overflow: 'hidden', borderRadius: 'var(--radius-lg)', marginBottom: '1.25rem' }}>
                    {isEnrolled && <span className="course-badge" style={{ zIndex: 10, background: 'var(--secondary)' }}>Enrolled</span>}
                    <div style={{ height: '160px', background: 'linear-gradient(135deg, #10B981, #3B82F6)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}>
                        <Trophy size={64} opacity={0.6} />
                    </div>
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

                <h3 style={{ fontSize: '1.4rem', marginBottom: '0.75rem' }}>{course.title}</h3>
                <p style={{ fontSize: '0.95rem', color: 'var(--text-secondary)', marginBottom: '1.5rem', display: '-webkit-box', WebkitLineClamp: '2', WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                    {course.description || "No description provided."}
                </p>
                
                <div style={{ display: 'flex', gap: '1rem', marginTop: 'auto' }}>
                  {isEnrolled ? (
                    <button className="enroll-btn" onClick={() => navigate(`/student/courses/${course.id}`)} style={{ flexGrow: 1 }}>
                      <BookOpen size={18} style={{ marginRight: '0.5rem' }} /> Continue
                    </button>
                  ) : (
                    <>
                      <button 
                        className="nav-btn-outline" 
                        onClick={() => setSelectedCourse(course.id)}
                        style={{ flexGrow: 1, border: '1px solid var(--border-color)', padding: '0.8rem' }}
                      >
                        Details
                      </button>
                      <button 
                        className="enroll-btn" 
                        onClick={() => handleEnroll(course.id)}
                        disabled={enrolling === course.id}
                        style={{ flexGrow: 2, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
                      >
                        {enrolling === course.id ? <Loader2 className="animate-spin" size={18} /> : <Plus size={18} />}
                        Enroll Now
                      </button>
                    </>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Course Detail Modal */}
      <AnimatePresence>
        {selectedCourse && (
            <CoursePreviewModal 
                courseId={selectedCourse} 
                onClose={() => setSelectedCourse(null)} 
                onEnroll={handleEnroll}
                isEnrolling={enrolling === selectedCourse}
            />
        )}
      </AnimatePresence>
    </div>
  );
};

const CoursePreviewModal = ({ courseId, onClose, onEnroll, isEnrolling }) => {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchDetails = async () => {
            try {
                const token = localStorage.getItem('token');
                const res = await fetch(`http://localhost:5000/api/student/courses/${courseId}/public`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (res.ok) {
                    const json = await res.json();
                    setData(json);
                }
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchDetails();
    }, [courseId]);

    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="modal-overlay" onClick={onClose}>
            <motion.div initial={{ y: 50, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 50, opacity: 0 }} className="modal-content glass-panel" onClick={e => e.stopPropagation()} style={{ maxWidth: '800px', width: '95%', padding: '0', overflow: 'hidden' }}>
                {loading ? (
                    <div style={{ padding: '4rem', textAlign: 'center' }}><Loader2 className="animate-spin text-primary" size={40} /></div>
                ) : data && (
                    <>
                        <div style={{ height: '200px', background: 'linear-gradient(135deg, var(--primary), var(--secondary))', padding: '2rem', color: 'white', position: 'relative' }}>
                            <button onClick={onClose} style={{ position: 'absolute', top: '1.5rem', right: '1.5rem', background: 'rgba(0,0,0,0.2)', border: 'none', color: 'white', borderRadius: '50%', padding: '0.5rem', cursor: 'pointer' }}><X size={20} /></button>
                            <h2 style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>{data.course.title}</h2>
                            <div style={{ display: 'flex', gap: '1.5rem', opacity: 0.9 }}>
                                <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}><User size={16} /> {data.course.instructor_name}</span>
                                <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}><Users size={16} /> {data.course.total_enrolled} enrolled</span>
                            </div>
                        </div>

                        <div style={{ padding: '2.5rem' }}>
                            <div style={{ display: 'flex', gap: '2.5rem' }}>
                                <div style={{ flex: 2 }}>
                                    <h3 style={{ marginBottom: '1rem' }}>Course Overview</h3>
                                    <p style={{ color: 'var(--text-secondary)', lineHeight: '1.7', marginBottom: '2rem' }}>{data.course.description || "No detailed description provided."}</p>
                                    
                                    <h3 style={{ marginBottom: '1rem' }}>Curriculum ({data.lessons.length} lessons)</h3>
                                    <div className="student-lesson-list glass-panel" style={{ maxHeight: 'calc(100vh - 300px)', overflowY: 'auto' }}>
                {data.lessons.map((lesson, idx) => (
                                            <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1rem', background: 'var(--bg-subtle)', borderRadius: 'var(--radius-lg)' }}>
                                                <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem', fontWeight: 'bold' }}>{idx + 1}</div>
                                                <div style={{ flex: 1 }}>
                                                    <div style={{ fontWeight: '600' }}>{lesson.title}</div>
                                                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'capitalize' }}>{lesson.type}</div>
                                                </div>
                                                {lesson.type === 'video' ? <Video size={16} opacity={0.5} /> : <FileText size={16} opacity={0.5} />}
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <div style={{ flex: 1 }}>
                                    <div className="glass-panel" style={{ padding: '1.5rem', background: 'var(--bg-subtle)', border: '1px solid var(--border-color)' }}>
                                        <h4 style={{ marginBottom: '1rem' }}>Ready to start?</h4>
                                        <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>Join thousands of students and start mastering this subject today.</p>
                                        <button className="enroll-btn" onClick={() => onEnroll(data.course.id)} disabled={isEnrolling} style={{ width: '100%', padding: '1rem' }}>
                                            {isEnrolling ? <Loader2 className="animate-spin" size={18} /> : "Enroll Now"}
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
