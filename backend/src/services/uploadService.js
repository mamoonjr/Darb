const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

// Local-disk "storage handler". In production, swap this implementation for an
// S3 / Cloudinary upload and return the resulting public URL — the callers and
// the `deliveryProofUrl` column do not need to change.
const UPLOAD_DIR = path.join(__dirname, '..', '..', 'uploads');

function ensureDir() {
  if (!fs.existsSync(UPLOAD_DIR)) {
    fs.mkdirSync(UPLOAD_DIR, { recursive: true });
  }
}

// Accepts a data URL (`data:image/jpeg;base64,...`) or a bare base64 string.
function saveBase64Image(input, prefix = 'file') {
  ensureDir();

  const match = /^data:(image\/(png|jpe?g|webp));base64,(.+)$/i.exec(input || '');
  const ext = match ? match[2].replace('jpeg', 'jpg') : 'jpg';
  const base64 = match ? match[3] : input;

  const buffer = Buffer.from(base64, 'base64');
  if (!buffer.length) {
    throw Object.assign(new Error('Invalid image data'), { status: 400 });
  }

  const filename = `${prefix}-${Date.now()}-${crypto.randomBytes(4).toString('hex')}.${ext}`;
  fs.writeFileSync(path.join(UPLOAD_DIR, filename), buffer);

  // Public path served by express.static in index.js
  return { filename, relativePath: `/uploads/${filename}` };
}

module.exports = { UPLOAD_DIR, saveBase64Image };
