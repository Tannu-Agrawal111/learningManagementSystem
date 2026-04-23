import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  User, Mail, MapPin, Globe, BookOpen, Award, Users,
  BookMarked, Edit3, Save, X, Lock, CheckCircle2,
  GraduationCap, Briefcase, Calendar, Loader2, AlertCircle, Camera, ArrowLeft
} from 'lucide-react';

const API = 'http://localhost:5000/api/auth';

const Profile = () => {
  const [profileData, setProfileData]   = useState(null);
  const [loading, setLoading]           = useState(true);
  const [editing, setEditing]           = useState(false);
  const [activeTab, setActiveTab]       = useState('profile');
  const [saving, setSaving]             = useState(false);
  const [toast, setToast]               = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(null);
  const fileInputRef = useRef(null);
  const navigate = useNavigate();

  const [form, setForm] = useState({ name: '', bio: '', headline: '', location: '', website: '', avatar: '' });
  const [pwForm, setPwForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });

  useEffect(() => { fetchProfile(); }, []);

  const fetchProfile = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API}/profile`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Failed');
      const data = await res.json();
      setProfileData(data);
      setForm({
        name:     data.user.name     || '',
        bio:      data.user.bio      || '',
        headline: data.user.headline || '',
        location: data.user.location || '',
        website:  data.user.website  || '',
        avatar:   data.user.avatar   || ''
      });
      setAvatarPreview(data.user.avatar || null);
    } catch {
      showToast('error', 'Could not load profile. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const showToast = (type, msg) => {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 3500);
  };

  // Convert selected file → base64 and store in form
  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      return showToast('error', 'Image must be smaller than 2 MB.');
    }
    const reader = new FileReader();
    reader.onload = (ev) => {
      const base64 = ev.target.result;
      setAvatarPreview(base64);
      setForm(f => ({ ...f, avatar: base64 }));
    };
    reader.readAsDataURL(file);
  };

  const handleSaveProfile = async () => {
    if (!form.name.trim()) return showToast('error', 'Name cannot be empty.');
    setSaving(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API}/profile`, {
        method:  'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body:    JSON.stringify(form)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      showToast('success', 'Profile updated successfully!');
      setEditing(false);
      fetchProfile();
    } catch (err) {
      showToast('error', err.message || 'Failed to save profile.');
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async () => {
    if (!pwForm.currentPassword || !pwForm.newPassword) {
      return showToast('error', 'Please fill in all password fields.');
    }
    if (pwForm.newPassword.length < 6) {
      return showToast('error', 'New password must be at least 6 characters.');
    }
    if (pwForm.newPassword !== pwForm.confirmPassword) {
      return showToast('error', 'New passwords do not match.');
    }
    setSaving(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API}/profile`, {
        method:  'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body:    JSON.stringify({ name: form.name, ...pwForm })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      showToast('success', 'Password changed successfully!');
      setPwForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err) {
      showToast('error', err.message || 'Failed to change password.');
    } finally {
      setSaving(false);
    }
  };

  // ── Format "Member Since" from ISO string ──────────────────────────────────
  const formatJoinDate = (isoStr) => {
    if (!isoStr) return 'Unknown';
    try {
      return new Date(isoStr).toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' });
    } catch {
      return 'Unknown';
    }
  };

  // ── Render states ──────────────────────────────────────────────────────────
  if (loading) return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh', flexDirection: 'column', gap: '1rem' }}>
      <Loader2 className="animate-spin text-primary" size={40} />
      <p style={{ color: 'var(--text-muted)' }}>Loading profile…</p>
    </div>
  );

  if (!profileData) return (
    <div style={{ textAlign: 'center', padding: '4rem' }}>
      <AlertCircle size={48} style={{ color: '#ef4444', margin: '0 auto 1rem', display: 'block' }} />
      <h2>Could not load profile</h2>
      <button className="btn-primary" style={{ marginTop: '1rem' }} onClick={fetchProfile}>Retry</button>
    </div>
  );

  const { user, stats } = profileData;
  const isInstructor = user.role === 'instructor';
  const initials = user.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  const joinDate = formatJoinDate(user.created_at);
  const displayAvatar = avatarPreview || form.avatar || null;

  return (
    <div className="dashboard-container" style={{ maxWidth: '1000px', padding: '2.5rem 2rem' }}>

      {/* ── Back to Dashboard ── */}
      <button
        onClick={() => navigate(isInstructor ? '/instructor/dashboard' : '/dashboard')}
        className="back-link"
        style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', marginBottom: '1.5rem', background: 'none', border: 'none', cursor: 'pointer' }}
      >
        <ArrowLeft size={18} /> Back to Dashboard
      </button>

      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
            style={{
              position: 'fixed', top: '5.5rem', right: '2rem', zIndex: 9999,
              padding: '1rem 1.5rem', borderRadius: '12px',
              background: toast.type === 'success' ? '#10b981' : '#ef4444',
              color: 'white', display: 'flex', alignItems: 'center', gap: '0.75rem',
              boxShadow: '0 8px 24px rgba(0,0,0,0.15)', fontWeight: '600', minWidth: '260px'
            }}
          >
            {toast.type === 'success' ? <CheckCircle2 size={20} /> : <AlertCircle size={20} />}
            {toast.msg}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Hero card ── */}
      <motion.div
        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
        className="glass-panel"
        style={{ padding: '2.5rem', marginBottom: '2rem', background: 'linear-gradient(135deg,rgba(99,102,241,.05),rgba(16,185,129,.05))' }}
      >
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '2rem', flexWrap: 'wrap' }}>

          {/* Avatar with upload overlay */}
          <div style={{ position: 'relative', flexShrink: 0 }}>
            <div style={{
              width: '110px', height: '110px', borderRadius: '50%',
              background: isInstructor ? 'linear-gradient(135deg,#6366f1,#4f46e5)' : 'linear-gradient(135deg,#10b981,#059669)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '2.5rem', fontWeight: '800', color: 'white',
              boxShadow: isInstructor ? '0 12px 30px rgba(99,102,241,.35)' : '0 12px 30px rgba(16,185,129,.35)',
              overflow: 'hidden'
            }}>
              {displayAvatar
                ? <img src={displayAvatar} alt="avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                : initials}
            </div>

            {/* Camera overlay (always visible, opens file picker) */}
            <button
              onClick={() => fileInputRef.current?.click()}
              title="Change profile photo"
              style={{
                position: 'absolute', bottom: 0, right: 0,
                width: '34px', height: '34px', borderRadius: '50%',
                background: 'var(--primary)', color: 'white', border: '3px solid white',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer', boxShadow: '0 2px 8px rgba(0,0,0,0.15)'
              }}
            >
              <Camera size={15} />
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              style={{ display: 'none' }}
              onChange={handleAvatarChange}
            />
          </div>

          {/* Details */}
          <div style={{ flex: 1, minWidth: '200px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap', marginBottom: '0.5rem' }}>
              <h1 style={{ margin: 0, fontSize: '2rem' }}>{user.name}</h1>
              <span style={{
                padding: '0.25rem 1rem', borderRadius: '9999px', fontSize: '0.78rem',
                fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.06em',
                background: isInstructor ? 'rgba(99,102,241,.12)' : 'rgba(16,185,129,.12)',
                color: isInstructor ? '#6366f1' : '#10b981',
                border: `1px solid ${isInstructor ? 'rgba(99,102,241,.25)' : 'rgba(16,185,129,.25)'}`
              }}>
                {isInstructor ? '🎓 Instructor' : '📚 Student'}
              </span>
            </div>

            {user.headline && (
              <p style={{ margin: '0 0 0.75rem', fontSize: '1.05rem', color: 'var(--text-secondary)', fontWeight: '500' }}>
                {user.headline}
              </p>
            )}

            <div style={{ display: 'flex', gap: '1.25rem', flexWrap: 'wrap', fontSize: '0.88rem', color: 'var(--text-muted)' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}><Mail size={15} /> {user.email}</span>
              {user.location && <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}><MapPin size={15} /> {user.location}</span>}
              {user.website && (
                <a href={user.website} target="_blank" rel="noopener noreferrer"
                  style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--primary)', textDecoration: 'none' }}>
                  <Globe size={15} /> {user.website.replace(/^https?:\/\//, '')}
                </a>
              )}
              {/* ── Member Since: real date ── */}
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <Calendar size={15} /> Member since {joinDate}
              </span>
            </div>

            {user.bio && (
              <p style={{ margin: '1rem 0 0', lineHeight: '1.75', color: 'var(--text-secondary)', maxWidth: '600px' }}>
                {user.bio}
              </p>
            )}
          </div>

          {/* Edit toggle */}
          <button
            onClick={() => setEditing(e => !e)}
            className={editing ? 'nav-btn-outline' : 'btn-primary'}
            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexShrink: 0 }}
          >
            {editing ? <><X size={18} /> Cancel</> : <><Edit3 size={18} /> Edit Profile</>}
          </button>
        </div>

        {/* Avatar-changed notice */}
        {editing && avatarPreview && avatarPreview !== (profileData.user.avatar || '') && (
          <div style={{ marginTop: '1rem', fontSize: '0.85rem', color: 'var(--primary)', fontWeight: '600' }}>
            📷 New photo selected — click "Save Changes" to apply it.
          </div>
        )}
      </motion.div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: '2rem' }}>

        {/* ── Left ── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

          {/* Stats — live from DB */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: '1rem' }}>
            {isInstructor ? (
              <>
                <StatCard icon={<BookOpen size={22} />} label="Courses Created" value={stats?.total_courses ?? 0} color="#6366f1" />
                <StatCard icon={<Users size={22} />}    label="Total Students"  value={stats?.total_students ?? 0} color="#10b981" />
              </>
            ) : (
              <>
                <StatCard icon={<BookMarked size={22} />} label="Enrolled Courses" value={stats?.enrolled_count ?? 0} color="#6366f1" />
                <StatCard icon={<Award size={22} />}      label="Completed"        value={stats?.completed_count ?? 0} color="#10b981" />
              </>
            )}
          </div>

          {/* Edit form — plain conditional, no height-animation bug */}
          {editing && (
            <div>
                {/* Tabs */}
                <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', background: 'var(--bg-subtle)', padding: '0.4rem', borderRadius: '12px', width: 'fit-content' }}>
                  {['profile', 'security'].map(tab => (
                    <button key={tab} onClick={() => setActiveTab(tab)} style={{
                      padding: '0.5rem 1.25rem', borderRadius: '8px', border: 'none', cursor: 'pointer',
                      fontWeight: '600', fontSize: '0.88rem', transition: 'all 0.2s', textTransform: 'capitalize',
                      background: activeTab === tab ? 'white' : 'transparent',
                      color:      activeTab === tab ? 'var(--primary)' : 'var(--text-muted)',
                      boxShadow:  activeTab === tab ? '0 2px 8px rgba(0,0,0,0.08)' : 'none'
                    }}>
                      {tab === 'profile' ? <><User size={13} style={{ marginRight: '0.3rem', verticalAlign: 'middle' }} />Profile Info</>
                                        : <><Lock size={13} style={{ marginRight: '0.3rem', verticalAlign: 'middle' }} />Security</>}
                    </button>
                  ))}
                </div>

                <div className="glass-panel" style={{ padding: '2rem' }}>
                  {activeTab === 'profile' ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                      <h3 style={{ margin: '0 0 0.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <User className="text-primary" size={20} /> Personal Information
                      </h3>

                      <Field label="Full Name *"    icon={<User size={15} />}>
                        <input className="input-field" value={form.name} onChange={e => setForm({...form, name: e.target.value})} placeholder="Your full name" />
                      </Field>

                      <Field label={isInstructor ? 'Professional Headline' : 'Learning Headline'} icon={<Briefcase size={15} />}>
                        <input className="input-field" value={form.headline} onChange={e => setForm({...form, headline: e.target.value})}
                          placeholder={isInstructor ? 'e.g. Senior Developer & Educator' : 'e.g. Aspiring Software Engineer'} />
                      </Field>

                      <Field label="Bio" icon={<GraduationCap size={15} />}>
                        <textarea className="input-field" value={form.bio} onChange={e => setForm({...form, bio: e.target.value})}
                          placeholder={isInstructor ? 'Your teaching experience…' : 'Your learning goals…'}
                          style={{ minHeight: '90px', resize: 'vertical' }} />
                      </Field>

                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                        <Field label="Location" icon={<MapPin size={15} />}>
                          <input className="input-field" value={form.location} onChange={e => setForm({...form, location: e.target.value})} placeholder="e.g. Mumbai, India" />
                        </Field>
                        <Field label="Website / LinkedIn" icon={<Globe size={15} />}>
                          <input className="input-field" value={form.website} onChange={e => setForm({...form, website: e.target.value})} placeholder="https://..." />
                        </Field>
                      </div>

                      <button onClick={handleSaveProfile} disabled={saving} className="btn-primary"
                        style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', padding: '1rem', marginTop: '0.25rem' }}>
                        {saving ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
                        {saving ? 'Saving…' : 'Save Changes'}
                      </button>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                      <h3 style={{ margin: '0 0 0.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Lock className="text-primary" size={20} /> Change Password
                      </h3>
                      <Field label="Current Password" icon={<Lock size={15} />}>
                        <input type="password" className="input-field" value={pwForm.currentPassword}
                          onChange={e => setPwForm({...pwForm, currentPassword: e.target.value})} placeholder="Current password" />
                      </Field>
                      <Field label="New Password (min 6 chars)" icon={<Lock size={15} />}>
                        <input type="password" className="input-field" value={pwForm.newPassword}
                          onChange={e => setPwForm({...pwForm, newPassword: e.target.value})} placeholder="New password" />
                      </Field>
                      <Field label="Confirm New Password" icon={<Lock size={15} />}>
                        <input type="password" className="input-field" value={pwForm.confirmPassword}
                          onChange={e => setPwForm({...pwForm, confirmPassword: e.target.value})} placeholder="Repeat new password" />
                      </Field>
                      <button onClick={handleChangePassword} disabled={saving} className="btn-primary"
                        style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', padding: '1rem', background: 'linear-gradient(135deg,#ef4444,#dc2626)' }}>
                        {saving ? <Loader2 className="animate-spin" size={18} /> : <Lock size={18} />}
                        {saving ? 'Updating…' : 'Update Password'}
                      </button>
                    </div>
                  )}
                </div>
            </div>
          )}

          {/* Bio card when not editing */}
          {!editing && (
            <div className="glass-panel" style={{ padding: '2rem' }}>
              <h3 style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <GraduationCap className="text-primary" size={20} />
                {isInstructor ? 'About the Instructor' : 'About the Learner'}
              </h3>
              <p style={{ color: 'var(--text-secondary)', lineHeight: '1.8', margin: 0 }}>
                {user.bio || (isInstructor
                  ? 'No bio yet. Click "Edit Profile" to share your expertise.'
                  : 'No bio yet. Click "Edit Profile" to share your learning goals.')}
              </p>
            </div>
          )}
        </div>

        {/* ── Right Sidebar ── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div className="glass-panel" style={{ padding: '1.75rem' }}>
            <h4 style={{ marginBottom: '1.25rem', fontWeight: '700' }}>Account Details</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <InfoRow icon={<Mail size={16} />}     label="Email"        value={user.email} />
              <InfoRow icon={<User size={16} />}     label="Role"         value={user.role.charAt(0).toUpperCase() + user.role.slice(1)} />
              <InfoRow icon={<Calendar size={16} />} label="Member Since" value={joinDate} />
              {user.location && <InfoRow icon={<MapPin size={16} />} label="Location" value={user.location} />}
            </div>
          </div>

          {/* Rank card — Student */}
          {!isInstructor && (
            <div className="glass-panel" style={{ padding: '1.75rem', background: 'linear-gradient(135deg,#6366f1,#4f46e5)', border: 'none', color: 'white' }}>
              <div style={{ fontSize: '0.75rem', fontWeight: '700', opacity: 0.8, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.5rem' }}>
                Current Rank
              </div>
              <div style={{ fontSize: '1.6rem', fontWeight: '800', marginBottom: '1.25rem' }}>
                {(stats?.completed_count ?? 0) >= 10 ? '🏆 Elite Scholar'
                  : (stats?.completed_count ?? 0) >= 5  ? '⭐ Advanced Learner'
                  : (stats?.completed_count ?? 0) >= 1  ? '🌱 Rising Star'
                  : '🎯 Newcomer'}
              </div>
              <div style={{ height: '8px', background: 'rgba(255,255,255,.25)', borderRadius: '4px', overflow: 'hidden', marginBottom: '0.75rem' }}>
                <div style={{ width: `${Math.min(((stats?.completed_count ?? 0) / 10) * 100, 100)}%`, height: '100%', background: 'white', borderRadius: '4px', transition: 'width 1s ease' }} />
              </div>
              <p style={{ fontSize: '0.82rem', opacity: 0.85, margin: 0 }}>
                {Math.max(10 - (stats?.completed_count ?? 0), 0)} completions to next rank
              </p>
            </div>
          )}

          {/* Impact card — Instructor */}
          {isInstructor && (
            <div className="glass-panel" style={{ padding: '1.75rem', background: 'linear-gradient(135deg,#10b981,#059669)', border: 'none', color: 'white' }}>
              <div style={{ fontSize: '0.75rem', fontWeight: '700', opacity: 0.8, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.5rem' }}>
                Teaching Impact
              </div>
              <div style={{ fontSize: '2.5rem', fontWeight: '800', lineHeight: 1 }}>{stats?.total_students ?? 0}</div>
              <div style={{ fontSize: '1rem', opacity: 0.9, marginTop: '0.25rem', marginBottom: '0.5rem' }}>Students Reached</div>
              <p style={{ fontSize: '0.82rem', opacity: 0.85, margin: 0 }}>
                Across {stats?.total_courses ?? 0} course{(stats?.total_courses ?? 0) !== 1 ? 's' : ''}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// ── Sub-components ─────────────────────────────────────────────────────────────

const StatCard = ({ icon, label, value, color }) => (
  <motion.div whileHover={{ y: -4 }} className="glass-panel"
    style={{ padding: '1.5rem', display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
    <div style={{ background: color, color: 'white', padding: '0.9rem', borderRadius: '14px', boxShadow: `0 6px 16px ${color}44` }}>
      {icon}
    </div>
    <div>
      <div style={{ fontSize: '2rem', fontWeight: '800', lineHeight: 1 }}>{value}</div>
      <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>{label}</div>
    </div>
  </motion.div>
);

const Field = ({ label, icon, children }) => (
  <div>
    <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.82rem', fontWeight: '600', color: 'var(--text-secondary)', marginBottom: '0.45rem' }}>
      {icon} {label}
    </label>
    {children}
  </div>
);

const InfoRow = ({ icon, label, value }) => (
  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem', fontSize: '0.9rem' }}>
    <span style={{ color: 'var(--primary)', marginTop: '2px', flexShrink: 0 }}>{icon}</span>
    <div>
      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</div>
      <div style={{ color: 'var(--text-primary)', fontWeight: '500', marginTop: '0.15rem', wordBreak: 'break-all' }}>{value}</div>
    </div>
  </div>
);

export default Profile;
