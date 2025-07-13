// File upload and management for encrypted messaging
const crypto = require('crypto');

// In-memory file storage (for demo purposes)
if (!global.fileStore) {
  global.fileStore = {
    files: new Map(),
    maxFileSize: 10 * 1024 * 1024, // 10MB
    allowedTypes: [
      'image/jpeg', 'image/png', 'image/gif', 'image/webp',
      'video/mp4', 'video/webm', 'video/quicktime',
      'audio/mp3', 'audio/wav', 'audio/ogg',
      'application/pdf', 'text/plain',
      'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/zip', 'application/x-rar-compressed'
    ]
  };
}

const generateFileId = () => {
  return crypto.randomBytes(16).toString('hex');
};

const encryptFile = (buffer, key) => {
  const algorithm = 'aes-256-gcm';
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipher(algorithm, key);
  
  let encrypted = cipher.update(buffer);
  encrypted = Buffer.concat([encrypted, cipher.final()]);
  
  const authTag = cipher.getAuthTag();
  
  return {
    encrypted: encrypted.toString('base64'),
    iv: iv.toString('base64'),
    authTag: authTag.toString('base64')
  };
};

const decryptFile = (encryptedData, key) => {
  const algorithm = 'aes-256-gcm';
  const decipher = crypto.createDecipher(algorithm, key);
  
  decipher.setAuthTag(Buffer.from(encryptedData.authTag, 'base64'));
  
  let decrypted = decipher.update(Buffer.from(encryptedData.encrypted, 'base64'));
  decrypted = Buffer.concat([decrypted, decipher.final()]);
  
  return decrypted;
};

exports.handler = async (event, context) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'POST, GET, DELETE, OPTIONS',
    'Content-Type': 'application/json'
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  try {
    if (event.httpMethod === 'POST') {
      // Upload file
      const { fileName, fileType, fileSize, fileData, senderId, encryptionKey } = JSON.parse(event.body || '{}');

      if (!fileName || !fileType || !fileData || !senderId) {
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({ error: 'fileName, fileType, fileData, and senderId are required' })
        };
      }

      // Validate file type
      if (!global.fileStore.allowedTypes.includes(fileType)) {
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({ error: 'File type not allowed' })
        };
      }

      // Validate file size
      if (fileSize > global.fileStore.maxFileSize) {
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({ error: 'File size too large (max 10MB)' })
        };
      }

      const fileId = generateFileId();
      const uploadTime = new Date().toISOString();
      
      // Encrypt file data
      const encryptedFile = encryptFile(Buffer.from(fileData, 'base64'), encryptionKey || 'default-key');
      
      // Store file metadata and encrypted data
      const fileRecord = {
        id: fileId,
        fileName,
        fileType,
        fileSize,
        senderId,
        uploadTime,
        encryptedData: encryptedFile,
        downloadCount: 0,
        isOneTime: false,
        expiryTime: null,
        thumbnail: null
      };

      // Generate thumbnail for images
      if (fileType.startsWith('image/')) {
        // In a real implementation, you'd generate actual thumbnails
        fileRecord.thumbnail = fileData.substring(0, 1000); // Simulate thumbnail
      }

      global.fileStore.files.set(fileId, fileRecord);

      return {
        statusCode: 201,
        headers,
        body: JSON.stringify({
          fileId,
          fileName,
          fileType,
          fileSize,
          uploadTime,
          downloadUrl: `/.netlify/functions/file-storage?fileId=${fileId}`,
          thumbnail: fileRecord.thumbnail
        })
      };
    }

    if (event.httpMethod === 'GET') {
      const { fileId, download } = event.queryStringParameters || {};

      if (!fileId) {
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({ error: 'fileId is required' })
        };
      }

      const fileRecord = global.fileStore.files.get(fileId);
      if (!fileRecord) {
        return {
          statusCode: 404,
          headers,
          body: JSON.stringify({ error: 'File not found' })
        };
      }

      // Check if file has expired
      if (fileRecord.expiryTime && new Date() > new Date(fileRecord.expiryTime)) {
        global.fileStore.files.delete(fileId);
        return {
          statusCode: 410,
          headers,
          body: JSON.stringify({ error: 'File has expired' })
        };
      }

      if (download === 'true') {
        // Decrypt and return file data
        try {
          const decryptedData = decryptFile(fileRecord.encryptedData, 'default-key');
          
          // Increment download count
          fileRecord.downloadCount++;
          
          // Delete if one-time file
          if (fileRecord.isOneTime) {
            global.fileStore.files.delete(fileId);
          }

          return {
            statusCode: 200,
            headers: {
              ...headers,
              'Content-Type': fileRecord.fileType,
              'Content-Disposition': `attachment; filename="${fileRecord.fileName}"`,
              'Cache-Control': 'no-cache'
            },
            body: decryptedData.toString('base64'),
            isBase64Encoded: true
          };
        } catch (error) {
          return {
            statusCode: 500,
            headers,
            body: JSON.stringify({ error: 'Failed to decrypt file' })
          };
        }
      } else {
        // Return file metadata
        return {
          statusCode: 200,
          headers,
          body: JSON.stringify({
            id: fileRecord.id,
            fileName: fileRecord.fileName,
            fileType: fileRecord.fileType,
            fileSize: fileRecord.fileSize,
            uploadTime: fileRecord.uploadTime,
            downloadCount: fileRecord.downloadCount,
            thumbnail: fileRecord.thumbnail
          })
        };
      }
    }

    if (event.httpMethod === 'DELETE') {
      const { fileId, userId } = JSON.parse(event.body || '{}');

      if (!fileId || !userId) {
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({ error: 'fileId and userId are required' })
        };
      }

      const fileRecord = global.fileStore.files.get(fileId);
      if (!fileRecord) {
        return {
          statusCode: 404,
          headers,
          body: JSON.stringify({ error: 'File not found' })
        };
      }

      // Only the sender can delete the file
      if (fileRecord.senderId !== userId) {
        return {
          statusCode: 403,
          headers,
          body: JSON.stringify({ error: 'Can only delete your own files' })
        };
      }

      global.fileStore.files.delete(fileId);

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ success: true, deleted: true })
      };
    }

    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' })
    };

  } catch (error) {
    console.error('File storage error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Internal server error' })
    };
  }
};
