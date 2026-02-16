'use client';

import React, { useRef, useEffect, useState } from 'react';
import SignatureCanvas from 'react-signature-canvas';

interface SignaturePadProps {
  onSignatureChange: (signatureData: string | null) => void;
  width?: number;
  height?: number;
}

export default function SignaturePad({ onSignatureChange, width = 500, height = 200 }: SignaturePadProps) {
  const sigCanvas = useRef<SignatureCanvas>(null);
  const [penColor, setPenColor] = useState('#000000');
  const [penSize, setPenSize] = useState(2);

  const clearSignature = () => {
    sigCanvas.current?.clear();
    onSignatureChange(null);
  };

  const saveSignature = () => {
    if (sigCanvas.current) {
      const isEmpty = sigCanvas.current.isEmpty();
      if (!isEmpty) {
        const dataUrl = sigCanvas.current.toDataURL('image/png');
        onSignatureChange(dataUrl);
      } else {
        onSignatureChange(null);
      }
    }
  };

  useEffect(() => {
    // Auto-save signature on stroke end
    const canvas = sigCanvas.current?.getCanvas();
    if (canvas) {
      canvas.addEventListener('mouseup', saveSignature);
      canvas.addEventListener('touchend', saveSignature);
      return () => {
        canvas.removeEventListener('mouseup', saveSignature);
        canvas.removeEventListener('touchend', saveSignature);
      };
    }
  }, []);

  return (
    <div className="signature-pad-container">
      <div className="signature-controls">
        <label>
          Pen Color:
          <input
            type="color"
            value={penColor}
            onChange={(e) => {
              setPenColor(e.target.value);
              if (sigCanvas.current) {
                sigCanvas.current.penColor = e.target.value;
              }
            }}
          />
        </label>
        <label>
          Pen Size:
          <input
            type="range"
            min="1"
            max="5"
            value={penSize}
            onChange={(e) => {
              const size = parseInt(e.target.value);
              setPenSize(size);
              if (sigCanvas.current) {
                sigCanvas.current.minWidth = size * 0.5;
                sigCanvas.current.maxWidth = size;
              }
            }}
          />
          <span>{penSize}px</span>
        </label>
        <button type="button" onClick={clearSignature} className="btn-secondary">
          Clear
        </button>
      </div>
      <div className="signature-canvas-wrapper">
        <SignatureCanvas
          ref={sigCanvas}
          canvasProps={{
            width: width,
            height: height,
            className: 'signature-canvas'
          }}
          backgroundColor="#ffffff"
          penColor={penColor}
          minWidth={penSize * 0.5}
          maxWidth={penSize}
        />
      </div>
      <style jsx>{`
        .signature-pad-container {
          border: 1px solid #ddd;
          border-radius: 8px;
          padding: 16px;
          background: #f9f9f9;
        }
        .signature-controls {
          display: flex;
          gap: 16px;
          margin-bottom: 12px;
          align-items: center;
          flex-wrap: wrap;
        }
        .signature-controls label {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 14px;
        }
        .signature-canvas-wrapper {
          border: 2px solid #333;
          border-radius: 4px;
          background: white;
          display: inline-block;
        }
        .signature-canvas {
          display: block;
          touch-action: none;
        }
      `}</style>
    </div>
  );
}
