const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../middleware/auth');
const Course = require('../models/Course');
const Progress = require('../models/Progress');
const { AssessmentSubmission } = require('../models/Assessment');
const mongoose = require('mongoose');

// ─── Analytics Dashboard ─────────────────────────────────────────────────────

router.get('/instructor-dashboard/:instructorId', authMiddleware, async (req, res) => {
  const { instructorId } = req.params;

  try {
    const instructorObjId = new mongoose.Types.ObjectId(instructorId);

    // 1. Instructor Revenue Share: Aggregation to calculate total sales and instructor share (e.g., 70% share)
    const revenueData = await Course.aggregate([
      { $match: { instructor: instructorObjId, isPaid: true } },
      { 
        $group: {
          _id: null,
          totalCourses: { $sum: 1 },
          totalEnrollments: { $sum: '$enrolledStudentsCount' },
          grossRevenue: { $sum: { $multiply: ['$price', '$enrolledStudentsCount'] } }
        }
      },
      {
        $project: {
          _id: 0,
          totalCourses: 1,
          totalEnrollments: 1,
          grossRevenue: 1,
          instructorShare: { $multiply: ['$grossRevenue', 0.7] } // 70% instructor payout share
        }
      }
    ]);

    // 2. Student Drop-off Rates: Aggregation to count completion counts per lecture to map progress drop-off
    const courses = await Course.find({ instructor: instructorId }).select('_id title');
    const courseIds = courses.map(c => c._id);

    const dropoffData = await Progress.aggregate([
      { $match: { course: { $in: courseIds } } },
      { $unwind: '$completedLectures' },
      {
        $group: {
          _id: { course: '$course', lectureId: '$completedLectures.lectureId' },
          studentCount: { $sum: 1 }
        }
      },
      {
        $project: {
          _id: 0,
          courseId: '$_id.course',
          lectureId: '$_id.lectureId',
          studentCount: 1
        }
      }
    ]);

    // 3. Average Test Scores: Aggregation to calculate average test scores across assessments
    const testScores = await AssessmentSubmission.aggregate([
      {
        $group: {
          _id: '$assessment',
          averageScore: { $avg: '$score' },
          highestScore: { $max: '$score' },
          totalAttempts: { $sum: 1 }
        }
      },
      {
        $lookup: {
          from: 'assessments',
          localField: '_id',
          foreignField: '_id',
          as: 'assessmentDetails'
        }
      },
      { $unwind: '$assessmentDetails' },
      {
        $project: {
          _id: 1,
          averageScore: 1,
          highestScore: 1,
          totalAttempts: 1,
          title: '$assessmentDetails.title',
          courseId: '$assessmentDetails.course'
        }
      }
    ]);

    res.json({
      revenue: revenueData[0] || { totalCourses: 0, totalEnrollments: 0, grossRevenue: 0, instructorShare: 0 },
      dropoff: dropoffData,
      testScores,
      courses
    });

  } catch (error) {
    console.error('Error generating instructor analytics:', error);
    res.status(500).json({ message: 'Failed to retrieve analytics data' });
  }
});

module.exports = router;
