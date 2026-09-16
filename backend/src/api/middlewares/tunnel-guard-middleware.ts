import { NextFunction, Request, Response } from "express";

const BLOCKED_ROUTES: ReadonlyArray<{ method: string; path: string }> = [
  { method: "POST", path: "/api/hotels/ai-search" },
  { method: "POST", path: "/api/auth/register" },
  { method: "POST", path: "/api/auth/login" },
];

const ENABLED_VALUES = ["true", "1", "yes", "on"];

export const isTunnelModeEnabled = (): boolean =>
  ENABLED_VALUES.includes((process.env.TUNNEL_MODE ?? "").trim().toLowerCase());

const normalisePath = (path: string): string => {
  const trimmed = path.toLowerCase().replace(/\/+$/, "");
  return trimmed === "" ? "/" : trimmed;
};

const tunnelGuard = (req: Request, res: Response, next: NextFunction) => {
  if (!isTunnelModeEnabled()) {
    next();
    return;
  }

  const requestPath = normalisePath(req.path);
  const isBlocked = BLOCKED_ROUTES.some(
    (route) =>
      route.method === req.method.toUpperCase() &&
      normalisePath(route.path) === requestPath
  );

  if (isBlocked) {
    res.status(403).json({
      message:
        "This endpoint is temporarily disabled while the server is exposed through a tunnel.",
    });
    return;
  }

  next();
};

if (isTunnelModeEnabled()) {
  console.warn(
    "[TUNNEL_MODE] ACTIVE — returning 403 for:",
    BLOCKED_ROUTES.map((r) => `${r.method} ${r.path}`).join(", ")
  );
}

export default tunnelGuard;
