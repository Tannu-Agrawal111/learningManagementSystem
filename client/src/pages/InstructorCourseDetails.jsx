import React, { useState, useEffect, useContext } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell
} from 'recharts';
import { 
  ArrowLeft, 
  Plus, 
  Edit, 
  HelpCircle, 
  Sparkles, 
  Trash2, 
  Check, 
  X, 
  Book, 
  BookOpen,
  Loader2,
  AlertCircle,
  Video,
  FileText,
  Layout,
  MessageSquare,
  BarChart3,
  Users,
  Eye,
  Mail,
  Calendar,
  Paperclip,
  FileCode,
  Image,
  ExternalLink,
} from 'lucide-react';
import { AuthContext } from '../context/AuthContext';
import './Instructor.css';

const InstructorCourseDetails = () => {
  const { courseId } = useParams();
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const [course, setCourse] = useState(null);
  const [lessons, setLessons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('curriculum'); // curriculum, analytics, doubts, students
  
  // Lesson form state (Add/Edit)
  const [showForm, setShowForm] = useState(false);
  const [editingLesson, setEditingLesson] = useState(null);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [lessonType, setLessonType] = useState('text');
  const [lessonUrl, setLessonUrl] = useState('');
  const [error, setError] = useState('');

  // Quiz state
  const [activeLessonId, setActiveLessonId] = useState(null);
  const [showQuizManager, setShowQuizManager] = useState(false);
  const [quizzes, setQuizzes] = useState([]);
  const [newQuiz, setNewQuiz] = useState({ question: '', options: ['', '', '', ''], correct_answer: '' });
  const [generatingAI, setGeneratingAI] = useState(false);

  // Analytics, Doubts, Students
  const [analytics, setAnalytics] = useState([]);
  const [doubts, setDoubts] = useState([]);
  const [enrolledStudents, setEnrolledStudents] = useState([]);
  const [answeringDoubt, setAnsweringDoubt] = useState(null);
  const [answerText, setAnswerText] = useState('');
  const [expandedLesson, setExpandedLesson] = useState(null);
  const [lessonResources, setLessonResources] = useState([]);
  const [newResource, setNewResource] = useState({ type: 'pdf', url: '', title: '' });
  const [editorTab, setEditorTab] = useState('edit'); // 'edit' or 'preview'

  const isOwner = course?.instructor_id === user.id;

  useEffect(() => {
    fetchCourseData();
    fetchLessons();
    fetchAnalytics();
    fetchDoubts();
    fetchStudents();
  }, [courseId]);

  const fetchCourseData = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('http://localhost:5000/api/instructor/courses', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        const currentCourse = data.find(c => c.id === parseInt(courseId));
        setCourse(currentCourse);
      }
    } catch (err) { console.error(err); }
  };

  const fetchLessons = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`http://localhost:5000/api/instructor/courses/${courseId}/lessons`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setLessons(data);
      }
    } catch (err) {
      console.error('Failed to fetch lessons', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchAnalytics = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`http://localhost:5000/api/instructor/courses/${courseId}/analytics`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setAnalytics(data);
      }
    } catch (err) { console.error(err); }
  };

  const fetchDoubts = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`http://localhost:5000/api/instructor/doubts`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setDoubts(data.filter(d => d.course_id === parseInt(courseId)));
      }
    } catch (err) { console.error(err); }
  };

  const fetchStudents = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`http://localhost:5000/api/instructor/courses/${courseId}/students`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setEnrolledStudents(data);
      }
    } catch (err) { console.error(err); }
  };

  const handleSaveLesson = async (e) => {
    e.preventDefault();
    setError('');

    try {
      const token = localStorage.getItem('token');
      const url = editingLesson 
        ? `http://localhost:5000/api/instructor/lessons/${editingLesson.id}`
        : `http://localhost:5000/api/instructor/courses/${courseId}/lessons`;
      
      const method = editingLesson ? 'PUT' : 'POST';
      const order_index = editingLesson ? editingLesson.order_index : lessons.length + 1;
      
      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ 
          title: title.trim(), 
          content: content.trim(), 
          type: lessonType, 
          url: lessonUrl.trim(), 
          order_index,
          resources: JSON.stringify(lessonResources)
        }),
      });

      if (res.ok) {
        fetchLessons();
        setShowForm(false);
        setEditingLesson(null);
        setTitle('');
        setContent('');
        setLessonType('text');
        setLessonUrl('');
        setLessonResources([]); // Reset resources after save
      } else {
        const data = await res.json();
        setError(data.message || 'Failed to save lesson');
      }
    } catch (err) {
      setError('An error occurred. Please try again.');
    }
  };

  const handleDeleteLesson = async (lessonId) => {
    if (!window.confirm('Delete this lesson and all its quizzes?')) return;
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`http://localhost:5000/api/instructor/lessons/${lessonId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) fetchLessons();
    } catch (err) { alert('Failed to delete lesson'); }
  };

  const handleCreateNewClick = () => {
    setEditingLesson(null);
    setTitle('');
    setContent('');
    setLessonType('text');
    setLessonUrl('');
    setLessonResources([]);
    setShowForm(true);
    setEditorTab('edit');
  };

  const handleEditClick = (lesson) => {
    setEditingLesson(lesson);
    setTitle(lesson.title);
    setContent(lesson.content);
    setLessonType(lesson.type);
    setLessonUrl(lesson.url || '');
    
    // Safety check for resources
    let parsedResources = [];
    try {
        if (lesson.resources) {
            parsedResources = typeof lesson.resources === 'string' ? JSON.parse(lesson.resources) : lesson.resources;
        }
    } catch (e) {
        console.error("Error parsing resources", e);
    }
    setLessonResources(Array.isArray(parsedResources) ? parsedResources : []);
    
    setShowForm(true);
    setEditorTab('edit');
  };

  const insertFormatting = (tag) => {
    const textarea = document.getElementById('lesson-content-textarea');
    if (!textarea) return;
    
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = content;
    const before = text.substring(0, start);
    const after = text.substring(end);
    const selected = text.substring(start, end);
    
    let newContent = '';
    switch(tag) {
        case 'h1': newContent = `${before}# ${selected}${after}`; break;
        case 'h2': newContent = `${before}## ${selected}${after}`; break;
        case 'bold': newContent = `${before}**${selected}**${after}`; break;
        case 'italic': newContent = `${before}*${selected}*${after}`; break;
        case 'code': newContent = `${before}\`\`\`\n${selected}\n\`\`\`${after}`; break;
        case 'image': newContent = `${before}![Alt text](image_url)${after}`; break;
        default: newContent = text;
    }
    setContent(newContent);
  };

  const addResource = () => {
    if (!newResource.url || !newResource.title) return;
    setLessonResources([...lessonResources, { ...newResource, id: Date.now() }]);
    setNewResource({ type: 'pdf', url: '', title: '' });
  };

  const removeResource = (id) => {
    setLessonResources(lessonResources.filter(r => r.id !== id));
  };

  const openQuizManager = async (lessonId) => {
    setActiveLessonId(lessonId);
    setShowQuizManager(true);
    fetchQuizzes(lessonId);
  };

  const fetchQuizzes = async (lessonId) => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`http://localhost:5000/api/instructor/lessons/${lessonId}/quizzes`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setQuizzes(data);
      }
    } catch (err) { console.error(err); }
  };

  const handleAddQuiz = async (e) => {
    e.preventDefault();
    if (!newQuiz.correct_answer) return alert('Select a correct answer');
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`http://localhost:5000/api/instructor/lessons/${activeLessonId}/quizzes`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(newQuiz),
      });
      if (res.ok) {
        fetchQuizzes(activeLessonId);
        setNewQuiz({ question: '', options: ['', '', '', ''], correct_answer: '' });
      }
    } catch (err) { alert('Failed to add quiz'); }
  };

  const handleDeleteQuiz = async (quizId) => {
    if (!window.confirm('Delete this question?')) return;
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`http://localhost:5000/api/instructor/lessons/${activeLessonId}/quizzes/${quizId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) fetchQuizzes(activeLessonId);
    } catch (err) { alert('Failed to delete quiz'); }
  };

  const handleGenerateAI = async () => {
    const lesson = lessons.find(l => l.id === activeLessonId);
    if (!lesson || !lesson.content) return alert('No lesson content to generate from');
    setGeneratingAI(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`http://localhost:5000/api/instructor/ai/generate-quiz`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ content: lesson.content, title: lesson.title }),
      });
      const data = await res.json();
      if (res.ok) {
        for (const quiz of data) {
           await fetch(`http://localhost:5000/api/instructor/lessons/${activeLessonId}/quizzes`, {
             method: 'POST',
             headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
             body: JSON.stringify(quiz),
           });
        }
        fetchQuizzes(activeLessonId);
      }
    } catch (err) { alert('AI Generation failed'); } finally { setGeneratingAI(false); }
  };

  const handleAnswerDoubt = async (doubtId) => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`http://localhost:5000/api/instructor/doubts/${doubtId}/answer`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ answer: answerText }),
      });
      if (res.ok) {
        setAnsweringDoubt(null);
        setAnswerText('');
        fetchDoubts();
      }
    } catch (err) { alert('Failed to answer doubt'); }
  };

  const COLORS = ['#6366F1', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'];

  const getIconForType = (type) => {
    switch(type) {
      case 'video': return <Video size={18} />;
      case 'pdf': return <FileText size={18} />;
      case 'test': return <Layout size={18} />;
      default: return <Book size={18} />;
    }
  };

  if (loading) {
    return (
      <div className="dashboard-container" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
        <Loader2 className="animate-spin text-primary" size={40} />
      </div>
    );
  }

  return (
    <div className="dashboard-container instructor-container">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <Link to="/instructor/dashboard" className="back-link" style={{ marginBottom: 0 }}>
            <ArrowLeft size={18} /> Back to Hub
        </Link>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
            <button 
                onClick={() => navigate(`/student/courses/${courseId}`)}
                className="nav-btn-outline" 
                style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
            >
                <Eye size={18} /> Student Preview
            </button>
        </div>
      </div>

      <div className="dashboard-header" style={{ borderBottom: 'none', marginBottom: '1rem' }}>
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '0.5rem' }}>
            <h1 style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', margin: 0 }}>
                <Book className="text-primary" /> {course?.title}
            </h1>
            <div style={{ background: 'var(--bg-subtle)', padding: '0.25rem 0.75rem', borderRadius: '9999px', fontSize: '0.85rem', fontWeight: '600', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '0.4rem', border: '1px solid var(--border-color)' }}>
                <Users size={14} className="text-primary" /> {enrolledStudents.length} Students Enrolled
            </div>
          </div>
          <p>{course?.description}</p>
        </motion.div>
      </div>

      <div className="dashboard-tabs" style={{ marginBottom: '2rem' }}>
        <div className={`tab-item ${activeTab === 'curriculum' ? 'active' : ''}`} onClick={() => setActiveTab('curriculum')}>
           <BookOpen size={18} /> Curriculum
        </div>
        <div className={`tab-item ${activeTab === 'analytics' ? 'active' : ''}`} onClick={() => setActiveTab('analytics')}>
           <BarChart3 size={18} /> Progress
        </div>
        <div className={`tab-item ${activeTab === 'students' ? 'active' : ''}`} onClick={() => setActiveTab('students')}>
           <Users size={18} /> Learners ({enrolledStudents.length})
        </div>
        <div className={`tab-item ${activeTab === 'doubts' ? 'active' : ''}`} onClick={() => setActiveTab('doubts')}>
           <MessageSquare size={18} /> Doubts ({doubts.filter(d => !d.answer).length})
        </div>
      </div>

      {activeTab === 'curriculum' && (
        <>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
            <h3 style={{ fontSize: '1.5rem', fontWeight: '700' }}>Modules</h3>
            {isOwner && !showForm && (
              <motion.button 
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleCreateNewClick} 
                className="btn-primary"
                style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
              >
                <Plus size={20} /> Add Module
              </motion.button>
            )}
          </div>

          <AnimatePresence>
            {showForm && isOwner && (
              <motion.div 
                initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
                className="form-card glass-panel" style={{ marginBottom: '3rem', padding: '2rem' }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                    <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        {editingLesson ? <Edit size={20} className="text-primary" /> : <Plus size={20} className="text-primary" />} 
                        {editingLesson ? 'Edit Module' : 'New Module'}
                    </h3>
                    <button onClick={() => { setShowForm(false); setEditingLesson(null); }} className="close-btn"><X size={24} /></button>
                </div>
                {error && <div className="auth-error"><AlertCircle size={18} /> {error}</div>}
                <form onSubmit={handleSaveLesson}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                    <div className="form-group">
                        <label>Title</label>
                        <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Lesson title..." className="input-field" required />
                    </div>
                    <div className="form-group">
                        <label>Type</label>
                        <select value={lessonType} onChange={e => setLessonType(e.target.value)} className="input-field">
                            <option value="text">📖 Text/Article</option>
                            <option value="video">🎥 Video</option>
                            <option value="pdf">📄 PDF</option>
                            <option value="test">📝 Test</option>
                        </select>
                    </div>
                  </div>
                  {(lessonType !== 'text' && lessonType !== 'test') && (
                    <div className="form-group">
                        <label>Resource URL</label>
                        <input type="text" className="input-field" placeholder="Enter link..." value={lessonUrl} onChange={e => setLessonUrl(e.target.value)} required />
                    </div>
                  )}
                  <div className="form-group">
                    <label>Content</label>
                    <div className="form-tabs" style={{ display: 'flex', gap: '1rem', borderBottom: '1px solid var(--border-color)', marginBottom: '1.5rem' }}>
                        <button type="button" onClick={() => setEditorTab('edit')} className={`tab-btn ${editorTab === 'edit' ? 'active' : ''}`} style={{ padding: '0.5rem 1rem', border: 'none', background: 'none', borderBottom: editorTab === 'edit' ? '2px solid var(--primary)' : 'none', fontWeight: '600', cursor: 'pointer' }}>Write Content</button>
                        <button type="button" onClick={() => setEditorTab('preview')} className={`tab-btn ${editorTab === 'preview' ? 'active' : ''}`} style={{ padding: '0.5rem 1rem', border: 'none', background: 'none', borderBottom: editorTab === 'preview' ? '2px solid var(--primary)' : 'none', fontWeight: '600', cursor: 'pointer' }}>Live Preview</button>
                    </div>

                    {editorTab === 'edit' ? (
                        <>
                            <div className="formatting-toolbar glass-panel" style={{ display: 'flex', gap: '0.5rem', padding: '0.5rem', marginBottom: '0.5rem', background: 'var(--bg-subtle)' }}>
                                <button type="button" onClick={() => insertFormatting('h1')} className="icon-btn-muted" title="Heading 1"><span style={{ fontWeight: '800' }}>H1</span></button>
                                <button type="button" onClick={() => insertFormatting('h2')} className="icon-btn-muted" title="Heading 2"><span style={{ fontWeight: '800' }}>H2</span></button>
                                <button type="button" onClick={() => insertFormatting('bold')} className="icon-btn-muted" title="Bold"><strong>B</strong></button>
                                <button type="button" onClick={() => insertFormatting('italic')} className="icon-btn-muted" title="Italic"><em>I</em></button>
                                <button type="button" onClick={() => insertFormatting('code')} className="icon-btn-muted" title="Code Snippet"><FileCode size={16} /></button>
                                <button type="button" onClick={() => insertFormatting('image')} className="icon-btn-muted" title="Image"><Image size={16} /></button>
                            </div>
                            <textarea 
                                id="lesson-content-textarea"
                                value={content} 
                                onChange={(e) => setContent(e.target.value)} 
                                placeholder="Write your lesson using Markdown... (e.g. # Heading)" 
                                className="input-field textarea-field" 
                                style={{ minHeight: '200px', fontFamily: 'monospace' }} 
                            />
                        </>
                    ) : (
                        <div className="preview-area glass-panel" style={{ minHeight: '200px', padding: '1.5rem', background: 'white', overflowY: 'auto', border: '1px solid var(--border-color)' }}>
                            <div className="markdown-preview" style={{ whiteSpace: 'pre-wrap' }}>
                                {content || "Nothing to preview yet."}
                            </div>
                        </div>
                    )}

                    <div style={{ marginTop: '2rem', paddingTop: '1.5rem', borderTop: '1px solid var(--border-color)' }}>
                        <h4 style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Paperclip size={18} /> Additional Resources</h4>
                        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
                            <select className="input-field" style={{ width: '120px' }} value={newResource.type} onChange={e => setNewResource({...newResource, type: e.target.value})}>
                                <option value="pdf">PDF</option>
                                <option value="video">Video</option>
                                <option value="image">Image</option>
                                <option value="link">Link</option>
                            </select>
                            <input className="input-field" placeholder="Resource Title" value={newResource.title} onChange={e => setNewResource({...newResource, title: e.target.value})} />
                            <input className="input-field" placeholder="URL" value={newResource.url} onChange={e => setNewResource({...newResource, url: e.target.value})} />
                            <button type="button" onClick={addResource} className="btn-primary" style={{ padding: '0 1.5rem' }}>Add</button>
                        </div>
                        <div className="resource-list" style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                            {lessonResources.map(r => (
                                <div key={r.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg-subtle)', padding: '0.5rem 1rem', borderRadius: '8px' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                        <span style={{ fontSize: '0.7rem', fontWeight: '800', background: 'var(--primary)', color: 'white', padding: '0.1rem 0.4rem', borderRadius: '4px' }}>{r.type.toUpperCase()}</span>
                                        <span style={{ fontWeight: '600' }}>{r.title}</span>
                                    </div>
                                    <button type="button" onClick={() => removeResource(r.id)} className="icon-btn-muted"><X size={14} /></button>
                                </div>
                            ))}
                        </div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                    <button type="submit" className="btn-primary" style={{ padding: '0.75rem 2rem' }}>{editingLesson ? 'Update' : 'Create'}</button>
                    <button type="button" className="nav-btn-outline" onClick={() => { setShowForm(false); setEditingLesson(null); }}>Cancel</button>
                  </div>
                </form>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="lesson-list">
            {lessons.map((lesson, index) => (
              <motion.div 
                key={lesson.id} 
                initial={{ opacity: 0, y: 10 }} 
                animate={{ opacity: 1, y: 0 }} 
                transition={{ delay: index * 0.05 }} 
                className={`lesson-item glass-panel ${expandedLesson === lesson.id ? 'expanded' : ''}`}
                style={{ flexDirection: 'column', alignItems: 'stretch' }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }} onClick={() => setExpandedLesson(expandedLesson === lesson.id ? null : lesson.id)}>
                    <div className="lesson-info">
                    <div className="lesson-number" style={{ background: 'var(--primary-light)', color: 'white' }}>{index + 1}</div>
                    <div className="lesson-title">
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            {getIconForType(lesson.type)}
                            {lesson.title}
                            <span style={{ fontSize: '0.7rem', padding: '0.1rem 0.4rem', borderRadius: '4px', background: 'var(--bg-subtle)', color: 'var(--text-muted)', textTransform: 'uppercase' }}>{lesson.type}</span>
                        </div>
                    </div>
                    </div>
                    {isOwner && (
                    <div style={{ display: 'flex', gap: '0.75rem' }} onClick={e => e.stopPropagation()}>
                        <button onClick={() => openQuizManager(lesson.id)} className="action-btn" style={{ fontSize: '0.8rem', padding: '0.4rem 0.8rem' }}>
                            <HelpCircle size={14} /> Quizzes
                        </button>
                        <button onClick={() => handleEditClick(lesson)} className="icon-btn-muted"><Edit size={16} /></button>
                        <button onClick={() => handleDeleteLesson(lesson.id)} className="icon-btn-muted"><Trash2 size={16} color="#EF4444" /></button>
                    </div>
                    )}
                </div>

                <AnimatePresence>
                    {expandedLesson === lesson.id && (
                        <motion.div 
                            initial={{ height: 0, opacity: 0 }} 
                            animate={{ height: 'auto', opacity: 1 }} 
                            exit={{ height: 0, opacity: 0 }}
                            style={{ overflow: 'hidden' }}
                        >
                            <div style={{ padding: '1.5rem', borderTop: '1px solid var(--border-color)', marginTop: '1rem', background: 'var(--bg-subtle)', borderRadius: 'var(--radius-lg)' }}>
                                <h4 style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Lesson Content Preview</h4>
                                {lesson.type === 'text' ? (
                                    <p style={{ whiteSpace: 'pre-wrap', color: 'var(--text-primary)', lineHeight: '1.6' }}>{lesson.content || "No content added to this module yet."}</p>
                                ) : (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem', background: 'white', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
                                            <div style={{ background: 'var(--primary-light)', color: 'white', padding: '0.5rem', borderRadius: '8px' }}>{getIconForType(lesson.type)}</div>
                                            <div>
                                                <div style={{ fontWeight: '600', fontSize: '0.9rem' }}>Resource Link</div>
                                                <a href={lesson.url} target="_blank" rel="noopener noreferrer" style={{ fontSize: '0.85rem', color: 'var(--primary)', wordBreak: 'break-all' }}>{lesson.url}</a>
                                            </div>
                                        </div>
                                        {lesson.content && (
                                            <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', whiteSpace: 'pre-wrap', marginTop: '0.5rem' }}>
                                                {lesson.content.length > 100 ? lesson.content.substring(0, 100) + '...' : lesson.content}
                                            </div>
                                        )}
                                        {lesson.resources && JSON.parse(lesson.resources).length > 0 && (
                                            <div style={{ marginTop: '0.75rem', display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                                                {JSON.parse(lesson.resources).map(r => (
                                                    <span key={r.id} style={{ fontSize: '0.7rem', background: 'var(--bg-subtle)', padding: '0.2rem 0.6rem', borderRadius: '4px', border: '1px solid var(--border-color)' }}>
                                                        📎 {r.title}
                                                    </span>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
              </motion.div>
            ))}
          </div>
        </>
      )}

      {activeTab === 'analytics' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass-panel" style={{ padding: '2rem' }}>
            <h3 style={{ marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}><BarChart3 size={24} className="text-primary" /> Learning Progress</h3>
            {analytics.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-muted)' }}>No data available yet.</div>
            ) : (
                <div style={{ height: 400, width: '100%' }}>
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={analytics} margin={{ top: 20, right: 30, left: 20, bottom: 50 }}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(0,0,0,0.05)" />
                            <XAxis dataKey="name" angle={-45} textAnchor="end" interval={0} height={70} stroke="var(--text-secondary)" fontSize={12} />
                            <YAxis stroke="var(--text-secondary)" fontSize={12} tickFormatter={(val) => `${val}%`} />
                            <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px rgba(0,0,0,0.1)' }} />
                            <Bar dataKey="percentage" radius={[8, 8, 0, 0]} barSize={40}>
                                {analytics.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            )}
        </motion.div>
      )}

      {activeTab === 'students' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <h3 style={{ marginBottom: '1.5rem' }}>Enrolled Learners ({enrolledStudents.length})</h3>
            <div className="glass-panel" style={{ overflow: 'hidden' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead style={{ background: 'var(--bg-subtle)' }}>
                        <tr>
                            <th style={{ textAlign: 'left', padding: '1rem', color: 'var(--text-secondary)' }}>Student Name</th>
                            <th style={{ textAlign: 'left', padding: '1rem', color: 'var(--text-secondary)' }}>Email</th>
                            <th style={{ textAlign: 'left', padding: '1rem', color: 'var(--text-secondary)' }}>Enrolled Date</th>
                        </tr>
                    </thead>
                    <tbody>
                        {enrolledStudents.map((s) => (
                            <tr key={s.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                                <td style={{ padding: '1rem', fontWeight: '600' }}>{s.name}</td>
                                <td style={{ padding: '1rem', color: 'var(--text-secondary)' }}><div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Mail size={14} /> {s.email}</div></td>
                                <td style={{ padding: '1rem', color: 'var(--text-secondary)' }}><div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Calendar size={14} /> {new Date(s.enrolled_at).toLocaleDateString()}</div></td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {enrolledStudents.length === 0 && <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>No students enrolled yet.</div>}
            </div>
        </motion.div>
      )}

      {activeTab === 'doubts' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <h3 style={{ marginBottom: '1.5rem' }}>Doubt Board</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {doubts.map((doubt) => (
                    <div key={doubt.id} className="glass-panel" style={{ padding: '1.5rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                            <div>
                                <span style={{ fontSize: '0.8rem', color: 'var(--primary)', fontWeight: '700' }}>{doubt.student_name}</span>
                                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginLeft: '0.5rem' }}>on {doubt.lesson_title || 'General'}</span>
                            </div>
                            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{new Date(doubt.created_at).toLocaleDateString()}</span>
                        </div>
                        <p style={{ fontWeight: '600', marginBottom: '1rem', fontSize: '1.1rem' }}>Q: {doubt.question}</p>
                        {doubt.answer ? (
                            <div style={{ background: 'var(--bg-subtle)', padding: '1rem', borderRadius: 'var(--radius-md)', borderLeft: '4px solid var(--secondary)' }}>
                                <p style={{ fontSize: '0.95rem' }}><span style={{ fontWeight: '700', color: 'var(--secondary)' }}>Answer:</span> {doubt.answer}</p>
                            </div>
                        ) : (
                            isOwner && (
                                answeringDoubt === doubt.id ? (
                                    <div style={{ marginTop: '1rem' }}>
                                        <textarea className="input-field" placeholder="Type answer..." value={answerText} onChange={e => setAnswerText(e.target.value)} style={{ marginBottom: '1rem' }} />
                                        <div style={{ display: 'flex', gap: '1rem' }}>
                                            <button onClick={() => handleAnswerDoubt(doubt.id)} className="btn-primary" style={{ padding: '0.5rem 1.5rem' }}>Send</button>
                                            <button onClick={() => setAnsweringDoubt(null)} className="nav-btn-outline" style={{ padding: '0.5rem 1rem' }}>Cancel</button>
                                        </div>
                                    </div>
                                ) : (
                                    <button onClick={() => setAnsweringDoubt(doubt.id)} className="btn-primary" style={{ padding: '0.5rem 1.5rem', background: 'var(--accent)' }}>Respond</button>
                                )
                            )
                        )}
                    </div>
                ))}
            </div>
        </motion.div>
      )}

      {/* Quiz Manager */}
      <AnimatePresence>
        {showQuizManager && isOwner && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="modal-overlay" onClick={() => setShowQuizManager(false)}>
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="modal-content glass-panel" onClick={e => e.stopPropagation()} style={{ maxWidth: '700px', width: '90%', padding: '2rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}><HelpCircle className="text-primary" /> Manage Quizzes</h2>
                <button onClick={() => setShowQuizManager(false)} className="close-btn"><X size={24} /></button>
              </div>
              <div className="glass-panel" style={{ background: 'var(--bg-subtle)', padding: '1.5rem', marginBottom: '2rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                  <h4 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Plus size={18} /> Add New Question</h4>
                  <button onClick={handleGenerateAI} className="ai-btn" disabled={generatingAI} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'linear-gradient(135deg, #8B5CF6, #EC4899)', color: 'white', border: 'none', padding: '0.5rem 1rem', borderRadius: 'var(--radius-md)', cursor: 'pointer', fontWeight: '600' }}>
                    {generatingAI ? <Loader2 className="animate-spin" size={16} /> : <Sparkles size={16} />} AI Generate 10 Questions
                  </button>
                </div>
                <form onSubmit={handleAddQuiz}>
                  <input className="input-field" placeholder="Question text..." value={newQuiz.question} onChange={e => setNewQuiz({ ...newQuiz, question: e.target.value })} style={{ marginBottom: '1rem' }} required />
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '1rem' }}>
                    {newQuiz.options.map((opt, i) => (
                      <div key={i} style={{ position: 'relative' }}>
                        <input className="input-field" placeholder={`Option ${i+1}`} value={opt} onChange={e => { const opts = [...newQuiz.options]; opts[i] = e.target.value; setNewQuiz({ ...newQuiz, options: opts }); }} required />
                        <button type="button" onClick={() => setNewQuiz({ ...newQuiz, correct_answer: opt })} style={{ position: 'absolute', right: '8px', top: '50%', transform: 'translateY(-50%)', background: newQuiz.correct_answer === opt ? 'var(--secondary)' : 'var(--bg-subtle)', color: newQuiz.correct_answer === opt ? 'white' : 'var(--text-muted)', border: 'none', borderRadius: '50%', width: '24px', height: '24px', cursor: 'pointer' }}><Check size={14} /></button>
                      </div>
                    ))}
                  </div>
                  <button type="submit" className="btn-primary" style={{ width: '100%' }}>Add Question</button>
                </form>
              </div>
              <div className="existing-quizzes">
                <h4 style={{ marginBottom: '1rem' }}>Current Quizzes ({quizzes.length})</h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', maxHeight: '400px', overflowY: 'auto' }}>
                  {quizzes.map((q, i) => (
                    <div key={q.id} className="glass-panel" style={{ padding: '1rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <p style={{ fontWeight: '600' }}>{i + 1}. {q.question}</p>
                        <button onClick={() => handleDeleteQuiz(q.id)} className="icon-btn-muted"><Trash2 size={16} color="#EF4444" /></button>
                      </div>
                      <div style={{ marginTop: '0.5rem', display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                        {q.options.map((opt, j) => (
                          <span key={j} style={{ fontSize: '0.8rem', padding: '0.2rem 0.6rem', borderRadius: 'var(--radius-sm)', background: q.correct_answer === opt ? 'rgba(16, 185, 129, 0.1)' : 'var(--bg-subtle)', color: q.correct_answer === opt ? 'var(--secondary)' : 'var(--text-secondary)', border: q.correct_answer === opt ? '1px solid var(--secondary)' : '1px solid transparent' }}>{opt}</span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default InstructorCourseDetails;
