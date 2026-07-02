import React, { useEffect, useState, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { motion } from 'framer-motion';
import { CreditCard, DollarSign, RefreshCw } from 'lucide-react';
import './Student.css';

const PaymentSubscriptions = () => {
  const { user } = useContext(AuthContext);
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPlans = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await fetch(`${window.API_BASE_URL || 'http://localhost:5000'}/api/payment/plans`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.ok) setPlans(await res.json());
      } catch (e) {
        console.error('Failed to load plans', e);
      } finally {
        setLoading(false);
      }
    };
    fetchPlans();
  }, []);

  const handleSubscribe = async (planId) => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${window.API_BASE_URL || 'http://localhost:5000'}/api/payment/subscribe/${planId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }
      });
      if (res.ok) alert('Subscription successful!');
      else {
        const err = await res.json();
        alert('Failed: ' + (err.message || 'unknown'));
      }
    } catch (e) {
      console.error(e);
      alert('Network error');
    }
  };

  if (loading) return <div className="loading"><RefreshCw className="animate-spin" size={40} /></div>;

  return (
    <div className="dashboard-container" style={{ minHeight: '100vh' }}>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="payment-wrapper">
        <h2 className="text-gradient" style={{ textAlign: 'center' }}><CreditCard size={28} /> Payment & Subscriptions</h2>
        {plans.length === 0 ? (
          <p style={{ textAlign: 'center', marginTop: '2rem' }}>No subscription plans available.</p>
        ) : (
          <div className="plan-grid" style={{ display: 'flex', gap: '1.5rem', justifyContent: 'center', flexWrap: 'wrap' }}>
            {plans.map(plan => (
              <div key={plan.id} className="plan-card glass-panel" style={{ padding: '1.5rem', width: '260px', textAlign: 'center' }}>
                <h3>{plan.name}</h3>
                <p><DollarSign /> {plan.price} / {plan.interval}</p>
                <button className="btn-primary" onClick={() => handleSubscribe(plan.id)} style={{ marginTop: '1rem' }}>Subscribe</button>
              </div>
            ))}
          </div>
        )}
      </motion.div>
    </div>
  );
};

export default PaymentSubscriptions;
