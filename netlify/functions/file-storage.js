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
  try {
    // Simple base64 encoding for demo - in production use proper encryption
    const encrypted = buffer.toString('base64');
    return {
      encrypted,
      iv: null,
      authTag: null,
      isPlaintext: true
    };
  } catch (error) {
    console.error('Encryption error:', error);
    return {
      encrypted: buffer.toString('base64'),
      iv: null,
      authTag: null,
      isPlaintext: true
    };
  }
};

const decryptFile = (encryptedData, key) => {
  try {
    return Buffer.from(encryptedData.encrypted, 'base64');
  } catch (error) {
    console.error('Decryption error:', error);
    throw new Error('File decryption failed');
  }
};

exports.handler = async (event, context) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
    'Content-Type': 'application/json'
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  try {
    if (event.httpMethod === 'POST') {
      const { fileName, fileType, fileData, senderId, encryptionKey } = JSON.parse(event.body || '{}');

      if (!fileName || !fileType || !fileData || !senderId) {
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({ error: 'Missing required fields' })
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

      // Check file size (base64 is ~33% larger than binary)
      const fileSize = Math.floor(fileData.length * 0.75);
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
      let encryptedFile;
      try {
        encryptedFile = encryptFile(Buffer.from(fileData, 'base64'), encryptionKey || 'default-key');
      } catch (encryptError) {
        console.error('Encryption error:', encryptError);
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({ error: 'Failed to encrypt file data' })
        };
      }
      
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
        try {
          // Create a smaller thumbnail (first 2000 chars of base64)
          fileRecord.thumbnail = fileData.substring(0, 2000);
        } catch (thumbError) {
          console.error('Thumbnail generation error:', thumbError);
          fileRecord.thumbnail = null;
        }
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
        // Decrypt and return file data for download
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
              'Access-Control-Allow-Origin': '*',
              'Content-Type': fileRecord.fileType,
              'Content-Disposition': `attachment; filename="${encodeURIComponent(fileRecord.fileName)}"`,
              'Cache-Control': 'no-cache',
              'Content-Length': decryptedData.length.toString()
            },
            body: decryptedData.toString('base64'),
            isBase64Encoded: true
          };
        } catch (error) {
          console.error('Download error:', error);
          return {
            statusCode: 500,
            headers,
            body: JSON.stringify({ error: 'Failed to decrypt file' })
          };
        }
      } else {
        // Return file metadata with preview data
        const responseData = {
          id: fileRecord.id,
          fileName: fileRecord.fileName,
          fileType: fileRecord.fileType,
          fileSize: fileRecord.fileSize,
          uploadTime: fileRecord.uploadTime,
          downloadCount: fileRecord.downloadCount,
          downloadUrl: `/.netlify/functions/file-storage?fileId=${fileId}&download=true`
        };

        // Include thumbnail for preview
        if (fileRecord.thumbnail) {
          responseData.thumbnail = fileRecord.thumbnail;
        }

        // For direct preview (images/videos), include the full data
        if (fileRecord.fileType.startsWith('image/') || fileRecord.fileType.startsWith('video/')) {
          try {
            const decryptedData = decryptFile(fileRecord.encryptedData, 'default-key');
            responseData.previewData = `data:${fileRecord.fileType};base64,${decryptedData.toString('base64')}`;
          } catch (error) {
            console.error('Preview generation error:', error);
          }
        }

        return {
          statusCode: 200,
          headers,
          body: JSON.stringify(responseData)
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

      // Only sender can delete their files
      if (fileRecord.senderId !== userId) {
        return {
          statusCode: 403,
          headers,
          body: JSON.stringify({ error: 'Permission denied' })
        };
      }

      global.fileStore.files.delete(fileId);

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ message: 'File deleted successfully' })
      };
    }

    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  } catch (error) {
    console.error('Function error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Internal server error', details: error.message })
    };
  }
};
