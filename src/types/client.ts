export interface Client {
  id: number;
  company_id: number;
  name: string;
  contact_name: string;
  contact_phone: string;
  contact_email: string;
  address: string;
  zip_code: string;
  city: string;
  country: string;
  service_type?: string;
  home_size?: string;
  frequency?: string;
  number_of_rooms?: string;
  number_of_bathrooms?: string;
  access_instructions?: string;
  priority_areas?: string;
  special_instructions?: string;
  allergies?: string;
  pets?: string;
  notes?: string;
}

export interface CreateClientInput {
  company_id: number;
  name: string;
  contact_name: string;
  contact_phone: string;
  contact_email: string;
  address: string;
  zip_code: string;
  city: string;
  country: string;
  service_type?: string;
  home_size?: string;
  frequency?: string;
  number_of_rooms?: string;
  number_of_bathrooms?: string;
  access_instructions?: string;
  priority_areas?: string;
  special_instructions?: string;
  allergies?: string;
  pets?: string;
  notes?: string;
}

export interface UpdateClientInput extends CreateClientInput {
  id: number;
}
