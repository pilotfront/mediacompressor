const express = require('express');
const multer = require('multer');
const sharp = require('sharp'); // Image compression
const ffmpeg = require('fluent-ffmpeg'); // Video compression
const fs = require('fs');
const path = require('path');

const upload = multer({ dest: '/tmp/uploads/' });
const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.post('/api/compress', upload.single('file'), async (req, res) => {
  const file = req.file;
  const targetSizeKB = parseInt(req.body.size, 10) || 1024; // Default size: 1MB
  const originalExtension = path.extname(file.originalname).toLowerCase();
  const outputFilePath = `/tmp/compressed-${file.originalname}`;

  if (!file) {
    return res.status(400).send('No file uploaded.');
  }

  try {
    // Image compression
    if (['.jpg', '.jpeg', '.png', '.webp'].includes(originalExtension)) {
      await sharp(file.path)
        .resize({ width: 800 }) // Example: Resize width
        .jpeg({ quality: 80 }) // Adjust quality
        .toFile(outputFilePath);
    }
    // Video compression
    else if (['.mp4', '.mov', '.avi'].includes(originalExtension)) {
      await new Promise((resolve, reject) => {
        ffmpeg(file.path)
          .outputOptions('-vcodec libx264', '-crf 28') // Lower quality for compression
          .on('end', resolve)
          .on('error', reject)
          .save(outputFilePath);
      });
    } else {
      return res.status(400).send('Unsupported file type.');
    }

    // Send the compressed file
    res.setHeader('Content-Disposition', `attachment; filename=${path.basename(outputFilePath)}`);
    res.setHeader('Content-Type', 'application/octet-stream');
    fs.createReadStream(outputFilePath).pipe(res);
  } catch (error) {
    console.error('Error during compression:', error);
    res.status(500).send('Failed to compress the file.');
  } finally {
    // Clean up temporary files
    fs.unlink(file.path, () => {});
    fs.unlink(outputFilePath, () => {});
  }
});

module.exports = app;
