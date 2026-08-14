import { NextFunction, Request, Response } from "express";

import ForbiddenError from "../../domain/errors/forbidden-error";

const requireRole = (...roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user || !roles.includes(req.user.role)) {
      next(new ForbiddenError("You do not have permission to perform this action"));
      return;
    }
    next();
  };
};

export default requireRole;
