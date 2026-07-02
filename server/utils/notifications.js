const nodemailer = require('nodemailer');

let ioInstance = null;

// Initialize Socket.io reference
const setIoInstance = (io) => {
  ioInstance = io;
};

// Create mail transporter
const createTransporter = () => {
  // If SMTP details are in environment, use them, otherwise use Ethereal/Mock SMTP
  if (process.env.SMTP_HOST && process.env.SMTP_USER) {
    return nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      }
    });
  } else {
    // Ethereal / console fallback transporter
    return {
      sendMail: async (mailOptions) => {
        console.log('--- [MOCK EMAIL SENT] ---');
        console.log(`To: ${mailOptions.to}`);
        console.log(`Subject: ${mailOptions.subject}`);
        console.log(`Body: ${mailOptions.text || mailOptions.html}`);
        console.log('-------------------------');
        return { messageId: `mock-id-${Date.now()}` };
      }
    };
  }
};

const transporter = createTransporter();

/**
 * Send real-time and email notification
 * @param {string} userId - User ID to send to (for socket.io)
 * @param {string} email - Email address
 * @param {string} title - Notification title
 * @param {string} message - Notification body/message
 * @param {object} payload - Optional extra payload data
 */
const sendNotification = async (userId, email, title, message, payload = {}) => {
  try {
    // 1. Send in-app notification via Socket.io if the user is online
    if (ioInstance) {
      const socketData = payload.dbNotification
        ? (typeof payload.dbNotification.toObject === 'function' ? payload.dbNotification.toObject() : payload.dbNotification)
        : {
            title,
            message,
            payload,
            createdAt: new Date(),
            isRead: false
          };
      ioInstance.to(userId.toString()).emit('notification', socketData);
      console.log(`Socket.io notification sent to user ${userId}: ${title}`);
    }

    // 2. Send email notification via Nodemailer
    await transporter.sendMail({
      from: '"LMS Learning Portal" <noreply@lms-platform.com>',
      to: email,
      subject: title,
      text: message,
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px; color: #333; max-width: 600px; margin: 0 auto; border: 1px solid #ddd; border-radius: 8px;">
          <h2 style="color: #4F46E5;">${title}</h2>
          <p style="font-size: 16px; line-height: 1.5;">${message}</p>
          ${payload.actionUrl ? `
            <div style="margin-top: 20px;">
              <a href="${payload.actionUrl}" style="background-color: #4F46E5; color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px; font-weight: bold;">View Details</a>
            </div>
          ` : ''}
          <hr style="border: none; border-top: 1px solid #eee; margin-top: 30px;" />
          <p style="font-size: 12px; color: #999;">This is an automated message from your LMS dashboard. Please do not reply directly to this email.</p>
        </div>
      `
    });
  } catch (error) {
    console.error('Error sending notification:', error.message);
  }
};

module.exports = {
  setIoInstance,
  sendNotification
};
