import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Lock, PlayCircle, ShoppingCart, Eye, Users, User, Star, Zap, Shield, CheckCircle, FileText, Video, Loader2, CreditCard, X, Award, Briefcase, AlertCircle, Plus, DownloadCloud } from 'lucide-react';
import './Student.css';



const StudentCoursePreview = () => {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [enrolling, setEnrolling] = useState(false);
  const [activeLesson, setActiveLesson] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    const fetch_ = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await fetch(`https://learningmanagementsystem-backend-lms.onrender.com/api/student/courses/${courseId}/public`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
          const json = await res.json();
          setData(json);
          if (json.lessons && json.lessons.length > 0) {
            setActiveLesson(json.lessons[0]);
          }
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

  const { course, lessons = [] } = data;
  
  const getYoutubeEmbedUrl = (url) => {
    if (!url) return '';
    let videoId = '';
    if (url.includes('v=')) {
      videoId = url.split('v=')[1]?.split('&')[0];
    } else if (url.includes('youtu.be/')) {
      videoId = url.split('youtu.be/')[1]?.split('?')[0];
    } else if (url.includes('embed/')) {
      videoId = url.split('embed/')[1]?.split('?')[0];
    }
    return videoId ? `https://www.youtube.com/embed/${videoId}?autoplay=1&mute=1` : url;
  };
  
  const handleEnroll = async () => {
    setEnrolling(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`https://learningmanagementsystem-backend-lms.onrender.com/api/student/courses/${courseId}/enroll`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        navigate(`/student/courses/${courseId}`);
      } else {
        const err = await res.json();
        alert(err.message || 'Failed to enroll');
      }
    } catch (e) {
      alert('Enrollment failed');
    } finally {
      setEnrolling(false);
    }
  };

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
        <div className="course-preview-hero" style={{ borderRadius: 'var(--radius-xl)', overflow: 'hidden', marginBottom: '2rem', background: 'linear-gradient(135deg,#10b981,#3b82f6)', color: 'white', padding: '3rem' }}>
          <h1 style={{ fontSize: '2.5rem', fontWeight: '900', marginBottom: '0.75rem' }}>{course.title}</h1>
          <p style={{ fontSize: '1.05rem', opacity: 0.9, marginBottom: '1.5rem', maxWidth: '600px' }}>{course.description}</p>
          <div className="hero-stats" style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap', fontSize: '0.9rem', opacity: 0.9 }}>
            <Link to={`/instructor/profile/${course.instructor_id}`} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'white', textDecoration: 'none' }}><User size={16} />{course.instructor_name}</Link>
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Users size={16} />{course.total_enrolled} students</span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><PlayCircle size={16} />{lessons.length} lessons</span>
          </div>
        </div>

        <div className="preview-main-layout">
          {/* Curriculum Sidebar */}
          <div className="curriculum-sidebar" style={{ width: '320px', flexShrink: 0 }}>
            <div className="glass-panel" style={{ padding: '1.5rem', marginBottom: '1rem' }}>
              <h3 style={{ marginBottom: '1rem', fontSize: '1.1rem' }}>Course Curriculum</h3>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', maxHeight: '420px', overflowY: 'auto' }}>
                {lessons.map((lesson, idx) => (
                    <div key={lesson.id} onClick={() => { setActiveLesson(lesson); setActiveTab('overview'); }}
                      style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem', borderRadius: '10px', cursor: 'pointer', background: activeLesson?.id === lesson.id ? 'rgba(99,102,241,0.12)' : 'transparent', border: activeLesson?.id === lesson.id ? '1px solid rgba(99,102,241,0.3)' : '1px solid transparent', transition: 'all 0.15s' }}>
                      <div style={{ flexShrink: 0, width: '28px', height: '28px', borderRadius: '50%', background: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}>
                        <PlayCircle size={14} />
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontWeight: '600', fontSize: '0.88rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{lesson.title}</div>
                        <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'capitalize' }}>{lesson.type}</div>
                      </div>
                    </div>
                ))}
              </div>
            </div>
          </div>

          {/* Content Area */}
          <div style={{ flexGrow: 1 }}>
            {activeLesson ? (
              <div className="glass-panel preview-content-card" style={{ padding: '2.5rem', maxHeight: '750px', display: 'flex', flexDirection: 'column', marginBottom: '1.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem', flexShrink: 0 }}>
                  <h2 style={{ fontSize: '1.6rem', margin: 0 }}>{activeLesson.title}</h2>
                </div>

                <div className="scroll-hide" style={{ overflowY: 'auto', flexGrow: 1, paddingRight: '10px' }}>
                    {activeLesson.url && (activeLesson.type === 'video' || activeLesson.url.includes('youtu')) && (
                        <div className="video-player-container glass-panel" style={{ width: '100%', aspectRatio: '16/9', background: '#000', borderRadius: '16px', overflow: 'hidden', border: '1px solid var(--border-color)', boxShadow: 'var(--shadow-lg)', marginBottom: '1.5rem' }}>
                            <iframe 
                                src={getYoutubeEmbedUrl(activeLesson.url)}
                                style={{ width: '100%', height: '100%', border: 'none' }}
                                allowFullScreen
                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                            ></iframe>
                        </div>
                    )}
                    
                    {(() => {
                        let parsedRes = [];
                        try { parsedRes = JSON.parse(activeLesson.resources || '[]'); } catch(e) {}
                        if (!Array.isArray(parsedRes)) parsedRes = [];
                        
                        const hasVideo = activeLesson.url && (activeLesson.type === 'video' || activeLesson.url.includes('youtu'));
                        
                        return (
                            <>
                                <div className="lesson-tabs" style={{ display: 'flex', gap: '0.5rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0', marginTop: hasVideo ? '0' : '1rem' }}>
                                    <button onClick={() => setActiveTab('overview')} style={{ background: 'none', border: 'none', padding: '0.75rem 1.5rem', fontSize: '1rem', fontWeight: activeTab === 'overview' ? '700' : '500', color: activeTab === 'overview' ? 'var(--primary)' : 'var(--text-muted)', borderBottom: activeTab === 'overview' ? '2px solid var(--primary)' : '2px solid transparent', cursor: 'pointer', transition: 'all 0.2s', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                        <FileText size={18} /> Lesson Text
                                    </button>
                                    {(parsedRes.length > 0 || activeLesson.url) && (
                                        <button onClick={() => setActiveTab('resources')} style={{ background: 'none', border: 'none', padding: '0.75rem 1.5rem', fontSize: '1rem', fontWeight: activeTab === 'resources' ? '700' : '500', color: activeTab === 'resources' ? 'var(--primary)' : 'var(--text-muted)', borderBottom: activeTab === 'resources' ? '2px solid var(--primary)' : '2px solid transparent', cursor: 'pointer', transition: 'all 0.2s', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                            <DownloadCloud size={18} /> Resources
                                        </button>
                                    )}
                                </div>
                                
                                <div className="tab-content main-lesson-body" style={{ minHeight: hasVideo ? '200px' : '400px', display: 'flex', flexDirection: 'column', gap: '1.5rem', marginTop: '1.5rem' }}>
                                    {activeTab === 'overview' && (
                                        <div 
                                          className="glass-panel rich-content-container scroll-hide" 
                                          style={{ 
                                            padding: '2.5rem', 
                                            background: 'white', 
                                            flexGrow: 1, 
                                            maxHeight: hasVideo ? '400px' : '600px', 
                                            overflowY: 'auto', 
                                            borderRadius: '16px', 
                                            border: '1px solid var(--border-color)',
                                            boxShadow: 'inset 0 2px 10px rgba(0,0,0,0.02)'
                                          }}
                                        >
                                          {activeLesson.content ? renderRichText(activeLesson.content) : <p style={{ color: 'var(--text-muted)' }}>No text content available for this lesson.</p>}
                                        </div>
                                    )}

                                    {activeTab === 'resources' && (parsedRes.length > 0 || activeLesson.url) && (
                                        <div className="glass-panel" style={{ padding: '1.5rem', background: 'rgba(99,102,241,0.04)', border: '1px solid rgba(99,102,241,0.15)', borderRadius: '16px', flexShrink: 0 }}>
                                            <h3 style={{ fontSize: '1rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                <DownloadCloud size={20} className="text-primary" /> Module Assets
                                            </h3>
                                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem' }}>
                                                {/* Primary Resource */}
                                                {activeLesson.url && (
                                                    <a href={activeLesson.url} target="_blank" rel="noopener noreferrer" className="resource-item-btn glass-panel" style={{ padding: '0.75rem 1rem', textDecoration: 'none', color: 'inherit', display: 'flex', alignItems: 'center', gap: '0.6rem', background: 'white', fontSize: '0.85rem' }}>
                                                        <div style={{ background: 'var(--primary)', color: 'white', padding: '0.4rem', borderRadius: '8px' }}>
                                                            {hasVideo ? <Video size={14} /> : <FileText size={14} />}
                                                        </div>
                                                        <span style={{ fontWeight: '600' }}>{hasVideo ? 'Video Link' : 'Lesson File'}</span>
                                                    </a>
                                                )}

                                                {/* Additional Resources */}
                                                {parsedRes.map((res, idx) => (
                                                    <a key={idx} href={res.url} target="_blank" rel="noopener noreferrer" className="resource-item-btn glass-panel" style={{ padding: '0.75rem 1rem', textDecoration: 'none', color: 'inherit', display: 'flex', alignItems: 'center', gap: '0.6rem', background: 'white', fontSize: '0.85rem' }}>
                                                        <div style={{ background: 'var(--bg-subtle)', color: 'var(--primary)', padding: '0.4rem', borderRadius: '8px', border: '1px solid var(--primary-light)' }}>
                                                            {res.type === 'video' ? <Video size={14} /> : <FileText size={14} />}
                                                        </div>
                                                        <span style={{ fontWeight: '600' }}>{res.title}</span>
                                                    </a>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </>
                        );
                    })()}
                </div>
              </div>
            ) : (
              <div className="glass-panel" style={{ padding: '3rem', textAlign: 'center' }}>
                <p style={{ color: 'var(--text-muted)' }}>{lessons.length === 0 ? "No lessons available yet." : <Loader2 className="animate-spin text-primary" size={32} />}</p>
              </div>
            )}

            {(() => {
                try {
                    const benefits = JSON.parse(course.benefits || '[]');
                    if (!Array.isArray(benefits) || benefits.length === 0) return null;
                    return (
                        <div className="glass-panel" style={{ padding: '2.5rem', marginTop: '1.5rem' }}>
                            <h3 style={{ marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Award size={20} className="text-secondary" /> What you'll learn</h3>
                            <div className="benefits-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                {benefits.map((b, i) => (
                                    <div key={i} style={{ display: 'flex', gap: '0.75rem', fontSize: '0.95rem', color: 'var(--text-secondary)' }}>
                                        <CheckCircle size={18} className="text-secondary" style={{ flexShrink: 0, marginTop: '2px' }} />
                                        {b}
                                    </div>
                                ))}
                            </div>
                        </div>
                    );
                } catch(e) { return null; }
            })()}
            
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
              style={{ marginTop: '1.5rem', background: 'linear-gradient(135deg,rgba(16,185,129,0.1),rgba(59,130,246,0.1))', border: '1px solid rgba(16,185,129,0.25)', borderRadius: 'var(--radius-xl)', padding: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '2rem', flexWrap: 'wrap' }}>
              <div>
                <h3 style={{ marginBottom: '0.4rem', color: '#059669' }}>Start Learning Today</h3>
                <div style={{ display: 'flex', gap: '1.5rem', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}><CheckCircle size={14} style={{ color: '#10b981' }} /> All {lessons.length} lessons</span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}><Zap size={14} style={{ color: '#10b981' }} /> Instant enrollment</span>
                </div>
              </div>
              <button onClick={handleEnroll} disabled={enrolling} className="enroll-btn" style={{ padding: '0.9rem 2rem', background: 'var(--primary)', display: 'flex', alignItems: 'center', gap: '0.6rem', flexShrink: 0, fontSize: '1rem' }}>
                {enrolling ? <Loader2 className="animate-spin" size={20} /> : <><Plus size={20} /> Enroll Now for Free</>}
              </button>
            </motion.div>
          </div>
        </div>
      </div>
    </>
  );
};

export default StudentCoursePreview;
