// api/index.js - Vercel serverless entry point
require('dotenv').config();

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');

const {
  globalLimiter,
  authLimiter,
  mongoSanitize,
  xssClean,
} = require('../server/middleware/security');

// Import your route modules (adjust paths if needed)
const authRoutes = require('../server/routes/auth');
const paymentRoutes = require('../server/routes/payments'); // optional, keep if you expose payments
// const otherRoutes = require('../server/routes/other'); // add more as required

const app = express();

// -------------------- security middleware --------------------
app.use(helmet);
app.use(cors({ origin: '*', credentials: true }));
app.use(globalLimiter);
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));
app.use(mongoSanitize);
app.use(xssClean);

// -------------------- rate limiting for auth --------------------
app.use('/api/auth/login', authLimiter);
app.use('/api/auth/register', authLimiter);

// -------------------- mount routes --------------------
app.use('/api/auth', authRoutes);
app.use('/api/payments', paymentRoutes); // optional
// app.use('/api/other', otherRoutes); // add more as needed

// -------------------- health check --------------------
app.get('/api/status', (req, res) => {
  res.json({
    status: 'LMS Backend is running!',
    env: process.env.NODE_ENV || 'development',
  });
});

module.exports = app; // Export for Vercel serverless function
