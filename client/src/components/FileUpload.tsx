import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';

interface FileUploadProps {
  onFileUpload: (file: File) => void;
  acceptedTypes?: string[];
  maxSize?: number;
  isUploading?: boolean;
}

const FileUpload: React.FC<FileUploadProps> = ({
  onFileUpload,
  acceptedTypes = ['image/*', 'video/*', 'audio/*', 'application/pdf'],
  maxSize = 50 * 1024 * 1024, // 50MB
  isUploading = false
}) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      const file = acceptedFiles[0];
      setSelectedFile(file);
      
      // Create preview for images and videos
      if (file.type.startsWith('image/') || file.type.startsWith('video/')) {
        const url = URL.createObjectURL(file);
        setPreviewUrl(url);
        setShowPreview(true);
      } else {
        setShowPreview(true);
      }
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: acceptedTypes.reduce((acc, type) => {
      acc[type] = [];
      return acc;
    }, {} as Record<string, string[]>),
    maxSize,
    multiple: false
  });

  const handleConfirmUpload = () => {
    if (selectedFile) {
      onFileUpload(selectedFile);
      setSelectedFile(null);
      setPreviewUrl(null);
      setShowPreview(false);
    }
  };

  const handleCancelUpload = () => {
    setSelectedFile(null);
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    setPreviewUrl(null);
    setShowPreview(false);
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFileIcon = (type: string) => {
    if (type.startsWith('image/')) return '🖼️';
    if (type.startsWith('video/')) return '🎥';
    if (type.startsWith('audio/')) return '🎵';
    return '📄';
  };

  return (
    <>
      <div className="relative">
        <div
          {...(getRootProps() as any)}
          className={`
            border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-all duration-200
            ${isDragActive || isDragOver ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-gray-400'}
            ${isUploading ? 'opacity-50 cursor-not-allowed' : ''}
          `}
        >
          <input {...(getInputProps() as any)} />
          
          <div className="flex flex-col items-center space-y-3">
            <div style={{ fontSize: '48px' }}>📎</div>
            <div>
              <p className="text-sm font-medium text-gray-700">
                {isDragActive ? 'Drop file here' : 'Drag & drop file here'}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                or click to select • Max {formatFileSize(maxSize)}
              </p>
            </div>
            
            <div className="flex space-x-2 text-xs text-gray-400">
              <span className="flex items-center space-x-1">
                <span>🖼️</span>
                <span>Images</span>
              </span>
              <span className="flex items-center space-x-1">
                <span>🎥</span>
                <span>Videos</span>
              </span>
              <span className="flex items-center space-x-1">
                <span>🎵</span>
                <span>Audio</span>
              </span>
              <span className="flex items-center space-x-1">
                <span>📄</span>
                <span>Documents</span>
              </span>
            </div>
          </div>
        </div>

        {isUploading && (
          <div className="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center rounded-lg">
            <div className="flex items-center space-x-2">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
              <span className="text-sm font-medium text-gray-700">Uploading...</span>
            </div>
          </div>
        )}
      </div>

      {/* Preview Modal */}
      {showPreview && selectedFile && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Preview File</h3>
              <button
                onClick={handleCancelUpload}
                className="text-gray-500 hover:text-gray-700"
              >
                ❌
              </button>
            </div>

            <div className="mb-4">
              <div className="flex items-center space-x-3 mb-3">
                {getFileIcon(selectedFile.type)}
                <div>
                  <p className="font-medium text-gray-900">{selectedFile.name}</p>
                  <p className="text-sm text-gray-500">
                    {formatFileSize(selectedFile.size)} • {selectedFile.type}
                  </p>
                </div>
              </div>

              {/* Preview content */}
              {previewUrl && (
                <div className="mt-4 rounded-lg overflow-hidden">
                  {selectedFile.type.startsWith('image/') && (
                    <img 
                      src={previewUrl} 
                      alt="Preview" 
                      className="max-w-full max-h-96 object-contain mx-auto"
                    />
                  )}
                  {selectedFile.type.startsWith('video/') && (
                    <video 
                      src={previewUrl} 
                      controls 
                      className="max-w-full max-h-96 mx-auto"
                    />
                  )}
                </div>
              )}
            </div>

            <div className="flex justify-end space-x-3">
              <button
                onClick={handleCancelUpload}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmUpload}
                disabled={isUploading}
                className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50"
              >
                {isUploading ? 'Uploading...' : 'Send File'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default FileUpload;
