const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const db = require('../db');
const { authMiddleware } = require('../middleware/auth');

// Razorpay credentials - use test keys for development
const RAZORPAY_KEY_ID = process.env.RAZORPAY_KEY_ID || 'rzp_test_YourKeyHere';
const RAZORPAY_KEY_SECRET = process.env.RAZORPAY_KEY_SECRET || 'YourSecretHere';

let Razorpay;
let razorpay;
try {
  Razorpay = require('razorpay');
  razorpay = new Razorpay({
    key_id: RAZORPAY_KEY_ID,
    key_secret: RAZORPAY_KEY_SECRET,
  });
} catch (e) {
  console.warn('Razorpay not initialized:', e.message);
}

router.use(authMiddleware);

// @route POST /api/payment/create-order
// @desc  Create a Razorpay order for a course
router.post('/create-order', async (req, res) => {
  const { courseId } = req.body;
  const studentId = req.user.id;

  try {
    // Get course info
    db.get('SELECT * FROM courses WHERE id = ?', [courseId], async (err, course) => {
      if (err || !course) return res.status(404).json({ message: 'Course not found' });
      if (!course.is_paid) return res.status(400).json({ message: 'Course is free — enroll directly' });

      // Check if already enrolled
      db.get('SELECT id FROM enrollments WHERE student_id = ? AND course_id = ?', [studentId, courseId], async (err, existing) => {
        if (existing) return res.status(400).json({ message: 'Already enrolled in this course' });

        const amountInPaise = Math.round(course.price * 100);

        // Simulate order if Razorpay not configured
        if (!razorpay || RAZORPAY_KEY_ID === 'rzp_test_YourKeyHere') {
          const mockOrderId = `order_mock_${Date.now()}`;
          db.run(
            'INSERT INTO payments (student_id, course_id, razorpay_order_id, amount, status) VALUES (?, ?, ?, ?, ?)',
            [studentId, courseId, mockOrderId, course.price, 'pending'],
            function (err) {
              if (err) return res.status(500).json({ message: 'Failed to create payment record' });
              return res.json({
                orderId: mockOrderId,
                amount: amountInPaise,
                currency: 'INR',
                keyId: RAZORPAY_KEY_ID,
                courseName: course.title,
                isMock: true,
              });
            }
          );
          return;
        }

        try {
          const order = await razorpay.orders.create({
            amount: amountInPaise,
            currency: 'INR',
            receipt: `lms_${studentId}_${courseId}_${Date.now()}`,
          });

          db.run(
            'INSERT INTO payments (student_id, course_id, razorpay_order_id, amount, status) VALUES (?, ?, ?, ?, ?)',
            [studentId, courseId, order.id, course.price, 'pending'],
            function (err) {
              if (err) return res.status(500).json({ message: 'Failed to create payment record' });
              res.json({
                orderId: order.id,
                amount: order.amount,
                currency: order.currency,
                keyId: RAZORPAY_KEY_ID,
                courseName: course.title,
              });
            }
          );
        } catch (rzpErr) {
          console.error('Razorpay error:', rzpErr);
          res.status(500).json({ message: 'Payment gateway error. Please try again.' });
        }
      });
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// @route POST /api/payment/verify
// @desc  Verify Razorpay payment signature and grant enrollment
router.post('/verify', (req, res) => {
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature, courseId, isMock } = req.body;
  const studentId = req.user.id;

  const grantEnrollment = () => {
    db.run(
      'UPDATE payments SET razorpay_payment_id = ?, status = ? WHERE razorpay_order_id = ? AND student_id = ?',
      [razorpay_payment_id || 'mock_payment', 'paid', razorpay_order_id, studentId],
      (err) => {
        if (err) return res.status(500).json({ message: 'Failed to update payment' });

        db.run(
          'INSERT OR IGNORE INTO enrollments (student_id, course_id) VALUES (?, ?)',
          [studentId, courseId],
          function (err) {
            if (err) return res.status(500).json({ message: 'Failed to enroll' });
            res.json({ message: 'Payment verified and enrollment granted', success: true });
          }
        );
      }
    );
  };

  // Skip signature verification for mock orders
  if (isMock || razorpay_order_id.startsWith('order_mock_')) {
    return grantEnrollment();
  }

  // Verify real Razorpay signature
  const generatedSignature = crypto
    .createHmac('sha256', RAZORPAY_KEY_SECRET)
    .update(`${razorpay_order_id}|${razorpay_payment_id}`)
    .digest('hex');

  if (generatedSignature !== razorpay_signature) {
    // Mark payment as failed
    db.run(
      'UPDATE payments SET status = ? WHERE razorpay_order_id = ?',
      ['failed', razorpay_order_id],
      () => {}
    );
    return res.status(400).json({ message: 'Payment verification failed. Invalid signature.' });
  }

  grantEnrollment();
});

// @route GET /api/payment/history
// @desc  Get student's payment history
router.get('/history', (req, res) => {
  const studentId = req.user.id;
  const query = `
    SELECT p.*, c.title as course_title, c.price
    FROM payments p
    JOIN courses c ON p.course_id = c.id
    WHERE p.student_id = ?
    ORDER BY p.created_at DESC
  `;
  db.all(query, [studentId], (err, rows) => {
    if (err) return res.status(500).json({ message: 'Database error' });
    res.json(rows);
  });
});

// @route GET /api/payment/key
// @desc  Get Razorpay public key for client
router.get('/key', (req, res) => {
  res.json({ keyId: RAZORPAY_KEY_ID });
});

module.exports = router;
