# Document Management & Digital Contract API Documentation

## Overview
This API provides comprehensive document management and digital contract signing capabilities for the Cigar Order Hub platform. It enables suppliers to upload documents, create contracts, and manage digital signatures from retailers.

## Authentication
All endpoints require JWT authentication. Include the token in the Authorization header:
```
Authorization: Bearer <token>
```

## Base URL
```
http://localhost:4000/api/protected
```

---

## Document Management

### Upload Document
Upload a document for a specific supplier-retailer relationship.

**Endpoint:** `POST /documents/upload`

**Request:**
- Content-Type: `multipart/form-data`
- Body:
  - `file`: Document file (PDF, JPG, PNG, DOC, DOCX, max 50MB)
  - `supplierId`: Supplier user ID
  - `retailerId`: Retailer user ID
  - `documentType`: Type of document (invoice, contract, license, certificate, report, photo, other)
  - `notes`: Optional notes about the document

**Response:**
```json
{
  "success": true,
  "message": "Document uploaded successfully",
  "documentId": 123,
  "filename": "invoice.pdf"
}
```

---

### Get Supplier Documents
Retrieve all documents for a specific supplier-retailer relationship.

**Endpoint:** `GET /documents/supplier/:supplierId/retailer/:retailerId`

**Response:**
```json
{
  "documents": [
    {
      "id": 123,
      "supplier_id": 1,
      "retailer_id": 2,
      "filename": "invoice.pdf",
      "file_type": "application/pdf",
      "file_size": 245760,
      "upload_date": "2024-01-15T10:30:00Z",
      "uploader_id": 1,
      "document_type": "invoice",
      "status": "active",
      "notes": "Q1 Invoice"
    }
  ]
}
```

---

### Download Document
Download a specific document file.

**Endpoint:** `GET /documents/:id/download`

**Response:** File download (binary)

---

### Delete Document
Soft delete a document (marks as deleted, doesn't remove file).

**Endpoint:** `DELETE /documents/:id`

**Response:**
```json
{
  "success": true,
  "message": "Document deleted successfully"
}
```

---

### Scan and Enhance Document
Apply image enhancements to a scanned document (auto-crop, contrast adjustment).

**Endpoint:** `POST /documents/:id/scan-enhance`

**Request:**
```json
{
  "enhance": true
}
```

**Response:**
```json
{
  "success": true,
  "message": "Document enhanced successfully",
  "documentId": 123
}
```

---

### Get Document Audit Log
Retrieve the audit trail for a document.

**Endpoint:** `GET /documents/:id/audit-log`

**Response:**
```json
{
  "logs": [
    {
      "id": 1,
      "entity_type": "document",
      "entity_id": 123,
      "action": "upload",
      "user_id": 1,
      "user_name": "John Supplier",
      "timestamp": "2024-01-15T10:30:00Z",
      "ip_address": "192.168.1.1",
      "notes": "Uploaded document: invoice.pdf"
    }
  ]
}
```

---

## Digital Contracts

### Create Contract
Create a new digital contract.

**Endpoint:** `POST /contracts/create`

**Request:**
```json
{
  "supplierId": 1,
  "retailerId": 2,
  "contractName": "Supply Agreement 2024",
  "contractContent": "This agreement is entered into...",
  "signatureRequiredBy": "2024-12-31"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Contract created successfully",
  "contractId": 456
}
```

---

### Send Contract to Retailer
Send a draft contract to retailer for signing.

**Endpoint:** `POST /contracts/:id/send`

**Response:**
```json
{
  "success": true,
  "message": "Contract sent to retailer successfully"
}
```

---

### Get Contract Details
Retrieve detailed information about a contract.

**Endpoint:** `GET /contracts/:id`

**Response:**
```json
{
  "contract": {
    "id": 456,
    "supplier_id": 1,
    "retailer_id": 2,
    "contract_name": "Supply Agreement 2024",
    "contract_content": "This agreement is entered into...",
    "pdf_file_path": "/uploads/contracts/1/2/contract_456_1234567890.pdf",
    "status": "sent",
    "created_date": "2024-01-15T10:00:00Z",
    "sent_date": "2024-01-15T11:00:00Z",
    "signed_date": null,
    "supplier_name": "John Supplier",
    "retailer_name": "Jane Retailer"
  }
}
```

---

### Get Supplier Contracts
List all contracts for a supplier.

**Endpoint:** `GET /contracts/supplier/:supplierId`

**Response:**
```json
{
  "contracts": [
    {
      "id": 456,
      "contract_name": "Supply Agreement 2024",
      "status": "sent",
      "created_date": "2024-01-15T10:00:00Z",
      "sent_date": "2024-01-15T11:00:00Z",
      "retailer_id": 2,
      "retailer_name": "Jane Retailer",
      "signature_id": null
    }
  ]
}
```

---

### Get Pending Contracts for Retailer
List all contracts awaiting signature from a retailer.

**Endpoint:** `GET /contracts/retailer/:retailerId/pending`

**Response:**
```json
{
  "contracts": [
    {
      "id": 456,
      "contract_name": "Supply Agreement 2024",
      "status": "sent",
      "sent_date": "2024-01-15T11:00:00Z",
      "signature_required_by": "2024-12-31",
      "supplier_id": 1,
      "supplier_name": "John Supplier"
    }
  ]
}
```

---

### Update Contract Status
Update the status of a contract.

**Endpoint:** `PUT /contracts/:id/status`

**Request:**
```json
{
  "status": "cancelled"
}
```

**Valid statuses:** draft, sent, viewed, signed, completed, cancelled

**Response:**
```json
{
  "success": true,
  "message": "Contract status updated successfully"
}
```

---

### Get Contract Audit Log
Retrieve the audit trail for a contract.

**Endpoint:** `GET /contracts/:id/audit-log`

**Response:**
```json
{
  "logs": [
    {
      "id": 2,
      "entity_type": "contract",
      "entity_id": 456,
      "action": "create",
      "user_id": 1,
      "user_name": "John Supplier",
      "timestamp": "2024-01-15T10:00:00Z",
      "notes": "Created contract: Supply Agreement 2024"
    }
  ]
}
```

---

## E-Signatures

### Initialize Signature Workflow
Start the signature process for a contract.

**Endpoint:** `POST /contracts/:contractId/signature/initialize`

**Response:**
```json
{
  "success": true,
  "message": "Signature workflow initialized",
  "contract": {
    "id": 456,
    "name": "Supply Agreement 2024",
    "content": "This agreement is entered into...",
    "status": "sent"
  }
}
```

---

### Submit Signature
Submit a digital signature for a contract.

**Endpoint:** `POST /contracts/:contractId/signature`

**Request:**
```json
{
  "signatureType": "draw",
  "signatureData": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA...",
  "signerName": "Jane Retailer"
}
```

**Signature Types:**
- `draw`: Canvas-drawn signature (base64 image)
- `type`: Typed signature (text string)
- `upload`: Uploaded signature image (base64 image)

**Response:**
```json
{
  "success": true,
  "message": "Signature saved successfully",
  "signatureId": 789
}
```

---

### Get Signature Status
Check if a contract has been signed.

**Endpoint:** `GET /contracts/:contractId/signature-status`

**Response:**
```json
{
  "contractStatus": "signed",
  "isSigned": true,
  "signature": {
    "id": 789,
    "signer_name": "Jane Retailer",
    "signature_type": "draw",
    "signed_date": "2024-01-16T09:30:00Z"
  }
}
```

---

### Complete Contract Signing
Generate final signed PDF and mark contract as completed.

**Endpoint:** `POST /contracts/:contractId/complete`

**Response:**
```json
{
  "success": true,
  "message": "Contract signing completed successfully",
  "pdfAvailable": true
}
```

---

### Download Signed Contract
Download the signed contract PDF.

**Endpoint:** `GET /contracts/:contractId/download`

**Response:** PDF file download (binary)

---

## Error Responses

All endpoints return standard error responses:

```json
{
  "error": "Error message describing what went wrong"
}
```

**Common HTTP Status Codes:**
- `200`: Success
- `400`: Bad Request (validation error)
- `401`: Unauthorized (invalid or missing token)
- `403`: Forbidden (insufficient permissions)
- `404`: Not Found (resource doesn't exist)
- `500`: Internal Server Error

---

## File Size Limits

- Maximum document size: 50MB (configurable via `MAX_DOCUMENT_SIZE`)
- Supported file types: PDF, JPG, JPEG, PNG, DOC, DOCX (configurable via `ALLOWED_DOCUMENT_TYPES`)

---

## Security Features

1. **Authentication**: All endpoints require valid JWT token
2. **Authorization**: Users can only access their own documents/contracts
3. **Audit Logging**: All actions are logged with timestamp, user, and IP
4. **Secure File Storage**: Files stored with hashed filenames to prevent directory traversal
5. **Rate Limiting**: Upload endpoints have rate limiting (10 uploads per 5 minutes)
6. **File Validation**: Type and size validation on all uploads

---

## Environment Variables

```bash
# Document Storage
DOCUMENT_STORAGE_PATH=/uploads/documents
MAX_DOCUMENT_SIZE=52428800  # 50MB in bytes
ALLOWED_DOCUMENT_TYPES=pdf,jpg,jpeg,png,doc,docx

# Contract Storage
CONTRACT_STORAGE_PATH=/uploads/contracts

# Signature Storage
SIGNATURE_STORAGE_PATH=/uploads/signatures
```
