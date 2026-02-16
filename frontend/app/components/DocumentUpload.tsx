'use client';

import React, { useState, useRef } from 'react';
import { UploadProgress } from '../types/documents';

interface DocumentUploadProps {
  supplierId: number;
  retailerId: number;
  documentType?: string;
  onUploadComplete?: (documentId: number) => void;
  onUploadError?: (error: string) => void;
}

export default function DocumentUpload({
  supplierId,
  retailerId,
  documentType = 'other',
  onUploadComplete,
  onUploadError
}: DocumentUploadProps) {
  const [uploadProgress, setUploadProgress] = useState<UploadProgress>({
    progress: 0,
    status: 'idle'
  });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg', 
    'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
  const maxSize = 50 * 1024 * 1024; // 50MB

  const validateFile = (file: File): string | null => {
    if (!allowedTypes.includes(file.type)) {
      return 'Invalid file type. Allowed types: PDF, JPG, PNG, DOC, DOCX';
    }
    if (file.size > maxSize) {
      return `File size exceeds maximum allowed size of ${maxSize / 1024 / 1024}MB`;
    }
    return null;
  };

  const handleFileSelect = (file: File) => {
    const error = validateFile(file);
    if (error) {
      setUploadProgress({ progress: 0, status: 'error', message: error });
      if (onUploadError) onUploadError(error);
      return;
    }
    setSelectedFile(file);
    setUploadProgress({ progress: 0, status: 'idle' });
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  const uploadDocument = async () => {
    if (!selectedFile) return;

    setUploadProgress({ progress: 10, status: 'uploading', message: 'Preparing upload...' });

    try {
      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('supplierId', supplierId.toString());
      formData.append('retailerId', retailerId.toString());
      formData.append('documentType', documentType);

      const token = localStorage.getItem('token');
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

      setUploadProgress({ progress: 30, status: 'uploading', message: 'Uploading file...' });

      const response = await fetch(`${apiUrl}/api/protected/documents/upload`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      setUploadProgress({ progress: 80, status: 'processing', message: 'Processing document...' });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Upload failed');
      }

      const data = await response.json();

      setUploadProgress({ 
        progress: 100, 
        status: 'success', 
        message: 'Document uploaded successfully!' 
      });

      if (onUploadComplete) {
        onUploadComplete(data.documentId);
      }

      // Reset after 2 seconds
      setTimeout(() => {
        setSelectedFile(null);
        setUploadProgress({ progress: 0, status: 'idle' });
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      }, 2000);

    } catch (error: any) {
      setUploadProgress({ 
        progress: 0, 
        status: 'error', 
        message: error.message || 'Upload failed' 
      });
      if (onUploadError) {
        onUploadError(error.message);
      }
    }
  };

  return (
    <div className="document-upload">
      <div
        className={`drop-zone ${isDragging ? 'dragging' : ''}`}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={() => fileInputRef.current?.click()}
      >
        <input
          ref={fileInputRef}
          type="file"
          onChange={handleFileInput}
          accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
          style={{ display: 'none' }}
        />
        <div className="drop-zone-content">
          {selectedFile ? (
            <>
              <p className="file-name">📄 {selectedFile.name}</p>
              <p className="file-size">
                {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
              </p>
            </>
          ) : (
            <>
              <p>📁 Drag and drop a file here</p>
              <p>or click to browse</p>
              <p className="file-types">PDF, JPG, PNG, DOC, DOCX (max 50MB)</p>
            </>
          )}
        </div>
      </div>

      {uploadProgress.status !== 'idle' && (
        <div className="upload-progress">
          <div className="progress-bar">
            <div 
              className={`progress-fill ${uploadProgress.status}`}
              style={{ width: `${uploadProgress.progress}%` }}
            />
          </div>
          <p className={`status-message ${uploadProgress.status}`}>
            {uploadProgress.message}
          </p>
        </div>
      )}

      {selectedFile && uploadProgress.status === 'idle' && (
        <button onClick={uploadDocument} className="btn-primary">
          Upload Document
        </button>
      )}

      <style jsx>{`
        .document-upload {
          width: 100%;
          max-width: 600px;
        }
        .drop-zone {
          border: 2px dashed #ccc;
          border-radius: 8px;
          padding: 40px;
          text-align: center;
          cursor: pointer;
          transition: all 0.3s;
          background: #f9f9f9;
        }
        .drop-zone:hover, .drop-zone.dragging {
          border-color: #007bff;
          background: #e7f3ff;
        }
        .drop-zone-content p {
          margin: 8px 0;
        }
        .file-name {
          font-weight: bold;
          font-size: 16px;
        }
        .file-size {
          color: #666;
          font-size: 14px;
        }
        .file-types {
          font-size: 12px;
          color: #888;
          margin-top: 12px;
        }
        .upload-progress {
          margin-top: 20px;
        }
        .progress-bar {
          width: 100%;
          height: 30px;
          background: #e0e0e0;
          border-radius: 15px;
          overflow: hidden;
        }
        .progress-fill {
          height: 100%;
          transition: width 0.3s;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-weight: bold;
        }
        .progress-fill.uploading, .progress-fill.processing {
          background: #007bff;
        }
        .progress-fill.success {
          background: #28a745;
        }
        .progress-fill.error {
          background: #dc3545;
        }
        .status-message {
          margin-top: 10px;
          font-weight: 500;
        }
        .status-message.uploading, .status-message.processing {
          color: #007bff;
        }
        .status-message.success {
          color: #28a745;
        }
        .status-message.error {
          color: #dc3545;
        }
        .btn-primary {
          margin-top: 16px;
          width: 100%;
        }
      `}</style>
    </div>
  );
}
