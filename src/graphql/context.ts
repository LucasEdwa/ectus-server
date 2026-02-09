import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "your_jwt_secret";

export interface ContextUser {
  id?: number;
  userId?: number;
  email?: string;
  role?: string;
  [key: string]: any;
}

export interface GraphQLContext {
  user?: ContextUser;
}

export function contextFunction({ req }: { req: any }): GraphQLContext {
  let authHeader =
    req.headers.authorization ||
    req.headers.Authorization ||
    req.get?.("authorization") ||
    req.get?.("Authorization") ||
    "";

  if (!authHeader && req.body && req.body.authorization) {
    authHeader = req.body.authorization;
  }

  let user: ContextUser | undefined = undefined;

  if (typeof authHeader === "string" && authHeader.startsWith("Bearer ")) {
    const token = authHeader.replace("Bearer ", "");
    try {
      const decoded = jwt.verify(token, JWT_SECRET) as ContextUser;
      user = {
        ...decoded,
        id: decoded.id ?? decoded.userId,
        role: decoded.role,
      };
    } catch (e: any) {
      // Handle different JWT errors more gracefully - only log once per unique error
      if (e.name === 'TokenExpiredError') {
        // Only log expired tokens occasionally to prevent spam
        if (Math.random() < 0.01) { // Log only 1% of expired token attempts
          console.warn("[contextFunction] JWT tokens are expiring - users may need to re-authenticate");
        }
      } else if (e.name === 'JsonWebTokenError') {
        console.warn("[contextFunction] Invalid JWT token format provided");
      } else {
        console.error("[contextFunction] Unexpected JWT error:", e.message);
      }
      // user remains undefined, which is the correct behavior for invalid tokens
    }
  }

  return { user };
}
