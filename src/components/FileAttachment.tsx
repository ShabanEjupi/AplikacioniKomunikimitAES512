import React, { useState, useRef, useCallback } from 'react';

interface FileAttachmentProps {
  onFileSelect: (files: FileList | null) => void;
  onSend: () => void;
  selectedFiles: FileList | null;
  isUploading: boolean;
}

interface FilePreview {
  file: File;
  preview: string;
  type: 'image' | 'video' | 'document' | 'audio';
  editedPreview?: string;
}

interface FileEditOptions {
  brightness: number;
  contrast: number;
  saturation: number;
  rotation: number;
  filter: string;
}

const FileAttachment: React.FC<FileAttachmentProps> = ({
  onFileSelect,
  onSend,
  selectedFiles,
  isUploading
}) => {
  const [previews, setPreviews] = useState<FilePreview[]>([]);
  const [showOneTime, setShowOneTime] = useState(false);
  const [oneTimeExpiry, setOneTimeExpiry] = useState<number>(60); // seconds
  const [editingFile, setEditingFile] = useState<number | null>(null);
  const [editOptions, setEditOptions] = useState<FileEditOptions>({
    brightness: 100,
    contrast: 100,
    saturation: 100,
    rotation: 0,
    filter: 'none'
  });
  const [isExpanded, setIsExpanded] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    onFileSelect(files);
    
    if (files) {
      generatePreviews(files);
    }
  };

  const generatePreviews = async (files: FileList) => {
    const newPreviews: FilePreview[] = [];
    
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      let preview = '';
      let type: 'image' | 'video' | 'document' | 'audio' = 'document';
      
      if (file.type.startsWith('image/')) {
        type = 'image';
        preview = URL.createObjectURL(file);
      } else if (file.type.startsWith('video/')) {
        type = 'video';
        preview = URL.createObjectURL(file);
      } else if (file.type.startsWith('audio/')) {
        type = 'audio';
        preview = URL.createObjectURL(file);
      } else {
        type = 'document';
        preview = getDocumentIcon(file.type);
      }
      
      newPreviews.push({ file, preview, type });
    }
    
    setPreviews(newPreviews);
  };

  const getDocumentIcon = (mimeType: string): string => {
    if (mimeType.includes('pdf')) return '📄';
    if (mimeType.includes('word')) return '📝';
    if (mimeType.includes('excel') || mimeType.includes('spreadsheet')) return '📊';
    if (mimeType.includes('powerpoint') || mimeType.includes('presentation')) return '📊';
    if (mimeType.includes('audio')) return '🎵';
    if (mimeType.includes('zip') || mimeType.includes('rar')) return '📦';
    return '📎';
  };

  const removeFile = (index: number) => {
    if (selectedFiles) {
      const dt = new DataTransfer();
      for (let i = 0; i < selectedFiles.length; i++) {
        if (i !== index) {
          dt.items.add(selectedFiles[i]);
        }
      }
      onFileSelect(dt.files);
      
      const newPreviews = previews.filter((_, i) => i !== index);
      setPreviews(newPreviews);
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const applyImageFilter = useCallback((file: File, options: FileEditOptions): Promise<string> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        const canvas = canvasRef.current;
        if (!canvas) {
          reject(new Error('Canvas not available'));
          return;
        }

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Canvas context not available'));
          return;
        }

        canvas.width = img.width;
        canvas.height = img.height;

        // Apply rotation
        if (options.rotation !== 0) {
          ctx.translate(canvas.width / 2, canvas.height / 2);
          ctx.rotate((options.rotation * Math.PI) / 180);
          ctx.translate(-canvas.width / 2, -canvas.height / 2);
        }

        // Apply filters
        ctx.filter = `brightness(${options.brightness}%) contrast(${options.contrast}%) saturate(${options.saturation}%)`;

        if (options.filter !== 'none') {
          switch (options.filter) {
            case 'grayscale':
              ctx.filter += ' grayscale(100%)';
              break;
            case 'sepia':
              ctx.filter += ' sepia(100%)';
              break;
            case 'blur':
              ctx.filter += ' blur(2px)';
              break;
            case 'vintage':
              ctx.filter += ' sepia(50%) contrast(120%) brightness(110%)';
              break;
          }
        }

        ctx.drawImage(img, 0, 0);
        const editedDataUrl = canvas.toDataURL('image/jpeg', 0.9);
        resolve(editedDataUrl);
      };
      img.onerror = reject;
      img.src = URL.createObjectURL(file);
    });
  }, []);

  const startEditing = useCallback((index: number) => {
    setEditingFile(index);
    setIsExpanded(true);
  }, []);

  const applyEdit = useCallback(async (index: number) => {
    const preview = previews[index];
    if (preview.type === 'image') {
      try {
        const editedPreview = await applyImageFilter(preview.file, editOptions);
        const newPreviews = [...previews];
        newPreviews[index] = { ...preview, editedPreview };
        setPreviews(newPreviews);
        setEditingFile(null);
      } catch (error) {
        console.error('Failed to apply edit:', error);
      }
    }
  }, [previews, editOptions, applyImageFilter]);

  const resetEdit = useCallback((index: number) => {
    const newPreviews = [...previews];
    delete newPreviews[index].editedPreview;
    setPreviews(newPreviews);
    setEditingFile(null);
    setEditOptions({
      brightness: 100,
      contrast: 100,
      saturation: 100,
      rotation: 0,
      filter: 'none'
    });
  }, [previews]);

  return (
    <div className="file-attachment">
      <div className="attachment-controls">
        <input
          ref={fileInputRef}
          type="file"
          multiple
          onChange={handleFileSelect}
          style={{ display: 'none' }}
          accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.txt,.zip,.rar"
        />
        
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="attach-btn"
          title="Attach files"
        >
          📎
        </button>

        <button
          type="button"
          onClick={() => {
            fileInputRef.current?.setAttribute('accept', 'image/*,video/*');
            fileInputRef.current?.click();
            setShowOneTime(true);
          }}
          className="camera-btn"
          title="Photo/Video"
        >
          📷
        </button>

        <button
          type="button"
          onClick={() => {
            fileInputRef.current?.setAttribute('accept', '.pdf,.doc,.docx,.txt');
            fileInputRef.current?.click();
          }}
          className="document-btn"
          title="Document"
        >
          📄
        </button>
      </div>

      {showOneTime && (
        <div className="one-time-controls">
          <label>
            <input
              type="checkbox"
              checked={showOneTime}
              onChange={(e) => setShowOneTime(e.target.checked)}
            />
            One-time view
          </label>
          {showOneTime && (
            <select
              value={oneTimeExpiry}
              onChange={(e) => setOneTimeExpiry(Number(e.target.value))}
              className="expiry-select"
            >
              <option value={10}>10 seconds</option>
              <option value={30}>30 seconds</option>
              <option value={60}>1 minute</option>
              <option value={300}>5 minutes</option>
              <option value={3600}>1 hour</option>
            </select>
          )}
        </div>
      )}

      {previews.length > 0 && (
        <div className="file-previews">
          {previews.map((preview, index) => (
            <div key={index} className="file-preview">
              <div className="preview-content">
                {preview.type === 'image' && (
                  <img src={preview.preview} alt="Preview" className="preview-image" />
                )}
                {preview.type === 'video' && (
                  <video src={preview.preview} className="preview-video" controls />
                )}
                {preview.type === 'document' && (
                  <div className="preview-document">
                    <span className="document-icon">{preview.preview}</span>
                    <span className="document-name">{preview.file.name}</span>
                  </div>
                )}
              </div>
              
              <div className="file-info">
                <span className="file-name">{preview.file.name}</span>
                <span className="file-size">{formatFileSize(preview.file.size)}</span>
              </div>
              
              <button
                type="button"
                onClick={() => removeFile(index)}
                className="remove-file"
                title="Remove file"
              >
                ❌
              </button>
            </div>
          ))}
          
          <div className="send-controls">
            <button
              type="button"
              onClick={onSend}
              disabled={isUploading}
              className="send-files-btn"
            >
              {isUploading ? 'Sending...' : `Send ${previews.length} file(s)`}
            </button>
          </div>
        </div>
      )}

      <style>{`
        .file-attachment {
          border-top: 1px solid #e0e0e0;
          padding: 10px;
          background: #f9f9f9;
        }

        .attachment-controls {
          display: flex;
          gap: 10px;
          margin-bottom: 10px;
        }

        .attach-btn, .camera-btn, .document-btn {
          background: #007bff;
          color: white;
          border: none;
          border-radius: 20px;
          width: 40px;
          height: 40px;
          cursor: pointer;
          font-size: 16px;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: background-color 0.2s;
        }

        .attach-btn:hover, .camera-btn:hover, .document-btn:hover {
          background: #0056b3;
        }

        .one-time-controls {
          display: flex;
          align-items: center;
          gap: 10px;
          margin-bottom: 10px;
          padding: 10px;
          background: #fff3cd;
          border: 1px solid #ffeaa7;
          border-radius: 5px;
        }

        .expiry-select {
          padding: 5px;
          border: 1px solid #ccc;
          border-radius: 3px;
        }

        .file-previews {
          background: white;
          border: 1px solid #e0e0e0;
          border-radius: 8px;
          padding: 15px;
          max-height: 300px;
          overflow-y: auto;
        }

        .file-preview {
          display: flex;
          align-items: center;
          gap: 15px;
          padding: 10px;
          border: 1px solid #e0e0e0;
          border-radius: 5px;
          margin-bottom: 10px;
          background: #f8f9fa;
        }

        .preview-content {
          flex-shrink: 0;
        }

        .preview-image {
          width: 60px;
          height: 60px;
          object-fit: cover;
          border-radius: 5px;
        }

        .preview-video {
          width: 100px;
          height: 60px;
          border-radius: 5px;
        }

        .preview-document {
          display: flex;
          flex-direction: column;
          align-items: center;
          padding: 10px;
          width: 60px;
        }

        .document-icon {
          font-size: 24px;
          margin-bottom: 5px;
        }

        .document-name {
          font-size: 10px;
          text-align: center;
          word-break: break-all;
        }

        .file-info {
          flex: 1;
          display: flex;
          flex-direction: column;
        }

        .file-name {
          font-weight: 500;
          color: #333;
          margin-bottom: 3px;
        }

        .file-size {
          font-size: 12px;
          color: #666;
        }

        .remove-file {
          background: #dc3545;
          color: white;
          border: none;
          border-radius: 50%;
          width: 24px;
          height: 24px;
          cursor: pointer;
          font-size: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .remove-file:hover {
          background: #c82333;
        }

        .send-controls {
          margin-top: 15px;
          text-align: center;
        }

        .send-files-btn {
          background: #28a745;
          color: white;
          border: none;
          border-radius: 25px;
          padding: 10px 20px;
          cursor: pointer;
          font-weight: 500;
          transition: background-color 0.2s;
        }

        .send-files-btn:hover:not(:disabled) {
          background: #218838;
        }

        .send-files-btn:disabled {
          background: #6c757d;
          cursor: not-allowed;
        }
      `}</style>
    </div>
  );
};

export default FileAttachment;
