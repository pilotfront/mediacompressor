import fs from 'fs';
import path from 'path';
import { IncomingForm } from 'formidable';
import ffmpeg from 'fluent-ffmpeg'; // Make sure to install ffmpeg library

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

      // Implement your media compression logic using FFmpeg
      const outputFilePath = path.join(process.cwd(), 'output.mp4');
      ffmpeg(file.path)
        .output(outputFilePath)
        .videoBitrate((compressionSize / 100) * 5000) // Example: Adjust bitrate based on compression size
        .on('end', () => {
          // Send the compressed file to the client
          res.status(200).download(outputFilePath, 'compressed-media.mp4', (err) => {
            if (err) {
              console.error(err);
              return res.status(500).json({ error: 'Error while sending the file' });
            }
            // Clean up the file after sending it to the client
            fs.unlinkSync(outputFilePath);
          });
        })
        .on('error', (err) => {
          console.error('Error during compression:', err);
          return res.status(500).json({ error: 'Compression error' });
        })
        .run();
    });
  } else {
    res.status(405).json({ error: 'Method Not Allowed' });
  }
}
