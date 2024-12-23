const PDFDocument = require('pdfkit');
const multer = require('multer');
const sizeOf = require('image-size');
const fs = require('fs');
const path = require('path');

const storage = multer.memoryStorage(); // Use memory storage for Vercel
const upload = multer({ storage: storage });

// Serverless function to handle the file upload and conversion
module.exports = (req, res) => {
  // Handle multipart form data (file upload)
  upload.single('image')(req, res, (err) => {
    if (err) {
      return res.status(400).json({ error: 'File upload failed' });
    }

    if (!req.file || path.extname(req.file.originalname) !== '.png') {
      return res.status(400).send('Please upload a PNG image');
    }

    // Get image dimensions
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
};
