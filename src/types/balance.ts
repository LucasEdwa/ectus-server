export interface TimeBalance {
  id: number;
  employee_id: number;
  flexible_hours: number; // in hours as float
  time_bank: number; // in hours as float
  vacation_days: number;
  comp_time: number; // in hours as float
  overtime_balance: number; // in hours as float
  sick_days: number;
  last_updated: Date;
  employee_name?: string;
  employee_email?: string;
}

export interface CreateTimeBalanceInput {
  employee_id: number;
  flexible_hours?: number;
  time_bank?: number;
  vacation_days?: number;
  comp_time?: number;
  overtime_balance?: number;
  sick_days?: number;
}

export interface UpdateTimeBalanceInput {
  flexible_hours?: number;
  time_bank?: number;
  vacation_days?: number;
  comp_time?: number;
  overtime_balance?: number;
  sick_days?: number;
  vacation_days_preliminary?: number;
  paid_days_remaining?: number;
  unpaid_days_remaining?: number;
  saved_days_year1?: number;
  break_minutes_today?: number;
}