const express = require('express');
const cors = require('cors');
const http = require('http');
const socketIo = require('socket.io');
require('dotenv').config();

const db = require('./db'); // SQLite db initialization
const connectMongoDB = require('./db_mongo'); // MongoDB Mongoose initialization

// Security Middleware Imports
const { 
  globalLimiter, 
  authLimiter, 
  mongoSanitize, 
  xssClean, 
  helmet 
} = require('./middleware/security');

// Route Imports
const authRoutes = require('./routes/auth');
const instructorRoutes = require('./routes/instructor');
const studentRoutes = require('./routes/student');

// Advanced Module Route Imports
const videoRoutes = require('./routes/video');
const assessmentRoutes = require('./routes/assessments');
const liveRoutes = require('./routes/live');
const paymentRoutes = require('./routes/payments');
const analyticsRoutes = require('./routes/analytics');
const gamificationRoutes = require('./routes/gamification');
const notificationRoutes = require('./routes/notification');

const { setIoInstance } = require('./utils/notifications');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: '*', // Allow development connection
    methods: ['GET', 'POST']
  }
});

const PORT = process.env.PORT || 5000;

// Connect to MongoDB
connectMongoDB();

// ─── Security Headers & Sanitizers ───────────────────────────────────────────
app.use(helmet);
app.use(cors({
  origin: ['http://localhost:5173', 'https://learningmanagementsystem-backend-lms.onrender.com'],
  credentials: true
}));

app.use(globalLimiter); // Global rate limiter
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));
app.use(mongoSanitize); // Anti NoSQL Injection
app.use(xssClean); // Anti XSS Attacks

// ─── Rate Limit Specific Routes ──────────────────────────────────────────────
app.use('/api/auth/login', authLimiter);
app.use('/api/auth/register', authLimiter);

// ─── Mount Routes ────────────────────────────────────────────────────────────
app.use('/api/auth', authRoutes);
app.use('/api/instructor', instructorRoutes);
app.use('/api/student', studentRoutes);

// Mount Advanced routes
app.use('/api/video', videoRoutes);
app.use('/api/assessments', assessmentRoutes);
app.use('/api/live', liveRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/gamification', gamificationRoutes);
app.use('/api/notifications', notificationRoutes);

// Serve uploads folder statically
const path = require('path');
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Simple status endpoint
app.get('/api/status', (req, res) => {
  res.json({ 
    status: 'LMS Backend is running!', 
    mongodb: 'connected',
    security: 'helmet & rate limiters active'
  });
});

// ─── Socket.io Real-time Event Handling ────────────────────────────────────────

setIoInstance(io); // Register socket.io reference in notifications utility

io.on('connection', (socket) => {
  console.log(`New user connected: ${socket.id}`);

  // User joins a private channel matching their userId (for targeted real-time alerts)
  socket.on('join_user', (userId) => {
    socket.join(userId.toString());
    console.log(`User ${userId} joined their notification channel.`);
  });

  // User joins discussion lobby for live chat inside a lecture
  socket.on('join_lecture_lobby', (lectureId) => {
    socket.join(lectureId.toString());
    console.log(`User joined lecture lobby ${lectureId}`);
  });

  // Post chat message in lecture lobby
  socket.on('send_lobby_msg', (data) => {
    const { lectureId, message, userName, userId } = data;
    io.to(lectureId.toString()).emit('receive_lobby_msg', {
      userId,
      userName,
      message,
      createdAt: new Date()
    });
  });

  // Proctoring logs (track tab switches / window blur alerts)
  socket.on('proctoring_violation', (data) => {
    const { userId, type, assessmentTitle } = data;
    console.warn(`[ANTI-CHEAT WARNING] User ${userId} committed proctor infraction: ${type} on ${assessmentTitle}`);
    
    // Broadcast warning to the student
    socket.emit('proctoring_warning', {
      message: `Warning: ${type} detected. Copy-pasting is disabled, and leaving the tab will terminate your exam.`
    });
  });

  // ─── Live Class Room Socket Events ──────────────────────────────────────────
  socket.on('join_class', (classId) => {
    const room = `class_${classId}`;
    socket.join(room);
    console.log(`User joined class room ${room}`);
  });

  socket.on('class_message', (data) => {
    const { classId, userId, userName, message } = data;
    const room = `class_${classId}`;
    io.to(room).emit('receive_class_msg', {
      userId,
      userName,
      message,
      createdAt: new Date()
    });
  });

  // ─── Interactive Timeline Q&A Socket Events ────────────────────────────────
  socket.on('join_qna_room', (lectureId) => {
    socket.join(`qna_${lectureId}`);
    console.log(`User joined Q&A room for lecture ${lectureId}`);
  });

  socket.on('post_timeline_question', (data) => {
    const { lectureId, userId, userName, question, timestamp } = data;
    const qnaData = {
      userId,
      userName,
      question,
      timestamp,
      createdAt: new Date(),
      replies: []
    };
    io.to(`qna_${lectureId}`).emit('new_timeline_question', qnaData);
  });

  socket.on('post_timeline_reply', (data) => {
    const { lectureId, questionId, userId, userName, reply } = data;
    io.to(`qna_${lectureId}`).emit('new_timeline_reply', {
      questionId,
      userId,
      userName,
      reply,
      createdAt: new Date()
    });
  });

  // ─── Typing Indicators ─────────────────────────────────────────────────────
  socket.on('typing_start', (data) => {
    const { room, userName } = data;
    socket.to(room).emit('user_typing', { userName });
  });

  socket.on('typing_stop', (data) => {
    const { room, userName } = data;
    socket.to(room).emit('user_stopped_typing', { userName });
  });

  // ─── Online Presence ───────────────────────────────────────────────────────
  socket.on('user_online', (data) => {
    const { courseId, userId, userName } = data;
    socket.join(`course_${courseId}`);
    io.to(`course_${courseId}`).emit('presence_update', {
      userId,
      userName,
      status: 'online'
    });
  });

  socket.on('disconnect', () => {
    console.log(`User disconnected: ${socket.id}`);
  });
});

// Start Server
server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
