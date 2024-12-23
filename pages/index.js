import fs from 'fs';
import path from 'path';
import { IncomingForm } from 'formidable';
import sharp from 'sharp'; // Image compression library
import ffmpeg from 'fluent-ffmpeg'; // FFmpeg library for video compression

export const config = {
  api: {
    bodyParser: false, // Disable body parsing to handle files manually
  },
};

export default function handler(req, res) {
  if (req.method === 'POST') {
    const form = new IncomingForm();
    form.parse(req, (err, fields, files) => {
      if (err) {
        console.error(err);
        return res.status(500).json({ error: 'File parsing error' });
      }

      const file = files.file[0];
      const targetSizeMB = parseFloat(fields.targetSizeMB); // Target size in MB

      if (!targetSizeMB || targetSizeMB <= 0) {
        return res.status(400).json({ error: 'Invalid target size provided' });
      }

      const ext = path.extname(file.originalFilename).toLowerCase();

      // Handle Image Compression (using sharp)
      if (['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.tiff'].includes(ext)) {
        const outputFilePath = path.join(process.cwd(), 'output.jpg');
        sharp(file.filepath)
          .metadata()
          .then((metadata) => {
            const originalSizeMB = metadata.size / 1024 / 1024; // Convert to MB
            if (originalSizeMB <= targetSizeMB) {
              // If the original image is smaller than the target size, no need to compress further
              fs.copyFileSync(file.filepath, outputFilePath);
              return res.status(200).download(outputFilePath, 'compressed-image.jpg', (err) => {
                if (err) return res.status(500).json({ error: 'Error while sending the file' });
                fs.unlinkSync(outputFilePath); // Cleanup
              });
            }

            // Calculate resize ratio for image compression based on target size
            const resizeFactor = targetSizeMB / originalSizeMB;
            sharp(file.filepath)
              .resize(Math.round(metadata.width * resizeFactor)) // Resize the image based on ratio
              .toFile(outputFilePath, (err, info) => {
                if (err) {
                  console.error('Error during image compression:', err);
                  return res.status(500).json({ error: 'Image compression error' });
                }

                // Send the compressed image
                res.status(200).download(outputFilePath, 'compressed-image.jpg', (err) => {
                  if (err) return res.status(500).json({ error: 'Error while sending the file' });
                  fs.unlinkSync(outputFilePath); // Cleanup
                });
              });
          })
          .catch((err) => {
            console.error('Error reading image metadata:', err);
            return res.status(500).json({ error: 'Error reading image metadata' });
          });
      }
      // Handle Video Compression (using ffmpeg)
      else if (['.mp4', '.mov', '.avi', '.mkv'].includes(ext)) {
        const outputFilePath = path.join(process.cwd(), 'output.mp4');
        ffmpeg(file.filepath)
          .output(outputFilePath)
          .on('end', () => {
            fs.stat(outputFilePath, (err, stats) => {
              if (err) return res.status(500).json({ error: 'Error checking video file size' });

              const compressedSizeMB = stats.size / 1024 / 1024; // Convert to MB
              if (compressedSizeMB <= targetSizeMB) {
                // If the compressed video is already within target size
                return res.status(200).download(outputFilePath, 'compressed-video.mp4', (err) => {
                  if (err) return res.status(500).json({ error: 'Error while sending the file' });
                  fs.unlinkSync(outputFilePath); // Cleanup
                });
              }

              // Adjust video bitrate to meet the target file size
              const bitrate = (targetSizeMB / compressedSizeMB) * 5000; // Adjust bitrate
              ffmpeg(file.filepath)
                .output(outputFilePath)
                .videoBitrate(bitrate) // Set the bitrate dynamically
                .on('end', () => {
                  res.status(200).download(outputFilePath, 'compressed-video.mp4', (err) => {
                    if (err) return res.status(500).json({ error: 'Error while sending the file' });
                    fs.unlinkSync(outputFilePath); // Cleanup
                  });
                })
                .on('error', (err) => {
                  console.error('Error during video compression:', err);
                  return res.status(500).json({ error: 'Video compression error' });
                })
                .run();
            });
          })
          .on('error', (err) => {
            console.error('Error during video compression:', err);
            return res.status(500).json({ error: 'Video compression error' });
          })
          .run();
      } else {
        return res.status(400).json({ error: 'Unsupported file type' });
      }
    });
  } else {
    res.status(405).json({ error: 'Method Not Allowed' });
  }
}
