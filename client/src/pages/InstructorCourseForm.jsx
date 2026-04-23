import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import './Instructor.css';

const InstructorCourseForm = () => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const token = localStorage.getItem('token');
      const res = await fetch('http://localhost:5000/api/instructor/courses', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ title, description }),
      });

      const data = await res.json();

      if (res.ok) {
        navigate(`/instructor/courses/${data.id}`);
      } else {
        setError(data.message || 'Failed to create course');
      }
    } catch (err) {
      setError('An error occurred. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="dashboard-container instructor-container">
      <Link to="/instructor/dashboard" className="back-link">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="19" y1="12" x2="5" y2="12"></line>
          <polyline points="12 19 5 12 12 5"></polyline>
        </svg>
        Back to Dashboard
      </Link>

      <div className="page-header">
        <h1>Create a New Course</h1>
        <p style={{ color: 'var(--text-secondary)' }}>Set up the foundation for your new educational content.</p>
      </div>

      <div className="form-card">
        {error && <div className="auth-error">{error}</div>}
        
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="title">Course Title</label>
            <input
              type="text"
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Advanced Web Development 2026"
              className="input-field"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="description">Course Description</label>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe what students will learn in this course..."
              className="input-field textarea-field"
              required
            />
          </div>

          <button type="submit" className="btn-primary" disabled={loading} style={{marginTop: '1rem'}}>
            {loading ? 'Creating...' : 'Create Course'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default InstructorCourseForm;
