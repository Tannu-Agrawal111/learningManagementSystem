import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  AlertTriangle, 
  Clock, 
  ShieldAlert, 
  Sparkles, 
  CheckCircle, 
  FileCode, 
  Upload, 
  ArrowRight,
  RefreshCw 
} from 'lucide-react';
import { socket, connectSocket } from '../utils/socket';
import useLmsStore from '../store/useLmsStore';

const TakeAssessment = () => {
  const { assessmentId } = useParams();
  const navigate = useNavigate();
  
  const user = useLmsStore(state => state.user);
  const token = useLmsStore(state => state.token);
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [submission, setSubmission] = useState(null);
  const [timeRemaining, setTimeRemaining] = useState(0); // in seconds
  const [answers, setAnswers] = useState({}); // questionId -> answerText
  
  const [infractionsCount, setInfractionsCount] = useState(0);
  const [infractionWarning, setInfractionWarning] = useState(null);
  const [terminated, setTerminated] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [scoreResult, setScoreResult] = useState(null);

  const timerRef = useRef(null);

  // 1. Initialize Socket.io and fetch assessment session
  useEffect(() => {
    if (user) {
      connectSocket(user.id);
    }
    
    // Connect warning listener
    socket.on('proctoring_warning', (data) => {
      setInfractionWarning(data.message);
      setTimeout(() => setInfractionWarning(null), 5000);
    });

    startExam();

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      socket.off('proctoring_warning');
    };
  }, [assessmentId, user]);

  const startExam = async () => {
    try {
      const res = await fetch(`${window.API_BASE_URL || 'http://localhost:5000'}/api/assessments/${assessmentId}/start`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.message || 'Failed to start assessment');
      }

      setSubmission(data);
      setInfractionsCount((data.infractions?.tabSwitches || 0) + (data.infractions?.windowBlurs || 0));

      if (data.status === 'terminated') {
        setTerminated(true);
      } else if (data.status === 'submitted' || data.status === 'auto-submitted') {
        setSubmitted(true);
        setScoreResult({ score: data.score, total: data.questions?.length || 0 });
      }

      // Calculate time remaining
      const startTime = new Date(data.startedAt).getTime();
      const durationMs = 15 * 60 * 1000; // Let's default to 15 mins if not specified
      const elapsedMs = Date.now() - startTime;
      const remainingSecs = Math.max(0, Math.floor((durationMs - elapsedMs) / 1000));
      setTimeRemaining(remainingSecs);

      setLoading(false);
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  };

  // 2. Countdown Timer hook
  useEffect(() => {
    if (loading || submitted || terminated || timeRemaining <= 0) return;
    
    timerRef.current = setInterval(() => {
      setTimeRemaining(prev => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          handleAutoSubmit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timerRef.current);
  }, [timeRemaining, loading, submitted, terminated]);

  // 3. Proctoring and Anti-Cheat Listeners
  useEffect(() => {
    if (loading || submitted || terminated || !submission) return;

    const triggerInfraction = async (type) => {
      try {
        const res = await fetch(`${window.API_BASE_URL || 'http://localhost:5000'}/api/assessments/submission/${submission._id}/infraction`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ type })
        });
        const data = await res.json();
        
        // Emit Socket Event for server warning
        socket.emit('proctoring_violation', {
          userId: user.id,
          type: type === 'tab-switch' ? 'tab change' : 'window blurring',
          assessmentTitle: 'Term Assessment'
        });

        const newCount = (data.submission?.infractions?.tabSwitches || 0) + (data.submission?.infractions?.windowBlurs || 0);
        setInfractionsCount(newCount);

        if (data.terminated || data.submission?.status === 'terminated') {
          setTerminated(true);
          clearInterval(timerRef.current);
        }
      } catch (err) {
        console.error('Failed to log infraction', err);
      }
    };

    const handleVisibilityChange = () => {
      if (document.hidden) {
        triggerInfraction('tab-switch');
      }
    };

    const handleBlur = () => {
      triggerInfraction('window-blur');
    };

    window.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('blur', handleBlur);

    return () => {
      window.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('blur', handleBlur);
    };
  }, [submission, loading, submitted, terminated]);

  const handleSelectOption = (qId, option) => {
    setAnswers(prev => ({
      ...prev,
      [qId]: option
    }));
  };

  const handleAutoSubmit = () => {
    alert('Time has expired! Submitting your assessment automatically.');
    submitAnswers(true);
  };

  const submitAnswers = async (isAuto = false) => {
    setLoading(true);
    try {
      const formattedAnswers = Object.entries(answers).map(([questionId, answer]) => ({
        questionId,
        answer
      }));

      const res = await fetch(`${window.API_BASE_URL || 'http://localhost:5000'}/api/assessments/submission/${submission._id}/submit`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ answers: formattedAnswers })
      });
      const data = await res.json();
      
      if (res.ok) {
        setSubmitted(true);
        setScoreResult({ score: data.score, total: submission.questions.length });
      } else {
        throw new Error(data.message);
      }
    } catch (err) {
      alert('Error submitting answers: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Prevent copying/pasting & right click context menus using native event blockers
  const blockEvents = (e) => {
    e.preventDefault();
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', height: '100vh', gap: '1rem', background: '#0F172A', color: 'white' }}>
        <RefreshCw className="animate-spin text-indigo-500" size={48} />
        <p style={{ fontFamily: 'Inter' }}>Securing proctor environment...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', background: '#0F172A', color: 'white', padding: '2rem' }}>
        <div style={{ textAlign: 'center', background: 'rgba(255,255,255,0.05)', padding: '3rem', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.1)' }}>
          <ShieldAlert className="text-red-500" size={60} style={{ margin: '0 auto 1.5rem' }} />
          <h2>Access Blocked</h2>
          <p style={{ marginTop: '0.5rem', color: '#94A3B8' }}>{error}</p>
          <button className="btn-primary" style={{ marginTop: '1.5rem' }} onClick={() => navigate('/dashboard')}>Return to Dashboard</button>
        </div>
      </div>
    );
  }

  if (terminated) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', background: '#0F172A', color: 'white', padding: '2rem' }}>
        <div style={{ textAlign: 'center', background: 'rgba(239,68,68,0.1)', padding: '3rem', borderRadius: '16px', border: '1px solid rgba(239,68,68,0.3)', maxWidth: '500px' }}>
          <ShieldAlert className="text-red-500" size={72} style={{ margin: '0 auto 1.5rem', animation: 'pulse 2s infinite' }} />
          <h2 style={{ fontSize: '1.75rem', fontWeight: '800' }}>Exam Terminated</h2>
          <p style={{ marginTop: '1rem', color: '#CBD5E1', lineHeight: '1.6' }}>
            Your assessment has been automatically locked and submitted due to multiple proctor violations (leaving the exam screen, changing tabs, or window defocusing).
          </p>
          <div style={{ display: 'flex', justifyContent: 'center', gap: '2rem', margin: '2rem 0', padding: '1rem', background: 'rgba(255,255,255,0.05)', borderRadius: '8px' }}>
            <div>
              <div style={{ fontSize: '0.8rem', color: '#94A3B8' }}>Tab Violations</div>
              <div style={{ fontSize: '1.5rem', fontWeight: '700', color: '#EF4444' }}>{submission?.infractions?.tabSwitches || 0}</div>
            </div>
            <div>
              <div style={{ fontSize: '0.8rem', color: '#94A3B8' }}>Defocus Violations</div>
              <div style={{ fontSize: '1.5rem', fontWeight: '700', color: '#EF4444' }}>{submission?.infractions?.windowBlurs || 0}</div>
            </div>
          </div>
          <button className="btn-primary" style={{ width: '100%' }} onClick={() => navigate('/dashboard')}>Back to Dashboard</button>
        </div>
      </div>
    );
  }

  if (submitted) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', background: '#0F172A', color: 'white', padding: '2rem' }}>
        <div style={{ textAlign: 'center', background: 'rgba(16,185,129,0.1)', padding: '3rem', borderRadius: '16px', border: '1px solid rgba(16,185,129,0.3)', maxWidth: '500px' }}>
          <CheckCircle className="text-emerald-500" size={72} style={{ margin: '0 auto 1.5rem' }} />
          <h2 style={{ fontSize: '1.75rem', fontWeight: '800' }}>Assessment Submitted</h2>
          <p style={{ marginTop: '0.5rem', color: '#CBD5E1' }}>Your assessment has been recorded and evaluated.</p>
          
          <div style={{ margin: '2rem 0', padding: '2rem', background: 'rgba(255,255,255,0.05)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)' }}>
            <span style={{ fontSize: '0.9rem', color: '#94A3B8', display: 'block', marginBottom: '0.5rem' }}>Your Score</span>
            <span style={{ fontSize: '3rem', fontWeight: '800', color: '#10B981' }}>{scoreResult?.score} <span style={{ fontSize: '1.5rem', color: '#94A3B8', fontWeight: '500' }}>/ {scoreResult?.total}</span></span>
          </div>

          <button className="btn-primary" style={{ width: '100%' }} onClick={() => navigate('/dashboard')}>Return to Dashboard</button>
        </div>
      </div>
    );
  }

  return (
    <div 
      onCopy={blockEvents}
      onPaste={blockEvents}
      onCut={blockEvents}
      onContextMenu={blockEvents}
      style={{ minHeight: '100vh', background: '#0F172A', color: 'white', padding: '80px 2rem 2rem', fontFamily: 'Inter', userSelect: 'none' }}
    >
      {/* Dynamic Warn Header Banner */}
      <AnimatePresence>
        {infractionWarning && (
          <motion.div 
            initial={{ y: -50, opacity: 0 }} 
            animate={{ y: 0, opacity: 1 }} 
            exit={{ y: -50, opacity: 0 }}
            style={{ position: 'fixed', top: 20, left: '50%', transform: 'translateX(-50%)', background: '#EF4444', color: 'white', padding: '1rem 2rem', borderRadius: '8px', zIndex: 10000, display: 'flex', alignItems: 'center', gap: '0.75rem', boxShadow: '0 10px 25px rgba(239,68,68,0.4)', fontWeight: '700' }}
          >
            <AlertTriangle size={24} />
            <span>{infractionWarning}</span>
          </motion.div>
        )}
      </AnimatePresence>

      <div style={{ maxWidth: '1000px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
        
        {/* Top Proctoring status bar */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255,255,255,0.05)', padding: '1.25rem 2rem', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ width: '10px', height: '10px', background: '#EF4444', borderRadius: '50%', display: 'inline-block', animation: 'ping 1.5s infinite' }}></span>
            <span style={{ fontWeight: '700', letterSpacing: '0.05em', color: '#EF4444' }}>LIVE PROCTORING SECURE</span>
          </div>
          
          <div style={{ display: 'flex', gap: '2rem', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: infractionsCount > 0 ? 'rgba(239,68,68,0.2)' : 'rgba(255,255,255,0.05)', padding: '0.4rem 0.8rem', borderRadius: '6px', border: infractionsCount > 0 ? '1px solid #EF4444' : '1px solid transparent' }}>
              <ShieldAlert size={18} className={infractionsCount > 0 ? 'text-red-500' : 'text-slate-400'} />
              <span style={{ fontSize: '0.9rem' }}>Infractions: <strong>{infractionsCount}/3</strong></span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(79,70,229,0.2)', padding: '0.4rem 0.8rem', borderRadius: '6px', border: '1px solid #4F46E5' }}>
              <Clock size={18} className="text-indigo-400" />
              <span style={{ fontSize: '1.1rem', fontWeight: '700', fontFamily: 'monospace' }}>{formatTime(timeRemaining)}</span>
            </div>
          </div>
        </div>

        {/* Question Area */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {submission?.questions.map((question, index) => (
            <div 
              key={question._id} 
              style={{ background: 'rgba(255,255,255,0.03)', padding: '2rem', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.05)', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <span style={{ fontSize: '1.15rem', fontWeight: '600' }}>Question {index + 1}</span>
                <span style={{ fontSize: '0.75rem', background: 'rgba(79,70,229,0.2)', color: '#A5B4FC', padding: '0.2rem 0.6rem', borderRadius: '4px', textTransform: 'capitalize' }}>
                  {question.difficulty} Difficulty
                </span>
              </div>
              
              <p style={{ fontSize: '1.25rem', lineHeight: '1.6', color: '#E2E8F0' }}>{question.text}</p>

              {/* Multiple Choice Render */}
              {question.type === 'multiple-choice' && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  {question.options.map((opt, oIdx) => (
                    <button 
                      key={oIdx}
                      onClick={() => handleSelectOption(question._id, opt)}
                      style={{ 
                        padding: '1rem', 
                        background: answers[question._id] === opt ? 'rgba(79,70,229,0.3)' : 'rgba(255,255,255,0.02)', 
                        border: answers[question._id] === opt ? '2.5px solid #4F46E5' : '1px solid rgba(255,255,255,0.08)',
                        color: 'white',
                        borderRadius: '8px', 
                        cursor: 'pointer', 
                        textAlign: 'left',
                        transition: 'all 0.2s',
                        fontWeight: answers[question._id] === opt ? '700' : '500'
                      }}
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              )}

              {/* Code syntax tasks */}
              {question.type === 'code-syntax' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#94A3B8', fontSize: '0.85rem' }}>
                    <FileCode size={16} />
                    <span>Complete the missing syntax below:</span>
                  </div>
                  <textarea 
                    value={answers[question._id] || ''}
                    onChange={(e) => handleSelectOption(question._id, e.target.value)}
                    placeholder="// Enter your syntax code solution here"
                    style={{ width: '100%', minHeight: '150px', background: '#090D16', color: '#34D399', border: '1px solid rgba(255,255,255,0.1)', padding: '1rem', borderRadius: '8px', fontFamily: 'monospace', outline: 'none' }}
                  />
                </div>
              )}

              {/* File upload tasks */}
              {question.type === 'file-upload' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#94A3B8', fontSize: '0.85rem' }}>
                    <Upload size={16} />
                    <span>Provide link or path for your project file submission:</span>
                  </div>
                  <input 
                    type="text" 
                    value={answers[question._id] || ''}
                    onChange={(e) => handleSelectOption(question._id, e.target.value)}
                    placeholder="https://github.com/username/repo or S3 file link"
                    style={{ width: '100%', background: '#090D16', color: 'white', border: '1px solid rgba(255,255,255,0.1)', padding: '1rem', borderRadius: '8px', fontFamily: 'monospace', outline: 'none' }}
                  />
                </div>
              )}

            </div>
          ))}
        </div>

        <button 
          onClick={() => submitAnswers(false)}
          className="btn-primary" 
          style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.75rem', height: '55px', fontSize: '1.1rem', background: 'linear-gradient(135deg, #10B981, #059669)', border: 'none', cursor: 'pointer' }}
        >
          Submit Proctored Exam <ArrowRight size={20} />
        </button>

      </div>
    </div>
  );
};

export default TakeAssessment;
