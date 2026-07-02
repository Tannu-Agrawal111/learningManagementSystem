import React, { useState, useEffect, useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search, BookOpen, User, Users, GraduationCap, Plus, Loader2, X, Filter, Star
} from 'lucide-react';
import { AuthContext } from '../context/AuthContext';
import './StudentExplore.css';

const CATEGORIES = ['All', 'Development', 'Design', 'Business', 'Marketing', 'Data Science', 'Personal Growth'];

const StudentExplore = () => {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const [allCourses, setAllCourses] = useState([]);
  const [enrolledIds, setEnrolledIds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [enrolling, setEnrolling] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem('token');
        const [catalogRes, enrollRes] = await Promise.all([
          fetch('http://localhost:5000/api/student/courses', { headers: { Authorization: `Bearer ${token}` } }),
          fetch('http://localhost:5000/api/student/enrollments', { headers: { Authorization: `Bearer ${token}` } }),
        ]);
        if (catalogRes.ok) setAllCourses(await catalogRes.json());
        if (enrollRes.ok) {
          const data = await enrollRes.json();
          setEnrolledIds(data.map(e => e.id));
        }
      } catch (err) {
        console.error('Failed to fetch explore data', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleFreeEnroll = async (courseId) => {
    setEnrolling(courseId);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`http://localhost:5000/api/student/courses/${courseId}/enroll`, {
        method: 'POST', headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        setEnrolledIds(prev => [...prev, courseId]);
      } else {
        const d = await res.json();
        alert(d.message || 'Failed to enroll');
      }
    } catch {
      alert('Error occurred');
    } finally {
      setEnrolling(null);
    }
  };

  const unenrolledCourses = allCourses.filter(c => !enrolledIds.includes(c.id));
  const filteredCourses = unenrolledCourses.filter(c => {
    const matchesSearch = c.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (c.description || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (c.instructor_name || '').toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  });

  return (
    <div className="explore-container dashboard-container">
      {/* Hero Search Banner */}
      <motion.div
        initial={{ opacity: 0, y: -16 }}
        animate={{ opacity: 1, y: 0 }}
        className="explore-hero"
      >
        <div className="explore-hero-text">
          <h1>Explore Courses</h1>
          <p>Discover new skills and expand your knowledge</p>
        </div>
        <div className="explore-search-bar">
          <Search size={20} className="explore-search-icon" />
          <input
            type="text"
            placeholder="Search courses, instructors…"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="explore-search-input"
          />
          {searchQuery && (
            <button className="explore-search-clear" onClick={() => setSearchQuery('')}>
              <X size={16} />
            </button>
          )}
        </div>
      </motion.div>



      {/* Results Count */}
      <div className="explore-results-meta">
        <span className="explore-results-count">
          {filteredCourses.length} {filteredCourses.length === 1 ? 'course' : 'courses'} available
        </span>
      </div>

      {/* Course Grid */}
      {loading ? (
        <div className="explore-loading">
          <Loader2 size={40} className="animate-spin text-primary" />
        </div>
      ) : filteredCourses.length === 0 ? (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="explore-empty glass-panel">
          <GraduationCap size={64} style={{ color: 'var(--text-muted)', marginBottom: '1rem' }} />
          <h3>No courses found</h3>
          <p>Try a different search term or category.</p>
        </motion.div>
      ) : (
        <div className="explore-grid">
          <AnimatePresence>
            {filteredCourses.map((course, index) => (
              <motion.div
                key={course.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ delay: index * 0.05 }}
                className="explore-card"
                whileHover={{ y: -6, boxShadow: '0 20px 40px rgba(79,70,229,0.12)' }}
              >
                {/* Card Thumbnail */}
                <div className="explore-card-thumb">
                  <span className="explore-price-badge free">
                    FREE
                  </span>
                  <div className="explore-card-thumb-inner">
                    <GraduationCap size={52} opacity={0.4} color="white" />
                  </div>
                </div>

                {/* Card Body */}
                <div className="explore-card-body">
                  <div className="explore-card-meta">
                    <Link to={`/instructor/profile/${course.instructor_id}`} className="explore-instructor">
                      <User size={13} /> {course.instructor_name || 'Instructor'}
                    </Link>
                    <span className="explore-students-count">
                      <Users size={13} /> {course.total_enrolled || 0}
                    </span>
                  </div>

                  <h3 className="explore-card-title">{course.title}</h3>
                  <p className="explore-card-desc">
                    {course.description || 'No description provided.'}
                  </p>

                  {/* Rating placeholder */}
                  <div className="explore-rating">
                    {[1,2,3,4,5].map(s => (
                      <Star key={s} size={13} fill={s <= 4 ? '#F59E0B' : 'none'} stroke="#F59E0B" />
                    ))}
                    <span>4.0</span>
                  </div>
                </div>

                {/* Card Actions */}
                <div className="explore-card-actions">
                  <Link to={`/student/courses/${course.id}/preview`} style={{ textDecoration: 'none', flex: 1 }}>
                    <button className="explore-btn-outline">Preview</button>
                  </Link>
                  {enrolledIds.includes(course.id) ? (
                    <button className="explore-btn-enrolled" disabled>✓ Enrolled</button>
                  ) : (
                    <button
                      className="explore-btn-enroll"
                      onClick={() => handleFreeEnroll(course.id)}
                      disabled={enrolling === course.id}
                    >
                      {enrolling === course.id ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />}
                      Enroll for Free
                    </button>
                  )}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
};

export default StudentExplore;
