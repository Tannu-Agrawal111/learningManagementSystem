const logger = require('./logger');

const notifications = {
  sendPaymentSuccess: async (email, details) => {
    logger.info(`Notification Sent: Payment Success to ${email} for ${details.courseName}`);
    // In production, integrate with SendGrid/Nodemailer
  },
  sendEnrollmentConfirmation: async (email, details) => {
    logger.info(`Notification Sent: Enrollment Confirmation to ${email} for ${details.courseName}`);
  },
  sendInstructorEarningAlert: async (email, details) => {
    logger.info(`Notification Sent: Earning Alert to Instructor ${email} - Amount: ${details.amount}`);
  },
  sendPayoutStatusUpdate: async (email, details) => {
    logger.info(`Notification Sent: Payout ${details.status} to ${email}`);
  }
};

module.exports = notifications;
