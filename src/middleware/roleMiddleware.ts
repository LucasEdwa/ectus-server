import { Request, Response, NextFunction } from "express";

export const authorize = (roles: string[]) => (req: Request, res: Response, next: NextFunction) => {
  const user = (req as any).user;
  if (!user || !roles.includes(user.role)) return res.sendStatus(403);
  next();
};