'use client';

import React, { useState, useEffect } from 'react';
import DocumentUpload from '../components/DocumentUpload';
import { Document } from '../types/documents';

export default function DocumentsPage() {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedRetailerId, setSelectedRetailerId] = useState<number>(1);
  const [currentUserId, setCurrentUserId] = useState<number>(1);

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

  const loadDocuments = async () => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(
        `${apiUrl}/api/protected/documents/supplier/${currentUserId}/retailer/${selectedRetailerId}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );

      if (!response.ok) {
        throw new Error('Failed to load documents');
      }

      const data = await response.json();
      setDocuments(data.documents || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDocuments();
  }, [selectedRetailerId]);

  const handleDownload = async (documentId: number, filename: string) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(
        `${apiUrl}/api/protected/documents/${documentId}/download`,
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );

      if (!response.ok) {
        throw new Error('Failed to download document');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err: any) {
      alert('Error downloading document: ' + err.message);
    }
  };

  const handleDelete = async (documentId: number) => {
    if (!confirm('Are you sure you want to delete this document?')) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(
        `${apiUrl}/api/protected/documents/${documentId}`,
        {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );

      if (!response.ok) {
        throw new Error('Failed to delete document');
      }

      loadDocuments();
    } catch (err: any) {
      alert('Error deleting document: ' + err.message);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB';
    return (bytes / 1024 / 1024).toFixed(2) + ' MB';
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="documents-page">
      <h1>Document Management</h1>
      
      <div className="page-section">
        <h2>Upload Document</h2>
        <DocumentUpload
          supplierId={currentUserId}
          retailerId={selectedRetailerId}
          documentType="other"
          onUploadComplete={() => loadDocuments()}
          onUploadError={(err) => setError(err)}
        />
      </div>

      <div className="page-section">
        <h2>Documents</h2>
        {loading && <p>Loading documents...</p>}
        {error && <p className="error">{error}</p>}
        
        {!loading && documents.length === 0 && (
          <p className="no-data">No documents found. Upload your first document above.</p>
        )}

        {!loading && documents.length > 0 && (
          <div className="documents-table">
            <table>
              <thead>
                <tr>
                  <th>Filename</th>
                  <th>Type</th>
                  <th>Size</th>
                  <th>Uploaded</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {documents.map((doc) => (
                  <tr key={doc.id}>
                    <td>
                      <span className="file-icon">📄</span>
                      {doc.filename}
                    </td>
                    <td>
                      <span className={`badge badge-${doc.document_type}`}>
                        {doc.document_type}
                      </span>
                    </td>
                    <td>{formatFileSize(doc.file_size)}</td>
                    <td>{formatDate(doc.upload_date)}</td>
                    <td>
                      <button
                        onClick={() => handleDownload(doc.id, doc.filename)}
                        className="btn-small btn-primary"
                      >
                        Download
                      </button>
                      <button
                        onClick={() => handleDelete(doc.id)}
                        className="btn-small btn-danger"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <style jsx>{`
        .documents-page {
          padding: 24px;
          max-width: 1200px;
          margin: 0 auto;
        }
        h1 {
          margin-bottom: 24px;
        }
        .page-section {
          background: white;
          border-radius: 8px;
          padding: 24px;
          margin-bottom: 24px;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        .page-section h2 {
          margin-top: 0;
          margin-bottom: 16px;
        }
        .error {
          color: #dc3545;
          padding: 12px;
          background: #f8d7da;
          border: 1px solid #f5c6cb;
          border-radius: 4px;
        }
        .no-data {
          color: #666;
          text-align: center;
          padding: 40px;
        }
        .documents-table {
          overflow-x: auto;
        }
        table {
          width: 100%;
          border-collapse: collapse;
        }
        th, td {
          text-align: left;
          padding: 12px;
          border-bottom: 1px solid #ddd;
        }
        th {
          background: #f8f9fa;
          font-weight: 600;
        }
        tr:hover {
          background: #f8f9fa;
        }
        .file-icon {
          margin-right: 8px;
        }
        .badge {
          padding: 4px 8px;
          border-radius: 4px;
          font-size: 12px;
          font-weight: 600;
          text-transform: uppercase;
        }
        .badge-invoice { background: #d1ecf1; color: #0c5460; }
        .badge-contract { background: #d4edda; color: #155724; }
        .badge-license { background: #fff3cd; color: #856404; }
        .badge-other { background: #e2e3e5; color: #383d41; }
        .btn-small {
          padding: 6px 12px;
          font-size: 14px;
          margin-right: 8px;
          border: none;
          border-radius: 4px;
          cursor: pointer;
        }
        .btn-primary {
          background: #007bff;
          color: white;
        }
        .btn-primary:hover {
          background: #0056b3;
        }
        .btn-danger {
          background: #dc3545;
          color: white;
        }
        .btn-danger:hover {
          background: #c82333;
        }
      `}</style>
    </div>
  );
}
