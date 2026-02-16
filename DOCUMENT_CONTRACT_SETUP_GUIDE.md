# Document Management & Digital Contract Setup Guide

## Overview
This guide walks through setting up the Document Management and Digital Contract system for the Cigar Order Hub platform.

## Prerequisites
- Node.js 16+ installed
- Backend and frontend running
- SQLite database configured
- JWT authentication set up

---

## Backend Setup

### 1. Install Dependencies

Navigate to the backend directory and install required packages:

```bash
cd backend
npm install multer sharp pdfkit
```

**Dependencies:**
- `multer`: Handles multipart file uploads
- `sharp`: Image processing for document enhancement
- `pdfkit`: PDF generation for contracts

### 2. Configure Environment Variables

Create or update your `.env` file in the `backend` directory:

```bash
# Document Management
DOCUMENT_STORAGE_PATH=/uploads/documents
MAX_DOCUMENT_SIZE=52428800  # 50MB
ALLOWED_DOCUMENT_TYPES=pdf,jpg,jpeg,png,doc,docx

# Contract Storage
CONTRACT_STORAGE_PATH=/uploads/contracts

# Signature Storage
SIGNATURE_STORAGE_PATH=/uploads/signatures

# Required for existing features
ENCRYPTION_KEY=your-encryption-key-32-chars-min
JWT_SECRET=your-jwt-secret-key
PORT=4000
FRONTEND_URL=http://localhost:3000
```

**Important:** Change `ENCRYPTION_KEY` and `JWT_SECRET` to secure random values in production.

### 3. Run Database Migrations

The migration file creates the following tables:
- `supplier_documents`: Document metadata and storage
- `digital_contracts`: Contract lifecycle management
- `contract_signatures`: E-signature data
- `document_audit_logs`: Audit trail for all actions

Run the migration:

```bash
cd backend
npm run migrate
```

Or manually:

```bash
sqlite3 cigar-hub.db < migrations/011_create_document_contract_tables.sql
```

### 4. Create Upload Directories

The system will auto-create directories, but you can create them manually:

```bash
mkdir -p uploads/documents
mkdir -p uploads/contracts
mkdir -p uploads/signatures
```

### 5. Start Backend Server

```bash
cd backend
npm start
```

Verify the server starts without errors and displays:
```
Backend running on port 4000
WebSocket server initialized
```

---

## Frontend Setup

### 1. Install Dependencies

Navigate to the frontend directory and install required packages:

```bash
cd frontend
npm install react-webcam react-signature-canvas react-pdf pdfjs-dist
```

**Dependencies:**
- `react-webcam`: Webcam capture for document scanning
- `react-signature-canvas`: Canvas-based signature drawing
- `react-pdf`: PDF viewing capabilities
- `pdfjs-dist`: PDF.js library for rendering PDFs

### 2. Configure Environment Variables

Create or update `.env.local` in the `frontend` directory:

```bash
NEXT_PUBLIC_API_URL=http://localhost:4000
```

### 3. Start Frontend

```bash
cd frontend
npm run dev
```

The frontend should be available at `http://localhost:3000`

---

## Feature Verification

### Test Document Upload

1. Navigate to `/documents`
2. Select a file or drag-and-drop
3. Click "Upload Document"
4. Verify the document appears in the list
5. Try downloading the document

### Test Contract Creation

1. Navigate to `/contracts`
2. Click "+ New Contract"
3. Fill in contract details:
   - Contract Name: "Test Agreement"
   - Retailer ID: Enter a valid retailer ID
   - Contract Content: Enter sample contract text
4. Click "Create Contract"
5. Verify contract appears with "draft" status

### Test Contract Signing

1. From contracts list, click "Send" on a draft contract
2. As a retailer user, navigate to `/contracts/pending` (or view contract directly)
3. Review contract content
4. Choose signature method (Draw or Type)
5. Provide signature
6. Click "Sign Contract"
7. Verify contract status changes to "signed"
8. Download the signed PDF

---

## API Endpoints

All endpoints are documented in `DOCUMENT_CONTRACT_API_DOCUMENTATION.md`

**Key Endpoints:**
- `POST /api/protected/documents/upload` - Upload document
- `GET /api/protected/documents/supplier/:supplierId/retailer/:retailerId` - List documents
- `POST /api/protected/contracts/create` - Create contract
- `POST /api/protected/contracts/:id/send` - Send contract
- `POST /api/protected/contracts/:contractId/signature` - Submit signature

---

## File Storage Structure

```
uploads/
├── documents/
│   └── {supplierId}/
│       └── {retailerId}/
│           └── {hash}_{timestamp}.{ext}
├── contracts/
│   └── {supplierId}/
│       └── {retailerId}/
│           └── contract_{id}_{timestamp}.pdf
└── signatures/
    └── {contractId}/
        └── signature_{timestamp}_{hash}.png
```

---

## Security Considerations

### File Upload Security
1. **File Type Validation**: Only allowed types can be uploaded
2. **File Size Limits**: Configurable maximum size (default 50MB)
3. **Secure Filenames**: Hash-based names prevent directory traversal
4. **Access Control**: Users can only access their own documents

### Contract Security
1. **Authorization Checks**: Suppliers create, retailers sign
2. **Audit Logging**: All actions tracked with user, timestamp, IP
3. **Status Workflow**: Prevents invalid state transitions
4. **Signature Verification**: IP and user agent recorded

### Best Practices
1. Use HTTPS in production
2. Set strong `ENCRYPTION_KEY` and `JWT_SECRET`
3. Configure rate limiting on upload endpoints
4. Regular backup of upload directories
5. Monitor audit logs for suspicious activity

---

## Troubleshooting

### Backend Won't Start
**Error:** `ENCRYPTION_KEY environment variable must be set`
**Solution:** Add `ENCRYPTION_KEY` to your `.env` file

### Document Upload Fails
**Error:** "File size exceeds maximum"
**Solution:** Increase `MAX_DOCUMENT_SIZE` in `.env` or reduce file size

### PDF Generation Fails
**Error:** "Failed to generate contract PDF"
**Solution:** 
- Check write permissions on contract directory
- Verify `CONTRACT_STORAGE_PATH` exists
- Check disk space

### Signature Not Saving
**Error:** "Invalid signature type"
**Solution:** Ensure signature type is one of: `draw`, `type`, `upload`

### Frontend Can't Connect
**Error:** Network request failed
**Solution:** 
- Verify `NEXT_PUBLIC_API_URL` is correct
- Check backend is running on correct port
- Verify CORS configuration in backend

---

## Database Schema

### supplier_documents
```sql
- id: INTEGER PRIMARY KEY
- supplier_id: INTEGER (FK to users)
- retailer_id: INTEGER (FK to users)
- filename: TEXT
- file_path: TEXT
- file_type: TEXT
- file_size: INTEGER
- upload_date: TEXT (ISO datetime)
- uploader_id: INTEGER (FK to users)
- document_type: TEXT (enum)
- status: TEXT (enum)
- notes: TEXT
```

### digital_contracts
```sql
- id: INTEGER PRIMARY KEY
- supplier_id: INTEGER (FK to users)
- retailer_id: INTEGER (FK to users)
- contract_name: TEXT
- contract_content: TEXT
- pdf_file_path: TEXT
- status: TEXT (enum)
- created_date: TEXT (ISO datetime)
- sent_date: TEXT
- signed_date: TEXT
- completed_date: TEXT
- signature_required_by: TEXT
- created_by: INTEGER (FK to users)
- notes: TEXT
```

### contract_signatures
```sql
- id: INTEGER PRIMARY KEY
- contract_id: INTEGER (FK to digital_contracts)
- signer_id: INTEGER (FK to users)
- signer_name: TEXT
- signature_type: TEXT (draw/type/upload)
- signature_data: TEXT
- signature_image_path: TEXT
- signed_date: TEXT (ISO datetime)
- ip_address: TEXT
- user_agent: TEXT
```

### document_audit_logs
```sql
- id: INTEGER PRIMARY KEY
- entity_type: TEXT (document/contract)
- entity_id: INTEGER
- action: TEXT (enum)
- user_id: INTEGER (FK to users)
- timestamp: TEXT (ISO datetime)
- ip_address: TEXT
- notes: TEXT
- metadata: TEXT (JSON)
```

---

## Production Deployment

### Environment Variables
Set these in your production environment:
```bash
DOCUMENT_STORAGE_PATH=/var/app/uploads/documents
CONTRACT_STORAGE_PATH=/var/app/uploads/contracts
SIGNATURE_STORAGE_PATH=/var/app/uploads/signatures
MAX_DOCUMENT_SIZE=52428800
ALLOWED_DOCUMENT_TYPES=pdf,jpg,jpeg,png,doc,docx
ENCRYPTION_KEY=<secure-random-32-char-key>
JWT_SECRET=<secure-random-key>
```

### File Storage
Consider using cloud storage (S3, Azure Blob) for production:
1. Implement cloud storage adapter in document-service.js
2. Update `DOCUMENT_STORAGE_PATH` to cloud bucket
3. Ensure proper IAM/access policies

### Monitoring
1. Monitor upload directory disk usage
2. Set up alerts for failed uploads
3. Review audit logs regularly
4. Track API endpoint performance

---

## Support & Resources

- **API Documentation**: See `DOCUMENT_CONTRACT_API_DOCUMENTATION.md`
- **Issue Tracking**: GitHub Issues #20
- **Security Concerns**: Review `SECURITY_SUMMARY.md`

---

## Next Steps

1. ✅ Complete backend setup
2. ✅ Complete frontend setup
3. ✅ Test document upload
4. ✅ Test contract creation
5. ✅ Test signature workflow
6. 📋 Configure production environment
7. 📋 Set up cloud storage (optional)
8. 📋 Enable SSL/HTTPS
9. 📋 Configure monitoring
10. 📋 Train users on features
