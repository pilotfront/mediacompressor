const express = require('express');
const multer = require('multer');
const sharp = require('sharp'); // For image compression
const ffmpeg = require('fluent-ffmpeg'); // For video compression
const fs = require('fs');
const path = require('path');

const app = express();
const upload = multer({ dest: 'uploads/' });

app.post('/api/compress', upload.single('file'), async (req, res) => {
    const file = req.file;
    const targetSize = parseInt(req.body.size); // Desired file size in KB

    if (!file || !targetSize) {
        return res.status(400).send('File and size are required');
    }

    const outputPath = `compressed/${file.filename}`;

    try {
        if (file.mimetype.startsWith('image/')) {
            // Compress image
            await sharp(file.path)
                .jpeg({ quality: 50 })
                .toFile(outputPath);

        } else if (file.mimetype.startsWith('video/')) {
            // Compress video
            await new Promise((resolve, reject) => {
                ffmpeg(file.path)
                    .outputOptions('-b:v', `${targetSize}k`)
                    .save(outputPath)
                    .on('end', resolve)
                    .on('error', reject);
            });
        }

        res.download(outputPath, file.originalname, () => {
            // Cleanup temporary files
            fs.unlinkSync(file.path);
            fs.unlinkSync(outputPath);
        });
    } catch (error) {
        res.status(500).send('Error compressing file');
    }
});

module.exports = app;
