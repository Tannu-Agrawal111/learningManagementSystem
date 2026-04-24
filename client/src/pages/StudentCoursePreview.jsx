import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Lock, PlayCircle, ShoppingCart, Eye, Users, User, Star, Zap, Shield, CheckCircle, FileText, Video, Loader2, CreditCard, X, Award, Briefcase, AlertCircle } from 'lucide-react';
import './Student.css';

const formatPrice = (p) => `₹${Number(p).toLocaleString('en-IN')}`;

const StudentCoursePreview = () => {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [paymentModal, setPaymentModal] = useState(false);
  const [activeLesson, setActiveLesson] = useState(null);

  useEffect(() => {
    const fetch_ = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await fetch(`http://localhost:5000/api/student/courses/${courseId}/public`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
          const json = await res.json();
          setData(json);
          const firstPreview = json.lessons.find(l => l.is_preview === 1);
          setActiveLesson(firstPreview || json.lessons[0]);
        }
      } catch (e) { console.error(e); }
      finally { setLoading(false); }
    };
    fetch_();
  }, [courseId]);

  if (loading) return (
    <div className="dashboard-container" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
      <Loader2 className="animate-spin text-primary" size={40} />
    </div>
  );

  if (!data) return (
    <div className="dashboard-container"><div className="empty-state"><h2>Course not found</h2><Link to="/student/catalog" className="btn-primary" style={{ marginTop: '1rem' }}>Back to Catalog</Link></div></div>
  );

  const renderRichText = (text) => {
    if (!text) return null;
    const lines = text.split('\n');
    return lines.map((line, i) => {
        if (line.startsWith('# ')) return <h1 key={i} style={{ fontSize: '1.8rem', marginBottom: '1.2rem', fontWeight: '800', borderBottom: '2px solid var(--primary-light)', paddingBottom: '0.4rem' }}>{line.substring(2)}</h1>;
        if (line.startsWith('## ')) return <h2 key={i} style={{ fontSize: '1.4rem', marginBottom: '1rem', fontWeight: '700', marginTop: '1.5rem' }}>{line.substring(3)}</h2>;
        if (line.startsWith('```')) {
            let codeContent = '';
            let j = i + 1;
            while(j < lines.length && !lines[j].startsWith('```')) { codeContent += lines[j] + '\n'; j++; }
            if (codeContent) return <div key={i} className="code-block" style={{ background: '#1e1e1e', color: '#d4d4d4', padding: '1.25rem', borderRadius: '12px', fontFamily: 'monospace', marginBottom: '1.25rem', overflowX: 'auto' }}><pre style={{ margin: 0 }}>{codeContent}</pre></div>;
        }
        let formattedLine = line.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>').replace(/\*(.*?)\*/g, '<em>$1</em>');
        if (line.trim() === '') return <div key={i} style={{ height: '0.75rem' }} />;
        return <p key={i} style={{ marginBottom: '0.75rem', lineHeight: '1.7' }} dangerouslySetInnerHTML={{ __html: formattedLine }} />;
    });
  };

  const { course, lessons, isPreview, previewCount } = data;
  const isPaid = course.is_paid === 1;
  const lockedCount = lessons.length - (previewCount || 0);

  return (
    <>
      <div className="dashboard-container student-container course-preview-page" style={{ maxWidth: '1300px' }}>
      <style>{`
        .course-preview-page {
          padding: 100px 2rem 2rem;
        }
        .preview-main-layout {
          display: flex;
          gap: 2rem;
        }
        @media (max-width: 1024px) {
          .preview-main-layout {
            flex-direction: column;
          }
          .curriculum-sidebar {
            width: 100% !important;
          }
          .course-preview-hero {
            padding: 2rem !important;
          }
          .course-preview-hero h1 {
            font-size: 1.8rem !important;
          }
        }
        @media (max-width: 768px) {
          .course-preview-page { padding: 85px 1rem 1rem; }
          .hero-stats {
            flex-direction: column;
            gap: 0.75rem !important;
          }
          .preview-content-card {
            padding: 1.5rem !important;
          }
          .benefits-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
        <Link to="/student/catalog" className="back-link" style={{ marginBottom: '1.5rem' }}><ArrowLeft size={18} /> Back to Catalog</Link>

        {/* Hero */}
        <div className="course-preview-hero" style={{ borderRadius: 'var(--radius-xl)', overflow: 'hidden', marginBottom: '2rem', background: isPaid ? 'linear-gradient(135deg,#4f46e5,#7c3aed)' : 'linear-gradient(135deg,#10b981,#3b82f6)', color: 'white', padding: '3rem' }}>
          {isPaid && <span style={{ display: 'inline-block', background: 'rgba(255,255,255,0.2)', borderRadius: '20px', padding: '0.3rem 1rem', fontSize: '0.8rem', fontWeight: '800', marginBottom: '1rem' }}>💰 PAID COURSE</span>}
          <h1 style={{ fontSize: '2.5rem', fontWeight: '900', marginBottom: '0.75rem' }}>{course.title}</h1>
          <p style={{ fontSize: '1.05rem', opacity: 0.9, marginBottom: '1.5rem', maxWidth: '600px' }}>{course.description}</p>
          <div className="hero-stats" style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap', fontSize: '0.9rem', opacity: 0.9 }}>
            <Link to={`/instructor/profile/${course.instructor_id}`} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'white', textDecoration: 'none' }}><User size={16} />{course.instructor_name}</Link>
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Users size={16} />{course.total_enrolled} students</span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><PlayCircle size={16} />{lessons.length} lessons</span>
            {isPaid && <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Eye size={16} />{previewCount} free preview{previewCount !== 1 ? 's' : ''}</span>}
          </div>
        </div>

        <div className="preview-main-layout">
          {/* Curriculum Sidebar */}
          <div className="curriculum-sidebar" style={{ width: '320px', flexShrink: 0 }}>
            <div className="glass-panel" style={{ padding: '1.5rem', marginBottom: '1rem' }}>
              <h3 style={{ marginBottom: '1rem', fontSize: '1.1rem' }}>Course Curriculum</h3>
              {isPaid && (
                <div style={{ background: 'rgba(99,102,241,0.08)', borderRadius: '8px', padding: '0.75rem', marginBottom: '1rem', fontSize: '0.82rem', color: 'var(--primary)', fontWeight: '600' }}>
                  <Zap size={14} style={{ display: 'inline', marginRight: '0.4rem' }} />
                  {previewCount} of {lessons.length} lessons unlocked
                </div>
              )}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', maxHeight: '420px', overflowY: 'auto' }}>
                {lessons.map((lesson, idx) => {
                  const unlocked = lesson.is_preview === 1 || !isPaid;
                  return (
                    <div key={lesson.id} onClick={() => unlocked && setActiveLesson(lesson)}
                      style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem', borderRadius: '10px', cursor: unlocked ? 'pointer' : 'not-allowed', background: activeLesson?.id === lesson.id ? 'rgba(99,102,241,0.12)' : 'transparent', border: activeLesson?.id === lesson.id ? '1px solid rgba(99,102,241,0.3)' : '1px solid transparent', opacity: unlocked ? 1 : 0.55, transition: 'all 0.15s' }}>
                      <div style={{ flexShrink: 0, width: '28px', height: '28px', borderRadius: '50%', background: unlocked ? 'var(--primary)' : 'var(--text-muted)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}>
                        {unlocked ? <PlayCircle size={14} /> : <Lock size={12} />}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontWeight: '600', fontSize: '0.88rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{lesson.title}</div>
                        <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'capitalize' }}>{lesson.type}</div>
                      </div>
                      {unlocked && lesson.is_preview === 1 && isPaid && (
                        <span style={{ fontSize: '0.6rem', background: '#dcfce7', color: '#16a34a', padding: '0.1rem 0.4rem', borderRadius: '8px', fontWeight: '800', flexShrink: 0 }}>FREE</span>
                      )}
                      {!unlocked && <Lock size={14} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Content Area */}
          <div style={{ flexGrow: 1 }}>
            {activeLesson && (activeLesson.is_preview === 1 || !isPaid) ? (
              <div className="glass-panel preview-content-card" style={{ padding: '2.5rem', maxHeight: '750px', display: 'flex', flexDirection: 'column' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem', flexShrink: 0 }}>
                  {isPaid && <span style={{ background: '#dcfce7', color: '#16a34a', padding: '0.25rem 0.75rem', borderRadius: '20px', fontSize: '0.78rem', fontWeight: '800' }}>🎁 FREE PREVIEW</span>}
                  <h2 style={{ fontSize: '1.6rem', margin: 0 }}>{activeLesson.title}</h2>
                </div>

                <div className="scroll-hide" style={{ overflowY: 'auto', flexGrow: 1, paddingRight: '10px' }}>
                    {activeLesson.url && (
                        <div style={{ marginBottom: '2rem', background: 'var(--bg-subtle)', padding: '1.5rem', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
                                <div style={{ background: 'var(--primary)', color: 'white', padding: '0.6rem', borderRadius: '10px' }}>
                                    {activeLesson.type === 'video' ? <Video size={20} /> : <FileText size={20} />}
                                </div>
                                <div>
                                    <div style={{ fontSize: '1rem', fontWeight: '800' }}>{activeLesson.type === 'video' ? 'Lesson Video' : 'Lesson Material'}</div>
                                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{activeLesson.type === 'video' ? 'Watch this video to understand the concepts.' : 'Download the handout for this lesson.'}</div>
                                </div>
                            </div>
                            <a href={activeLesson.url} target="_blank" rel="noopener noreferrer" className="enroll-btn" style={{ display: 'inline-flex', padding: '0.75rem 1.5rem', fontSize: '0.9rem', gap: '0.5rem', background: 'var(--primary)' }}>
                                {activeLesson.type === 'video' ? <><PlayCircle size={18} /> Watch Preview</> : <><FileText size={18} /> View Resource</>}
                            </a>
                        </div>
                    )}
                    
                    {activeLesson.content ? (
                      <div className="rich-content-container" style={{ background: 'white', padding: '2rem', borderRadius: '12px', border: '1px solid var(--border-color)', marginBottom: '1.5rem' }}>
                        {renderRichText(activeLesson.content)}
                      </div>
                    ) : (
                      <div style={{ padding: '2rem', textAlign: 'center', background: 'var(--bg-subtle)', borderRadius: '12px', marginBottom: '1.5rem' }}>
                        <p style={{ color: 'var(--text-muted)', fontStyle: 'italic', margin: 0 }}>Detailed text content is not available for this preview.</p>
                      </div>
                    )}

                    {activeLesson.resources && JSON.parse(activeLesson.resources || '[]').length > 0 && (
                        <div style={{ marginTop: '0.5rem' }}>
                            <h4 style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}><FileText size={18} className="text-primary" /> Additional Preview Resources</h4>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem' }}>
                                {JSON.parse(activeLesson.resources).map((res, idx) => (
                                    <a key={idx} href={res.url} target="_blank" rel="noopener noreferrer" className="glass-panel" style={{ padding: '0.75rem 1.25rem', textDecoration: 'none', color: 'inherit', display: 'flex', alignItems: 'center', gap: '0.6rem', background: 'white', fontSize: '0.85rem' }}>
                                        <FileText size={16} className="text-primary" /> {res.title}
                                    </a>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
              </div>
            ) : (
              <div className="glass-panel" style={{ padding: '3rem', textAlign: 'center' }}>
                <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem', color: 'white' }}>
                  <Lock size={36} />
                </div>
                <h2 style={{ marginBottom: '0.75rem' }}>Content Locked</h2>
                <p style={{ color: 'var(--text-secondary)', maxWidth: '380px', margin: '0 auto 2rem' }}>
                  Purchase this course to unlock all <strong>{lockedCount}</strong> remaining lessons and get full lifetime access.
                </p>
                <button onClick={() => setPaymentModal(true)} className="enroll-btn" style={{ padding: '1rem 2.5rem', background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', display: 'inline-flex', alignItems: 'center', gap: '0.75rem', fontSize: '1rem' }}>
                  <ShoppingCart size={20} /> Unlock Full Course — {formatPrice(course.price)}
                </button>
              </div>
            )}

            {course.benefits && JSON.parse(course.benefits || '[]').length > 0 && (
                <div className="glass-panel" style={{ padding: '2.5rem', marginTop: '1.5rem' }}>
                    <h3 style={{ marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Award size={20} className="text-secondary" /> What you'll learn</h3>
                    <div className="benefits-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                        {JSON.parse(course.benefits || '[]').map((b, i) => (
                            <div key={i} style={{ display: 'flex', gap: '0.75rem', fontSize: '0.95rem', color: 'var(--text-secondary)' }}>
                                <CheckCircle size={18} className="text-secondary" style={{ flexShrink: 0, marginTop: '2px' }} />
                                {b}
                            </div>
                        ))}
                    </div>
                </div>
            )}
            {isPaid && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
                style={{ marginTop: '1.5rem', background: 'linear-gradient(135deg,rgba(99,102,241,0.1),rgba(139,92,246,0.1))', border: '1px solid rgba(99,102,241,0.25)', borderRadius: 'var(--radius-xl)', padding: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '2rem', flexWrap: 'wrap' }}>
                <div>
                  <h3 style={{ marginBottom: '0.4rem', color: 'var(--primary)' }}>Get Full Course Access</h3>
                  <div style={{ display: 'flex', gap: '1.5rem', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}><CheckCircle size={14} style={{ color: 'var(--secondary)' }} /> All {lessons.length} lessons</span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}><Shield size={14} style={{ color: 'var(--secondary)' }} /> Secure payment</span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}><Zap size={14} style={{ color: 'var(--secondary)' }} /> Instant access</span>
                  </div>
                </div>
                <button onClick={() => setPaymentModal(true)} className="enroll-btn" style={{ padding: '0.9rem 2rem', background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', display: 'flex', alignItems: 'center', gap: '0.6rem', flexShrink: 0, fontSize: '1rem' }}>
                  <ShoppingCart size={20} /> Buy Now — {formatPrice(course.price)}
                </button>
              </motion.div>
            )}
          </div>
        </div>
      </div>

      {/* Payment Modal */}
      {paymentModal && (
        <PaymentOverlay course={course} onClose={() => setPaymentModal(false)}
          onSuccess={() => { setPaymentModal(false); navigate(`/student/courses/${courseId}`); }} />
      )}
    </>
  );
};

const PaymentOverlay = ({ course, onClose, onSuccess }) => {
  const [step, setStep] = useState('method_selection'); // method_selection, details, auth, processing, success, failed
  const [method, setMethod] = useState(''); // upi, qr, bank
  const [studentDetails, setStudentDetails] = useState('');
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [instructor, setInstructor] = useState(null);

  useEffect(() => {
    fetch(`http://localhost:5000/api/instructor/public/${course.instructor_id}`)
      .then(r => r.json()).then(d => setInstructor(d.instructor)).catch(console.error);
  }, [course.instructor_id]);

  const handleMethodSelect = (m) => {
    setMethod(m);
    setStep('details');
  };

  const handleProceedToAuth = () => {
    if (!studentDetails.trim()) {
      setError(`Please enter your ${method === 'upi' ? 'UPI ID' : 'Bank Account Number'} to proceed.`);
      return;
    }
    setError('');
    setStep('auth');
  };

  const handlePay = async () => {
    if (pin.length < 4) {
      setError('Please enter a valid 4-digit or 6-digit PIN.');
      return;
    }
    setError('');
    setStep('processing');
    
    try {
      const token = localStorage.getItem('token');
      // 1. Create mock order
      const orderRes = await fetch('http://localhost:5000/api/payment/create-order', {
        method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ courseId: course.id })
      });
      const orderData = await orderRes.json();
      if (!orderRes.ok) { setError(orderData.message); setStep('details'); return; }

      // 2. Simulate bank processing delay
      await new Promise(r => setTimeout(r, 2500));
      
      // 3. Verify mock payment
      const verifyRes = await fetch('http://localhost:5000/api/payment/verify', {
        method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ 
          razorpay_order_id: orderData.orderId || `order_mock_${Date.now()}`, 
          razorpay_payment_id: `txn_${Math.random().toString(36).substr(2, 9)}`, 
          courseId: course.id, 
          isMock: true 
        })
      });
      
      if (verifyRes.ok) { 
        setStep('success'); 
        setTimeout(onSuccess, 2000); 
      } else { 
        setStep('failed'); 
      }
    } catch { 
      setError('Bank server unreachable. Try again.'); 
      setStep('details'); 
    }
  };

  if (!instructor) return null;

  const hasUpi = !!instructor.upi_id;
  const hasBank = !!instructor.bank_account;
  const hasQr = !!instructor.qr_code;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
      onClick={(step === 'method_selection' || step === 'details' || step === 'auth') ? onClose : undefined}>
      <motion.div initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} onClick={e => e.stopPropagation()}
        className="glass-panel" style={{ maxWidth: '450px', width: '95%', padding: '0', overflow: 'hidden', position: 'relative', background: '#fff' }}>
        
        {/* Header */}
        <div style={{ background: 'linear-gradient(135deg, #1e3a8a, #3b82f6)', color: 'white', padding: '1.5rem', textAlign: 'center', position: 'relative' }}>
            {(step === 'details' || step === 'auth') && (
              <button onClick={() => step === 'auth' ? setStep('details') : setStep('method_selection')} style={{ position: 'absolute', top: '1.5rem', left: '1.5rem', background: 'rgba(255,255,255,0.2)', border: 'none', borderRadius: '50%', padding: '0.4rem', cursor: 'pointer', color: 'white', display: 'flex' }}><ArrowLeft size={18} /></button>
            )}
            <button onClick={onClose} style={{ position: 'absolute', top: '1.5rem', right: '1.5rem', background: 'rgba(255,255,255,0.2)', border: 'none', borderRadius: '50%', padding: '0.4rem', cursor: 'pointer', color: 'white', display: 'flex' }}><X size={18} /></button>
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                <Shield size={24} />
                <h2 style={{ margin: 0, fontSize: '1.25rem' }}>Secure Direct Transfer</h2>
            </div>
            <div style={{ fontSize: '1.5rem', fontWeight: '800', margin: '0.5rem 0' }}>{formatPrice(course.price)}</div>
            <div style={{ fontSize: '0.85rem', opacity: 0.9 }}>Paying to: <strong>{course.instructor_name}</strong></div>
        </div>

        <div style={{ padding: '2rem' }}>
            {(!hasUpi && !hasBank && !hasQr) ? (
                <div style={{ textAlign: 'center', color: '#ef4444' }}>
                    <AlertCircle size={48} style={{ margin: '0 auto 1rem' }} />
                    <h3 style={{ marginBottom: '0.5rem' }}>Payment Unavailable</h3>
                    <p style={{ fontSize: '0.9rem' }}>The instructor has not provided any bank or UPI details to receive payments. You cannot enroll at this time.</p>
                </div>
            ) : step === 'method_selection' ? (
                <div>
                    <h3 style={{ marginBottom: '1.5rem', fontSize: '1.1rem', color: 'var(--text-primary)', textAlign: 'center' }}>Choose Payment Method</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        {hasUpi && (
                            <button onClick={() => handleMethodSelect('upi')} className="payment-method-btn" style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1rem', border: '1px solid var(--border-color)', borderRadius: '12px', background: 'white', cursor: 'pointer', transition: 'all 0.2s', textAlign: 'left' }}>
                                <div style={{ background: '#e0e7ff', color: '#4f46e5', padding: '0.6rem', borderRadius: '8px' }}><Zap size={20} /></div>
                                <div style={{ flex: 1 }}>
                                    <div style={{ fontWeight: '700', fontSize: '1rem', color: 'var(--text-primary)' }}>UPI Transfer</div>
                                    <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Pay directly to instructor's UPI ID</div>
                                </div>
                            </button>
                        )}
                        {hasBank && (
                            <button onClick={() => handleMethodSelect('bank')} className="payment-method-btn" style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1rem', border: '1px solid var(--border-color)', borderRadius: '12px', background: 'white', cursor: 'pointer', transition: 'all 0.2s', textAlign: 'left' }}>
                                <div style={{ background: '#dcfce7', color: '#16a34a', padding: '0.6rem', borderRadius: '8px' }}><Briefcase size={20} /></div>
                                <div style={{ flex: 1 }}>
                                    <div style={{ fontWeight: '700', fontSize: '1rem', color: 'var(--text-primary)' }}>Bank Transfer</div>
                                    <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>IMPS / NEFT to instructor's account</div>
                                </div>
                            </button>
                        )}
                        {hasQr && (
                            <button onClick={() => handleMethodSelect('qr')} className="payment-method-btn" style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1rem', border: '1px solid var(--border-color)', borderRadius: '12px', background: 'white', cursor: 'pointer', transition: 'all 0.2s', textAlign: 'left' }}>
                                <div style={{ background: '#f3e8ff', color: '#9333ea', padding: '0.6rem', borderRadius: '8px' }}><CreditCard size={20} /></div>
                                <div style={{ flex: 1 }}>
                                    <div style={{ fontWeight: '700', fontSize: '1rem', color: 'var(--text-primary)' }}>Scan QR Code</div>
                                    <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Scan instructor's QR with any app</div>
                                </div>
                            </button>
                        )}
                    </div>
                    <style>{`.payment-method-btn:hover { border-color: var(--primary) !important; box-shadow: 0 4px 12px rgba(0,0,0,0.05); }`}</style>
                </div>
            ) : step === 'details' ? (
                <div style={{ animation: 'fadeIn 0.3s ease' }}>
                    <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '1.25rem', marginBottom: '1.5rem' }}>
                        <h4 style={{ fontSize: '0.85rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.75rem' }}>Transfer To (Instructor)</h4>
                        {method === 'upi' && <div style={{ fontSize: '1.1rem', fontWeight: '700', color: '#1e3a8a' }}>{instructor.upi_id}</div>}
                        {method === 'bank' && (
                            <>
                                <div style={{ fontSize: '1.1rem', fontWeight: '700', color: '#1e3a8a', marginBottom: '0.25rem' }}>A/C: {instructor.bank_account}</div>
                                <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>IFSC: {instructor.ifsc_code}</div>
                            </>
                        )}
                        {method === 'qr' && (
                            <div style={{ textAlign: 'center' }}>
                                <img src={instructor.qr_code} alt="QR Code" style={{ width: '150px', height: '150px', objectFit: 'contain', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '0.5rem', background: 'white' }} />
                            </div>
                        )}
                    </div>

                    <div style={{ marginBottom: '1.5rem' }}>
                        <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '700', marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>
                            Transfer From (Your {method === 'upi' ? 'UPI ID' : 'Bank Account Number'}) <span style={{color: '#ef4444'}}>*</span>
                        </label>
                        <input 
                            type="text" 
                            value={studentDetails}
                            onChange={(e) => setStudentDetails(e.target.value)}
                            placeholder={method === 'upi' ? "e.g. student@okaxis" : "e.g. 0987654321"}
                            className="input-field"
                            style={{ width: '100%', padding: '0.8rem', fontSize: '1rem', border: '2px solid #e2e8f0' }}
                        />
                        <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>This ensures the money is transferred from the correct student account.</p>
                    </div>

                    {error && <div style={{ color: '#ef4444', fontSize: '0.85rem', marginBottom: '1rem', padding: '0.5rem', background: '#fef2f2', borderRadius: '6px' }}>{error}</div>}

                    <button onClick={handleProceedToAuth} className="btn-primary" style={{ width: '100%', padding: '1rem', fontSize: '1.05rem', background: '#1e3a8a' }}>
                        Proceed to Pay
                    </button>
                </div>
            ) : step === 'auth' ? (
                <div style={{ textAlign: 'center', animation: 'fadeIn 0.3s ease' }}>
                    <Shield size={48} style={{ color: '#10b981', margin: '0 auto 1rem' }} />
                    <h3 style={{ marginBottom: '0.5rem' }}>Bank Authentication</h3>
                    <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>Enter your UPI PIN or Banking Password to authorize the transfer of <strong>{formatPrice(course.price)}</strong>.</p>
                    
                    <div style={{ marginBottom: '1.5rem' }}>
                        <input 
                            type="password" 
                            maxLength={6}
                            value={pin}
                            onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
                            placeholder="****"
                            style={{ width: '150px', textAlign: 'center', padding: '1rem', fontSize: '1.5rem', letterSpacing: '0.5em', border: '2px solid #e2e8f0', borderRadius: '12px', outline: 'none' }}
                        />
                    </div>

                    {error && <div style={{ color: '#ef4444', fontSize: '0.85rem', marginBottom: '1rem' }}>{error}</div>}

                    <button onClick={handlePay} className="btn-primary" style={{ width: '100%', padding: '1rem', fontSize: '1.05rem', background: '#10b981' }}>
                        Confirm & Transfer
                    </button>
                </div>
            ) : step === 'processing' ? (
                <div style={{ textAlign: 'center', padding: '2rem 0' }}>
                    <div style={{ position: 'relative', width: '80px', height: '80px', margin: '0 auto 1.5rem' }}>
                        <Loader2 className="animate-spin" size={80} style={{ color: '#3b82f6' }} />
                        <Shield size={32} style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', color: '#1e3a8a' }} />
                    </div>
                    <h3 style={{ fontSize: '1.25rem', marginBottom: '0.5rem' }}>Processing Transfer...</h3>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Contacting your bank securely. Please do not close this window.</p>
                </div>
            ) : step === 'success' ? (
                <div style={{ textAlign: 'center', padding: '1rem 0' }}>
                    <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: '#10b981', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem', color: 'white' }}>
                        <CheckCircle size={40} />
                    </div>
                    <h2 style={{ color: '#10b981', marginBottom: '0.5rem' }}>Payment Successful!</h2>
                    <p style={{ color: 'var(--text-secondary)', marginBottom: '1rem' }}>{formatPrice(course.price)} transferred to {course.instructor_name}.</p>
                    <div style={{ background: '#f8fafc', padding: '0.75rem', borderRadius: '8px', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                        Transaction ID: TXN{Math.floor(Math.random() * 1000000000)}
                    </div>
                    <p style={{ color: 'var(--primary)', fontWeight: '700', marginTop: '1.5rem' }}>Enrolling you in the course...</p>
                </div>
            ) : (
                <div style={{ textAlign: 'center', padding: '1rem 0' }}>
                    <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: '#fef2f2', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem', color: '#ef4444' }}>
                        <X size={40} />
                    </div>
                    <h2 style={{ color: '#ef4444', marginBottom: '0.5rem' }}>Transfer Failed</h2>
                    <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>Your bank declined the transaction or server timed out.</p>
                    <button onClick={() => setStep('method_selection')} className="btn-primary" style={{ width: '100%', padding: '1rem', background: '#1e3a8a' }}>Try Again</button>
                </div>
            )}
        </div>
      </motion.div>
    </motion.div>
  );
};

export default StudentCoursePreview;
