import React, { useState, useEffect, useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  BookOpen, User, Users, TrendingUp, ArrowRight,
  Loader2, Flame, Clock, CheckCircle2, Zap,
  CalendarX, ChevronRight, Trash2
} from 'lucide-react';
import { AuthContext } from '../context/AuthContext';
import './Student.css';
import './StudentDashboard.css';

const StudentDashboard = () => {
  const { user } = useContext(AuthContext);
  const [enrollments, setEnrollments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [unenrollingId, setUnenrollingId] = useState(null);
  const [gamification, setGamification] = useState({ streak: 0, xp: 0 });
  const [activityStats, setActivityStats] = useState({ hoursSpent: 0, completedTasks: 0 });
  const navigate = useNavigate();

  const fetchData = async () => {
    try {
      const token = localStorage.getItem('token');
      const [enrollRes, gamRes] = await Promise.all([
        fetch(`${window.API_BASE_URL || 'http://localhost:5000'}/api/student/enrollments`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch(`${window.API_BASE_URL || 'http://localhost:5000'}/api/gamification/activity/streak`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);

      if (enrollRes.ok) {
        const enrollData = await enrollRes.json();
        setEnrollments(enrollData);

        // Derive stats from enrolment data
        const completedCount = enrollData.filter(c => (c.progress_percentage || 0) === 100).length;
        setActivityStats(prev => ({ ...prev, completedTasks: completedCount }));
      }

      if (gamRes.ok) {
        const g = await gamRes.json();
        setGamification({ streak: g.streak || 0, xp: g.xp || 0 });
        // Rough hours: 1 XP ≈ 6 minutes
        setActivityStats(prev => ({ ...prev, hoursSpent: Math.floor((g.xp || 0) / 10) }));
      }
    } catch (err) {
      console.error('Failed to fetch data', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleUnenroll = async (enrollment) => {
    if (!window.confirm('Are you sure you want to unenroll? This will permanently delete your learning progress.')) return;
    const enrollmentId = enrollment.enrollment_id;
    setUnenrollingId(enrollmentId);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${window.API_BASE_URL || 'http://localhost:5000'}/api/student/enrollments/${enrollmentId}/delete`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      });
      if (res.ok) {
        setEnrollments(prev => prev.filter(e => e.enrollment_id !== enrollmentId));
      } else {
        const data = await res.json();
        alert(`Unenroll failed: ${data.message || 'Unknown error'}`);
      }
    } catch (err) {
      alert('Network error. Please check your connection.');
    } finally {
      setUnenrollingId(null);
    }
  };

  // Find next incomplete course for smart suggestion
  const nextCourse = enrollments.find(e => (e.progress_percentage || 0) < 100);

  if (loading) {
    return (
      <div className="dashboard-container" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
        <Loader2 className="animate-spin text-primary" size={40} />
      </div>
    );
  }

  return (
    <div className="dashboard-container student-container">

      {/* ── Greeting ── */}
      <motion.div
        initial={{ opacity: 0, y: -16 }}
        animate={{ opacity: 1, y: 0 }}
        className="sd-greeting"
      >
        <div>
          <h1 className="sd-greeting-title">
            Hello, <span className="text-gradient">{user?.name?.split(' ')[0]}</span>! ✨
          </h1>
          <p className="sd-greeting-sub">
            {enrollments.length > 0
              ? 'Ready to pick up where you left off?'
              : "Welcome to your learning journey. Let's find something exciting today!"}
          </p>
        </div>
      </motion.div>

      {/* ── My Learning ── */}
      {enrollments.length > 0 && (
        <section className="sd-section" style={{ marginBottom: '2.5rem' }}>
          <div className="sd-section-header">
            <h2 className="sd-section-title">
              <TrendingUp size={22} className="text-primary" /> My Learning
            </h2>
          </div>

          <div className="catalog-grid">
            {enrollments.map((course, index) => (
              <motion.div
                key={course.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.08 }}
                className="sd-course-card"
                whileHover={{ y: -6, boxShadow: '0 20px 40px rgba(79,70,229,0.12)' }}
              >
                {/* Thumbnail */}
                <div className="sd-card-thumb">
                  <span className="course-badge">In Progress</span>
                  <div className="sd-card-thumb-inner">
                    <BookOpen size={52} opacity={0.4} color="white" />
                  </div>
                  <button
                    className="unenroll-btn-icon"
                    title="Unenroll"
                    onClick={e => { e.preventDefault(); handleUnenroll(course); }}
                    disabled={unenrollingId === course.enrollment_id}
                  >
                    {unenrollingId === course.enrollment_id
                      ? <Loader2 className="animate-spin" size={14} />
                      : <Trash2 size={14} />}
                  </button>
                </div>

                {/* Body */}
                <div className="sd-card-body">
                  <div className="sd-card-meta">
                    <Link to={`/instructor/profile/${course.instructor_id}`} className="instructor-name">
                      <User size={13} /> {course.instructor_name}
                    </Link>
                    <span className="sd-enrolled-count">
                      <Users size={13} /> {course.total_enrolled || 0}
                    </span>
                  </div>

                  <h3 className="sd-card-title">{course.title}</h3>

                  {/* Progress */}
                  <div className="sd-progress-wrap">
                    <div className="sd-progress-label">
                      <span>Progress</span>
                      <span className="sd-progress-pct">{course.progress_percentage || 0}%</span>
                    </div>
                    <div className="progress-bar-bg" style={{ height: '7px' }}>
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${course.progress_percentage || 0}%` }}
                        className="progress-bar-fill"
                      />
                    </div>
                  </div>
                </div>

                {/* Action – single clean button */}
                <div className="sd-card-footer">
                  <Link to={`/student/courses/${course.id}`} style={{ textDecoration: 'none', width: '100%' }}>
                    <button className="enroll-btn sd-continue-btn">
                      Continue <ArrowRight size={17} />
                    </button>
                  </Link>
                </div>
              </motion.div>
            ))}
          </div>
        </section>
      )}

      {/* ── Bottom Two-Column Section ── */}
      <div className="sd-bottom-grid">

        {/* Left – Today's Schedule */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
          className="sd-widget sd-schedule"
        >
          <h2 className="sd-widget-title">
            <CalendarX size={20} className="text-primary" /> Today's Schedule
          </h2>

          {/* Empty State */}
          <div className="sd-empty-state">
            <div className="sd-empty-icon">🎉</div>
            <h3 className="sd-empty-heading">You're all caught up for today!</h3>
            <p className="sd-empty-sub">No live sessions scheduled.</p>

            {/* Smart Goal Suggestion */}
            {nextCourse && (
              <div className="sd-suggestion-box">
                <div className="sd-suggestion-label">
                  <Zap size={15} style={{ color: '#F59E0B' }} /> Smart Goal
                </div>
                <p className="sd-suggestion-course">{nextCourse.title}</p>
                <p className="sd-suggestion-progress">
                  {nextCourse.progress_percentage || 0}% complete – keep going!
                </p>
                <Link to={`/student/courses/${nextCourse.id}`} style={{ textDecoration: 'none' }}>
                  <button className="sd-suggestion-btn">
                    Jump to Next Lesson <ChevronRight size={15} />
                  </button>
                </Link>
              </div>
            )}


          </div>
        </motion.div>

        {/* Right – Metrics Grid */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.25 }}
          className="sd-metrics-col"
        >
          {/* Hours Spent */}
          <div className="sd-metric-card sd-metric-hours">
            <div className="sd-metric-icon-wrap sd-icon-blue">
              <Clock size={22} />
            </div>
            <div className="sd-metric-info">
              <span className="sd-metric-value">{activityStats.hoursSpent}</span>
              <span className="sd-metric-label">Hours Spent</span>
            </div>
          </div>

          {/* Completed Tasks */}
          <div className="sd-metric-card sd-metric-tasks">
            <div className="sd-metric-icon-wrap sd-icon-green">
              <CheckCircle2 size={22} />
            </div>
            <div className="sd-metric-info">
              <span className="sd-metric-value">{activityStats.completedTasks}</span>
              <span className="sd-metric-label">Completed Courses</span>
            </div>
          </div>

          {/* Daily Streak */}
          <div className="sd-metric-card sd-metric-streak">
            <div className="sd-metric-icon-wrap sd-icon-orange">
              <Flame size={22} />
            </div>
            <div className="sd-metric-info">
              <span className="sd-metric-value">
                {gamification.streak}
                <span className="sd-streak-emoji">🔥</span>
              </span>
              <span className="sd-metric-label">Day Streak</span>
            </div>
          </div>
        </motion.div>
      </div>

    </div>
  );
};

export default StudentDashboard;
