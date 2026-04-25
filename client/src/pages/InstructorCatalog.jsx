import React, { useState, useEffect, useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search, 
  ArrowLeft, 
  Loader2, 
  Globe, 
  ExternalLink, 
  Users, 
  BookOpen, 
  User, 
  Star, 
  Filter,
  LayoutGrid
} from 'lucide-react';
import { AuthContext } from '../context/AuthContext';
import './Instructor.css';

const InstructorCatalog = () => {
  const { user } = useContext(AuthContext);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();

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

  const filteredCourses = courses.filter(c => 
    c.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
    (c.instructor_name && c.instructor_name.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  if (loading) {
    return (
      <div className="dashboard-container" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
        <Loader2 className="animate-spin text-primary" size={40} />
      </div>
    );
  }

  return (
    <div className="dashboard-container instructor-container instructor-catalog-view">
      <style>{`
        .instructor-catalog-view { padding: 100px 2rem 2rem; }
        .catalog-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 2.5rem;
          flex-wrap: wrap;
          gap: 1.5rem;
        }
        @media (max-width: 768px) {
          .instructor-catalog-view { padding: 90px 1rem 1rem; }
          .catalog-header { flex-direction: column; align-items: stretch; }
          .search-bar-container { width: 100% !important; }
        }
      `}</style>

      <div style={{ marginBottom: '1.5rem' }}>
        <Link to="/instructor/dashboard" className="back-link">
          <ArrowLeft size={18} /> Back to Dashboard
        </Link>
      </div>

      <div className="catalog-header">
        <div>
          <h1 style={{ fontSize: '2.5rem', fontWeight: '800' }}>Global Course <span className="text-gradient">Library</span></h1>
          <p style={{ fontSize: '1.1rem', color: 'var(--text-secondary)' }}>Explore what other instructors are teaching across the platform.</p>
        </div>

        <div className="search-bar-container" style={{ position: 'relative', width: '400px' }}>
          <div className="search-bar glass-panel" style={{ display: 'flex', alignItems: 'center', padding: '0.75rem 1.25rem', gap: '0.75rem', background: 'white', borderRadius: '100px', border: '1px solid var(--border-color)', boxShadow: 'var(--shadow-sm)' }}>
             <Search size={20} className="text-muted" />
             <input 
               type="text" 
               placeholder="Search by course or instructor name..." 
               value={searchQuery}
               onChange={(e) => setSearchQuery(e.target.value)}
               style={{ background: 'none', border: 'none', outline: 'none', color: 'var(--text-primary)', width: '100%', fontSize: '0.95rem' }}
             />
          </div>
        </div>
      </div>

      {filteredCourses.length === 0 ? (
        <motion.div 
          initial={{ opacity: 0 }} 
          animate={{ opacity: 1 }} 
          className="empty-state glass-panel" 
          style={{ padding: '5rem 2rem', textAlign: 'center' }}
        >
          <div style={{ background: 'var(--bg-subtle)', width: '80px', height: '80px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem' }}>
            <Search size={40} className="text-muted" />
          </div>
          <h2 style={{ fontSize: '1.75rem', marginBottom: '0.5rem' }}>No courses found</h2>
          <p style={{ color: 'var(--text-secondary)', maxWidth: '400px', margin: '0 auto' }}>
            We couldn't find any results for "<strong>{searchQuery}</strong>". Try a different search term.
          </p>
          <button onClick={() => setSearchQuery('')} className="btn-primary" style={{ marginTop: '2rem' }}>
            Clear Search
          </button>
        </motion.div>
      ) : (
        <div className="courses-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '2rem' }}>
          {filteredCourses.map((course, index) => (
            <motion.div 
              key={course.id} 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="course-card-premium glass-panel"
              whileHover={{ y: -5 }}
            >
              <div style={{ padding: '1.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.25rem' }}>
                  <Link to={`/instructor/profile/${course.instructor_id}`} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'var(--bg-subtle)', padding: '0.3rem 0.8rem', borderRadius: '100px', textDecoration: 'none' }}>
                    <div style={{ width: '20px', height: '20px', borderRadius: '50%', background: 'var(--primary)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.6rem', fontWeight: '800' }}>
                        {course.instructor_name?.charAt(0).toUpperCase()}
                    </div>
                    <span style={{ fontSize: '0.8rem', fontWeight: '700', color: 'var(--text-secondary)' }}>
                      {course.instructor_name} {course.instructor_id === user.id && "(You)"}
                    </span>
                  </Link>
                  <Globe size={18} className="text-muted" />
                </div>

                <h3 style={{ fontSize: '1.3rem', marginBottom: '0.75rem', lineHeight: '1.4' }}>{course.title}</h3>
                <p style={{ fontSize: '0.95rem', color: 'var(--text-secondary)', marginBottom: '1.5rem', display: '-webkit-box', WebkitLineClamp: '2', WebkitBoxOrient: 'vertical', overflow: 'hidden', minHeight: '2.8em' }}>
                  {course.description || "No description provided."}
                </p>
                
                <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
                  <div style={{ fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.4rem', background: 'var(--bg-subtle)', padding: '0.25rem 0.6rem', borderRadius: '6px' }}>
                    <Users size={14} className="text-primary" /> {course.total_students || 0}
                  </div>
                  <div style={{ fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.4rem', background: 'var(--bg-subtle)', padding: '0.25rem 0.6rem', borderRadius: '6px' }}>
                    <BookOpen size={14} className="text-secondary" /> {course.total_lessons || 0}
                  </div>
                  <div style={{ fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.4rem', background: 'var(--bg-subtle)', padding: '0.25rem 0.6rem', borderRadius: '6px', color: '#10b981', fontWeight: '800' }}>
                    FREE
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '0.75rem' }}>
                    <Link 
                        to={course.instructor_id === user.id ? `/instructor/courses/${course.id}` : `/student/courses/${course.id}/preview`} 
                        className="btn-primary" 
                        style={{ flex: 1, textDecoration: 'none', display: 'flex', justifyContent: 'center', gap: '0.5rem', alignItems: 'center' }}
                    >
                        {course.instructor_id === user.id ? 'Manage' : 'View Details'} <ExternalLink size={16} />
                    </Link>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
};

export default InstructorCatalog;
