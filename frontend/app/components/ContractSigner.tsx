'use client';

import React, { useState } from 'react';
import SignaturePad from './SignaturePad';
import { Contract } from '../types/documents';

interface ContractSignerProps {
  contract: Contract;
  onSignComplete?: (contractId: number) => void;
  onError?: (error: string) => void;
}

export default function ContractSigner({ contract, onSignComplete, onError }: ContractSignerProps) {
  const [signatureType, setSignatureType] = useState<'draw' | 'type' | 'upload'>('draw');
  const [signatureData, setSignatureData] = useState<string | null>(null);
  const [typedSignature, setTypedSignature] = useState('');
  const [signerName, setSignerName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showContract, setShowContract] = useState(true);

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

  const handleSubmitSignature = async () => {
    if (!signerName.trim()) {
      alert('Please enter your name');
      return;
    }

    let finalSignatureData = signatureData;
    if (signatureType === 'type') {
      if (!typedSignature.trim()) {
        alert('Please type your signature');
        return;
      }
      finalSignatureData = typedSignature;
    }

    if (!finalSignatureData) {
      alert('Please provide a signature');
      return;
    }

    setIsSubmitting(true);

    try {
      const token = localStorage.getItem('token');

      // Submit signature
      const response = await fetch(
        `${apiUrl}/api/protected/contracts/${contract.id}/signature`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            signatureType,
            signatureData: finalSignatureData,
            signerName
          })
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to submit signature');
      }

      // Complete the signing process
      const completeResponse = await fetch(
        `${apiUrl}/api/protected/contracts/${contract.id}/complete`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );

      if (!completeResponse.ok) {
        throw new Error('Failed to complete contract signing');
      }

      alert('Contract signed successfully!');
      if (onSignComplete) {
        onSignComplete(contract.id);
      }

    } catch (err: any) {
      const errorMsg = err.message || 'Failed to sign contract';
      alert(errorMsg);
      if (onError) {
        onError(errorMsg);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="contract-signer">
      <div className="contract-header">
        <h2>{contract.contract_name}</h2>
        <span className={`status-badge status-${contract.status}`}>
          {contract.status}
        </span>
      </div>

      {showContract && (
        <div className="contract-content">
          <h3>Contract Content</h3>
          <div className="contract-text">
            {contract.contract_content.split('\n').map((line, i) => (
              <p key={i}>{line}</p>
            ))}
          </div>
          <button 
            onClick={() => setShowContract(false)}
            className="btn-primary"
          >
            Proceed to Sign
          </button>
        </div>
      )}

      {!showContract && (
        <div className="signature-section">
          <h3>Sign Contract</h3>
          
          <div className="form-group">
            <label>Your Name:</label>
            <input
              type="text"
              value={signerName}
              onChange={(e) => setSignerName(e.target.value)}
              placeholder="Enter your full name"
              className="form-input"
            />
          </div>

          <div className="signature-type-selector">
            <label>Signature Method:</label>
            <div className="radio-group">
              <label>
                <input
                  type="radio"
                  value="draw"
                  checked={signatureType === 'draw'}
                  onChange={() => setSignatureType('draw')}
                />
                Draw Signature
              </label>
              <label>
                <input
                  type="radio"
                  value="type"
                  checked={signatureType === 'type'}
                  onChange={() => setSignatureType('type')}
                />
                Type Signature
              </label>
            </div>
          </div>

          {signatureType === 'draw' && (
            <div className="signature-draw">
              <SignaturePad 
                onSignatureChange={setSignatureData}
                width={500}
                height={200}
              />
            </div>
          )}

          {signatureType === 'type' && (
            <div className="signature-type">
              <label>Type your signature:</label>
              <input
                type="text"
                value={typedSignature}
                onChange={(e) => {
                  setTypedSignature(e.target.value);
                  setSignatureData(e.target.value);
                }}
                placeholder="John Doe"
                className="form-input signature-input"
              />
              {typedSignature && (
                <div className="signature-preview">
                  {typedSignature}
                </div>
              )}
            </div>
          )}

          <div className="action-buttons">
            <button
              onClick={() => setShowContract(true)}
              className="btn-secondary"
              disabled={isSubmitting}
            >
              Back to Contract
            </button>
            <button
              onClick={handleSubmitSignature}
              className="btn-success"
              disabled={isSubmitting || !signatureData || !signerName}
            >
              {isSubmitting ? 'Signing...' : 'Sign Contract'}
            </button>
          </div>
        </div>
      )}

      <style jsx>{`
        .contract-signer {
          max-width: 800px;
          margin: 0 auto;
          padding: 24px;
        }
        .contract-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 24px;
        }
        .status-badge {
          padding: 6px 12px;
          border-radius: 4px;
          font-size: 14px;
          font-weight: 600;
          text-transform: uppercase;
        }
        .status-sent, .status-viewed {
          background: #fff3cd;
          color: #856404;
        }
        .status-signed {
          background: #d4edda;
          color: #155724;
        }
        .contract-content {
          background: white;
          border: 1px solid #ddd;
          border-radius: 8px;
          padding: 24px;
          margin-bottom: 24px;
        }
        .contract-text {
          max-height: 400px;
          overflow-y: auto;
          padding: 16px;
          background: #f9f9f9;
          border-radius: 4px;
          margin: 16px 0;
        }
        .contract-text p {
          margin: 8px 0;
          line-height: 1.6;
        }
        .signature-section {
          background: white;
          border: 1px solid #ddd;
          border-radius: 8px;
          padding: 24px;
        }
        .form-group {
          margin-bottom: 20px;
        }
        .form-group label {
          display: block;
          margin-bottom: 8px;
          font-weight: 600;
        }
        .form-input {
          width: 100%;
          padding: 10px;
          border: 1px solid #ddd;
          border-radius: 4px;
          font-size: 16px;
        }
        .signature-type-selector {
          margin-bottom: 24px;
        }
        .radio-group {
          display: flex;
          gap: 20px;
          margin-top: 8px;
        }
        .radio-group label {
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .signature-input {
          font-family: 'Brush Script MT', cursive;
          font-size: 24px;
        }
        .signature-preview {
          margin-top: 16px;
          padding: 20px;
          border: 2px solid #333;
          border-radius: 4px;
          background: white;
          font-family: 'Brush Script MT', cursive;
          font-size: 36px;
          text-align: center;
        }
        .action-buttons {
          display: flex;
          gap: 12px;
          justify-content: flex-end;
          margin-top: 24px;
        }
        .btn-primary, .btn-secondary, .btn-success {
          padding: 12px 24px;
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
        .btn-secondary {
          background: #6c757d;
          color: white;
        }
        .btn-secondary:hover {
          background: #545b62;
        }
        .btn-success {
          background: #28a745;
          color: white;
        }
        .btn-success:hover:not(:disabled) {
          background: #218838;
        }
        button:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }
      `}</style>
    </div>
  );
}
