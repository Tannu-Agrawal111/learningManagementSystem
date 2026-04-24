import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { DollarSign, Tag, BookOpen, FileText, ArrowLeft, Plus, Check, Sparkles, AlertCircle, Loader2 } from 'lucide-react';
import './Instructor.css';

const InstructorCourseForm = () => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [isPaid, setIsPaid] = useState(false);
  const [price, setPrice] = useState('');
  const [benefits, setBenefits] = useState(['']);
  const [error, setError] = useState('');
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await fetch('http://localhost:5000/api/auth/profile', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          setProfile(data.user);
        }
      } catch (err) {
        console.error('Failed to fetch profile', err);
      }
    };
    fetchProfile();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (isPaid) {
      if (!price || parseFloat(price) <= 0) {
        setError('Please enter a valid price for the paid course.');
        return;
      }
      
      const hasPaymentDetails = profile?.upi_id || (profile?.bank_account && profile?.ifsc_code);
      if (!hasPaymentDetails) {
        setError(
          <span>
            Payment details missing! Please add your UPI ID or Bank details in your 
            <Link to="/profile" style={{ color: 'var(--primary)', textDecoration: 'underline', marginLeft: '4px' }}>
              profile
            </Link> before launching a paid course.
          </span>
        );
        return;
      }
    }

    setLoading(true);

    try {
      const token = localStorage.getItem('token');
      const res = await fetch('http://localhost:5000/api/instructor/courses', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ 
          title: title.trim(), 
          description: description.trim(), 
          is_paid: isPaid ? 1 : 0, 
          price: isPaid ? parseFloat(price) : 0,
          benefits: benefits.filter(b => b.trim() !== '')
        }),
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

  const addBenefit = () => setBenefits([...benefits, '']);
  const removeBenefit = (index) => setBenefits(benefits.filter((_, i) => i !== index));
  const updateBenefit = (index, value) => {
    const newBenefits = [...benefits];
    newBenefits[index] = value;
    setBenefits(newBenefits);
  };

  return (
    <div className="dashboard-container instructor-container course-form-page">
      <style>{`
        .course-form-page {
          padding: 100px 2rem 2rem;
          max-width: 900px;
          margin: 0 auto;
        }
        .form-card {
          background: white;
          border-radius: var(--radius-xl);
          padding: 2.5rem;
          box-shadow: var(--shadow-xl);
          border: 1px solid var(--border-color);
        }
        .pricing-toggle {
          display: flex;
          gap: 1rem;
          margin-bottom: 1.5rem;
        }
        .pricing-btn {
          flex: 1;
          padding: 1.25rem;
          border-radius: 16px;
          border: 2px solid var(--border-color);
          background: white;
          cursor: pointer;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 0.5rem;
        }
        .pricing-btn.active.free {
          border-color: #10b981;
          background: #ecfdf5;
          color: #059669;
        }
        .pricing-btn.active.paid {
          border-color: var(--primary);
          background: rgba(99, 102, 241, 0.05);
          color: var(--primary);
        }
        @media (max-width: 768px) {
          .course-form-page { padding: 85px 1rem 1rem; }
          .form-card { padding: 1.5rem; }
          .pricing-toggle { flex-direction: column; }
        }
      `}</style>

      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <Link to="/instructor/dashboard" className="back-link">
          <ArrowLeft size={18} /> Back to Dashboard
        </Link>
      </motion.div>

      <div className="page-header" style={{ marginBottom: '2.5rem' }}>
        <motion.h1 
          initial={{ opacity: 0, x: -20 }} 
          animate={{ opacity: 1, x: 0 }}
          style={{ fontSize: '2.5rem', fontWeight: '900', marginBottom: '0.5rem' }}
        >
          Create New <span className="text-gradient">Course</span>
        </motion.h1>
        <motion.p 
          initial={{ opacity: 0 }} 
          animate={{ opacity: 1 }} 
          transition={{ delay: 0.1 }}
          style={{ color: 'var(--text-secondary)', fontSize: '1.1rem' }}
        >
          Fill in the details below to launch your next educational masterpiece.
        </motion.p>
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }} 
        animate={{ opacity: 1, y: 0 }} 
        transition={{ delay: 0.2 }}
        className="form-card glass-panel"
      >
        {error && (
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="auth-error" style={{ marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <AlertCircle size={20} /> {error}
          </motion.div>
        )}
        
        <form onSubmit={handleSubmit}>
          <div className="form-group" style={{ marginBottom: '2rem' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', fontSize: '1rem', fontWeight: '700', marginBottom: '0.75rem' }}>
              <BookOpen size={18} className="text-primary" /> Course Title
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Master Modern UI Design with React"
              className="input-field"
              required
              style={{ padding: '1rem 1.25rem', fontSize: '1.05rem' }}
            />
          </div>

          <div className="form-group" style={{ marginBottom: '2rem' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', fontSize: '1rem', fontWeight: '700', marginBottom: '0.75rem' }}>
              <FileText size={18} className="text-primary" /> Course Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Provide a compelling description of what students will achieve..."
              className="input-field textarea-field"
              required
              style={{ minHeight: '150px', padding: '1rem 1.25rem', fontSize: '1rem', lineHeight: '1.6' }}
            />
          </div>

          <div className="form-group" style={{ marginBottom: '2.5rem' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', fontSize: '1rem', fontWeight: '700', marginBottom: '1rem' }}>
              <Sparkles size={18} className="text-secondary" /> Pricing Model
            </label>
            <div className="pricing-toggle">
              <button
                type="button"
                onClick={() => setIsPaid(false)}
                className={`pricing-btn free ${!isPaid ? 'active' : ''}`}
              >
                <span style={{ fontSize: '1.5rem' }}>🆓</span>
                <span style={{ fontWeight: '800' }}>Free Course</span>
                <span style={{ fontSize: '0.8rem', opacity: 0.8 }}>Maximum accessibility</span>
              </button>
              <button
                type="button"
                onClick={() => setIsPaid(true)}
                className={`pricing-btn paid ${isPaid ? 'active' : ''}`}
              >
                <span style={{ fontSize: '1.5rem' }}>💰</span>
                <span style={{ fontWeight: '800' }}>Paid Course</span>
                <span style={{ fontSize: '0.8rem', opacity: 0.8 }}>Professional value</span>
              </button>
            </div>

            <AnimatePresence>
              {isPaid && (
                <motion.div 
                  initial={{ opacity: 0, height: 0 }} 
                  animate={{ opacity: 1, height: 'auto' }} 
                  exit={{ opacity: 0, height: 0 }}
                  style={{ overflow: 'hidden' }}
                >
                  <div style={{ padding: '1.5rem', background: 'rgba(99,102,241,0.05)', borderRadius: '16px', border: '1px solid rgba(99,102,241,0.2)' }}>
                    <label style={{ fontSize: '0.85rem', fontWeight: '700', color: 'var(--text-secondary)', marginBottom: '0.75rem', display: 'block' }}>
                      Set Course Price (₹ INR)
                    </label>
                    <div style={{ position: 'relative' }}>
                      <span style={{ position: 'absolute', left: '1.25rem', top: '50%', transform: 'translateY(-50%)', fontWeight: '900', color: 'var(--primary)', fontSize: '1.25rem' }}>₹</span>
                      <input
                        type="number"
                        value={price}
                        onChange={(e) => setPrice(e.target.value)}
                        placeholder="e.g. 999"
                        className="input-field"
                        min="1"
                        required={isPaid}
                        style={{ paddingLeft: '2.8rem', fontSize: '1.25rem', fontWeight: '800' }}
                      />
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div className="form-group" style={{ marginBottom: '2.5rem' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', fontSize: '1rem', fontWeight: '700', marginBottom: '1rem' }}>
              <Check size={18} className="text-secondary" /> Learning Outcomes
            </label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {benefits.map((benefit, index) => (
                <motion.div key={index} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} style={{ display: 'flex', gap: '0.75rem' }}>
                  <input
                    type="text"
                    value={benefit}
                    onChange={(e) => updateBenefit(index, e.target.value)}
                    placeholder="e.g. Master the fundamentals of CSS Grid"
                    className="input-field"
                  />
                  {benefits.length > 1 && (
                    <button type="button" onClick={() => removeBenefit(index)} className="icon-btn-muted" style={{ padding: '0.5rem', background: 'rgba(239,68,68,0.05)', color: '#ef4444' }}>
                      <Plus size={18} style={{ transform: 'rotate(45deg)' }} />
                    </button>
                  )}
                </motion.div>
              ))}
            </div>
            <button 
              type="button" 
              onClick={addBenefit} 
              className="nav-btn-outline" 
              style={{ marginTop: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.6rem 1.25rem', fontSize: '0.85rem' }}
            >
              <Plus size={16} /> Add Another Outcome
            </button>
          </div>

          <motion.button 
            whileHover={{ scale: 1.01 }} 
            whileTap={{ scale: 0.98 }}
            type="submit" 
            className="btn-primary" 
            disabled={loading} 
            style={{ width: '100%', padding: '1.25rem', fontSize: '1.1rem', fontWeight: '800', display: 'flex', justifyContent: 'center', gap: '0.75rem', marginTop: '1rem' }}
          >
            {loading ? <><Loader2 className="animate-spin" size={20} /> Creating Course...</> : `Launch ${isPaid ? 'Paid' : 'Free'} Course`}
          </motion.button>
        </form>
      </motion.div>
    </div>
  );
};

export default InstructorCourseForm;
