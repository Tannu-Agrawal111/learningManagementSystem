import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ArrowLeft, 
  CheckCircle2, 
  PlayCircle, 
  Lock, 
  Award, 
  BookOpen, 
  HelpCircle,
  X,
  ChevronRight,
  Info,
  Video,
  FileText,
  Mic,
  Download,
  MessageCircle,
  Send,
  DownloadCloud,
  Sparkles,
  Loader2,
  Image,
  Star
} from 'lucide-react';
import './Student.css';

const StudentCourseView = () => {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const [courseData, setCourseData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeLesson, setActiveLesson] = useState(null);
  const [completingId, setCompletingId] = useState(null);
  const [showVideo, setShowVideo] = useState(false);
  const [userRating, setUserRating] = useState(null);
  const [ratingHover, setRatingHover] = useState(0);
  const [submittingRating, setSubmittingRating] = useState(false);
  
  // Quiz state
  const [showQuiz, setShowQuiz] = useState(null);
  const [quizzes, setQuizzes] = useState([]);
  const [quizAnswers, setQuizAnswers] = useState({});
  const [quizResult, setQuizResult] = useState(null);
  const [checkingQuiz, setCheckingQuiz] = useState(false);

  // Doubts state
  const [showDoubts, setShowDoubts] = useState(false);
  const [doubtText, setDoubtText] = useState('');
  const [doubts, setDoubts] = useState([]);
  const [submittingDoubt, setSubmittingDoubt] = useState(false);

  // AI Practice state
  const [isPractice, setIsPractice] = useState(false);
  const [generatingPractice, setGeneratingPractice] = useState(false);

  const fetchCourseDetails = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`https://learningmanagementsystem-backend-lms.onrender.com/api/student/courses/${courseId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) {
        setCourseData(data);
        if (data.lessons.length > 0 && !activeLesson) {
          setActiveLesson(data.lessons[0]);
        }
        setUserRating(data.userRating);
      } else if (res.status === 403) {
        // Not enrolled - redirect to preview
        navigate(`/student/courses/${courseId}/preview`);
      } else {
        setError(data.message || 'Failed to load course');
      }
    } catch (err) {
      setError('An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const fetchDoubts = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`https://learningmanagementsystem-backend-lms.onrender.com/api/student/doubts`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setDoubts(data.filter(d => d.course_id === parseInt(courseId)));
      }
    } catch (err) {
      console.error('Failed to fetch doubts', err);
    }
  };

  useEffect(() => {
    fetchCourseDetails();
    fetchDoubts();
  }, [courseId]);

  const handleMarkComplete = async (lessonId) => {
    setCompletingId(lessonId);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`https://learningmanagementsystem-backend-lms.onrender.com/api/student/lessons/${lessonId}/complete`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) fetchCourseDetails();
    } catch (err) {
      alert('Failed to mark complete');
    } finally {
      setCompletingId(null);
    }
  };

  const handleRate = async (rating) => {
    setSubmittingRating(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`https://learningmanagementsystem-backend-lms.onrender.com/api/student/courses/${courseId}/rate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ rating }),
      });
      if (res.ok) {
        setUserRating(rating);
        fetchCourseDetails(); // Refresh course stats
      }
    } catch (err) {
      alert('Failed to save rating');
    } finally {
      setSubmittingRating(false);
    }
  };

  const handleAskDoubt = async () => {
    if (!doubtText.trim()) return;
    setSubmittingDoubt(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`https://learningmanagementsystem-backend-lms.onrender.com/api/student/doubts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ 
          courseId, 
          lessonId: activeLesson?.id, 
          question: doubtText 
        }),
      });
      if (res.ok) {
        setDoubtText('');
        fetchDoubts();
      }
    } catch (err) {
      alert('Failed to send doubt');
    } finally {
      setSubmittingDoubt(false);
    }
  };

  const handleStartQuiz = async (lessonId) => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`https://learningmanagementsystem-backend-lms.onrender.com/api/student/lessons/${lessonId}/quizzes`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) {
        setQuizzes(data);
        setShowQuiz(lessonId);
        setQuizAnswers({});
        setQuizResult(null);
      }
    } catch (err) {
      alert('Failed to load quiz');
    }
  };

  const handleSubmitQuiz = async () => {
    setCheckingQuiz(true);
    try {
      if (isPractice) {
        // Check locally for AI practice
        let score = 0;
        const results = quizzes.map(q => {
          const isCorrect = quizAnswers[q.question] === q.correct_answer; // Using question as key for practice
          if (isCorrect) score++;
          return { question: q.question, isCorrect, correctAnswer: q.correct_answer };
        });
        setQuizResult({ score, total: quizzes.length, results });
        setCheckingQuiz(false);
        return;
      }

      const token = localStorage.getItem('token');
      const res = await fetch(`https://learningmanagementsystem-backend-lms.onrender.com/api/student/lessons/${showQuiz}/quizzes/check`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ answers: quizAnswers, isPractice })
      });
      const data = await res.json();
      if (res.ok) setQuizResult(data);
    } catch (err) {
      alert('Error checking quiz');
    } finally {
      setCheckingQuiz(false);
    }
  };

  const handleAIPractice = async () => {
    if (!activeLesson?.content && activeLesson?.type === 'text') {
        alert('No content available for AI practice generation.');
        return;
    }
    setGeneratingPractice(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`https://learningmanagementsystem-backend-lms.onrender.com/api/student/ai/practice`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
            content: activeLesson?.content || activeLesson?.title, 
            title: activeLesson?.title 
        })
      });
      const data = await res.json();
      if (res.ok) {
        setQuizzes(data);
        setIsPractice(true);
        setShowQuiz(activeLesson.id);
        setQuizAnswers({});
        setQuizResult(null);
      }
    } catch (err) {
      alert('Failed to generate practice questions');
    } finally {
      setGeneratingPractice(false);
    }
  };

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
    return videoId ? `https://www.youtube.com/embed/${videoId}` : url;
  };

  const renderRichText = (text) => {
    if (!text) return null;
    
    // Simple professional markdown renderer logic
    const lines = text.split('\n');
    return lines.map((line, i) => {
        // Headings
        if (line.startsWith('# ')) return <h1 key={i} style={{ fontSize: '2.2rem', marginBottom: '1.5rem', fontWeight: '800', borderBottom: '2px solid var(--primary-light)', paddingBottom: '0.5rem' }}>{line.substring(2)}</h1>;
        if (line.startsWith('## ')) return <h2 key={i} style={{ fontSize: '1.75rem', marginBottom: '1.25rem', fontWeight: '700', marginTop: '2rem' }}>{line.substring(3)}</h2>;
        
        // Code blocks (simple check)
        if (line.startsWith('```')) {
            let codeContent = '';
            let j = i + 1;
            while(j < lines.length && !lines[j].startsWith('```')) {
                codeContent += lines[j] + '\n';
                j++;
            }
            if (codeContent) {
                return (
                    <div key={i} className="code-block glass-panel" style={{ background: '#1e1e1e', color: '#d4d4d4', padding: '1.5rem', borderRadius: '12px', fontFamily: 'monospace', marginBottom: '1.5rem', overflowX: 'auto', position: 'relative' }}>
                        <div style={{ position: 'absolute', top: '0.5rem', right: '1rem', fontSize: '0.7rem', color: '#888', fontWeight: '700' }}>CODE SNIPPET</div>
                        <pre style={{ margin: 0 }}>{codeContent}</pre>
                    </div>
                );
            }
        }
        
        // Images
        const imgMatch = line.match(/!\[(.*?)\]\((.*?)\)/);
        if (imgMatch) {
            return (
                <div key={i} style={{ margin: '2rem 0', textAlign: 'center' }}>
                    <img src={imgMatch[2]} alt={imgMatch[1]} style={{ maxWidth: '100%', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-lg)' }} />
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>{imgMatch[1]}</p>
                </div>
            );
        }

        // Bold/Italic (Basic)
        let formattedLine = line;
        formattedLine = formattedLine.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
        formattedLine = formattedLine.replace(/\*(.*?)\*/g, '<em>$1</em>');

        if (line.trim() === '') return <div key={i} style={{ height: '1rem' }} />;
        
        return <p key={i} style={{ marginBottom: '1rem', lineHeight: '1.8' }} dangerouslySetInnerHTML={{ __html: formattedLine }} />;
    });
  };

  const renderLessonContent = () => {
    if (!activeLesson) return null;
    
    let resources = [];
    try {
        if (activeLesson.resources) {
            resources = typeof activeLesson.resources === 'string' ? JSON.parse(activeLesson.resources || '[]') : activeLesson.resources;
        }
    } catch (e) {
        console.error("Resource parse error", e);
        resources = [];
    }
    if (!Array.isArray(resources)) resources = [];
    
    return (
      <div className="lesson-content-wrapper" style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
        <div className="main-lesson-body" style={{ height: 'calc(100vh - 280px)', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            {/* Text Content - Rich Format - SCROLLABLE */}
            <div 
              className="glass-panel rich-content-container scroll-hide" 
              style={{ 
                padding: '2.5rem', 
                background: 'white', 
                flexGrow: 1, 
                maxHeight: '600px', 
                overflowY: 'auto', 
                borderRadius: '16px', 
                border: '1px solid var(--border-color)',
                boxShadow: 'inset 0 2px 10px rgba(0,0,0,0.02)'
              }}
            >
              {renderRichText(activeLesson.content)}
            </div>

            {/* Resources Section - NOW STICKY/BOTTOM */}
            {(resources.length > 0 || activeLesson.url) && (
                <div className="glass-panel" style={{ padding: '1.5rem', background: 'rgba(99,102,241,0.04)', border: '1px solid rgba(99,102,241,0.15)', borderRadius: '16px', flexShrink: 0 }}>
                    <h3 style={{ fontSize: '1rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <DownloadCloud size={20} className="text-primary" /> Module Assets
                    </h3>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem' }}>
                        {/* Primary Resource */}
                        {activeLesson.url && (
                            <a href={activeLesson.url} target="_blank" rel="noopener noreferrer" className="resource-item-btn glass-panel" style={{ padding: '0.75rem 1rem', textDecoration: 'none', color: 'inherit', display: 'flex', alignItems: 'center', gap: '0.6rem', background: 'white', fontSize: '0.85rem' }}>
                                <div style={{ background: 'var(--primary)', color: 'white', padding: '0.4rem', borderRadius: '8px' }}>
                                    {activeLesson.type === 'video' ? <Video size={14} /> : <FileText size={14} />}
                                </div>
                                <span style={{ fontWeight: '600' }}>{activeLesson.type === 'video' ? 'Watch Video' : 'Lesson File'}</span>
                            </a>
                        )}

                        {/* Additional Resources */}
                        {resources.map((res, idx) => (
                            <a key={res.id || idx} href={res.url} target="_blank" rel="noopener noreferrer" className="resource-item-btn glass-panel" style={{ padding: '0.75rem 1rem', textDecoration: 'none', color: 'inherit', display: 'flex', alignItems: 'center', gap: '0.6rem', background: 'white', fontSize: '0.85rem' }}>
                                <div style={{ background: 'var(--bg-subtle)', color: 'var(--primary)', padding: '0.4rem', borderRadius: '8px', border: '1px solid var(--primary-light)' }}>
                                    {res.type === 'video' ? <Video size={14} /> : <FileText size={14} />}
                                </div>
                                <span style={{ fontWeight: '600' }}>{res.title}</span>
                            </a>
                        ))}
                    </div>
                </div>
            )}
            
            {/* Benefits Section */}
            {course.benefits && JSON.parse(course.benefits || '[]').length > 0 && (
                <div className="glass-panel" style={{ padding: '1.5rem', background: 'rgba(16,185,129,0.03)', border: '1px solid rgba(16,185,129,0.1)', borderRadius: '16px' }}>
                    <h3 style={{ fontSize: '0.9rem', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Award size={16} className="text-secondary" /> Learning Outcomes</h3>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                        {JSON.parse(course.benefits || '[]').map((b, i) => (
                            <div key={i} style={{ display: 'flex', gap: '0.4rem', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                                <CheckCircle2 size={14} className="text-secondary" style={{ flexShrink: 0, marginTop: '2px' }} />
                                {b}
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="dashboard-container" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
        <Loader2 className="animate-spin text-primary" size={40} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="dashboard-container">
        <div className="empty-state">
          <div className="empty-state-icon"><Lock size={48} /></div>
          <h2>Enrollment Required</h2>
          <p>{error}</p>
          <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem' }}>
              <Link to={`/student/courses/${courseId}/preview`} className="nav-btn-outline" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                Preview Course
              </Link>
              <Link to="/student/catalog" className="btn-primary">View Catalog</Link>
          </div>
        </div>
      </div>
    );
  }

  const { course, lessons } = courseData;

  return (
    <>
      <div className="dashboard-container student-container course-view-container" style={{ maxWidth: '1400px' }}>
      <style>{`
        .course-view-container {
          padding: 100px 2rem 2rem;
        }
        .course-main-layout {
          display: flex;
          gap: 2rem;
        }
        @media (max-width: 1024px) {
          .course-main-layout {
            flex-direction: column;
          }
          .course-sidebar {
            width: 100% !important;
          }
          .main-lesson-body {
            height: auto !important;
          }
          .rich-content-container {
            max-height: none !important;
          }
        }
        @media (max-width: 768px) {
          .course-view-container { padding: 85px 1rem 1rem; }
          .course-header-actions {
            flex-direction: column;
            width: 100%;
          }
          .course-header-actions > button, 
          .course-header-actions > div {
            width: 100%;
          }
          .action-buttons-grid {
            display: grid;
            grid-template-columns: 1fr;
            gap: 1rem;
          }
          .course-title-header {
            flex-direction: column;
            align-items: flex-start !important;
            gap: 1.5rem;
          }
          .doubt-drawer {
            width: 100% !important;
            padding: 1.5rem !important;
          }
        }
      `}</style>
      <div className="course-main-layout">
        
        {/* Left Sidebar - Curriculum */}
        <div className="course-sidebar" style={{ width: '350px', flexShrink: 0 }}>
            <Link to="/dashboard" className="back-link" style={{ marginBottom: '1.5rem' }}>
                <ArrowLeft size={18} /> Back to Dashboard
            </Link>
            
            <div className="glass-panel" style={{ padding: '1.5rem', marginBottom: '1.5rem' }}>
                <h2 style={{ fontSize: '1.25rem', marginBottom: '1rem' }}>{course.title}</h2>
                <div className="progress-container">
                    <div className="progress-header">
                        <span>Course Progress</span>
                        <span>{course.progress_percentage}%</span>
                    </div>
                    <div className="progress-bar-bg"><div className="progress-bar-fill" style={{ width: `${course.progress_percentage}%` }}></div></div>
                </div>
            </div>

            <div className="student-lesson-list glass-panel" style={{ maxHeight: 'calc(100vh - 300px)', overflowY: 'auto' }}>
                {lessons.map((lesson, idx) => (
                    <div 
                        key={lesson.id} 
                        className={`student-lesson-item ${activeLesson?.id === lesson.id ? 'active' : ''} ${lesson.is_completed ? 'completed' : ''}`}
                        onClick={() => { setActiveLesson(lesson); setShowVideo(false); }}
                        style={{ padding: '1rem', cursor: 'pointer', borderBottom: '1px solid var(--border-color)', display: 'flex', gap: '0.75rem' }}
                    >
                        <div style={{ color: lesson.is_completed ? 'var(--secondary)' : 'var(--text-muted)' }}>
                            {lesson.is_completed ? <CheckCircle2 size={18} /> : (activeLesson?.id === lesson.id ? <PlayCircle size={18} className="text-primary" /> : <PlayCircle size={18} />)}
                        </div>
                        <div>
                            <div style={{ fontSize: '0.8rem', fontWeight: '700', color: 'var(--text-muted)' }}>Lesson {idx + 1}</div>
                            <div style={{ fontWeight: '600', fontSize: '0.95rem' }}>{lesson.title}</div>
                            {(() => {
                                try {
                                    const resList = JSON.parse(lesson.resources || '[]');
                                    if (Array.isArray(resList) && resList.length > 0) {
                                        return (
                                            <div style={{ display: 'flex', gap: '0.4rem', marginTop: '0.25rem' }}>
                                                {resList.map((r, i) => (
                                                    <span key={i} title={r.title} style={{ fontSize: '0.6rem', background: 'var(--bg-subtle)', color: 'var(--text-muted)', padding: '0.1rem 0.3rem', borderRadius: '3px', border: '1px solid var(--border-color)' }}>
                                                        {r.type === 'video' ? '📺' : (r.type === 'pdf' ? '📄' : '📎')}
                                                    </span>
                                                ))}
                                            </div>
                                        );
                                    }
                                } catch(e) {}
                                return null;
                            })()}
                        </div>
                    </div>
                ))}
            </div>
        </div>

        {/* Right Section - Content & Interaction */}
        <div style={{ flexGrow: 1 }}>
            <div className="course-title-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                    <h1 style={{ fontSize: '2rem', margin: 0 }}>{activeLesson?.title}</h1>
                    <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <span>Course by <Link to={`/instructor/profile/${course.instructor_id}`} style={{ fontWeight: '700', color: 'var(--primary)', textDecoration: 'none' }}>{course.instructor_name}</Link></span>
                        {course.average_rating > 0 && (
                            <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', color: '#f59e0b', fontWeight: '700' }}>
                                <Star size={16} fill="#f59e0b" /> {Number(course.average_rating).toFixed(1)} ({course.total_ratings})
                            </span>
                        )}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.2rem', marginLeft: '0.5rem' }}>
                            {[1, 2, 3, 4, 5].map((star) => (
                                <Star 
                                    key={star}
                                    size={18}
                                    style={{ cursor: submittingRating ? 'default' : 'pointer', transition: 'all 0.2s' }}
                                    fill={(ratingHover || userRating) >= star ? '#f59e0b' : 'none'}
                                    color={(ratingHover || userRating) >= star ? '#f59e0b' : '#cbd5e1'}
                                    onMouseEnter={() => !submittingRating && setRatingHover(star)}
                                    onMouseLeave={() => !submittingRating && setRatingHover(0)}
                                    onClick={() => !submittingRating && handleRate(star)}
                                />
                            ))}
                            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginLeft: '0.3rem' }}>{userRating ? 'Your rating' : 'Rate this course'}</span>
                        </div>
                    </div>
                </div>
                <div className="course-header-actions" style={{ display: 'flex', gap: '0.75rem' }}>
                    <button onClick={() => setShowDoubts(!showDoubts)} className="nav-btn-outline" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <MessageCircle size={18} /> Doubts
                    </button>
                    {courseData?.course?.progress_percentage === 100 && (
                        <button 
                            onClick={() => navigate(`/student/certificate/${courseId}`)}
                            className="btn-primary" 
                            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'linear-gradient(135deg, #fbbf24, #f59e0b)' }}
                        >
                            <Award size={18} /> Get Certificate
                        </button>
                    )}
                    {activeLesson?.id && (
                        <button 
                            className={`btn-primary ${activeLesson.is_completed ? 'completed' : ''}`} 
                            onClick={() => handleMarkComplete(activeLesson.id)}
                            disabled={completingId === activeLesson.id || activeLesson.is_completed}
                        >
                            {activeLesson.is_completed ? <CheckCircle2 size={18} /> : (completingId === activeLesson.id ? '...' : 'Mark as Complete')}
                        </button>
                    )}
                </div>
            </div>

            {renderLessonContent()}

            <div className="action-buttons-grid" style={{ display: 'flex', gap: '1rem', marginBottom: '2rem' }}>
                <button onClick={() => handleStartQuiz(activeLesson.id)} className="glass-panel" style={{ padding: '1rem 2rem', cursor: 'pointer', flexGrow: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '1rem', fontWeight: '700' }}>
                    <HelpCircle size={24} className="text-primary" /> Take Lesson Quiz
                </button>
                <button 
                    onClick={handleAIPractice} 
                    disabled={generatingPractice}
                    className="glass-panel" 
                    style={{ padding: '1rem 2rem', cursor: 'pointer', flexGrow: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '1rem', fontWeight: '700', background: 'var(--bg-subtle)' }}
                >
                    {generatingPractice ? <Loader2 className="animate-spin" size={24} /> : <Sparkles size={24} className="text-accent" />} 
                    AI Practice
                </button>
                {activeLesson?.url && (
                    <a href={activeLesson.url} download className="glass-panel" style={{ padding: '1rem 2rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: '700', textDecoration: 'none', color: 'inherit' }}>
                        <DownloadCloud size={24} className="text-secondary" /> Download Resources
                    </a>
                )}
            </div>
        </div>
      </div>

      {/* Quiz Modal */}
      <AnimatePresence>
        {showQuiz && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="modal-overlay" onClick={() => setShowQuiz(null)}>
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="modal-content glass-panel" onClick={e => e.stopPropagation()} style={{ maxWidth: '600px', width: '90%', padding: '2rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    {isPractice ? <Sparkles className="text-accent" /> : <HelpCircle className="text-primary" />} 
                    {isPractice ? 'AI Practice Session' : 'Lesson Quiz'}
                </h2>
                <button onClick={() => { setShowQuiz(null); setIsPractice(false); }} className="close-btn"><X size={24} /></button>
              </div>

              {quizzes.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '2rem' }}><p>No quizzes available yet.</p></div>
              ) : (
                <div className="quiz-questions">
                  {!quizResult ? (
                    <>
                      {quizzes.map((q, idx) => (
                        <div key={q.id} style={{ marginBottom: '1.5rem', padding: '1rem', background: 'var(--bg-subtle)', borderRadius: 'var(--radius-lg)' }}>
                          <p style={{ fontWeight: '600', marginBottom: '1rem' }}>{idx + 1}. {q.question}</p>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                            {q.options.map((opt, oIdx) => (
                              <label key={oIdx} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem', background: quizAnswers[isPractice ? q.question : q.id] === opt ? 'var(--primary-light)' : 'white', borderRadius: 'var(--radius-md)', cursor: 'pointer', border: '1px solid var(--border-color)' }}>
                                <input type="radio" name={`quiz-${q.id || idx}`} value={opt} checked={quizAnswers[isPractice ? q.question : q.id] === opt} onChange={() => setQuizAnswers({ ...quizAnswers, [isPractice ? q.question : q.id]: opt })} style={{ display: 'none' }} />
                                {opt}
                              </label>
                            ))}
                          </div>
                        </div>
                      ))}
                      <button className="btn-primary" style={{ width: '100%' }} onClick={handleSubmitQuiz} disabled={checkingQuiz || Object.keys(quizAnswers).length < quizzes.length}>
                        {checkingQuiz ? 'Checking...' : 'Submit Answers'}
                      </button>
                    </>
                  ) : (
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>{quizResult.score === quizResult.total ? '🎉' : '📚'}</div>
                      <h3>{isPractice ? 'Practice Complete!' : 'Your Score:'} {quizResult.score} / {quizResult.total}</h3>
                      <p style={{ marginTop: '0.5rem', color: 'var(--text-secondary)' }}>
                        {isPractice ? 'Great job practicing! You can try again to master these concepts.' : 'This score has been recorded for your progress.'}
                      </p>
                      <button className="btn-primary" style={{ marginTop: '2rem', width: '100%' }} onClick={() => { setShowQuiz(null); setIsPractice(false); }}>Close</button>
                    </div>
                  )}
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
    {/* Doubt Side Drawer moved to Root for Z-Index isolation */}
    <AnimatePresence>
        {showDoubts && (
            <>
                <motion.div 
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                    onClick={() => setShowDoubts(false)}
                    style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.4)', zIndex: 9998, backdropFilter: 'blur(8px)' }}
                />
                <motion.div 
                    initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
                    transition={{ type: 'spring', damping: 30, stiffness: 300 }}
                    className="doubt-drawer"
                    style={{ position: 'fixed', top: 0, right: 0, width: '480px', height: '100%', background: 'white', zIndex: 9999, boxShadow: '-15px 0 50px rgba(0,0,0,0.2)', padding: '2.5rem', display: 'flex', flexDirection: 'column' }}
                >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2.5rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '1.5rem' }}>
                        <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', margin: 0, color: 'var(--text-primary)' }}>
                            <MessageCircle className="text-primary" size={28} /> Lesson Doubts
                        </h2>
                        <button 
                            onClick={(e) => { e.stopPropagation(); setShowDoubts(false); }} 
                            className="icon-btn-muted" 
                            style={{ padding: '0.5rem', borderRadius: '50%', background: 'var(--bg-subtle)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                            title="Close"
                        >
                            <X size={24} />
                        </button>
                    </div>

                    <div style={{ marginBottom: '2.5rem' }}>
                        <h4 style={{ marginBottom: '1rem' }}>Ask a Question</h4>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                            <textarea 
                                className="input-field" 
                                placeholder="What part of the lesson was unclear?" 
                                value={doubtText}
                                onChange={e => setDoubtText(e.target.value)}
                                style={{ minHeight: '120px', resize: 'none', padding: '1rem' }}
                            />
                            <button className="btn-primary" onClick={handleAskDoubt} disabled={submittingDoubt} style={{ width: '100%', padding: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                                {submittingDoubt ? <Loader2 className="animate-spin" size={18} /> : <Send size={18} />}
                                Submit Question
                            </button>
                        </div>
                    </div>

                    <div style={{ flexGrow: 1, overflowY: 'auto' }}>
                        <h4 style={{ marginBottom: '1.25rem', paddingBottom: '0.5rem', borderBottom: '1px solid var(--border-color)' }}>Previous Doubts</h4>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            {doubts.length === 0 ? (
                                <p style={{ textAlign: 'center', color: 'var(--text-muted)', marginTop: '2rem' }}>No questions yet for this module.</p>
                            ) : (
                                doubts.map(d => (
                                    <div key={d.id} className="glass-panel" style={{ padding: '1.25rem', background: 'var(--bg-subtle)' }}>
                                        <p style={{ fontWeight: '600', marginBottom: '0.5rem' }}>Q: {d.question}</p>
                                        {d.answer ? (
                                            <div style={{ marginTop: '0.75rem', padding: '0.75rem', background: 'white', borderRadius: '8px', borderLeft: '3px solid var(--secondary)' }}>
                                                <p style={{ fontSize: '0.9rem', color: 'var(--text-primary)' }}><strong>A:</strong> {d.answer}</p>
                                            </div>
                                        ) : (
                                            <p style={{ marginTop: '0.5rem', fontSize: '0.85rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>Instructor will answer soon...</p>
                                        )}
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </motion.div>
            </>
        )}
    </AnimatePresence>
    </>
  );
};

export default StudentCourseView;
