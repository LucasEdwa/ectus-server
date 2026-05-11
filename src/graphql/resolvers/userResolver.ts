import { db } from "../../models/db";
import bcrypt from "bcryptjs";
import {
  User,
  CreateUserInput,
  LoginInput,
  AuthPayload,
} from "../../types/user";
import {
  generateToken,
  generateRefreshToken,
  verifyRefreshToken,
} from "../../middleware/jwtAuth";
import {
  assertAuthenticated,
  canViewOtherUsersInCompany,
  resolveViewerCompanyId,
} from "../auth/userAccess";
import { parseInput } from "../../validation/parse";
import { loginSchema, refreshTokenSchema, signupSchema } from "../../validation/schemas";

export const userResolvers = {
  Query: {
    
    async users(parent: any, args: any, context: any): Promise<User[]> {
      assertAuthenticated(context.user);
      const companyId = await resolveViewerCompanyId(context.user);
      const [rows]: any = await db.query(
        "SELECT id, name, email, role, company_id, created_at FROM users WHERE company_id = ? ORDER BY id ASC",
        [companyId]
      );
      return rows;
    },
    async usersByCompany(parent: any, args: { company_id: number }, context: any): Promise<User[]> {
      assertAuthenticated(context.user);
      const viewerCompany = await resolveViewerCompanyId(context.user);
      if (Number(args.company_id) !== viewerCompany) {
        throw new Error("Not authorized to view users from this company");
      }
      const [rows]: any = await db.query(
        "SELECT id, name, email, role, company_id, created_at FROM users WHERE company_id = ? ORDER BY id ASC",
        [args.company_id]
      );
      return rows;
    },
    async roles(): Promise<string[]> {
      return ["employee", "leader", "finance", "hr"];
    },
    async me(parent: any, arg: any, context: any): Promise<User | null> {
      console.log("[ME_QUERY] Context user:", context.user);
      if (!context.user || !context.user.id) {
        console.log("[ME_QUERY] Not authenticated - missing user or user.id");
        throw new Error("Not authenticated");
      }
      // Fetch full user from DB
      const [rows]: any = await db.query(
        "SELECT id, name, email, role, company_id, created_at FROM users WHERE id = ?",
        [context.user.id]
      );
      const user = rows.length > 0 ? rows[0] : null;
      console.log("[ME_QUERY] Returning user:", user);
      return user;
    },
    async userById(
      parent: any,
      args: { id: number },
      context: any
    ): Promise<User | null> {
      assertAuthenticated(context.user);
      const viewer = context.user;

      if (Number(args.id) === Number(viewer.id)) {
        const [rows]: any = await db.query(
          "SELECT id, name, email, role, company_id, created_at FROM users WHERE id = ?",
          [args.id]
        );
        return rows.length > 0 ? rows[0] : null;
      }

      if (!canViewOtherUsersInCompany(viewer)) {
        throw new Error("Not authorized to view this user.");
      }

      const [rows]: any = await db.query(
        "SELECT id, name, email, role, company_id, created_at FROM users WHERE id = ?",
        [args.id]
      );
      if (rows.length === 0) {
        return null;
      }
      const target = rows[0];
      const viewerCompany = await resolveViewerCompanyId(viewer);
      if (Number(target.company_id) !== viewerCompany) {
        throw new Error("Not authorized to view this user.");
      }
      return target;
    },
    async companies(_: unknown, __: unknown, context: any): Promise<any[]> {
      assertAuthenticated(context.user);
      try {
        const cid = await resolveViewerCompanyId(context.user);
        const [rows]: any = await db.query("SELECT id, name FROM companies WHERE id = ?", [cid]);
        return rows;
      } catch {
        return [];
      }
    },
  },
  Mutation: {
    async signup(parent: any, args: CreateUserInput): Promise<AuthPayload> {
      const parsed = parseInput(signupSchema, args);
      const { name, email, password, role, company_id } = parsed;
      console.debug("[SIGNUP] Received args:", args);
      try {
        // Check if user already exists
        const [existingUsers]: any = await db.query(
          "SELECT id, name, email, role, company_id FROM users WHERE email = ?",
          [email]
        );
        console.debug('[SIGNUP] Existing users:', existingUsers);
        if (existingUsers.length > 0) {
          throw new Error("An account with this email already exists. Please log in.");
        }
        // Validate company_id if provided
        if (company_id) {
          const [companies]: any = await db.query(
            "SELECT id FROM companies WHERE id = ?",
            [company_id]
          );
          console.debug('[SIGNUP] Company lookup:', companies);
          if (companies.length === 0) {
            throw new Error(`Company with ID ${company_id} does not exist`);
          }
        }
        // Hash password
        const hashedPassword = await bcrypt.hash(password, 12);
        // Create user
        const [result]: any = await db.query(
          `INSERT INTO users (name, email, password, role, company_id) 
           VALUES (?, ?, ?, ?, ?)`,
          [name, email, hashedPassword, role, company_id]
        );
        console.debug('[SIGNUP] Insert result:', result);
        // Get created user - select only existing columns
        const [userRows]: any = await db.query(
          "SELECT id, name, email, role, company_id, COALESCE(created_at, NOW()) as created_at FROM users WHERE id = ?",
          [result.insertId]
        );
        console.debug('[SIGNUP] Created user:', userRows);
        const user = userRows[0];
        if (!user.name || user.name.trim() === "") {
          throw new Error("Signup failed: Created user has no name. Please contact support.");
        }
        // Generate JWT token
        const token = generateToken(user);
        console.debug('[SIGNUP] Generated token:', token);
        return { token, user };
      } catch (error: any) {
        console.error('[SIGNUP] Error:', error);
        throw new Error(`Signup failed: ${error.message}`);
      }
    },

    async login(parent: any, args: LoginInput): Promise<AuthPayload> {
      const { email, password } = parseInput(loginSchema, args);
      try {
        // Find user
        const [userRows]: any = await db.query(
          "SELECT id, name, email, password, role, company_id, created_at FROM users WHERE email = ?",
          [email]
        );
        if (userRows.length === 0) {
          throw new Error("Invalid email or password");
        }
        const user = userRows[0];
        if (!user.name || user.name.trim() === "") {
          throw new Error("Login failed: User name is missing. Please contact support.");
        }
        // Verify password
        const isValid = await bcrypt.compare(password, user.password);
        if (!isValid) {
          throw new Error("Invalid email or password");
        }
        // Generate JWT tokens
        const token = generateToken(user);
        const refreshToken = generateRefreshToken(user);
        
        // Remove password from response
        const { password: _, ...userWithoutPassword } = user;
        return { 
          token, 
          refreshToken, 
          user: userWithoutPassword 
        };
      } catch (error: any) {
        throw new Error(`Login failed: ${error.message}`);
      }
    },

    async refreshToken(parent: any, args: { refreshToken: string }): Promise<AuthPayload> {
      try {
        const { refreshToken } = parseInput(refreshTokenSchema, args);
        const decoded = verifyRefreshToken(refreshToken);
        
        // Find user to get latest data
        const [userRows]: any = await db.query(
          "SELECT id, name, email, role, company_id, created_at FROM users WHERE id = ?",
          [decoded.id]
        );
        
        if (userRows.length === 0) {
          throw new Error("User not found");
        }
        
        const user = userRows[0];
        
        // Generate new access token and refresh token
        const newToken = generateToken(user);
        const newRefreshToken = generateRefreshToken(user);
        
        return {
          token: newToken,
          refreshToken: newRefreshToken,
          user
        };
      } catch (error: any) {
        throw new Error(`Token refresh failed: ${error.message}`);
      }
    },
  },
};
