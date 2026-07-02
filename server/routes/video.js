const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { authMiddleware } = require('../middleware/auth');
const { initiateMultipart, uploadPart, completeMultipart } = require('../utils/storage');
const Progress = require('../models/Progress');
const Course = require('../models/Course');

const upload = multer({ limits: { fileSize: 50 * 1024 * 1024 } }); // 50MB chunk limit

// ─── Resumable Multipart Uploads ─────────────────────────────────────────────

// Initiate multipart upload
router.post('/multipart/initiate', authMiddleware, (req, res) => {
  const { filename, fileType } = req.body;
  if (!filename) return res.status(400).json({ message: 'Filename is required' });

  try {
    const result = initiateMultipart(filename, fileType || 'video/mp4');
    res.json(result);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Upload chunk/part
router.post('/multipart/upload-part', authMiddleware, upload.single('chunk'), async (req, res) => {
  const { uploadId, partNumber } = req.body;
  if (!uploadId || !partNumber || !req.file) {
    return res.status(400).json({ message: 'Missing uploadId, partNumber, or chunk file' });
  }

  try {
    const result = await uploadPart(uploadId, partNumber, req.file.buffer);
    res.json(result);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Complete multipart upload & trigger encoding pipeline
router.post('/multipart/complete', authMiddleware, async (req, res) => {
  const { uploadId } = req.body;
  if (!uploadId) return res.status(400).json({ message: 'Missing uploadId' });

  try {
    const completionResult = await completeMultipart(uploadId);
    
    // Simulate/Perform Adaptive Video Encoding (HLS conversion)
    // In production, this would dispatch to AWS MediaConvert or FFmpeg child_process
    const videoFilename = completionResult.filename;
    const hlsDirName = `hls-${videoFilename.split('.')[0]}`;
    const hlsDirPath = path.join(__dirname, '../uploads', hlsDirName);
    
    if (!fs.existsSync(hlsDirPath)) {
      fs.mkdirSync(hlsDirPath, { recursive: true });
    }

    // Creating mock HLS files (.m3u8 and dummy .ts files) for playbacks
    const playlistContent = `#EXTM3U
#EXT-X-VERSION:3
#EXT-X-STREAM-INF:BANDWIDTH=800000,RESOLUTION=640x360
/uploads/${hlsDirName}/360p.m3u8
#EXT-X-STREAM-INF:BANDWIDTH=1400000,RESOLUTION=842x480
/uploads/${hlsDirName}/480p.m3u8
#EXT-X-STREAM-INF:BANDWIDTH=2800000,RESOLUTION=1280x720
/uploads/${hlsDirName}/720p.m3u8
#EXT-X-STREAM-INF:BANDWIDTH=5000000,RESOLUTION=1920x1080
/uploads/${hlsDirName}/1080p.m3u8`;

    fs.writeFileSync(path.join(hlsDirPath, 'manifest.m3u8'), playlistContent);
    
    // Create individual stream manifests (mocking FFmpeg output)
    const streamStub = `#EXTM3U\n#EXT-X-TARGETDURATION:10\n#EXT-X-MEDIA-SEQUENCE:0\n#EXTINF:10.0,\n/uploads/${videoFilename}\n#EXT-X-ENDLIST`;
    fs.writeFileSync(path.join(hlsDirPath, '360p.m3u8'), streamStub);
    fs.writeFileSync(path.join(hlsDirPath, '480p.m3u8'), streamStub);
    fs.writeFileSync(path.join(hlsDirPath, '720p.m3u8'), streamStub);
    fs.writeFileSync(path.join(hlsDirPath, '1080p.m3u8'), streamStub);

    res.json({
      message: 'Video upload completed and processed into HLS format',
      originalUrl: completionResult.location,
      hlsUrl: `/uploads/${hlsDirName}/manifest.m3u8`
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ─── Playback Continuity ─────────────────────────────────────────────────────

// Debounced background API to save video timestamp down to the second
router.post('/playback/continuity', authMiddleware, async (req, res) => {
  const { courseId, lectureId, watchTimeSeconds, lastPositionSeconds, completed } = req.body;
  const studentId = req.user.id;

  if (!courseId || !lectureId) {
    return res.status(400).json({ message: 'Missing courseId or lectureId' });
  }

  try {
    // Find or create Progress document for this student and course
    let progress = await Progress.findOne({ student: studentId, course: courseId });
    if (!progress) {
      progress = new Progress({
        student: studentId,
        course: courseId,
        completedLectures: [],
        videoWatchTimes: [],
        completedSteps: [],
        overallPercentage: 0
      });
    }

    // Update specific video watch time
    let timeIndex = progress.videoWatchTimes.findIndex(item => item.lectureId === lectureId);
    if (timeIndex > -1) {
      progress.videoWatchTimes[timeIndex].watchTimeSeconds = watchTimeSeconds;
      progress.videoWatchTimes[timeIndex].lastPositionSeconds = lastPositionSeconds;
      if (completed) progress.videoWatchTimes[timeIndex].completed = true;
    } else {
      progress.videoWatchTimes.push({
        lectureId,
        watchTimeSeconds,
        lastPositionSeconds,
        completed: !!completed
      });
    }

    // If completed and not already in completedLectures, add it
    if (completed && !progress.completedLectures.some(l => l.lectureId === lectureId)) {
      progress.completedLectures.push({ lectureId, completedAt: new Date() });
    }

    // Calculate percentage
    const course = await Course.findById(courseId);
    if (course) {
      const totalLectures = course.sections.reduce((acc, sec) => acc + sec.lectures.length, 0);
      if (totalLectures > 0) {
        const completedCount = progress.completedLectures.length;
        progress.overallPercentage = Math.round((completedCount / totalLectures) * 100);
      }
    }

    progress.lastAccessed = new Date();
    await progress.save();

    res.json({
      message: 'Playback continuity saved successfully',
      lastPositionSeconds,
      overallPercentage: progress.overallPercentage
    });
  } catch (error) {
    console.error('Error saving playback continuity:', error);
    res.status(500).json({ message: 'Failed to save playback progress' });
  }
});

module.exports = router;
