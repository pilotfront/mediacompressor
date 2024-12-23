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

app.use(express.static('public'));

// POST endpoint to handle image upload and conversion to PDF
app.post('/convert', upload.single('image'), (req, res) => {
  if (!req.file || path.extname(req.file.originalname) !== '.png') {
    return res.status(400).send('Please upload a PNG image');
  }

  // Get image dimensions from buffer data
  const dimensions = sizeOf(req.file.buffer);

  // Create a new PDF document
  const doc = new PDFDocument({ autoFirstPage: false });

  // Set headers for downloading the PDF
  res.setHeader('Content-Disposition', 'attachment; filename="converted.pdf"');
  res.setHeader('Content-Type', 'application/pdf');

  // Pipe the PDF to the response
  doc.pipe(res);

  // Add a page to the PDF with the same size as the image
  doc.addPage({ size: [dimensions.width, dimensions.height] });

  // Add the image to the PDF without resizing (keeping full resolution)
  doc.image(req.file.buffer, 0, 0, { width: dimensions.width, height: dimensions.height });

  // Finalize the PDF document
  doc.end();
});

module.exports = app;
