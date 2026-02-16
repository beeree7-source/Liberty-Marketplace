// Type definitions for Document Management and Digital Contracts

export interface Document {
  id: number;
  supplier_id: number;
  retailer_id: number;
  filename: string;
  file_path: string;
  file_type: string;
  file_size: number;
  upload_date: string;
  uploader_id: number;
  document_type: 'invoice' | 'contract' | 'license' | 'certificate' | 'report' | 'photo' | 'other';
  status: 'active' | 'archived' | 'deleted';
  notes?: string;
}

export interface Contract {
  id: number;
  supplier_id: number;
  retailer_id: number;
  contract_name: string;
  contract_content: string;
  pdf_file_path?: string;
  status: 'draft' | 'sent' | 'viewed' | 'signed' | 'completed' | 'cancelled';
  created_date: string;
  sent_date?: string;
  signed_date?: string;
  completed_date?: string;
  signature_required_by?: string;
  created_by: number;
  notes?: string;
  supplier_name?: string;
  retailer_name?: string;
  signature_id?: number;
  signer_name?: string;
  signature_type?: 'draw' | 'type' | 'upload';
  signature_date?: string;
}

export interface Signature {
  id: number;
  contract_id: number;
  signer_id: number;
  signer_name: string;
  signature_type: 'draw' | 'type' | 'upload';
  signature_data: string;
  signature_image_path?: string;
  signed_date: string;
  ip_address?: string;
  user_agent?: string;
}

export interface AuditLog {
  id: number;
  entity_type: 'document' | 'contract';
  entity_id: number;
  action: 'upload' | 'view' | 'download' | 'send' | 'sign' | 'delete' | 'archive' | 'update' | 'create';
  user_id: number;
  user_name?: string;
  timestamp: string;
  ip_address?: string;
  notes?: string;
  metadata?: string;
}

export interface UploadProgress {
  progress: number;
  status: 'idle' | 'uploading' | 'processing' | 'success' | 'error';
  message?: string;
}
