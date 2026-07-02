const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../middleware/auth');
const { Question, Assessment, AssessmentSubmission } = require('../models/Assessment');
const Course = require('../models/Course');

// ─── Question Bank (Instructor Only) ─────────────────────────────────────────

// Create new question in bank
router.post('/questions', authMiddleware, async (req, res) => {
  const { courseId, text, type, options, correctAnswer, difficulty, weightage } = req.body;
  if (!courseId || !text || !correctAnswer) {
    return res.status(400).json({ message: 'Missing courseId, text or correctAnswer' });
  }

  try {
    const question = new Question({
      course: courseId,
      text,
      type,
      options,
      correctAnswer,
      difficulty,
      weightage
    });
    await question.save();
    res.status(201).json(question);
  } catch (error) {
    res.status(500).json({ message: 'Failed to create question' });
  }
});

// ─── Assessment Creation ─────────────────────────────────────────────────────

// Create an assessment configuration
router.post('/create', authMiddleware, async (req, res) => {
  const { courseId, title, lectureId, durationMinutes, isDynamic, dynamicWeightage, staticQuestions } = req.body;
  if (!courseId || !title || !lectureId || !durationMinutes) {
    return res.status(400).json({ message: 'Missing required configuration fields' });
  }

  try {
    const assessment = new Assessment({
      course: courseId,
      title,
      lectureId,
      durationMinutes,
      isDynamic: !!isDynamic,
      dynamicWeightage: dynamicWeightage || { easyCount: 5, mediumCount: 3, hardCount: 2 },
      staticQuestions: staticQuestions || []
    });
    await assessment.save();
    res.status(201).json(assessment);
  } catch (error) {
    res.status(500).json({ message: 'Failed to configure assessment' });
  }
});

// ─── Assessment Execution ────────────────────────────────────────────────────

// Start exam (handles dynamic generation and countdown timing)
router.post('/:assessmentId/start', authMiddleware, async (req, res) => {
  const { assessmentId } = req.params;
  const studentId = req.user.id;

  try {
    const assessment = await Assessment.findById(assessmentId);
    if (!assessment) return res.status(404).json({ message: 'Assessment not found' });

    // Check if there is an active/completed submission
    let submission = await AssessmentSubmission.findOne({
      student: studentId,
      assessment: assessmentId
    });

    if (submission) {
      if (submission.status !== 'in-progress') {
        return res.status(400).json({ message: 'You have already submitted this exam.', submission });
      }
      
      // If it's already in progress, check if time has run out
      const timeSpentMs = Date.now() - new Date(submission.startedAt).getTime();
      const allowedTimeMs = assessment.durationMinutes * 60 * 1000;
      if (timeSpentMs > allowedTimeMs) {
        // Lock and score automatically
        submission.status = 'auto-submitted';
        submission.submittedAt = new Date();
        await submission.save();
        return res.status(400).json({ message: 'Exam time expired. Submitted automatically.', submission });
      }

      // Populate questions and return active session
      const populatedSubmission = await AssessmentSubmission.findById(submission._id).populate('questions');
      return res.json(populatedSubmission);
    }

    // Generate questions for new submission
    let assignedQuestions = [];
    if (assessment.isDynamic) {
      // Dynamic quiz generation: pull random questions based on difficulty weightage
      const { easyCount, mediumCount, hardCount } = assessment.dynamicWeightage;

      const pullRandom = async (diff, limit) => {
        if (limit <= 0) return [];
        return Question.aggregate([
          { $match: { course: assessment.course, difficulty: diff } },
          { $sample: { size: limit } }
        ]);
      };

      const easyQ = await pullRandom('easy', easyCount);
      const mediumQ = await pullRandom('medium', mediumCount);
      const hardQ = await pullRandom('hard', hardCount);

      assignedQuestions = [...easyQ, ...mediumQ, ...hardQ];
    } else {
      // Static questions loaded
      assignedQuestions = await Question.find({ _id: { $in: assessment.staticQuestions } });
    }

    if (assignedQuestions.length === 0) {
      return res.status(400).json({ message: 'No questions available in the question bank for this course.' });
    }

    submission = new AssessmentSubmission({
      student: studentId,
      assessment: assessmentId,
      startedAt: new Date(),
      questions: assignedQuestions.map(q => q._id),
      answers: [],
      score: 0,
      status: 'in-progress'
    });

    await submission.save();
    
    // Return the submission populated with questions (excluding answers for safety)
    const result = await AssessmentSubmission.findById(submission._id).populate({
      path: 'questions',
      select: '-correctAnswer' // Hide correct answers from client
    });

    res.json(result);
  } catch (error) {
    console.error('Error starting assessment:', error);
    res.status(500).json({ message: 'Failed to start assessment' });
  }
});

// Submit/Log Proctoring Infractions
router.post('/submission/:submissionId/infraction', authMiddleware, async (req, res) => {
  const { submissionId } = req.params;
  const { type } = req.body; // 'tab-switch' or 'window-blur'

  try {
    const submission = await AssessmentSubmission.findById(submissionId);
    if (!submission) return res.status(404).json({ message: 'Submission not found' });

    if (submission.status !== 'in-progress') {
      return res.status(400).json({ message: 'Exam is not in progress.' });
    }

    if (type === 'tab-switch') {
      submission.infractions.tabSwitches += 1;
    } else if (type === 'window-blur') {
      submission.infractions.windowBlurs += 1;
    }

    const totalInfractions = submission.infractions.tabSwitches + submission.infractions.windowBlurs;
    
    // AI Proctoring: Terminate exam automatically after 3 infractions
    if (totalInfractions >= 3) {
      submission.status = 'terminated';
      submission.submittedAt = new Date();
      await submission.save();
      return res.json({ 
        message: 'Exam terminated automatically due to multiple proctoring infractions.', 
        terminated: true,
        submission 
      });
    }

    await submission.save();
    res.json({ 
      message: 'Infraction logged successfully.', 
      warningsRemaining: 3 - totalInfractions,
      submission 
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to log infraction' });
  }
});

// Submit completed assessment and grade server-side
router.post('/submission/:submissionId/submit', authMiddleware, async (req, res) => {
  const { submissionId } = req.params;
  const { answers } = req.body; // Array of { questionId, answer }

  try {
    const submission = await AssessmentSubmission.findById(submissionId).populate('questions');
    if (!submission) return res.status(404).json({ message: 'Submission not found' });

    if (submission.status !== 'in-progress') {
      return res.status(400).json({ message: 'This exam submission has already been graded or closed.' });
    }

    // Verify time limit on submission
    const assessment = await Assessment.findById(submission.assessment);
    const timeLimitMs = (assessment.durationMinutes + 1) * 60 * 1000; // 1 min grace period
    const timeSpentMs = Date.now() - new Date(submission.startedAt).getTime();

    if (timeSpentMs > timeLimitMs) {
      submission.status = 'auto-submitted';
    } else {
      submission.status = 'submitted';
    }

    // Grade submissions
    let totalScore = 0;
    const gradedAnswers = submission.questions.map(q => {
      const studentAnswerObj = answers.find(ans => ans.questionId === q._id.toString());
      const studentAnswer = studentAnswerObj ? studentAnswerObj.answer : '';
      
      let isCorrect = false;
      if (q.type === 'multiple-choice') {
        isCorrect = q.correctAnswer.trim().toLowerCase() === studentAnswer.trim().toLowerCase();
      } else if (q.type === 'code-syntax') {
        // Simple regex/substring check for correct syntax elements
        isCorrect = studentAnswer.includes(q.correctAnswer.trim());
      } else {
        // File upload - evaluated by instructor, default 0 score for now
        isCorrect = false;
      }

      const pointsScored = isCorrect ? q.weightage : 0;
      totalScore += pointsScored;

      return {
        questionId: q._id,
        answer: studentAnswer,
        score: pointsScored
      };
    });

    submission.answers = gradedAnswers;
    submission.score = totalScore;
    submission.submittedAt = new Date();

    await submission.save();
    res.json({ message: 'Exam graded successfully', score: totalScore, submission });
  } catch (error) {
    console.error('Submit error:', error);
    res.status(500).json({ message: 'Failed to grade exam submission' });
  }
});

// Get assessment by lectureId
router.get('/lecture/:lectureId', authMiddleware, async (req, res) => {
  const { lectureId } = req.params;
  try {
    const assessment = await Assessment.findOne({ lectureId });
    if (!assessment) return res.status(404).json({ message: 'No assessment found for this lecture' });
    res.json(assessment);
  } catch (error) {
    res.status(500).json({ message: 'Failed to retrieve assessment' });
  }
});

module.exports = router;
