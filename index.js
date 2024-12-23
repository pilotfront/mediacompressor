const express = require('express');
const sharp = require('sharp');
const ffmpeg = require('fluent-ffmpeg');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Initialize Express
const app = express();
const port = process.env.PORT || 3000;

// Multer setup for handling file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, './uploads');
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  },
});
const upload = multer({ storage: storage });

// Compress Image
const compressImage = (filePath, targetSize) => {
  return new Promise((resolve, reject) => {
    sharp(filePath)
      .resize({ width: targetSize })
      .toFile(`./compressed/${path.basename(filePath)}`, (err, info) => {
        if (err) reject(err);
        resolve(info);
      });
  });
};

// Compress Video
const compressVideo = (filePath, targetSize) => {
  return new Promise((resolve, reject) => {
    ffmpeg(filePath)
      .outputOptions([`-b:v ${targetSize}k`])
      .on('end', function () {
        resolve(`./compressed/${path.basename(filePath)}`);
      })
      .on('error', function (err) {
        reject(err);
      })
      .save(`./compressed/${path.basename(filePath)}`);
  });
};

// Compress Endpoint
app.post('/compress', upload.single('file'), async (req, res) => {
  try {
    const file = req.file;
    const targetSize = req.body.size;

    if (!file) return res.status(400).send('No file uploaded.');
    if (!targetSize) return res.status(400).send('No target size provided.');

    const extname = path.extname(file.originalname).toLowerCase();

    // Ensure the "compressed" directory exists
    if (!fs.existsSync('./compressed')) {
      fs.mkdirSync('./compressed');
    }

    let compressedFilePath;
    if (extname === '.jpg' || extname === '.jpeg' || extname === '.png') {
      compressedFilePath = await compressImage(file.path, targetSize);
    } else if (extname === '.mp4' || extname === '.mov' || extname === '.avi') {
      compressedFilePath = await compressVideo(file.path, targetSize);
    } else {
      return res.status(400).send('Unsupported file type.');
    }

    res.sendFile(compressedFilePath);
  } catch (err) {
    console.error(err);
    res.status(500).send('Error compressing file.');
  }
});


