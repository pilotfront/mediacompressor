const express = require('express');
const multer = require('multer');
const sharp = require('sharp');
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
    console.error('No file uploaded');
    return res.status(400).send('No file uploaded.');
  }

  try {
    console.log(`File uploaded: ${file.originalname}, path: ${file.path}`);

    // Image Compression Logic
    if (['.jpg', '.jpeg', '.png', '.webp'].includes(originalExtension)) {
      await sharp(file.path)
        .resize({ width: 800 }) // Example: Resize width
        .jpeg({ quality: 80 }) // Adjust quality
        .toFile(outputFilePath);

      console.log(`Image compressed and saved to ${outputFilePath}`);
    } else {
      return res.status(400).send('Unsupported file type.');
    }

    if (!fs.existsSync(outputFilePath)) {
      throw new Error(`Output file not created: ${outputFilePath}`);
    }

    // Send the compressed file
    res.setHeader('Content-Disposition', `attachment; filename=${path.basename(outputFilePath)}`);
    res.setHeader('Content-Type', 'application/octet-stream');
    fs.createReadStream(outputFilePath).pipe(res);
  } catch (error) {
    console.error('Error during compression:', error.message);
    res.status(500).send(`Failed to compress the file. Error: ${error.message}`);
  } finally {
    // Clean up temporary files
    fs.unlink(file.path, (err) => {
      if (err) console.error(`Failed to delete input file: ${file.path}`, err.message);
    });
    fs.unlink(outputFilePath, (err) => {
      if (err) console.error(`Failed to delete output file: ${outputFilePath}`, err.message);
    });
  }
});

module.exports = app;
