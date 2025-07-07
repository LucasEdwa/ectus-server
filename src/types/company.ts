export interface Company {
  id: number;
  name: string;
  org_number: string;
  address: string;
  zip_code: string;
  city: string;
  country: string;
  phone?: string;
  email?: string;
  bankgiro?: string;
  plusgiro?: string;
  vat_number?: string;
  created_at: string;
}

export interface CreateCompanyInput {
  name: string;
  org_number: string;
  address: string;
  zip_code: string;
  city: string;
  country: string;
  phone?: string;
  email?: string;
  bankgiro?: string;
  plusgiro?: string;
  vat_number?: string;
}

export interface UpdateCompanyInput {
  id: number;
  name?: string;
  org_number?: string;
  address?: string;
  zip_code?: string;
  city?: string;
  country?: string;
  phone?: string;
  email?: string;
  bankgiro?: string;
  plusgiro?: string;
  vat_number?: string;
}
