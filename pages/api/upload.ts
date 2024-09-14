import { NextApiRequest, NextApiResponse } from 'next';
import formidable from 'formidable';
import fs from 'fs';
import path from 'path';
import { execFile } from 'child_process';
import { promisify } from 'util';
import { File } from 'formidable';

const execFileAsync = promisify(execFile);

const uploadDir = path.join(process.cwd(), 'public', 'uploads');
export const config = {
  api: {
    bodyParser: false,
  },
};

function generateUniqueFileName(fileName: string): string {
  const timestamp = Date.now();
  const randomString = Math.random().toString(36).substring(2, 8);
  const ext = path.extname(fileName);
  const name = path.basename(fileName, ext);
  return `${name}_${timestamp}_${randomString}${ext}`;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  console.log('Uploading file');

  const form = formidable({
    uploadDir,
    keepExtensions: true,
  });

  form.parse(req, async (err, fields, files) => {
    if (err) {
      console.error('Error parsing form:', err);
      return res.status(500).json({ error: 'Error parsing form data' });
    }

    const file = Array.isArray(files.file) ? files.file[0] : files.file;
    if (!file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const originalFileName = (file as File).originalFilename || 'uploaded_video.mp4';
    const uniqueFileName = generateUniqueFileName(originalFileName);
    const safeFileName = uniqueFileName.replace(/\s+/g, '_');
    const newPath = path.join(uploadDir, safeFileName);
    const audioFileName = `${path.parse(safeFileName).name}.mp3`;
    const audioPath = path.join(uploadDir, audioFileName);

    try {
      await fs.promises.rename(file.filepath, newPath);
      console.log('File renamed');
      
      // First, probe the file to check for audio streams
      const { stdout } = await execFileAsync('ffprobe', [
        '-v', 'error',
        '-select_streams', 'a:0',
        '-show_entries', 'stream=codec_type',
        '-of', 'csv=p=0',
        newPath
      ]);
      console.log('ffprobe output:', stdout);
      
      if (stdout.trim() === 'audio') {
        // File has audio, proceed with extraction
        console.log('Extracting audio');
        await execFileAsync('ffmpeg', [
          '-i', newPath,
          '-q:a', '0',
          '-map', 'a',
          '-y',  // Overwrite output file if it exists
          audioPath
        ]);
        console.log(`Audio extracted successfully`);

        // Return the paths relative to the public directory
        const videoUrl = `/uploads/${safeFileName}`;
        const audioUrl = `/uploads/${audioFileName}`;
        return res.status(200).json({ videoUrl, audioUrl });
      } else {
        // No audio stream found
        console.log(`No audio stream found in the file`);
        const videoUrl = `/uploads/${safeFileName}`;
        return res.status(200).json({ videoUrl, message: "No audio stream found in the video" });
      }
    } catch (error) {
      console.error('Error processing file:', error);
      return res.status(500).json({ error: 'Error processing file' });
    }
  });
}
