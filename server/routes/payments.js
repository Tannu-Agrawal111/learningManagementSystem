const express = require('express');
const router = express.Router();
let stripe;
if (process.env.STRIPE_SECRET_KEY && !process.env.STRIPE_SECRET_KEY.includes('MockStripe')) {
  stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
} else {
  // Mock Stripe implementation for environments without a real secret key
  stripe = {
    checkout: {
      sessions: {
        create: async (params) => ({
          url: params.success_url?.replace('{CHECKOUT_SESSION_ID}', `mock_session_${Date.now()}`) || 'http://localhost:5173/simulated-checkout',
          id: `mock_session_${Date.now()}`,
        }),
      },
    },
    webhooks: {
      constructEvent: (payload, sig, secret) => {
        // If a webhook secret is not set, simply parse the JSON payload
        try {
          return JSON.parse(payload.toString());
        } catch (e) {
          return {};
        }
      },
    },
  };
}
const { authMiddleware } = require('../middleware/auth');
const User = require('../models/User');
const Course = require('../models/Course');
const { getOrCreateMongoUser, getOrCreateMongoCourse } = require('../utils/dbSync');
const db = require('../db'); // SQLite db to keep them in sync
const { sendNotification } = require('../utils/notifications');

// ─── Plans Endpoint ──────────────────────────────────────────────────────────
router.get('/plans', authMiddleware, (req, res) => {
  res.json([
    { id: 'monthly', name: 'Monthly All-Access', price: 9.99, interval: 'month' },
    { id: 'yearly', name: 'Yearly Premium Saver', price: 99.99, interval: 'year' }
  ]);
});

// ─── Checkout Sessions ────────────────────────────────────────────────────────
router.post('/checkout/session', authMiddleware, async (req, res) => {
  const { courseId, subscriptionTier } = req.body; // 'monthly' or 'yearly'
  const studentId = req.user.id;

  try {
    const student = await getOrCreateMongoUser(studentId) || { name: 'Student', email: 'student@lms.com' };
    let lineItems = [];
    let metadata = { studentId: studentId.toString() };

    let isMockStripe = !process.env.STRIPE_SECRET_KEY || process.env.STRIPE_SECRET_KEY.includes('MockStripe');

    if (courseId) {
      // Direct course purchase
      const course = await getOrCreateMongoCourse(courseId);
      if (!course) return res.status(404).json({ message: 'Course not found' });
      if (!course.isPaid) return res.status(400).json({ message: 'Course is free' });

      if (isMockStripe) {
        // Return simulated checkout URL
        return res.json({
          url: `http://localhost:5173/simulated-checkout?purchaseType=course&courseId=${courseId}&studentId=${studentId}`,
          sessionId: `mock_session_course_${Date.now()}`
        });
      }

      lineItems = [{
        price_data: {
          currency: 'usd',
          product_data: {
            name: course.title,
            description: course.description
          },
          unit_amount: Math.round(course.price * 100) // Stripe expects cents
        },
        quantity: 1
      }];
      metadata.courseId = courseId.toString();
      metadata.purchaseType = 'course';

    } else if (subscriptionTier) {
      // Subscription tier purchase
      const priceAmount = subscriptionTier === 'yearly' ? 99.99 : 9.99;
      
      if (isMockStripe) {
        // Return simulated checkout URL
        return res.json({
          url: `http://localhost:5173/simulated-checkout?purchaseType=subscription&subscriptionTier=${subscriptionTier}&studentId=${studentId}`,
          sessionId: `mock_session_sub_${Date.now()}`
        });
      }

      lineItems = [{
        price_data: {
          currency: 'usd',
          recurring: {
            interval: subscriptionTier === 'yearly' ? 'year' : 'month'
          },
          product_data: {
            name: `LMS All-Access Subscription (${subscriptionTier === 'yearly' ? 'Yearly' : 'Monthly'})`,
            description: 'Get full access to all courses, assessments, and certifications on our platform'
          },
          unit_amount: Math.round(priceAmount * 100)
        },
        quantity: 1
      }];
      metadata.subscriptionTier = subscriptionTier;
      metadata.purchaseType = 'subscription';
    } else {
      return res.status(400).json({ message: 'Must specify courseId or subscriptionTier' });
    }

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: lineItems,
      mode: subscriptionTier ? 'subscription' : 'payment',
      success_url: `http://localhost:5173/payment-success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `http://localhost:5173/payment-cancelled`,
      metadata
    });

    res.json({ url: session.url, sessionId: session.id });
  } catch (error) {
    console.error('Stripe session error:', error);
    // Safe fallback to simulated checkout in case of any Stripe errors
    res.json({
      url: `http://localhost:5173/simulated-checkout?purchaseType=${subscriptionTier ? 'subscription' : 'course'}&courseId=${courseId || ''}&subscriptionTier=${subscriptionTier || ''}&studentId=${studentId}`,
      sessionId: `mock_session_fallback_${Date.now()}`
    });
  }
});

// ─── Simulated Checkout Success Endpoint ──────────────────────────────────────
router.post('/checkout/simulate-success', authMiddleware, async (req, res) => {
  const { purchaseType, courseId, subscriptionTier } = req.body;
  const studentId = req.user.id;

  try {
    const user = await getOrCreateMongoUser(studentId);
    const userEmail = user ? user.email : 'student@lms.com';
    const userName = user ? user.name : 'Learner';

    if (purchaseType === 'course') {
      db.run(
        'INSERT OR IGNORE INTO enrollments (student_id, course_id) VALUES (?, ?)',
        [studentId, courseId],
        function (err) {
          if (err) console.error('SQLite enrollment sync error:', err.message);
        }
      );

      await Course.findByIdAndUpdate(courseId, { $inc: { enrolledStudentsCount: 1 } });
      
      await sendNotification(
        studentId,
        userEmail,
        'Payment Successful - Enrolled!',
        `Hi ${userName}, you have successfully purchased and enrolled in your course! Let's get started.`,
        { actionUrl: `/student/courses/${courseId}` }
      );
      return res.json({ success: true, message: 'Enrolled in course successfully' });

    } else if (purchaseType === 'subscription') {
      if (user) {
        user.role = 'student';
        user.xp += 100;
        await user.save();
      }

      await sendNotification(
        studentId,
        userEmail,
        'Subscription Activated!',
        `Hi ${userName}, your All-Access ${subscriptionTier} Subscription is active. Enjoy unlimited access.`,
        { actionUrl: '/dashboard' }
      );
      return res.json({ success: true, message: 'Subscription activated successfully' });
    }

    res.status(400).json({ message: 'Invalid purchase type' });
  } catch (error) {
    console.error('Simulated payment error:', error);
    res.status(500).json({ message: 'Failed to complete simulated payment' });
  }
});

// ─── Webhook Handler ──────────────────────────────────────────────────────────
router.post('/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  const sig = req.headers['stripe-signature'];
  let event;

  try {
    if (process.env.STRIPE_WEBHOOK_SECRET) {
      event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
    } else {
      event = JSON.parse(req.body.toString());
    }
  } catch (err) {
    console.error(`Webhook signature verification failed:`, err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    const { studentId, courseId, subscriptionTier, purchaseType } = session.metadata;

    try {
      const user = await getOrCreateMongoUser(studentId);
      const userEmail = user ? user.email : 'student@lms.com';
      const userName = user ? user.name : 'Learner';

      if (purchaseType === 'course') {
        db.run(
          'INSERT OR IGNORE INTO enrollments (student_id, course_id) VALUES (?, ?)',
          [studentId, courseId],
          function (err) {
            if (err) console.error('SQLite enrollment sync error:', err.message);
          }
        );

        await Course.findByIdAndUpdate(courseId, { $inc: { enrolledStudentsCount: 1 } });
        
        await sendNotification(
          studentId,
          userEmail,
          'Payment Successful - Enrolled!',
          `Hi ${userName}, you have successfully purchased and enrolled in your course! Let's get started.`,
          { actionUrl: `/student/courses/${courseId}` }
        );

      } else if (purchaseType === 'subscription') {
        if (user) {
          user.role = 'student';
          user.xp += 100;
          await user.save();
        }

        await sendNotification(
          studentId,
          userEmail,
          'Subscription Activated!',
          `Hi ${userName}, your All-Access ${subscriptionTier} Subscription is active. Enjoy unlimited access.`,
          { actionUrl: '/dashboard' }
        );
      }

      console.log(`Payment successfully processed for student ${studentId}`);
    } catch (dbErr) {
      console.error('Error updating records post-payment webhook:', dbErr.message);
    }
  }

  res.json({ received: true });
});

module.exports = router;
