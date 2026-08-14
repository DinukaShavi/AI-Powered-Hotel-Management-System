import { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";

import UnauthorizedError from "../../domain/errors/unauthorized-error";

const authenticate = (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    next(new UnauthorizedError("Authentication token is required"));
    return;
  }

  const token = authHeader.split(" ")[1];
  const JWT_SECRET = process.env.JWT_SECRET;

  if (!JWT_SECRET) {
    next(new Error("JWT_SECRET is not set"));
    return;
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as {
      userId: string;
      role: string;
    };
    req.user = { userId: decoded.userId, role: decoded.role };
    next();
  } catch (error) {
    next(new UnauthorizedError("Invalid or expired token"));
  }
};

export default authenticate;
