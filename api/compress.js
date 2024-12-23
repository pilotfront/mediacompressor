const express = require('express');
const multer = require('multer');
const sharp = require('sharp');
const fs = require('fs');
const path = require('path');
const fluent_ffmpeg = require('fluent-ffmpeg');
const app = express();

// Middleware for parsing form data
const upload = multer({ dest: 'uploads/' });
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// POST route for compressing image
app.post('/api/compress/image', upload.single('image'), (req, res) => {
  const filePath = req.file.path;

  sharp(filePath)
    .resize(800) // Resize to 800px width
    .toBuffer()
    .then((data) => {
      const outputPath = path.join('uploads', 'compressed_' + req.file.originalname);
      fs.writeFileSync(outputPath, data);
      res.json({ message: 'Image compressed successfully!', file: outputPath });
    })
    .catch((err) => {
      res.status(500).json({ error: 'Image compression failed', details: err });
    });
});

// POST route for compressing video
app.post('/api/compress/video', upload.single('video'), (req, res) => {
  const inputPath = req.file.path;
  const outputPath = path.join('uploads', 'compressed_' + req.file.originalname);

  fluent_ffmpeg(inputPath)
    .output(outputPath)
    .videoCodec('libx264')
    .audioCodec('aac')
    .on('end', () => {
      res.json({ message: 'Video compressed successfully!', file: outputPath });
    })
    .on('error', (err) => {
      res.status(500).json({ error: 'Video compression failed', details: err });
    })
    .run();
});

// Serve static files from the 'uploads' folder
app.use('/uploads', express.static('uploads'));

// Start server
app.listen(3000, () => {
  console.log('Server running on http://localhost:3000');
});
