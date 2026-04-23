import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Lock, PlayCircle, ShoppingCart, Eye, Users, User, Star, Zap, Shield, CheckCircle, FileText, Video, Loader2, CreditCard, X, Award, Briefcase } from 'lucide-react';
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
  const [step, setStep] = useState('confirm');
  const [error, setError] = useState('');
  const [instructor, setInstructor] = useState(null);

  useEffect(() => {
    fetch(`http://localhost:5000/api/instructor/public/${course.instructor_id}`)
      .then(r => r.json()).then(d => setInstructor(d.instructor)).catch(console.error);
  }, [course.instructor_id]);

  const handlePay = async () => {
    setStep('processing');
    try {
      const token = localStorage.getItem('token');
      const orderRes = await fetch('http://localhost:5000/api/payment/create-order', {
        method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ courseId: course.id })
      });
      const orderData = await orderRes.json();
      if (!orderRes.ok) { setError(orderData.message); setStep('confirm'); return; }

      if (orderData.isMock) {
        await new Promise(r => setTimeout(r, 1500));
        const verifyRes = await fetch('http://localhost:5000/api/payment/verify', {
          method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
          body: JSON.stringify({ razorpay_order_id: orderData.orderId, razorpay_payment_id: 'demo_' + Date.now(), courseId: course.id, isMock: true })
        });
        if (verifyRes.ok) { setStep('success'); setTimeout(onSuccess, 1800); } else { setStep('failed'); }
        return;
      }

      const options = {
        key: orderData.keyId, amount: orderData.amount, currency: orderData.currency,
        name: 'EduFlow LMS', description: course.title, order_id: orderData.orderId,
        handler: async (response) => {
          const vr = await fetch('http://localhost:5000/api/payment/verify', {
            method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify({ ...response, courseId: course.id })
          });
          if (vr.ok) { setStep('success'); setTimeout(onSuccess, 1800); } else { setStep('failed'); }
        },
        theme: { color: '#6366f1' }, modal: { ondismiss: () => setStep('confirm') }
      };
      const rzp = new window.Razorpay(options);
      rzp.open();
      setStep('confirm');
    } catch { setError('Unexpected error. Try again.'); setStep('confirm'); }
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(8px)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
      onClick={step === 'confirm' ? onClose : undefined}>
      <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} onClick={e => e.stopPropagation()}
        className="glass-panel" style={{ maxWidth: '420px', width: '95%', padding: '2.5rem', textAlign: 'center', position: 'relative' }}>
        {step === 'confirm' && (
          <button onClick={onClose} style={{ position: 'absolute', top: '1rem', right: '1rem', background: 'var(--bg-subtle)', border: 'none', borderRadius: '50%', padding: '0.4rem', cursor: 'pointer', display: 'flex' }}><X size={18} /></button>
        )}
        {step === 'confirm' && (
          <>
            <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.25rem', color: 'white' }}><ShoppingCart size={28} /></div>
            <h2 style={{ marginBottom: '0.4rem' }}>Complete Purchase</h2>
            <p style={{ color: 'var(--text-muted)', marginBottom: '1.25rem', fontSize: '0.9rem' }}>{course.title}</p>
            <div style={{ background: 'var(--bg-subtle)', borderRadius: '10px', padding: '1rem', marginBottom: '1.25rem', fontSize: '0.9rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: '800', fontSize: '1.1rem' }}>
                <span>Total</span><span style={{ color: 'var(--primary)' }}>{formatPrice(course.price)}</span>
              </div>
            </div>

            {instructor && (instructor.upi_id || instructor.bank_account) && (
                <div style={{ textAlign: 'left', background: 'rgba(99,102,241,0.05)', borderRadius: '12px', padding: '1rem', marginBottom: '1.25rem', fontSize: '0.8rem', border: '1px dashed var(--primary)' }}>
                    <div style={{ fontWeight: '800', color: 'var(--primary)', marginBottom: '0.4rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                        <Briefcase size={14} /> Instructor Payment Details
                    </div>
                    {instructor.upi_id && <div><strong>UPI ID:</strong> {instructor.upi_id}</div>}
                    {instructor.bank_account && (
                        <div style={{ marginTop: '0.3rem' }}>
                            <div><strong>Bank A/C:</strong> {instructor.bank_account}</div>
                            <div><strong>IFSC:</strong> {instructor.ifsc_code}</div>
                        </div>
                    )}
                    {instructor.qr_code && (
                        <div style={{ marginTop: '0.75rem', textAlign: 'center' }}>
                            <img src={instructor.qr_code} alt="QR" style={{ width: '100px', borderRadius: '8px' }} />
                        </div>
                    )}
                </div>
            )}
            {error && <div className="auth-error" style={{ marginBottom: '1rem' }}>{error}</div>}
            <button onClick={handlePay} className="enroll-btn" style={{ width: '100%', padding: '1rem', background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.6rem', fontSize: '1rem', marginBottom: '0.75rem' }}>
              <CreditCard size={20} /> Pay Now
            </button>
            <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>🔒 Demo mode — no real charges</p>
          </>
        )}
        {step === 'processing' && (
          <><Loader2 className="animate-spin text-primary" size={52} style={{ margin: '0.5rem auto 1.5rem' }} /><h2>Processing...</h2><p style={{ color: 'var(--text-muted)' }}>Verifying your payment.</p></>
        )}
        {step === 'success' && (
          <><div style={{ width: '72px', height: '72px', borderRadius: '50%', background: '#10b981', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.25rem', color: 'white' }}><CheckCircle size={36} /></div><h2 style={{ color: '#10b981' }}>Payment Successful!</h2><p style={{ color: 'var(--text-muted)', marginTop: '0.5rem' }}>Redirecting to your course...</p></>
        )}
        {step === 'failed' && (
          <><div style={{ fontSize: '3.5rem', marginBottom: '1rem' }}>❌</div><h2 style={{ color: '#ef4444' }}>Payment Failed</h2><button onClick={() => setStep('confirm')} className="enroll-btn" style={{ marginTop: '1.25rem', width: '100%' }}>Try Again</button></>
        )}
      </motion.div>
    </motion.div>
  );
};

export default StudentCoursePreview;
