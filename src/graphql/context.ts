import jwt from "jsonwebtoken";
import { decodeAccessToken, extractBearerToken } from "../middleware/jwtAuth";
import type { ContextUser, GraphQLContext } from "./contextTypes";

export type { ContextUser, GraphQLContext } from "./contextTypes";

export function contextFunction({ req }: { req: any }): GraphQLContext {
  const authHeader =
    req.headers?.authorization ||
    req.headers?.Authorization ||
    req.get?.("authorization") ||
    req.get?.("Authorization") ||
    "";

  const token = extractBearerToken(
    typeof authHeader === "string" ? authHeader : undefined,
    req.body
  );

  let user: GraphQLContext["user"] = undefined;

  if (token) {
    try {
      const decoded = decodeAccessToken(token);
      if (typeof decoded === "string") {
        console.warn("[contextFunction] Unexpected string JWT payload");
      } else {
        const u = decoded as ContextUser;
        user = {
          ...u,
          id: u.id ?? u.userId,
          role: u.role as string | undefined,
        };
      }
    } catch (e: unknown) {
      if (e instanceof jwt.TokenExpiredError) {
        if (Math.random() < 0.01) {
          console.warn("[contextFunction] JWT tokens are expiring — clients may need to re-authenticate");
        }
      } else if (e instanceof jwt.JsonWebTokenError) {
        console.warn("[contextFunction] Invalid JWT token format provided");
      } else if (e instanceof Error) {
        console.warn("[contextFunction] JWT verification failed:", e.message);
      }
    }
  }

  return { user };
}
