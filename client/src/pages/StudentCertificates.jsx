import React, { useEffect, useState, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Award } from 'lucide-react';
import './Student.css';

const StudentCertificates = () => {
  const { user } = useContext(AuthContext);
  const [certificates, setCertificates] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCertificates = async () => {
      try {
        const token = localStorage.getItem('token');
        // Use the new gamification certificates endpoint
        const res = await fetch(`${window.API_BASE_URL || 'http://localhost:5000'}/api/gamification/certificates`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.ok) {
          const { certificates } = await res.json();
          setCertificates(certificates);
        } else {
          const err = await res.json();
          console.error('Certificates fetch error', err);
        }
      } catch (e) {
        console.error('Failed to load certificates', e);
      } finally {
        setLoading(false);
      }
    };
    fetchCertificates();
  }, []);
  const handleDownload = async (courseId) => {
    const token = localStorage.getItem('token');
    try {
      const res = await fetch(`${window.API_BASE_URL || 'http://localhost:5000'}/api/gamification/certificates/${courseId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const { pdfUrl } = await res.json();
        window.open(pdfUrl, '_blank');
      } else {
        const err = await res.json();
        console.error('Download error', err);
      }
    } catch (e) {
      console.error('Download failed', e);
    }
  };
  if (loading) return <div className="loading">Loading certificates...</div>;

  return (
    <div className="dashboard-container" style={{ minHeight: '100vh' }}>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="certificate-wrapper">
        <div className="certificate-outer">
          <div className="certificate-inner">
            <div className="certificate-header" style={{ textAlign: 'center' }}>
              <Award size={80} className="cert-icon" />
              <h1 className="cert-title">My Certificates</h1>
            </div>
            {certificates.length === 0 ? (
              <p style={{ textAlign: 'center', marginTop: '2rem' }}>You have no certificates yet.</p>
            ) : (
              <ul style={{ listStyle: 'none', padding: 0 }}>
                {certificates.map(cert => (
                  <li key={cert.id} style={{ margin: '1.5rem 0', textAlign: 'center' }}>
                    <div style={{ display: 'inline-block', padding: '1rem 2rem', border: '2px solid var(--primary)', borderRadius: 'var(--radius-lg)' }}>
                      <h3>{cert.title}</h3>
                      <p>Issued: {new Date(cert.issuedAt).toLocaleDateString()}</p>
                      <button className="nav-btn-outline" style={{ marginTop: '0.5rem' }} onClick={() => handleDownload(cert.courseId)}>Download PDF</button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default StudentCertificates;
