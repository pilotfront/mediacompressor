const express = require('express');
const multer = require('multer');
const sharp = require('sharp'); // For image compression
const fs = require('fs');
const path = require('path');

const upload = multer({ dest: '/tmp/uploads/' });
const app = express();

app.post('/api/compress', upload.single('file'), async (req, res) => {
  const file = req.file;
  const targetSizeKB = parseInt(req.body.size, 10);

  if (!file || !targetSizeKB) {
    return res.status(400).send('File and target size are required.');
  }

  try {
    // Define output file path
    const outputFilePath = `/tmp/uploads/compressed-${file.originalname}`;

    // Use sharp to compress the image
    await sharp(file.path)
      .resize({ width: 800 }) // Resize width to 800px as an example
      .jpeg({ quality: 80 }) // Adjust quality to 80
      .toFile(outputFilePath);

    // Send the compressed file
    res.setHeader('Content-Disposition', `attachment; filename=${path.basename(outputFilePath)}`);
    res.setHeader('Content-Type', 'application/octet-stream');

    // Stream the compressed file to the response
    fs.createReadStream(outputFilePath).pipe(res);
  } catch (error) {
    console.error('Error compressing file:', error);
    res.status(500).send('Failed to compress the file.');
  } finally {
    // Clean up temporary files
    fs.unlink(file.path, () => {});
  }
});

module.exports = app;
