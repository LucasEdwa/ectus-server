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
    async roles(): Promise<string[]> {
      return ["employee", "leader", "finance", "hr"];
    },
    async me(parent: any, arg: any, context: any): Promise<User | null> {
      if (!context.user) {
        throw new Error("Not authenticated");
      }
      return context.user;
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
  },
  Mutation: {
    async signup(parent: any, args: CreateUserInput): Promise<AuthPayload> {
      const { name, email, password, role, company_id } = args;

      try {
        // Check if user already exists
        const [existingUsers]: any = await db.query(
          "SELECT id FROM users WHERE email = ?",
          [email]
        );

        if (existingUsers.length > 0) {
          throw new Error("User with this email already exists");
        }

        // Validate company_id if provided
        if (company_id) {
          const [companies]: any = await db.query(
            "SELECT id FROM companies WHERE id = ?",
            [company_id]
          );

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

        // Get created user - select only existing columns
        const [userRows]: any = await db.query(
          "SELECT id, name, email, role, company_id, COALESCE(created_at, NOW()) as created_at FROM users WHERE id = ?",
          [result.insertId]
        );

        const user = userRows[0];

        return user;
      } catch (error: any) {
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
