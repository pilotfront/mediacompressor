import { createFFmpeg, fetchFile } from '@ffmpeg/ffmpeg';
import nextConnect from 'next-connect';
import multer from 'multer';
import fs from 'fs';

const upload = multer({ dest: '/tmp/' });
const apiRoute = nextConnect();

apiRoute.use(upload.single('file'));

apiRoute.post(async (req, res) => {
  const ffmpeg = createFFmpeg({ log: true });
  await ffmpeg.load();

  const inputPath = `/tmp/${req.file.filename}`;
  const outputPath = `/tmp/output.mp4`;

  // Load the file into ffmpeg's virtual file system
  ffmpeg.FS('writeFile', req.file.originalname, await fetchFile(inputPath));

  // Compress the file
  await ffmpeg.run('-i', req.file.originalname, '-vcodec', 'libx264', '-crf', '28', 'output.mp4');

  // Retrieve the output file
  const data = ffmpeg.FS('readFile', 'output.mp4');
  fs.writeFileSync(outputPath, Buffer.from(data));

  // Send the file to the client
  res.setHeader('Content-Type', 'video/mp4');
  res.setHeader('Content-Disposition', 'attachment; filename=compressed-media.mp4');
  res.send(Buffer.from(data));
});

export const config = {
  api: {
    bodyParser: false,
  },
};

export default apiRoute;
