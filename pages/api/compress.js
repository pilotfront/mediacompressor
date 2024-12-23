import { IncomingForm } from 'formidable';
import cloudinary from 'cloudinary';

cloudinary.config({
  cloud_name: 'your-cloud-name', // Replace with your Cloudinary Cloud Name
  api_key: 'your-api-key',       // Replace with your Cloudinary API Key
  api_secret: 'your-api-secret',  // Replace with your Cloudinary API Secret
});

export const config = {
  api: {
    bodyParser: false,
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
      const targetSizeMB = parseFloat(fields.targetSizeMB);

      if (!targetSizeMB || targetSizeMB <= 0) {
        return res.status(400).json({ error: 'Invalid target size provided' });
      }

      // Upload file to Cloudinary
      cloudinary.uploader.upload(file.filepath, { resource_type: 'video' }, (uploadError, result) => {
        if (uploadError) {
          return res.status(500).json({ error: 'Error uploading to Cloudinary' });
        }

        // Perform video compression via Cloudinary transformation
        cloudinary.uploader.explicit(result.public_id, {
          resource_type: 'video',
          eager: [
            { width: 1280, height: 720, crop: 'limit', quality: 'auto' },
          ],
        }, (transformError, transformedResult) => {
          if (transformError) {
            return res.status(500).json({ error: 'Error compressing video' });
          }

          // Provide the compressed video URL to the client
          res.status(200).json({
            success: true,
            url: transformedResult.secure_url,
          });
        });
      });
    });
  } else {
    res.status(405).json({ error: 'Method Not Allowed' });
  }
}
