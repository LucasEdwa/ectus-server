export interface User {
  id: number;
  name: string;
  email: string;
  role: string;
  company_id?: number;
  created_at: string;
}

export interface CreateUserInput {
  name: string;
  email: string;
  password: string;
  role: UserRole;
  company_id?: number;
}

export interface LoginInput {
  email: string;
  password: string;
}

export interface AuthPayload {
  token: string;
  user: User;
}
enum UserRole {
  EMPLOYEE = "employee",
  LEADER = "leader",
  FINANCE = "finance",
  HR = "hr",
}
