import React, { useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { CreditCard, ShieldCheck, Loader2, ArrowLeft, Landmark } from 'lucide-react';
import './Student.css';

const SimulatedCheckout = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const purchaseType = searchParams.get('purchaseType');
  const courseId = searchParams.get('courseId');
  const subscriptionTier = searchParams.get('subscriptionTier');

  const [loading, setLoading] = useState(false);
  const [cardName, setCardName] = useState('');
  const [cardNumber, setCardNumber] = useState('4242 4242 4242 4242');
  const [expiry, setExpiry] = useState('12/29');
  const [cvc, setCvc] = useState('123');

  const handlePay = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${window.API_BASE_URL || 'http://localhost:5000'}/api/payments/checkout/simulate-success`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          purchaseType,
          courseId,
          subscriptionTier
        })
      });

      if (res.ok) {
        alert('Payment Simulated Successfully! You are now enrolled/subscribed.');
        if (purchaseType === 'course') {
          navigate(`/student/courses/${courseId}`);
        } else {
          navigate('/dashboard');
        }
      } else {
        const d = await res.json();
        alert(d.message || 'Payment simulation failed.');
      }
    } catch (err) {
      alert('Error during simulation.');
    } finally {
      setLoading(false);
    }
  };

  const amount = purchaseType === 'course' ? '$29.99' : (subscriptionTier === 'yearly' ? '$99.99' : '$9.99');
  const description = purchaseType === 'course' 
    ? 'Direct Lifetime Course Access' 
    : `All-Access ${subscriptionTier === 'yearly' ? 'Yearly' : 'Monthly'} Plan`;

  return (
    <div className="dashboard-container" style={{ minHeight: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '100px 1rem' }}>
      <style>{`
        .checkout-box {
          width: 100%;
          max-width: 500px;
          border-radius: var(--radius-xl);
          background: rgba(255, 255, 255, 0.08);
          backdrop-filter: blur(12px);
          border: 1px solid var(--border-color);
          padding: 2.5rem;
          box-shadow: var(--shadow-2xl);
        }
        .visa-card {
          background: linear-gradient(135deg, #1e3a8a, #3b82f6);
          border-radius: var(--radius-lg);
          padding: 1.5rem;
          color: white;
          margin-bottom: 2rem;
          position: relative;
          box-shadow: 0 8px 20px rgba(59, 130, 246, 0.3);
        }
      `}</style>

      <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} className="checkout-box">
        <button onClick={() => navigate(-1)} className="nav-btn-outline" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem', padding: '0.4rem 0.8rem' }}>
          <ArrowLeft size={16} /> Cancel
        </button>

        <h2 className="text-gradient" style={{ marginBottom: '0.5rem' }}>Secure Sandbox Payment</h2>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem', fontSize: '0.95rem' }}>
          Simulating checkout environment for: <strong>{description}</strong>
        </p>

        <div className="visa-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
            <Landmark size={32} />
            <span style={{ fontSize: '0.8rem', fontWeight: '800', letterSpacing: '2px' }}>SANDBOX CARD</span>
          </div>
          <div style={{ fontSize: '1.4rem', letterSpacing: '3px', marginBottom: '1.5rem', fontFamily: 'monospace' }}>
            {cardNumber}
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
            <div>
              <div style={{ opacity: 0.6, fontSize: '0.7rem' }}>CARDHOLDER</div>
              <div>{cardName || 'YOUR NAME'}</div>
            </div>
            <div>
              <div style={{ opacity: 0.6, fontSize: '0.7rem' }}>EXPIRES</div>
              <div>{expiry}</div>
            </div>
          </div>
        </div>

        <form onSubmit={handlePay} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div>
            <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '0.4rem' }}>Cardholder Name</label>
            <input 
              type="text" 
              required 
              value={cardName} 
              onChange={e => setCardName(e.target.value.toUpperCase())}
              placeholder="JOHN DOE"
              style={{ width: '100%', padding: '0.8rem', borderRadius: '10px', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-color)', color: 'white' }}
            />
          </div>

          <div style={{ display: 'flex', gap: '1rem' }}>
            <div style={{ flex: 2 }}>
              <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '0.4rem' }}>Expiry Date</label>
              <input 
                type="text" 
                required 
                value={expiry} 
                onChange={e => setExpiry(e.target.value)}
                placeholder="MM/YY"
                style={{ width: '100%', padding: '0.8rem', borderRadius: '10px', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-color)', color: 'white' }}
              />
            </div>
            <div style={{ flex: 1 }}>
              <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '0.4rem' }}>CVC</label>
              <input 
                type="password" 
                maxLength="3" 
                required 
                value={cvc} 
                onChange={e => setCvc(e.target.value)}
                placeholder="123"
                style={{ width: '100%', padding: '0.8rem', borderRadius: '10px', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-color)', color: 'white' }}
              />
            </div>
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="btn-primary" 
            style={{ width: '100%', marginTop: '1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', padding: '1rem' }}
          >
            {loading ? <Loader2 className="animate-spin" size={20} /> : <><ShieldCheck size={20} /> Pay {amount}</>}
          </button>
        </form>
      </motion.div>
    </div>
  );
};

export default SimulatedCheckout;
