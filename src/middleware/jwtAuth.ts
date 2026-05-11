import dotenv from "dotenv";
import { Request, Response, NextFunction } from "express";
import jwt, { JwtPayload, SignOptions } from "jsonwebtoken";
import { db } from "../models/db";

declare global {
  namespace Express {
    interface Request {
      user?: any;
    }
  }
}

dotenv.config();

export const JWT_ISSUER = "ectus-server";
export const JWT_AUDIENCE = "ectus-users";

const JWT_VERIFY_OPTIONS: jwt.VerifyOptions = {
  issuer: JWT_ISSUER,
  audience: JWT_AUDIENCE,
};

export function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET?.trim();
  if (!secret) {
    throw new Error("JWT_SECRET environment variable is required.");
  }
  return secret;
}

/** Call after dotenv so misconfiguration fails fast at startup */
export function assertJwtConfigured(): void {
  getJwtSecret();
}

/** Same token extraction for GraphQL context and REST middleware */
export function extractBearerToken(authHeader: string | undefined, body?: unknown): string | undefined {
  let header = authHeader?.trim();
  const bodyAuth =
    body && typeof body === "object" && body !== null && "authorization" in body
      ? String((body as { authorization?: unknown }).authorization ?? "").trim()
      : "";
  if (!header && bodyAuth) header = bodyAuth;
  if (!header) return undefined;
  if (header.startsWith("Bearer ")) return header.slice(7).trim() || undefined;
  return header || undefined;
}

const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "24h";
const REFRESH_TOKEN_EXPIRES_IN = process.env.REFRESH_TOKEN_EXPIRES_IN || "7d";

function rejectRefreshTokenUsedAsAccess(decoded: string | JwtPayload): void {
  if (typeof decoded === "object" && decoded !== null && (decoded as JwtPayload & { type?: string }).type === "refresh") {
    throw new Error("Invalid token");
  }
}

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
    issuer: JWT_ISSUER,
    audience: JWT_AUDIENCE,
  };

  return jwt.sign(payload, getJwtSecret(), options);
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
    issuer: JWT_ISSUER,
    audience: JWT_AUDIENCE,
  };

  return jwt.sign(payload, getJwtSecret(), options);
};

/** Throws jwt.JsonWebTokenError / jwt.TokenExpiredError — for callers that need precise error kinds */
export function decodeAccessToken(token: string): jwt.JwtPayload | string {
  const decoded = jwt.verify(token, getJwtSecret(), JWT_VERIFY_OPTIONS);
  rejectRefreshTokenUsedAsAccess(decoded);
  return decoded;
}

// Verify access JWT (not refresh tokens)
export const verifyToken = (token: string): any => {
  try {
    return decodeAccessToken(token);
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
    const decoded = jwt.verify(token, getJwtSecret(), JWT_VERIFY_OPTIONS);

    // Check if it's actually a refresh token
    if (typeof decoded === "object" && decoded !== null) {
      const payload = decoded as JwtPayload & { type?: string };
      if (payload.type !== "refresh") {
        throw new Error("Invalid refresh token");
      }
    } else {
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
    const authHeader =
      req.headers.authorization ||
      (req.headers as { Authorization?: string }).Authorization ||
      "";
    const token = extractBearerToken(authHeader, req.body);

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
