const express = require('express');
const cors = require('cors');
require('dotenv').config();
const db = require('./db');

const authRoutes = require('./routes/auth');
const instructorRoutes = require('./routes/instructor');
const studentRoutes = require('./routes/student');
const paymentRoutes = require('./routes/payment');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/instructor', instructorRoutes);
app.use('/api/student', studentRoutes);
app.use('/api/payment', paymentRoutes);

// Serve uploaded files
const path = require('path');
app.use('/uploads', require('express').static(path.join(__dirname, 'uploads')));

// Simple test route
app.get('/api/status', (req, res) => {
  res.json({ status: 'LMS Backend is running!' });
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
