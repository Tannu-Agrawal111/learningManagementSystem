const mongoose = require('mongoose');

// Question Schema for Question Bank
const questionSchema = new mongoose.Schema({
  course: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true, index: true },
  text: { type: String, required: true },
  type: { 
    type: String, 
    enum: ['multiple-choice', 'code-syntax', 'file-upload'], 
    default: 'multiple-choice' 
  },
  options: [String], // only for multiple-choice
  correctAnswer: String, // syntax code template or MCQ answer
  difficulty: { 
    type: String, 
    enum: ['easy', 'medium', 'hard'], 
    default: 'medium',
    index: true
  },
  weightage: { type: Number, default: 1 },
  createdAt: { type: Date, default: Date.now }
});

const Question = mongoose.model('Question', questionSchema);

// Assessment Configuration Schema
const assessmentSchema = new mongoose.Schema({
  course: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true, index: true },
  title: { type: String, required: true },
  lectureId: { type: String, required: true }, // The lecture this assessment belongs to
  durationMinutes: { type: Number, required: true }, // strict countdown
  isDynamic: { type: Boolean, default: false }, // Dynamic pulling from question bank
  
  // Weights for dynamic generator (e.g. 50% easy, 30% medium, 20% hard)
  dynamicWeightage: {
    easyCount: { type: Number, default: 5 },
    mediumCount: { type: Number, default: 3 },
    hardCount: { type: Number, default: 2 }
  },
  
  staticQuestions: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Question' }],
  createdAt: { type: Date, default: Date.now }
});

const Assessment = mongoose.model('Assessment', assessmentSchema);

// Assessment Submission Schema for strict time tracking & anti-cheat logs
const submissionSchema = new mongoose.Schema({
  student: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  assessment: { type: mongoose.Schema.Types.ObjectId, ref: 'Assessment', required: true, index: true },
  startedAt: { type: Date, default: Date.now },
  submittedAt: Date,
  
  // Questions assigned to this user (especially if dynamically generated)
  questions: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Question' }],
  
  answers: [{
    questionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Question' },
    answer: String, // student answer text or file path/url
    score: { type: Number, default: 0 }
  }],
  
  score: { type: Number, default: 0 },
  status: { 
    type: String, 
    enum: ['in-progress', 'submitted', 'auto-submitted', 'terminated'], 
    default: 'in-progress' 
  },
  
  // Anti-cheat infractions tracker
  infractions: {
    tabSwitches: { type: Number, default: 0 },
    windowBlurs: { type: Number, default: 0 }
  }
});

const AssessmentSubmission = mongoose.model('AssessmentSubmission', submissionSchema);

module.exports = { Question, Assessment, AssessmentSubmission };
