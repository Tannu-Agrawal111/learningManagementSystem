const mongoose = require('mongoose');

const certificateSchema = new mongoose.Schema({
  student: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  course: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true, index: true },
  issuedAt: { type: Date, default: Date.now },
  
  // Unique cryptographic verification hash
  verificationHash: { type: String, required: true, unique: true, index: true },
  
  // QR verification code content
  qrCodeUrl: String,
  
  // PDF download details
  pdfUrl: String
});

module.exports = mongoose.model('Certificate', certificateSchema);
