import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, User, BookOpen, ArrowLeft, CheckCircle, Loader2, Trophy, Sparkles, Plus, Users, X, FileText, Video, Lock, CreditCard, ShoppingCart, Shield, Zap, Star, Briefcase } from 'lucide-react';
import './Student.css';

const formatPrice = (price) => `₹${Number(price).toLocaleString('en-IN')}`;

const StudentCatalog = () => {
  const [courses, setCourses] = useState([]);
  const [enrolledIds, setEnrolledIds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [enrolling, setEnrolling] = useState(null);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [paymentModal, setPaymentModal] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const navigate = useNavigate();

  useEffect(() => { fetchCatalogAndEnrollments(); }, []);

  const fetchCatalogAndEnrollments = async () => {
    try {
      const token = localStorage.getItem('token');
      const [catalogRes, enrollRes] = await Promise.all([
        fetch('http://localhost:5000/api/student/courses', { headers: { 'Authorization': `Bearer ${token}` } }),
        fetch('http://localhost:5000/api/student/enrollments', { headers: { 'Authorization': `Bearer ${token}` } })
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
      const res = await fetch(`http://localhost:5000/api/student/courses/${courseId}/enroll`, {
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
            const isPaid = course.is_paid === 1;
            return (
              <motion.div key={course.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.07 }} className="catalog-card glass-panel" whileHover={{ y: -8, boxShadow: 'var(--shadow-xl)' }}>
                <div style={{ position: 'relative', overflow: 'hidden', borderRadius: 'var(--radius-lg)', marginBottom: '1.25rem' }}>
                  {isEnrolled && <span className="course-badge" style={{ zIndex: 10, background: 'var(--secondary)' }}>Enrolled</span>}
                  {isPaid && !isEnrolled && (
                    <span style={{ position: 'absolute', top: '0.75rem', right: '0.75rem', zIndex: 10, background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', color: 'white', padding: '0.3rem 0.8rem', borderRadius: '20px', fontSize: '0.8rem', fontWeight: '800' }}>
                      {formatPrice(course.price)}
                    </span>
                  )}
                  {!isPaid && !isEnrolled && (
                    <span style={{ position: 'absolute', top: '0.75rem', right: '0.75rem', zIndex: 10, background: 'linear-gradient(135deg,#10b981,#059669)', color: 'white', padding: '0.3rem 0.8rem', borderRadius: '20px', fontSize: '0.8rem', fontWeight: '800' }}>
                      FREE
                    </span>
                  )}
                  <div style={{ height: '160px', background: isPaid ? 'linear-gradient(135deg,#6366f1,#8b5cf6)' : 'linear-gradient(135deg,#10B981,#3B82F6)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}>
                    {isPaid ? <CreditCard size={64} opacity={0.6} /> : <Trophy size={64} opacity={0.6} />}
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
                      {isPaid ? (
                        <button className="enroll-btn" onClick={() => setPaymentModal(course)}
                          style={{ flexGrow: 2, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', background: 'linear-gradient(135deg,#6366f1,#8b5cf6)' }}>
                          <ShoppingCart size={18} /> Buy ₹{Number(course.price).toLocaleString('en-IN')}
                        </button>
                      ) : (
                        <button className="enroll-btn" onClick={() => handleFreeEnroll(course.id)}
                          disabled={enrolling === course.id}
                          style={{ flexGrow: 2, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                          {enrolling === course.id ? <Loader2 className="animate-spin" size={18} /> : <Plus size={18} />} Enroll Free
                        </button>
                      )}
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
            onEnroll={handleFreeEnroll} onBuy={(c) => { setSelectedCourse(null); setPaymentModal(c); }}
            isEnrolling={enrolling === selectedCourse?.id} />
        )}
      </AnimatePresence>
      <AnimatePresence>
        {paymentModal && (
          <PaymentModal course={paymentModal} onClose={() => setPaymentModal(null)}
            onSuccess={() => { setPaymentModal(null); fetchCatalogAndEnrollments(); navigate(`/student/courses/${paymentModal.id}`); }} />
        )}
      </AnimatePresence>
    </div>
  );
};

const CoursePreviewModal = ({ course, onClose, onEnroll, onBuy, isEnrolling }) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const isPaid = course.is_paid === 1;

  useEffect(() => {
    const fetchDetails = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await fetch(`http://localhost:5000/api/student/courses/${course.id}/public`, { headers: { 'Authorization': `Bearer ${token}` } });
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
            <div style={{ height: '180px', background: isPaid ? 'linear-gradient(135deg,#6366f1,#8b5cf6)' : 'linear-gradient(135deg,var(--primary),var(--secondary))', padding: '2rem', color: 'white', position: 'relative', flexShrink: 0 }}>
              <button onClick={onClose} style={{ position: 'absolute', top: '1rem', right: '1rem', background: 'rgba(0,0,0,0.2)', border: 'none', color: 'white', borderRadius: '50%', padding: '0.5rem', cursor: 'pointer', display: 'flex' }}><X size={20} /></button>
              {isPaid && (
                <span style={{ display: 'inline-block', background: 'rgba(255,255,255,0.2)', border: '1px solid rgba(255,255,255,0.4)', borderRadius: '20px', padding: '0.25rem 0.75rem', fontSize: '0.8rem', fontWeight: '700', marginBottom: '0.5rem' }}>
                  💰 PAID COURSE
                </span>
              )}
              <h2 style={{ fontSize: '1.6rem', marginBottom: '0.5rem' }}>{data.course.title}</h2>
              <div style={{ display: 'flex', gap: '1.5rem', opacity: 0.9, fontSize: '0.9rem' }}>
                <Link to={`/instructor/profile/${data.course.instructor_id}`} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'white', textDecoration: 'none' }}><User size={15} />{data.course.instructor_name}</Link>
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}><Users size={15} />{data.course.total_enrolled} enrolled</span>
                {isPaid && <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}><Star size={15} />{formatPrice(data.course.price)}</span>}
              </div>
            </div>
            <div style={{ padding: '2rem', overflowY: 'auto', flexGrow: 1 }}>
              <div style={{ display: 'flex', gap: '2rem' }}>
                <div style={{ flex: 2 }}>
                  <h3 style={{ marginBottom: '1rem' }}>Course Overview</h3>
                  <p style={{ color: 'var(--text-secondary)', lineHeight: '1.7', marginBottom: '1.5rem' }}>{data.course.description || 'No description provided.'}</p>
                  
                  {data.course.benefits && JSON.parse(data.course.benefits).length > 0 && (
                      <div style={{ marginBottom: '2rem' }}>
                          <h3 style={{ marginBottom: '1rem' }}>What you'll learn</h3>
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                              {JSON.parse(data.course.benefits).map((b, i) => (
                                  <div key={i} style={{ display: 'flex', gap: '0.5rem', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                                      <CheckCircle size={16} className="text-secondary" style={{ flexShrink: 0, marginTop: '2px' }} />
                                      {b}
                                  </div>
                              ))}
                          </div>
                      </div>
                  )}

                  <h3 style={{ marginBottom: '1rem' }}>Curriculum ({data.lessons.length} lessons)</h3>
                  {isPaid && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.75rem 1rem', background: 'rgba(99,102,241,0.08)', borderRadius: '8px', marginBottom: '1rem', fontSize: '0.85rem', color: 'var(--primary)', fontWeight: '600' }}>
                      <Zap size={16} /> {data.previewCount} free preview lesson{data.previewCount !== 1 ? 's' : ''} available
                    </div>
                  )}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', maxHeight: '250px', overflowY: 'auto' }}>
                    {data.lessons.map((lesson, idx) => (
                      <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '0.75rem 1rem', background: 'var(--bg-subtle)', borderRadius: '10px', opacity: lesson.is_preview || !isPaid ? 1 : 0.6 }}>
                        <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: lesson.is_preview || !isPaid ? 'var(--primary)' : 'var(--text-muted)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.7rem', fontWeight: 'bold', color: 'white', flexShrink: 0 }}>
                          {lesson.is_preview || !isPaid ? (idx + 1) : <Lock size={12} />}
                        </div>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontWeight: '600', fontSize: '0.9rem' }}>{lesson.title}</div>
                          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'capitalize' }}>{lesson.type}</div>
                        </div>
                        {isPaid && lesson.is_preview === 1 && (
                          <span style={{ fontSize: '0.65rem', background: '#dcfce7', color: '#16a34a', padding: '0.15rem 0.5rem', borderRadius: '10px', fontWeight: '700' }}>FREE</span>
                        )}
                        {isPaid && !lesson.is_preview && <Lock size={14} style={{ color: 'var(--text-muted)' }} />}
                      </div>
                    ))}
                  </div>
                </div>
                <div style={{ flex: 1 }}>
                  <div className="glass-panel" style={{ padding: '1.5rem', background: 'var(--bg-subtle)', border: '1px solid var(--border-color)', position: 'sticky', top: 0 }}>
                    {isPaid ? (
                      <>
                        <div style={{ textAlign: 'center', marginBottom: '1.25rem' }}>
                          <div style={{ fontSize: '2.5rem', fontWeight: '900', color: 'var(--primary)' }}>{formatPrice(data.course.price)}</div>
                          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>One-time payment</div>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1.25rem', fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Shield size={14} style={{ color: 'var(--secondary)' }} /> Secure payment</div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Zap size={14} style={{ color: 'var(--secondary)' }} /> Instant access</div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><CheckCircle size={14} style={{ color: 'var(--secondary)' }} /> Full course access</div>
                        </div>
                        <button className="enroll-btn" onClick={() => onBuy(course)} style={{ width: '100%', padding: '1rem', background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                          <ShoppingCart size={18} /> Buy Now
                        </button>
                      </>
                    ) : (
                      <>
                        <div style={{ textAlign: 'center', marginBottom: '1.25rem' }}>
                          <div style={{ fontSize: '2rem', fontWeight: '900', color: 'var(--secondary)' }}>FREE</div>
                        </div>
                        <button className="enroll-btn" onClick={() => onEnroll(data.course.id)} disabled={isEnrolling} style={{ width: '100%', padding: '1rem' }}>
                          {isEnrolling ? <Loader2 className="animate-spin" size={18} /> : 'Enroll Now'}
                        </button>
                      </>
                    )}
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

const PaymentModal = ({ course, onClose, onSuccess }) => {
  const [step, setStep] = useState('confirm'); // confirm | processing | success | failed
  const [error, setError] = useState('');
  const [instructor, setInstructor] = useState(null);

  useEffect(() => {
    fetch(`http://localhost:5000/api/instructor/public/${course.instructor_id}`)
      .then(r => r.json()).then(d => setInstructor(d.instructor)).catch(console.error);
  }, [course.instructor_id]);

  const handlePayment = async () => {
    setStep('processing');
    setError('');
    try {
      const token = localStorage.getItem('token');
      const orderRes = await fetch('http://localhost:5000/api/payment/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ courseId: course.id })
      });
      const orderData = await orderRes.json();
      if (!orderRes.ok) { setError(orderData.message || 'Failed to create order'); setStep('confirm'); return; }

      if (orderData.isMock) {
        // Demo mode — simulate payment without real Razorpay keys
        await new Promise(r => setTimeout(r, 1500));
        const verifyRes = await fetch('http://localhost:5000/api/payment/verify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
          body: JSON.stringify({ razorpay_order_id: orderData.orderId, razorpay_payment_id: 'demo_pay_' + Date.now(), courseId: course.id, isMock: true })
        });
        if (verifyRes.ok) { setStep('success'); setTimeout(onSuccess, 2000); }
        else { setStep('failed'); }
        return;
      }

      // Real Razorpay checkout
      const options = {
        key: orderData.keyId,
        amount: orderData.amount,
        currency: orderData.currency,
        name: 'EduFlow LMS',
        description: orderData.courseName,
        order_id: orderData.orderId,
        handler: async (response) => {
          const verifyRes = await fetch('http://localhost:5000/api/payment/verify', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify({ ...response, courseId: course.id })
          });
          if (verifyRes.ok) { setStep('success'); setTimeout(onSuccess, 2000); }
          else { setStep('failed'); }
        },
        prefill: {},
        theme: { color: '#6366f1' },
        modal: { ondismiss: () => setStep('confirm') }
      };
      const rzp = new window.Razorpay(options);
      rzp.open();
      setStep('confirm');
    } catch (err) {
      setError('An unexpected error occurred. Please try again.');
      setStep('confirm');
    }
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="modal-overlay" onClick={step === 'confirm' ? onClose : undefined}>
      <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
        className="modal-content glass-panel" onClick={e => e.stopPropagation()}
        style={{ maxWidth: '440px', width: '95%', padding: '2.5rem', textAlign: 'center' }}>

        {step === 'confirm' && (
          <>
            <div style={{ width: '72px', height: '72px', borderRadius: '50%', background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem', color: 'white' }}>
              <ShoppingCart size={32} />
            </div>
            <h2 style={{ marginBottom: '0.5rem' }}>Complete Purchase</h2>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>{course.title}</p>
            <div style={{ background: 'var(--bg-subtle)', borderRadius: '12px', padding: '1.25rem', marginBottom: '1.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', fontSize: '0.9rem' }}>
                <span>Course Price</span><span style={{ fontWeight: '700' }}>{formatPrice(course.price)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', paddingTop: '0.75rem', borderTop: '1px solid var(--border-color)', fontWeight: '800' }}>
                <span>Total</span><span style={{ color: 'var(--primary)', fontSize: '1.2rem' }}>{formatPrice(course.price)}</span>
              </div>
            </div>

            {instructor && (instructor.upi_id || instructor.bank_account) && (
                <div style={{ textAlign: 'left', background: 'rgba(99,102,241,0.05)', borderRadius: '12px', padding: '1rem', marginBottom: '1.5rem', fontSize: '0.82rem', border: '1px dashed var(--primary)' }}>
                    <div style={{ fontWeight: '800', color: 'var(--primary)', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                        <Briefcase size={14} /> Instructor Payment Details
                    </div>
                    {instructor.upi_id && <div><strong>UPI ID:</strong> {instructor.upi_id}</div>}
                    {instructor.bank_account && (
                        <div style={{ marginTop: '0.4rem' }}>
                            <div><strong>Bank A/C:</strong> {instructor.bank_account}</div>
                            <div><strong>IFSC:</strong> {instructor.ifsc_code}</div>
                        </div>
                    )}
                    {instructor.qr_code && (
                        <div style={{ marginTop: '0.75rem', textAlign: 'center' }}>
                            <img src={instructor.qr_code} alt="QR" style={{ width: '120px', borderRadius: '8px' }} />
                        </div>
                    )}
                </div>
            )}
            {error && <div className="auth-error" style={{ marginBottom: '1rem' }}>{error}</div>}
            <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1rem' }}>
              <button onClick={onClose} className="nav-btn-outline" style={{ flex: 1, padding: '0.9rem' }}>Cancel</button>
              <button onClick={handlePayment} className="enroll-btn" style={{ flex: 2, padding: '0.9rem', background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                <CreditCard size={18} /> Pay Now
              </button>
            </div>
            <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              <span>🔒 SSL Secured</span><span>💳 UPI / Cards</span><span>🏦 Net Banking</span>
            </div>
            <p style={{ marginTop: '0.75rem', fontSize: '0.72rem', color: 'var(--text-muted)' }}>
              Demo mode: payment is simulated without real charges.
            </p>
          </>
        )}

        {step === 'processing' && (
          <>
            <Loader2 className="animate-spin text-primary" size={56} style={{ margin: '0 auto 1.5rem' }} />
            <h2>Processing Payment...</h2>
            <p style={{ color: 'var(--text-secondary)' }}>Please wait while we verify your payment.</p>
          </>
        )}

        {step === 'success' && (
          <>
            <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: 'linear-gradient(135deg,#10b981,#059669)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem', color: 'white' }}>
              <CheckCircle size={40} />
            </div>
            <h2 style={{ color: 'var(--secondary)' }}>Payment Successful!</h2>
            <p style={{ color: 'var(--text-secondary)', marginTop: '0.5rem' }}>You now have full access to <strong>{course.title}</strong>. Redirecting...</p>
          </>
        )}

        {step === 'failed' && (
          <>
            <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: 'linear-gradient(135deg,#ef4444,#dc2626)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem', color: 'white', fontSize: '2rem' }}>✕</div>
            <h2 style={{ color: '#ef4444' }}>Payment Failed</h2>
            <p style={{ color: 'var(--text-secondary)', marginTop: '0.5rem' }}>Something went wrong. Please try again.</p>
            <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.5rem' }}>
              <button onClick={onClose} className="nav-btn-outline" style={{ flex: 1 }}>Cancel</button>
              <button onClick={() => setStep('confirm')} className="enroll-btn" style={{ flex: 1 }}>Retry</button>
            </div>
          </>
        )}
      </motion.div>
    </motion.div>
  );
};

export default StudentCatalog;
