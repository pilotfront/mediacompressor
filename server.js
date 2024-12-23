const express = require('express');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const PDFDocument = require('pdfkit');
const sizeOf = require('image-size');

const app = express();

// Use memory storage for Multer (avoid using file system on Vercel)
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// Serve static files from the 'public' directory
app.use(express.static('public'));

// POST endpoint for converting image to PDF
app.post('/convert', upload.single('image'), (req, res) => {
  if (!req.file || path.extname(req.file.originalname) !== '.png') {
    return res.status(400).send('Please upload a PNG image');
  }

  const dimensions = sizeOf(req.file.buffer);
  const doc = new PDFDocument({ autoFirstPage: false });

  res.setHeader('Content-Disposition', 'attachment; filename="converted.pdf"');
  res.setHeader('Content-Type', 'application/pdf');

  doc.pipe(res);
  doc.addPage({ size: [dimensions.width, dimensions.height] });
  doc.image(req.file.buffer, 0, 0, { width: dimensions.width, height: dimensions.height });
  doc.end();
});

// Export the app for Vercel
module.exports = app;
