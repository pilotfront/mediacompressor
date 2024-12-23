const sharp = require('sharp');
const fluent_ffmpeg = require('fluent-ffmpeg');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Set up file storage and file upload handling
const upload = multer({ dest: '/tmp/uploads/' });  // Use Vercel's /tmp folder

module.exports = async (req, res) => {
  if (req.method === 'POST') {
    const contentType = req.headers['content-type'];

    // Handle image compression
    if (contentType && contentType.includes('image')) {
      const buffer = req.body;  // Raw binary data from the uploaded image

      try {
        const compressedImage = await sharp(buffer)
          .resize(800)  // Resize image to 800px width (you can adjust this)
          .toBuffer();

        const outputPath = path.join('/tmp', 'compressed_image.jpg');
        fs.writeFileSync(outputPath, compressedImage);

        res.status(200).json({ message: 'Image compressed successfully!', file: outputPath });
      } catch (err) {
        res.status(500).json({ error: 'Error compressing image', details: err.message });
      }
    }
    // Handle video compression
    else if (contentType && contentType.includes('video')) {
      const buffer = req.body;  // Raw binary data from the uploaded video

      const inputPath = '/tmp/input_video.mp4';
      const outputPath = '/tmp/compressed_video.mp4';

      try {
        fs.writeFileSync(inputPath, buffer);

        fluent_ffmpeg(inputPath)
          .output(outputPath)
          .videoCodec('libx264')
          .audioCodec('aac')
          .on('end', () => {
            res.status(200).json({ message: 'Video compressed successfully!', file: outputPath });
          })
          .on('error', (err) => {
            res.status(500).json({ error: 'Error compressing video', details: err.message });
          })
          .run();
      } catch (err) {
        res.status(500).json({ error: 'Error processing video', details: err.message });
      }
    } else {
      res.status(400).json({ error: 'Unsupported file type' });
    }
  } else {
    res.status(405).json({ error: 'Method Not Allowed' });
  }
};
