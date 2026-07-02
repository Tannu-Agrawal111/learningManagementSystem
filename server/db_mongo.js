const mongoose = require('mongoose');

const connectMongoDB = async () => {
  const mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/lms';
  try {
    await mongoose.connect(mongoUri);
    console.log('Successfully connected to MongoDB.');
  } catch (error) {
    console.error('Mongoose/MongoDB connection failed:', error.message);
    console.warn('Backend will continue to run, but Mongoose-dependent modules might fail.');
  }
};

module.exports = connectMongoDB;
