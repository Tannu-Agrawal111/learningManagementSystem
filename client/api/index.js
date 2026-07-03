// client/api/index.js - Vercel serverless entry point
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import module from 'node:module';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Ensure server files can resolve packages installed in client/node_modules
const clientNodeModules = path.resolve(__dirname, '..', 'node_modules');
if (process.env.NODE_PATH) {
  process.env.NODE_PATH = clientNodeModules + path.delimiter + process.env.NODE_PATH;
} else {
  process.env.NODE_PATH = clientNodeModules;
}
module.Module._initPaths();

const require = createRequire(import.meta.url);

require('dotenv').config();

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');

const {
  globalLimiter,
  authLimiter,
  mongoSanitize,
  xssClean,
} = require('../../server/middleware/security');

// Import route modules pointing to the server folder
const authRoutes = require('../../server/routes/auth');
const paymentRoutes = require('../../server/routes/payments');

const app = express();

// Connect to MongoDB
const connectMongoDB = require('../../server/db_mongo');
connectMongoDB();

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
app.use('/api/payments', paymentRoutes);

// -------------------- health check --------------------
app.get('/api/status', (req, res) => {
  res.json({
    status: 'LMS Backend is running!',
    env: process.env.NODE_ENV || 'development',
  });
});

export default app;
