export interface Document {
  id: number;
  employee_id: number;
  company_id: number;
  document_type: 'contract' | 'certification' | 'identification' | 'other';
  title: string;
  description?: string;
  file_url: string;
  file_name: string;
  file_size: number;
  mime_type: string;
  uploaded_at: Date;
  expires_at?: Date;
  is_active: boolean;
}

export interface CreateDocumentInput {
  employee_id: number;
  document_type: string;
  title: string;
  description?: string;
  file_url: string;
  file_name: string;
  file_size: number;
  mime_type: string;
  expires_at?: string;
}

export interface UpdateDocumentInput {
  id: number;
  title?: string;
  description?: string;
  document_type?: string;
  expires_at?: string;
  is_active?: boolean;
}
