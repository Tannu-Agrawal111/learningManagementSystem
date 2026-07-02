const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

// Simulating AWS S3 multipart upload backend endpoints
// If process.env.AWS_ACCESS_KEY_ID is defined, we could initialize AWS S3 client,
// otherwise we perform robust local resumable chunk uploads.

const UPLOADS_DIR = path.join(__dirname, '../uploads');
const CHUNKS_DIR = path.join(UPLOADS_DIR, 'chunks');

if (!fs.existsSync(UPLOADS_DIR)) fs.mkdirSync(UPLOADS_DIR, { recursive: true });
if (!fs.existsSync(CHUNKS_DIR)) fs.mkdirSync(CHUNKS_DIR, { recursive: true });

// Track active uploads
const activeUploads = new Map();

/**
 * Initialize a multipart upload session
 */
const initiateMultipart = (filename, fileType) => {
  const uploadId = crypto.randomBytes(16).toString('hex');
  const tempDir = path.join(CHUNKS_DIR, uploadId);
  fs.mkdirSync(tempDir, { recursive: true });

  const session = {
    uploadId,
    filename,
    fileType,
    tempDir,
    parts: [],
    createdAt: Date.now()
  };
  
  activeUploads.set(uploadId, session);
  return { uploadId, key: filename };
};

/**
 * Upload a single part/chunk
 */
const uploadPart = async (uploadId, partNumber, fileBuffer) => {
  const session = activeUploads.get(uploadId);
  if (!session) {
    throw new Error('Upload session not found or expired.');
  }

  const partFilename = `part-${partNumber}`;
  const partPath = path.join(session.tempDir, partFilename);
  
  fs.writeFileSync(partPath, fileBuffer);
  
  const etag = crypto.createHash('md5').update(fileBuffer).digest('hex');
  
  session.parts.push({
    PartNumber: parseInt(partNumber),
    ETag: etag,
    path: partPath
  });

  return { ETag: etag, PartNumber: partNumber };
};

/**
 * Assemble all parts to complete the upload
 */
const completeMultipart = async (uploadId) => {
  const session = activeUploads.get(uploadId);
  if (!session) {
    throw new Error('Upload session not found or expired.');
  }

  // Sort parts by PartNumber
  session.parts.sort((a, b) => a.PartNumber - b.PartNumber);

  const destinationFilename = `${Date.now()}-${session.filename}`;
  const destinationPath = path.join(UPLOADS_DIR, destinationFilename);
  const writeStream = fs.createWriteStream(destinationPath);

  for (const part of session.parts) {
    const chunkData = fs.readFileSync(part.path);
    writeStream.write(chunkData);
    // Delete chunk file after writing
    try {
      fs.unlinkSync(part.path);
    } catch (e) {
      console.warn('Error deleting temp chunk:', e.message);
    }
  }
  
  writeStream.end();
  
  // Clean up directory
  try {
    fs.rmdirSync(session.tempDir);
  } catch (e) {
    console.warn('Error deleting temp directory:', e.message);
  }

  activeUploads.delete(uploadId);

  // Return the public url path
  return {
    location: `/uploads/${destinationFilename}`,
    filename: destinationFilename
  };
};

module.exports = {
  initiateMultipart,
  uploadPart,
  completeMultipart
};
