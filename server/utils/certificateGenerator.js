const PDFDocument = require('pdfkit');
const QRCode = require('qrcode');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const CERTIFICATE_DIR = path.join(__dirname, '../uploads/certificates');
if (!fs.existsSync(CERTIFICATE_DIR)) {
  fs.mkdirSync(CERTIFICATE_DIR, { recursive: true });
}

/**
 * Generate a PDF Certificate
 * @param {string} studentName 
 * @param {string} courseTitle 
 * @param {string} studentId 
 * @param {string} courseId 
 * @returns {Promise<{pdfUrl: string, verificationHash: string}>}
 */
const generatePDFCertificate = async (studentName, courseTitle, studentId, courseId) => {
  return new Promise(async (resolve, reject) => {
    try {
      // Create a unique cryptographic verification hash
      const dataToHash = `${studentId}-${courseId}-${Date.now()}`;
      const verificationHash = crypto.createHash('sha256').update(dataToHash).digest('hex');
      
      const qrVerificationUrl = `https://learningmanagementsystem-backend-lms.onrender.com/api/student/certificates/verify/${verificationHash}`;
      
      // Generate QR Code data URL
      const qrCodeDataUrl = await QRCode.toDataURL(qrVerificationUrl);

      // Create PDF
      const doc = new PDFDocument({
        layout: 'landscape',
        size: 'A4',
        margin: 40
      });

      const filename = `cert-${verificationHash}.pdf`;
      const filePath = path.join(CERTIFICATE_DIR, filename);
      const writeStream = fs.createWriteStream(filePath);

      doc.pipe(writeStream);

      // --- Background & Border Styling ---
      // Primary background color tint
      doc.rect(0, 0, doc.page.width, doc.page.height).fill('#F8FAFC');

      // Decorative outer border
      doc.rect(20, 20, doc.page.width - 40, doc.page.height - 40)
         .lineWidth(4)
         .stroke('#4F46E5'); // Deep Indigo

      // Decorative inner border
      doc.rect(26, 26, doc.page.width - 52, doc.page.height - 52)
         .lineWidth(1)
         .stroke('#10B981'); // Emerald Green

      // Top corner decorations
      doc.rect(20, 20, 40, 40).fill('#4F46E5');
      doc.rect(doc.page.width - 60, 20, 40, 40).fill('#4F46E5');
      doc.rect(20, doc.page.height - 60, 40, 40).fill('#4F46E5');
      doc.rect(doc.page.width - 60, doc.page.height - 60, 40, 40).fill('#4F46E5');

      // --- Certificate Text Content ---
      doc.moveDown(4);

      // Title
      doc.font('Helvetica-Bold')
         .fontSize(36)
         .fillColor('#0F172A')
         .text('CERTIFICATE OF COMPLETION', { align: 'center' });

      doc.moveDown(1);
      doc.font('Helvetica')
         .fontSize(16)
         .fillColor('#475569')
         .text('THIS IS PROUDLY PRESENTED TO', { align: 'center' });

      doc.moveDown(0.8);
      // Student Name
      doc.font('Helvetica-Bold')
         .fontSize(28)
         .fillColor('#4F46E5')
         .text(studentName.toUpperCase(), { align: 'center' });

      // Line separating name and course details
      doc.moveDown(0.5);
      doc.moveTo(doc.page.width / 4, doc.y)
         .lineTo((doc.page.width / 4) * 3, doc.y)
         .lineWidth(1.5)
         .stroke('#E2E8F0');

      doc.moveDown(1);
      doc.font('Helvetica')
         .fontSize(14)
         .fillColor('#475569')
         .text('for successfully completing the course titled', { align: 'center' });

      doc.moveDown(0.8);
      // Course Title
      doc.font('Helvetica-Bold')
         .fontSize(22)
         .fillColor('#0F172A')
         .text(`"${courseTitle}"`, { align: 'center' });

      doc.moveDown(1.5);
      
      // Date and Verification Layout
      const bottomY = doc.y;

      // Date of issue
      doc.font('Helvetica')
         .fontSize(11)
         .fillColor('#94A3B8')
         .text(`Date Issued: ${new Date().toLocaleDateString()}`, doc.page.width / 2 - 100, bottomY, {
           width: 200,
           align: 'center'
         });

      // Signature line (Instructor / Director)
      doc.moveTo(doc.page.width / 6, bottomY + 30)
         .lineTo(doc.page.width / 6 + 150, bottomY + 30)
         .lineWidth(1)
         .stroke('#94A3B8');

      doc.font('Helvetica-Bold')
         .fontSize(11)
         .fillColor('#475569')
         .text('Authorized Signatory', doc.page.width / 6, bottomY + 35, {
           width: 150,
           align: 'center'
         });

      // Embed QR code on the right side
      const qrImageBuffer = Buffer.from(qrCodeDataUrl.split(',')[1], 'base64');
      doc.image(qrImageBuffer, doc.page.width - 200, bottomY - 30, { width: 100, height: 100 });

      doc.font('Helvetica')
         .fontSize(9)
         .fillColor('#94A3B8')
         .text('Scan to Verify Authenticity', doc.page.width - 210, bottomY + 75, {
           width: 120,
           align: 'center'
         });

      // Footer unique ID info
      doc.font('Helvetica-Oblique')
         .fontSize(8)
         .fillColor('#94A3B8')
         .text(`Verification ID: ${verificationHash}`, 0, doc.page.height - 40, {
           align: 'center',
           width: doc.page.width
         });

      // Finish writing PDF
      doc.end();

      writeStream.on('finish', () => {
        resolve({
          pdfUrl: `/uploads/certificates/${filename}`,
          verificationHash
        });
      });

      writeStream.on('error', (err) => {
        reject(err);
      });

    } catch (error) {
      reject(error);
    }
  });
};

module.exports = {
  generatePDFCertificate
};
