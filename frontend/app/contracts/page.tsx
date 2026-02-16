'use client';

import React, { useState, useEffect } from 'react';
import { Contract } from '../types/documents';

export default function ContractsPage() {
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [currentUserId] = useState<number>(1); // Mock user ID

  // Form state
  const [formData, setFormData] = useState({
    supplierId: currentUserId,
    retailerId: 1,
    contractName: '',
    contractContent: '',
    signatureRequiredBy: ''
  });

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

  const loadContracts = async () => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(
        `${apiUrl}/api/protected/contracts/supplier/${currentUserId}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );

      if (!response.ok) {
        throw new Error('Failed to load contracts');
      }

      const data = await response.json();
      setContracts(data.contracts || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadContracts();
  }, []);

  const handleCreateContract = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.contractName || !formData.contractContent) {
      alert('Please fill in all required fields');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(
        `${apiUrl}/api/protected/contracts/create`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(formData)
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create contract');
      }

      alert('Contract created successfully!');
      setShowCreateForm(false);
      setFormData({
        supplierId: currentUserId,
        retailerId: 1,
        contractName: '',
        contractContent: '',
        signatureRequiredBy: ''
      });
      loadContracts();
    } catch (err: any) {
      alert('Error creating contract: ' + err.message);
    }
  };

  const handleSendContract = async (contractId: number) => {
    if (!confirm('Send this contract to the retailer for signing?')) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(
        `${apiUrl}/api/protected/contracts/${contractId}/send`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );

      if (!response.ok) {
        throw new Error('Failed to send contract');
      }

      alert('Contract sent successfully!');
      loadContracts();
    } catch (err: any) {
      alert('Error sending contract: ' + err.message);
    }
  };

  const handleDownload = async (contractId: number, contractName: string) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(
        `${apiUrl}/api/protected/contracts/${contractId}/download`,
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );

      if (!response.ok) {
        throw new Error('Failed to download contract');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${contractName.replace(/[^a-z0-9]/gi, '_')}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err: any) {
      alert('Error downloading contract: ' + err.message);
    }
  };

  const formatDate = (dateStr: string | undefined) => {
    if (!dateStr) return 'N/A';
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <div className="contracts-page">
      <div className="page-header">
        <h1>Digital Contracts</h1>
        <button 
          onClick={() => setShowCreateForm(!showCreateForm)}
          className="btn-primary"
        >
          {showCreateForm ? 'Cancel' : '+ New Contract'}
        </button>
      </div>

      {showCreateForm && (
        <div className="create-form-section">
          <h2>Create New Contract</h2>
          <form onSubmit={handleCreateContract}>
            <div className="form-group">
              <label>Contract Name *</label>
              <input
                type="text"
                value={formData.contractName}
                onChange={(e) => setFormData({...formData, contractName: e.target.value})}
                placeholder="e.g., Supply Agreement 2024"
                required
              />
            </div>

            <div className="form-group">
              <label>Retailer ID *</label>
              <input
                type="number"
                value={formData.retailerId}
                onChange={(e) => setFormData({...formData, retailerId: parseInt(e.target.value)})}
                required
              />
            </div>

            <div className="form-group">
              <label>Contract Content *</label>
              <textarea
                value={formData.contractContent}
                onChange={(e) => setFormData({...formData, contractContent: e.target.value})}
                placeholder="Enter contract terms and conditions..."
                rows={10}
                required
              />
            </div>

            <div className="form-group">
              <label>Signature Required By (optional)</label>
              <input
                type="date"
                value={formData.signatureRequiredBy}
                onChange={(e) => setFormData({...formData, signatureRequiredBy: e.target.value})}
              />
            </div>

            <button type="submit" className="btn-primary">Create Contract</button>
          </form>
        </div>
      )}

      <div className="contracts-section">
        <h2>Your Contracts</h2>
        {loading && <p>Loading contracts...</p>}
        {error && <p className="error">{error}</p>}
        
        {!loading && contracts.length === 0 && (
          <p className="no-data">No contracts found. Create your first contract above.</p>
        )}

        {!loading && contracts.length > 0 && (
          <div className="contracts-table">
            <table>
              <thead>
                <tr>
                  <th>Contract Name</th>
                  <th>Retailer</th>
                  <th>Status</th>
                  <th>Created</th>
                  <th>Sent</th>
                  <th>Signed</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {contracts.map((contract) => (
                  <tr key={contract.id}>
                    <td>{contract.contract_name}</td>
                    <td>{contract.retailer_name || `Retailer #${contract.retailer_id}`}</td>
                    <td>
                      <span className={`status-badge status-${contract.status}`}>
                        {contract.status}
                      </span>
                    </td>
                    <td>{formatDate(contract.created_date)}</td>
                    <td>{formatDate(contract.sent_date)}</td>
                    <td>{formatDate(contract.signed_date)}</td>
                    <td>
                      {contract.status === 'draft' && (
                        <button
                          onClick={() => handleSendContract(contract.id)}
                          className="btn-small btn-primary"
                        >
                          Send
                        </button>
                      )}
                      {(contract.status === 'signed' || contract.status === 'completed') && (
                        <button
                          onClick={() => handleDownload(contract.id, contract.contract_name)}
                          className="btn-small btn-success"
                        >
                          Download PDF
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <style jsx>{`
        .contracts-page {
          padding: 24px;
          max-width: 1400px;
          margin: 0 auto;
        }
        .page-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 24px;
        }
        .create-form-section {
          background: white;
          border-radius: 8px;
          padding: 24px;
          margin-bottom: 24px;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        .contracts-section {
          background: white;
          border-radius: 8px;
          padding: 24px;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        .form-group {
          margin-bottom: 16px;
        }
        .form-group label {
          display: block;
          margin-bottom: 8px;
          font-weight: 600;
        }
        .form-group input,
        .form-group textarea {
          width: 100%;
          padding: 10px;
          border: 1px solid #ddd;
          border-radius: 4px;
          font-size: 16px;
          font-family: inherit;
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
        .contracts-table {
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
        .status-badge {
          padding: 4px 8px;
          border-radius: 4px;
          font-size: 12px;
          font-weight: 600;
          text-transform: uppercase;
        }
        .status-draft { background: #e2e3e5; color: #383d41; }
        .status-sent, .status-viewed { background: #fff3cd; color: #856404; }
        .status-signed { background: #d4edda; color: #155724; }
        .status-completed { background: #d1ecf1; color: #0c5460; }
        .btn-primary, .btn-success {
          padding: 10px 20px;
          border: none;
          border-radius: 4px;
          font-size: 16px;
          cursor: pointer;
          transition: background 0.3s;
        }
        .btn-primary {
          background: #007bff;
          color: white;
        }
        .btn-primary:hover {
          background: #0056b3;
        }
        .btn-small {
          padding: 6px 12px;
          font-size: 14px;
          margin-right: 8px;
        }
        .btn-success {
          background: #28a745;
          color: white;
        }
        .btn-success:hover {
          background: #218838;
        }
      `}</style>
    </div>
  );
}
