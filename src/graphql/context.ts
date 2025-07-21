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
    } catch (e) {
      console.error("[contextFunction] JWT verification error:", e);
    }
  } else {
    console.warn("[contextFunction] No valid Bearer token found in headers");
  }

  return { user };
}
