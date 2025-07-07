import { Request, Response, NextFunction } from "express";
import jwt, { SignOptions } from "jsonwebtoken";
import { db } from "../models/db";

// Extend Express Request interface to include user
declare global {
  namespace Express {
    interface Request {
      user?: any;
    }
  }
}

// JWT Configuration
const JWT_SECRET = process.env.JWT_SECRET || "your_jwt_secret";
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "24h";

// Generate JWT token
export const generateToken = (user: any): string => {
  const payload = {
    id: user.id,
    email: user.email,
    role: user.role,
    iat: Math.floor(Date.now() / 1000)
  };

  const options: SignOptions = {
    expiresIn: JWT_EXPIRES_IN as SignOptions["expiresIn"],
    issuer: "ectus-server",
    audience: "ectus-users"
  };

  return jwt.sign(payload, JWT_SECRET, options);
};

// Verify JWT token
export const verifyToken = (token: string): any => {
  try {
    return jwt.verify(token, JWT_SECRET, {
      issuer: "ectus-server",
      audience: "ectus-users"
    });
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      throw new Error("Token has expired");
    } else if (error instanceof jwt.JsonWebTokenError) {
      throw new Error("Invalid token");
    }
    throw new Error("Token verification failed");
  }
};

// Clean up expired tokens (example for custom token tables)
export const cleanupExpiredTokens = async (): Promise<void> => {
  const currentTimestamp = Math.floor(Date.now() / 1000);

  try {
    // Example: clean up expired confirmation tokens
    await db.query(
      "DELETE FROM users_confirmations WHERE expires < ?",
      [currentTimestamp]
    );
    // Add more cleanup as needed for your schema
    console.log("Expired tokens cleanup completed");
  } catch (error) {
    console.error("Error cleaning up expired tokens:", error);
    throw error;
  }
};

// JWT Authentication middleware for Express
export const authenticateToken = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    let authHeader = req.headers.authorization || "";
    if (!authHeader && req.body && req.body.authorization) {
      authHeader = req.body.authorization;
    }
    const token = authHeader && authHeader.startsWith("Bearer ") ? authHeader.split(" ")[1] : authHeader;

    if (!token) {
      res.status(401).json({
        success: false,
        message: "Access token required"
      });
      return;
    }

    // Verify token
    const decoded = verifyToken(token);

    // Optionally: fetch fresh user data from DB
    // const [userRows]: any = await db.query("SELECT * FROM users WHERE id = ?", [decoded.id]);
    // const user = userRows[0];
    // if (!user) {
    //   res.status(401).json({ success: false, message: "Invalid token" });
    //   return;
    // }

    // Attach decoded user info to request
    req.user = {
      ...decoded,
      id: decoded.id ?? decoded.userId,
      role: decoded.role,
    };
    next();
  } catch (error) {
    console.error("Authentication error:", error);
    res.status(401).json({
      success: false,
      message: "Invalid or expired token"
    });
  }
};

// Example: Admin only middleware
export const requireAdmin = (req: Request, res: Response, next: NextFunction): void => {
  try {
    if (!req.user || req.user.role !== "admin") {
      res.status(403).json({
        success: false,
        message: "Admin access required"
      });
      return;
    }
    next();
  } catch (error) {
    res.status(403).json({
      success: false,
      message: "Access denied"
    });
  }
};
