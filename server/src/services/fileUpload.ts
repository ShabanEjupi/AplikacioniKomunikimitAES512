import multer from 'multer';
import path from 'path';
import sharp from 'sharp';
import ffmpeg from 'fluent-ffmpeg';
import { v4 as uuidv4 } from 'uuid';
import fs from 'fs';
import config from '../config';
import { Request } from 'express';

// Configure ffmpeg (using system ffmpeg or install separately)
try {
  // Try to use system ffmpeg if available
  ffmpeg.setFfmpegPath('ffmpeg');
} catch (error) {
  console.warn('⚠️  FFmpeg not found. Video processing will be limited.');
}

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req: Request, file: any, cb: (error: Error | null, destination: string) => void) => {
    const uploadDir = config.uploadsDir;
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req: Request, file: any, cb: (error: Error | null, filename: string) => void) => {
    const uniqueName = `${uuidv4()}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  }
});

const fileFilter = (req: Request, file: any, cb: any) => {
  const allowedTypes = [
    ...config.allowedFileTypes.images,
    ...config.allowedFileTypes.videos,
    ...config.allowedFileTypes.documents,
    ...config.allowedFileTypes.audio
  ];
  
  const fileExt = path.extname(file.originalname).toLowerCase();
  
  if (allowedTypes.includes(fileExt)) {
    cb(null, true);
  } else {
    cb(new Error('File type not allowed'), false);
  }
};

export const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: config.maxFileSize
  }
});

export class MediaProcessor {
  // Process uploaded images
  static async processImage(filePath: string): Promise<string> {
    try {
      const processedPath = filePath.replace(/\.[^/.]+$/, '_processed.webp');
      
      await sharp(filePath)
        .resize(1920, 1080, { fit: 'inside', withoutEnlargement: true })
        .webp({ quality: 85 })
        .toFile(processedPath);
      
      // Generate thumbnail
      const thumbnailPath = filePath.replace(/\.[^/.]+$/, '_thumb.webp');
      await sharp(filePath)
        .resize(300, 300, { fit: 'cover' })
        .webp({ quality: 70 })
        .toFile(thumbnailPath);
      
      return processedPath;
    } catch (error) {
      console.error('Error processing image:', error);
      throw error;
    }
  }

  // Process uploaded videos
  static async processVideo(filePath: string): Promise<string> {
    return new Promise((resolve, reject) => {
      const processedPath = filePath.replace(/\.[^/.]+$/, '_processed.mp4');
      const thumbnailPath = filePath.replace(/\.[^/.]+$/, '_thumb.jpg');
      
      ffmpeg(filePath)
        .outputOptions([
          '-c:v libx264',
          '-preset medium',
          '-crf 23',
          '-c:a aac',
          '-b:a 128k',
          '-movflags +faststart'
        ])
        .output(processedPath)
        .on('end', () => {
          // Generate video thumbnail
          ffmpeg(filePath)
            .screenshots({
              timestamps: ['00:00:01.000'],
              filename: path.basename(thumbnailPath),
              folder: path.dirname(thumbnailPath),
              size: '320x240'
            })
            .on('end', () => resolve(processedPath))
            .on('error', reject);
        })
        .on('error', reject)
        .run();
    });
  }

  // Process uploaded audio
  static async processAudio(filePath: string): Promise<string> {
    return new Promise((resolve, reject) => {
      const processedPath = filePath.replace(/\.[^/.]+$/, '_processed.mp3');
      
      ffmpeg(filePath)
        .audioCodec('mp3')
        .audioBitrate(128)
        .output(processedPath)
        .on('end', () => resolve(processedPath))
        .on('error', reject)
        .run();
    });
  }

  // Get file metadata
  static async getFileMetadata(filePath: string, fileType: string) {
    const stats = fs.statSync(filePath);
    const metadata: any = {
      size: stats.size,
      lastModified: stats.mtime,
      type: fileType
    };

    if (fileType.startsWith('image/')) {
      try {
        const imageData = await sharp(filePath).metadata();
        metadata.width = imageData.width;
        metadata.height = imageData.height;
      } catch (error) {
        console.error('Error getting image metadata:', error);
      }
    }

    if (fileType.startsWith('video/')) {
      return new Promise((resolve, reject) => {
        ffmpeg.ffprobe(filePath, (err: any, data: any) => {
          if (err) {
            reject(err);
            return;
          }
          
          const videoStream = data.streams.find((s: any) => s.codec_type === 'video');
          if (videoStream) {
            metadata.width = videoStream.width;
            metadata.height = videoStream.height;
            metadata.duration = parseFloat(data.format.duration || '0');
          }
          
          resolve(metadata);
        });
      });
    }

    return metadata;
  }
}

export default { upload, MediaProcessor };
