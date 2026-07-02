import React, { useEffect, useState, useContext } from 'react';
import { motion } from 'framer-motion';
import { BadgeCheck, Star, Trophy, Loader2 } from 'lucide-react';
import { AuthContext } from '../context/AuthContext';
import './Student.css';

const StudentStreak = () => {
  const { user } = useContext(AuthContext);
  const [streakData, setStreakData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStreak = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await fetch('http://localhost:5000/api/gamification/activity/streak', {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
        if (!res.ok) {
          const err = await res.json();
          throw new Error(err.message || 'Failed to fetch streak');
        }
        const data = await res.json();
        setStreakData(data);
      } catch (err) {
        console.error('Streak fetch error', err);
      } finally {
        setLoading(false);
      }
    };
    fetchStreak();
  }, []);

  if (loading) return <div className="loading"><Loader2 className="animate-spin" size={40} /></div>;

  if (!streakData) return <div className="error">Failed to load streak data.</div>;

  return (
    <div className="dashboard-container" style={{ minHeight: '100vh' }}>
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="streak-card glass-panel"
        style={{ maxWidth: '800px', margin: '2rem auto', padding: '2rem', textAlign: 'center' }}
      >
        <h2 className="text-gradient">Learning Streak</h2>
        <p style={{ fontSize: '1.25rem', margin: '1rem 0' }}>
          You have been active for <strong>{streakData.streak} day{streakData.streak > 1 ? 's' : ''}</strong> straight!
        </p>
        <p style={{ fontSize: '1.1rem' }}>Total XP: <strong>{streakData.xp}</strong></p>
        {streakData.badgesEarned && streakData.badgesEarned.length > 0 && (
          <div style={{ marginTop: '1.5rem' }}>
            <h3>Earned Badges</h3>
            <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', flexWrap: 'wrap' }}>
              {streakData.badgesEarned.map((b, i) => (
                <span key={i} className="badge-item" style={{ background: 'var(--bg-subtle)', padding: '0.5rem 1rem', borderRadius: 'var(--radius-md)', fontWeight: '600' }}>
                  <BadgeCheck size={14} style={{ verticalAlign: 'middle', marginRight: '0.3rem' }} />{b}
                </span>
              ))}
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
};

export default StudentStreak;
