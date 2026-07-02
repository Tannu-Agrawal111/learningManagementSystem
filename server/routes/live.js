const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../middleware/auth');
const Course = require('../models/Course');
const User = require('../models/User');

// ─── In-Video Contextual Q&A ─────────────────────────────────────────────────

// Add question at specific video second
router.post('/qna', authMiddleware, async (req, res) => {
  const { courseId, sectionId, lectureId, second, comment } = req.body;
  const studentId = req.user.id;

  if (!courseId || !lectureId || second === undefined || !comment) {
    return res.status(400).json({ message: 'Missing courseId, lectureId, second, or comment text' });
  }

  try {
    const course = await Course.findById(courseId);
    if (!course) return res.status(404).json({ message: 'Course not found' });

    // Find the section and lecture in nesting structure
    let lectureFound = false;
    for (const section of course.sections) {
      const lecture = section.lectures.id(lectureId) || section.lectures.find(l => l._id.toString() === lectureId);
      if (lecture) {
        lecture.qna.push({
          student: studentId,
          second: parseInt(second),
          comment,
          createdAt: new Date()
        });
        lectureFound = true;
        break;
      }
    }

    if (!lectureFound) {
      return res.status(404).json({ message: 'Lecture not found in this course' });
    }

    await course.save();
    
    // Return course with populated student details if needed, or simple success
    res.json({ message: 'Q&A comment added successfully', second, comment });
  } catch (error) {
    console.error('Error posting Q&A comment:', error);
    res.status(500).json({ message: 'Failed to post Q&A comment' });
  }
});

// Fetch all Q&As for a specific lecture
router.get('/qna/:courseId/:lectureId', authMiddleware, async (req, res) => {
  const { courseId, lectureId } = req.params;

  try {
    const course = await Course.findById(courseId).populate('sections.lectures.qna.student', 'name avatar');
    if (!course) return res.status(404).json({ message: 'Course not found' });

    for (const section of course.sections) {
      const lecture = section.lectures.id(lectureId) || section.lectures.find(l => l._id.toString() === lectureId);
      if (lecture) {
        return res.json(lecture.qna);
      }
    }

    res.status(404).json({ message: 'Lecture not found' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to retrieve Q&As' });
  }
});

// ─── Live Class Room Routing ──────────────────────────────────────────────────

// Generate Live Session details (Daily.co / Agora RTC tokens)
router.post('/class/session', authMiddleware, async (req, res) => {
  const { courseId, title, startTime } = req.body;
  
  if (!courseId || !title) {
    return res.status(400).json({ message: 'Missing courseId or class title' });
  }

  try {
    // Agora App ID mock config
    const appId = process.env.AGORA_APP_ID || 'agora_demo_app_id_99a888c';
    const channelName = `class-${courseId}`;
    
    // Generate a mock Agora RTC token
    const rtcToken = `006${appId}IACMockTokenForAgoraRTCChannel-${channelName}-ValidFor24Hours`;
    
    // Generate webRTC room URL
    const dailyCoRoomUrl = `https://lms-live.daily.co/room-${courseId}`;

    res.json({
      message: 'Live session room configured successfully',
      appId,
      channelName,
      rtcToken,
      dailyCoRoomUrl,
      title,
      startTime: startTime || new Date(),
      status: 'scheduled'
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to create live class' });
  }
});

module.exports = router;
