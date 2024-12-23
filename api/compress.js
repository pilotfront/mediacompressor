const express = require('express');
const multer = require('multer');
const sharp = require('sharp'); // For image compression
const ffmpeg = require('fluent-ffmpeg'); // For video compression
const fs = require('fs');
const path = require('path');

const upload = multer({ dest: '/tmp/uploads/' });
const app = express();

app.post('/api/compress', upload.single('file'), async (req, res) => {
  const file = req.file;

  if (!file) {
    return res.status(400).send('No file uploaded.');
  }

  const targetSizeKB = parseInt(req.body.size, 10) || 1024; // Default: 1MB
  const originalExtension = path.extname(file.originalname);
  const outputFilePath = `/tmp/uploads/compressed-${file.originalname}`;

  try {
    // Handle images (JPEG, PNG, etc.)
    if (['.jpg', '.jpeg', '.png', '.webp'].includes(originalExtension.toLowerCase())) {
      await sharp(file.path)
        .resize({ width: 800 }) // Example: Resize width to 800px
        .toFormat(originalExtension.replace('.', '')) // Preserve original format
        .toFile(outputFilePath);
    }

    // Handle videos (MP4, etc.)
    else if (['.mp4', '.mov', '.avi'].includes(originalExtension.toLowerCase())) {
      await new Promise((resolve, reject) => {
        ffmpeg(file.path)
          .outputOptions([
            '-vcodec libx264', // Use H.264 codec
            '-crf 28', // Adjust quality (lower = better quality)
          ])
          .on('end', resolve)
          .on('error', reject)
          .save(outputFilePath);
      });
    }

    // Unsupported file types
    else {
      return res.status(400).send('Unsupported file type.');
    }

    // Send the compressed file back to the client
    res.setHeader('Content-Disposition', `attachment; filename=${path.basename(outputFilePath)}`);
    res.setHeader('Content-Type', 'application/octet-stream');
    fs.createReadStream(outputFilePath).pipe(res);
  } catch (error) {
    console.error('Compression error:', error);
    res.status(500).send('Failed to compress the file.');
  } finally {
    // Clean up temporary files
    fs.unlink(file.path, () => {});
    if (fs.existsSync(outputFilePath)) fs.unlink(outputFilePath, () => {});
  }
});

module.exports = app;
