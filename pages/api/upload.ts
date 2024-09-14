import { NextApiRequest, NextApiResponse } from 'next';
import formidable from 'formidable';
import fs from 'fs';
import path from 'path';
import { execFile } from 'child_process';
import { promisify } from 'util';
import { File } from 'formidable';
import { getAccountID, getApiKey, getServiceUrl, getHeaders } from '../../libs/chatbees';

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

async function transcribeAudio(
  aid: string,
  apiKey: string,
  collectionName: string,
  audioFilePath: string,
  lang: string
): Promise<string> {
  const urlSuffix = '/docs/transcribe_audio';
  const formData = new FormData();
  
  // Read the file from the local file system
  const fileBuffer = await fs.promises.readFile(audioFilePath);
  const fileName = path.basename(audioFilePath);

  // Create a Blob from the file buffer
  const blob = new Blob([fileBuffer]);
  
  // Append the file to the FormData
  formData.append('file', blob, fileName);

  // Add the request data
  const requestData = JSON.stringify({
    namespace_name: 'public',
    collection_name: collectionName,
    lang: lang
  });
  formData.append('request', requestData);

  const url = getServiceUrl(aid) + urlSuffix;
  const headers = getHeaders(aid, apiKey, true); // Set upload to true

  console.log('Transcription URL:', url);
  console.log('Transcription Headers:', headers);
  console.log('FormData keys:', Array.from(formData.keys())); // Fix for iteration error

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: headers,
      body: formData,
    });

    if (response.ok) {
      const data = await response.json();
      return data.transcript;
    } else {
      const errorText = await response.text();
      console.error('Transcription API Error:', {
        status: response.status,
        statusText: response.statusText,
        errorBody: errorText
      });
      throw new Error(`Transcription failed: ${response.status} ${response.statusText}`);
    }
  } catch (error) {
    console.error('Error transcribing audio:', error);
    throw error;
  }
}

async function uploadTranscription(
  aid: string,
  apiKey: string,
  collectionName: string,
  docName: string,
  transcript: string
): Promise<void> {
  const urlSuffix = '/docs/add';
  const formData = new FormData();
  
  // Create a Blob from the transcript
  const blob = new Blob([transcript], { type: 'text/plain' });
  
  // Append the file to the FormData
  formData.append('file', blob, `${docName}.txt`);

  // Add the request data
  const requestData = JSON.stringify({
    namespace_name: 'public',
    collection_name: collectionName,
    doc_name: docName
  });
  formData.append('request', requestData);

  const url = getServiceUrl(aid) + urlSuffix;
  const headers = getHeaders(aid, apiKey, true); // Set upload to true

  console.log('Upload Transcription URL:', url);
  console.log('Upload Transcription Headers:', headers);
  console.log('FormData keys:', Array.from(formData.keys()));

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: headers,
      body: formData,
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Upload Transcription API Error:', {
        status: response.status,
        statusText: response.statusText,
        errorBody: errorText
      });
      throw new Error(`Upload Transcription failed: ${response.status} ${response.statusText}`);
    }
  } catch (error) {
    console.error('Error uploading transcription:', error);
    throw error;
  }
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

        // Transcribe the audio
        console.log('Transcribing audio');
        try {
          const transcript = await transcribeAudio(
            getAccountID() as string,
            getApiKey() as string,
            'videos', // or whatever collection name you're using
            audioPath, // Pass the full path to the audio file
            'ja' // or whatever language code is appropriate
          );
          console.log('Transcription complete', transcript);

          // Upload the transcription
          console.log('Uploading transcription');
          const docName = path.parse(safeFileName).name; // Use the video filename (without extension) as the doc name
          await uploadTranscription(
            getAccountID() as string,
            getApiKey() as string,
            'videos', // or whatever collection name you're using
            docName,
            transcript
          );
          console.log('Transcription uploaded successfully');

          // Return the paths and transcript
          const videoUrl = `/uploads/${safeFileName}`;
          const audioUrl = `/uploads/${audioFileName}`;
          return res.status(200).json({ videoUrl, audioUrl, transcript, docName });
        } catch (transcriptionError) {
          console.error('Transcription or upload error details:', transcriptionError as Error);
          return res.status(500).json({ error: 'Transcription or upload failed', details: (transcriptionError as Error).message });
        }
      } else {
        // No audio stream found
        console.log(`No audio stream found in the file`);
        const videoUrl = `/uploads/${safeFileName}`;
        return res.status(200).json({ videoUrl, message: "No audio stream found in the video" });
      }
    } catch (error) {
      console.error('Error processing file:', error);
      return res.status(500).json({ 
        error: 'Error processing file', 
        details: (error as Error).message 
      });
    }
  });
}
