import { db } from "../../models/db";
import bcrypt from "bcryptjs";
import {
  User,
  CreateUserInput,
  LoginInput,
  AuthPayload,
} from "../../types/user";
import { generateToken } from "../../middleware/jwtAuth";

export const userResolvers = {
  Query: {
    
    async users(): Promise<User[]> {
      const [rows]: any = await db.query(
        "SELECT id, name, email, role, company_id, created_at FROM users"
      );
      return rows;
    },
    async usersByCompany(parent: any, args: { company_id: number }, context: any): Promise<User[]> {
      console.log('=== usersByCompany Debug (After Fix) ===');
      console.log('context.user:', context.user);
      console.log('args.company_id:', args.company_id, typeof args.company_id);
      console.log('context.user.company_id:', context.user?.company_id, typeof context.user?.company_id);
      console.log('Match?', context.user?.company_id === args.company_id);
      
      if (!context.user) {
        throw new Error("Not authenticated");
      }
      // Verify user belongs to the company they're querying
      if (context.user.company_id !== args.company_id) {
        console.log('❌ Authorization failed - company_id mismatch');
        console.log('Expected:', args.company_id, 'Got:', context.user.company_id);
        
        // TEMPORARY: If company_id is undefined, fetch it from database
        if (context.user.company_id === undefined) {
          console.log('⚠️  TEMPORARY FIX: Fetching company_id from database');
          const [userRows]: any = await db.query(
            "SELECT company_id FROM users WHERE id = ?",
            [context.user.id]
          );
          if (userRows.length > 0 && userRows[0].company_id === args.company_id) {
            console.log('✅ TEMPORARY: User belongs to company', args.company_id);
          } else {
            throw new Error("Not authorized to view users from this company");
          }
        } else {
          throw new Error("Not authorized to view users from this company");
        }
      }
      const [rows]: any = await db.query(
        "SELECT id, name, email, role, company_id, created_at FROM users WHERE company_id = ?",
        [args.company_id]
      );
      console.log('✅ Returning', rows.length, 'users');
      return rows;
    },
    async roles(): Promise<string[]> {
      return ["employee", "leader", "finance", "hr"];
    },
    async me(parent: any, arg: any, context: any): Promise<User | null> {
      if (!context.user || !context.user.id) {
        throw new Error("Not authenticated");
      }
      // Fetch full user from DB
      const [rows]: any = await db.query(
        "SELECT id, name, email, role, company_id, created_at FROM users WHERE id = ?",
        [context.user.id]
      );
      return rows.length > 0 ? rows[0] : null;
    },
    async userById(
      parent: any,
      args: { id: number }
    ): Promise<User | null> {
      const [rows]: any = await db.query(
        "SELECT id, name, email, role, company_id, created_at FROM users WHERE id = ?",
        [args.id]
      );
      return rows.length > 0 ? rows[0] : null;
    },
    async companies(): Promise<any[]> {
      const [rows]: any = await db.query("SELECT id, name FROM companies");
      return rows;
    },
  },
  Mutation: {
    async signup(parent: any, args: CreateUserInput): Promise<AuthPayload> {
      const { name, email, password, role, company_id } = args;
      console.debug('[SIGNUP] Received args:', args);
      if (!name || name.trim() === "") {
        throw new Error("Signup failed: Name is required and cannot be empty.");
      }
      try {
        // Check if user already exists
        const [existingUsers]: any = await db.query(
          "SELECT id FROM users WHERE email = ?",
          [email]
        );
        console.debug('[SIGNUP] Existing users:', existingUsers);
        if (existingUsers.length > 0) {
          throw new Error("User with this email already exists");
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
      const { email, password } = args;
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
        // Generate JWT token using new util
        const token = generateToken(user);
        // Remove password from response
        const { password: _, ...userWithoutPassword } = user;
        return { token, user: userWithoutPassword };
      } catch (error: any) {
        throw new Error(`Login failed: ${error.message}`);
      }
    },
  },
};
