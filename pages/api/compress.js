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
      const compressionSize = fields.compressionSize || 50; // Default to 50% if not provided

      // Determine file type based on file extension
      const ext = path.extname(file.originalFilename).toLowerCase();

      if (['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.tiff'].includes(ext)) {
        // Handle image compression
        const outputFilePath = path.join(process.cwd(), 'output.jpg');
        sharp(file.filepath)
          .resize({ width: (compressionSize / 100) * 1920 }) // Example resize based on compression size
          .toFile(outputFilePath, (err, info) => {
            if (err) {
              console.error('Error during image compression:', err);
              return res.status(500).json({ error: 'Image compression error' });
            }
            // Send the compressed image
            res.status(200).download(outputFilePath, 'compressed-image.jpg', (err) => {
              if (err) {
                console.error(err);
                return res.status(500).json({ error: 'Error while sending the file' });
              }
              // Clean up the file after sending it to the client
              fs.unlinkSync(outputFilePath);
            });
          });
      } else if (['.mp4', '.mov', '.avi', '.mkv'].includes(ext)) {
        // Handle video compression
        const outputFilePath = path.join(process.cwd(), 'output.mp4');
        ffmpeg(file.filepath)
          .output(outputFilePath)
          .videoBitrate((compressionSize / 100) * 5000) // Example: Adjust bitrate based on compression size
          .on('end', () => {
            // Send the compressed video
            res.status(200).download(outputFilePath, 'compressed-video.mp4', (err) => {
              if (err) {
                console.error(err);
                return res.status(500).json({ error: 'Error while sending the file' });
              }
              // Clean up the file after sending it to the client
              fs.unlinkSync(outputFilePath);
            });
          })
          .on('error', (err) => {
            console.error('Error during video compression:', err);
            return res.status(500).json({ error: 'Video compression error' });
          })
          .run();
      } else {
        // Handle unsupported file type
        return res.status(400).json({ error: 'Unsupported file type' });
      }
    });
  } else {
    res.status(405).json({ error: 'Method Not Allowed' });
  }
}
