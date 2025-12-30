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
const REFRESH_TOKEN_EXPIRES_IN = process.env.REFRESH_TOKEN_EXPIRES_IN || "7d";

// Generate JWT token
export const generateToken = (user: any): string => {
  const payload = {
    id: user.id,
    email: user.email,
    role: user.role,
    company_id: user.company_id,
    iat: Math.floor(Date.now() / 1000)
  };

  const options: SignOptions = {
    expiresIn: JWT_EXPIRES_IN as SignOptions["expiresIn"],
    issuer: "ectus-server",
    audience: "ectus-users"
  };

  return jwt.sign(payload, JWT_SECRET, options);
};

// Generate refresh token
export const generateRefreshToken = (user: any): string => {
  const payload = {
    id: user.id,
    email: user.email,
    type: 'refresh',
    iat: Math.floor(Date.now() / 1000)
  };

  const options: SignOptions = {
    expiresIn: REFRESH_TOKEN_EXPIRES_IN as SignOptions["expiresIn"],
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

// Verify refresh token
export const verifyRefreshToken = (token: string): any => {
  try {
    const decoded = jwt.verify(token, JWT_SECRET, {
      issuer: "ectus-server",
      audience: "ectus-users"
    });
    
    // Check if it's actually a refresh token
    if (typeof decoded === 'object' && decoded.type !== 'refresh') {
      throw new Error("Invalid refresh token");
    }
    
    return decoded;
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      throw new Error("Refresh token has expired");
    } else if (error instanceof jwt.JsonWebTokenError) {
      throw new Error("Invalid refresh token");
    }
    throw new Error("Refresh token verification failed");
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
