const mongoose = require('mongoose');

const discountLogSchema = new mongoose.Schema({
  discountPercent: { type: Number, required: true },
  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true },
  changedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
});

const lectureSchema = new mongoose.Schema({
  title: { type: String, required: true },
  type: { 
    type: String, 
    enum: ['video', 'document', 'quiz', 'live'], 
    default: 'document' 
  },
  content: String,
  url: String, // AWS S3 multipart upload / HLS url
  resources: [String],
  orderIndex: { type: Number, default: 0 },
  isPreview: { type: Boolean, default: false },
  
  // Drip feed release delay (in days after student enrollment)
  releaseDelayDays: { type: Number, default: 0 },
  
  // Contextual Q&A timeline-based comments
  qna: [{
    student: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    second: { type: Number, default: 0 }, // For video timeline mapping
    comment: { type: String, required: true },
    answer: String,
    instructorAnswered: { type: Boolean, default: false },
    createdAt: { type: Date, default: Date.now }
  }]
});

const sectionSchema = new mongoose.Schema({
  title: { type: String, required: true },
  orderIndex: { type: Number, default: 0 },
  lectures: [lectureSchema]
});

const courseSchema = new mongoose.Schema({
  _id: { type: String },
  title: { type: String, required: true, index: true },
  description: String,
  instructor: { type: String, ref: 'User', required: true, index: true },
  
  sections: [sectionSchema],
  
  isPaid: { type: Boolean, default: false },
  price: { type: Number, default: 0 },
  discountLogs: [discountLogSchema],
  enrollmentLimit: { type: Number, default: 0 }, // 0 means unlimited
  enrolledStudentsCount: { type: Number, default: 0 },
  
  averageRating: { type: Number, default: 0 },
  totalRatings: { type: Number, default: 0 },
  benefits: [String],
  
  // Stripe/Paypal pricing identifier
  gatewayProductId: String,
  gatewayPriceId: String,
  
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Course', courseSchema);
