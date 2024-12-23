const express = require('express');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const PDFDocument = require('pdfkit');
const sizeOf = require('image-size');

const app = express();

// Serve static files from the 'public' directory
app.use(express.static('public'));

// Set up multer to handle file uploads
const upload = multer({ dest: 'uploads/' });

app.post('/convert', upload.single('image'), (req, res) => {
  if (!req.file || path.extname(req.file.originalname) !== '.png') {
    return res.status(400).send('Please upload a PNG image');
  }

  // Get image dimensions
  const dimensions = sizeOf(req.file.path);

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
  doc.image(req.file.path, 0, 0, { width: dimensions.width, height: dimensions.height });

  // Finalize the PDF document
  doc.end();

  // Delete the uploaded image file after the conversion
  fs.unlinkSync(req.file.path);
});

// Start the server
app.listen(3000, () => {
  console.log('Server is running on http://localhost:3000');
});

