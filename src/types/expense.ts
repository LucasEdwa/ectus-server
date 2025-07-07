export interface Expense {
  id: number;
  company_id: number;
  user_id: number;
  description: string;
  amount: number;
  expense_date: string;
  category_id: number;
  category?: string;
  created_at?: string;
}

export interface CreateExpenseInput {
  company_id: number;
  user_id: number;
  description: string;
  amount: number;
  expense_date: string;
  category_id: number;
}

export interface UpdateExpenseInput {
  id: number;
  description?: string;
  amount?: number;
  expense_date?: string;
  category_id?: number;
}
