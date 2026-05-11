export interface ContextUser {
  id?: number;
  userId?: number;
  email?: string;
  role?: string;
  company_id?: number | null;
  [key: string]: unknown;
}

export interface GraphQLContext {
  user?: ContextUser;
}
