import React, { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Download, Award, Shield, Check, ArrowLeft, Printer } from 'lucide-react';
import { AuthContext } from '../context/AuthContext';
import './Student.css';

const Certificate = () => {
  const { courseId } = useParams();
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCourseDetails = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await fetch(`http://localhost:5000/api/student/courses/${courseId}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await res.json();
        if (res.ok) {
          setCourse(data.course);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchCourseDetails();
  }, [courseId]);

  const handlePrint = () => {
    window.print();
  };

  if (loading) return <div className="loading">Loading certificate...</div>;
  if (!course) return <div className="error">Course not found.</div>;

  return (
    <div className="dashboard-container" style={{ minHeight: '100vh' }}>
      <div className="no-print" style={{ 
        marginBottom: '2rem', 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        background: 'var(--bg-subtle)',
        padding: '1rem 1.5rem',
        borderRadius: 'var(--radius-lg)',
        border: '1px solid var(--border-color)'
      }}>
        <button onClick={() => navigate(-1)} className="back-link" style={{ marginBottom: 0, border: 'none', background: 'none', cursor: 'pointer' }}>
          <ArrowLeft size={18} /> Back to Course
        </button>
        <div style={{ display: 'flex', gap: '1rem' }}>
          <button onClick={handlePrint} className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Printer size={18} /> Print / Save as PDF
          </button>
        </div>
      </div>

      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="certificate-wrapper"
      >
        <div className="certificate-outer">
          <div className="certificate-inner">
            <div className="certificate-border"></div>
            
            <div className="certificate-content">
              <div className="certificate-header">
                <Award size={80} className="cert-icon" />
                <h1 className="cert-title">Certificate of Completion</h1>
                <p className="cert-subtitle">This is to certify that</p>
              </div>

              <div className="cert-recipient">
                <h2 className="recipient-name">{user?.name}</h2>
              </div>

              <div className="cert-body">
                <p>has successfully completed the professional course</p>
                <h3 className="course-name">{course.title}</h3>
                <p>demonstrating proficiency and dedication in the field of study.</p>
              </div>

              <div className="cert-footer">
                <div className="cert-signature">
                  <div className="signature-line"></div>
                  <p>LMS Administrator</p>
                </div>
                <div className="cert-seal">
                  <div className="seal-outer">
                    <Shield size={40} />
                    <span>VERIFIED</span>
                  </div>
                </div>
                <div className="cert-date">
                  <div className="signature-line"></div>
                  <p>{new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</p>
                </div>
              </div>

              <div className="cert-id">
                Certificate ID: LMS-{courseId}-{user?.id}-{Date.now().toString().slice(-6)}
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      <style>{`
        @media print {
          .no-print { display: none !important; }
          body { background: white !important; margin: 0; padding: 0; }
          .dashboard-container { padding: 0 !important; }
          .certificate-wrapper { transform: scale(1) !important; box-shadow: none !important; margin: 0 !important; }
        }

        .certificate-wrapper {
          max-width: 900px;
          margin: 0 auto;
          background: white;
          padding: 20px;
          box-shadow: 0 20px 50px rgba(0,0,0,0.15);
          border-radius: 8px;
          width: 100%;
        }

        .certificate-outer {
          border: 15px double #1e293b;
          padding: 10px;
          background: #f8fafc;
        }

        .certificate-inner {
          border: 2px solid #1e293b;
          padding: 60px;
          text-align: center;
          position: relative;
          background: white;
        }

        @media (max-width: 768px) {
          .certificate-inner { padding: 30px 15px; }
          .cert-title { font-size: 1.75rem; }
          .recipient-name { font-size: 2rem; padding: 0 10px; margin: 15px 0; }
          .course-name { font-size: 1.5rem; }
          .cert-body { font-size: 0.9rem; margin: 20px 0; }
          .cert-footer { flex-direction: column; align-items: center; gap: 2rem; margin-top: 30px; }
          .seal-outer { width: 100px; height: 100px; }
          .signature-line { width: 150px; }
        }

        .cert-icon {
          color: #fbbf24;
          margin-bottom: 20px;
        }

        .cert-title {
          font-family: 'Playfair Display', serif;
          font-size: 3.5rem;
          color: #1e293b;
          margin-bottom: 10px;
          text-transform: uppercase;
          letter-spacing: 2px;
        }

        .cert-subtitle {
          font-size: 1.2rem;
          color: #64748b;
          font-style: italic;
        }

        .recipient-name {
          font-family: 'Great Vibes', cursive;
          font-size: 4rem;
          color: #0f172a;
          margin: 30px 0;
          border-bottom: 2px solid #e2e8f0;
          display: inline-block;
          padding: 0 40px;
        }

        .course-name {
          font-size: 2.5rem;
          color: #2563eb;
          margin: 20px 0;
          font-weight: 800;
        }

        .cert-body {
          margin: 40px 0;
          line-height: 1.6;
          color: #334155;
          font-size: 1.1rem;
        }

        .cert-footer {
          display: flex;
          justify-content: space-between;
          align-items: flex-end;
          margin-top: 60px;
        }

        .signature-line {
          width: 200px;
          border-bottom: 2px solid #1e293b;
          margin-bottom: 10px;
        }

        .cert-seal {
          position: relative;
        }

        .seal-outer {
          width: 120px;
          height: 120px;
          background: #fbbf24;
          border-radius: 50%;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          color: #78350f;
          border: 4px solid #78350f;
          box-shadow: 0 0 0 4px #fbbf24, 0 0 20px rgba(251, 191, 36, 0.4);
          font-weight: 900;
          font-size: 0.7rem;
        }

        .cert-id {
          margin-top: 40px;
          font-size: 0.8rem;
          color: #94a3b8;
          font-family: monospace;
        }
      `}</style>
    </div>
  );
};

export default Certificate;
