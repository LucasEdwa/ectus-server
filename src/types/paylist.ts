export interface Paylist {
  id: number;
  company_id: number;
  employee_id: number;
  month: string;
  pdf_url: string;
}

export interface CreatePaylistInput {
  company_id: number;
  employee_id: number;
  month: string;
  pdf_url: string;
}
