import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { db } from "../../models/db";

// Update last_login for a user
const updateLastLogin = async (userId: number) => {
  const now = Math.floor(Date.now() / 1000); // current timestamp in seconds
  await db.query("UPDATE users SET last_login = ? WHERE id = ?", [now, userId]);
};

export const authResolvers = {
  Mutation: {
    async register(args: any) {
      console.log("Register args:", args); // Should now log the actual arguments
      const { name, email, password, role } = args;
      if (!name || !email || !password || !role) {
        throw new Error("All fields are required");
      }
      const [existing]: any = await db.query("SELECT id FROM users WHERE email = ?", [email]);
      if (existing.length > 0) {
        throw new Error("Email already registered");
      }
      const hashed = await bcrypt.hash(password, 10);
      const registered = Math.floor(Date.now() / 1000); // current timestamp in seconds
      await db.query(
        "INSERT INTO users (name, email, password, role, registered) VALUES (?, ?, ?, ?, ?)",
        [name, email, hashed, role, registered]
      );
      return { message: "User registered" };
    },
    async login(args: any) {
      const { email, password } = args;
      if (!email || !password) {
        throw new Error("Email and password required");
      }
      const [rows]: any = await db.query("SELECT * FROM users WHERE email = ?", [email]);
      const user = rows[0];
      if (!user || !(await bcrypt.compare(password, user.password))) {
        throw new Error("Invalid credentials");
      }
      await updateLastLogin(user.id); // Update last_login on successful login

      // Ensure JWT_SECRET is set
      const jwtSecret = process.env.JWT_SECRET;
      if (!jwtSecret) {
        throw new Error("JWT_SECRET environment variable is not set");
      }

      const token = jwt.sign({ id: user.id, role: user.role }, jwtSecret, { expiresIn: "7d" });
      return { token };
    }
  }
};
