import { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";

import User from "../infrastructure/schemas/User";
import ValidationError from "../domain/errors/validation-error";
import UnauthorizedError from "../domain/errors/unauthorized-error";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Emails listed in ADMIN_EMAILS (comma-separated) are granted the ADMIN role on registration.
// This is the only way an ADMIN account can be created - there is no promote-to-admin endpoint.
const getAdminEmails = () =>
  (process.env.ADMIN_EMAILS || "")
    .split(",")
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);

const generateToken = (userId: string, role: string) => {
  const JWT_SECRET = process.env.JWT_SECRET;
  if (!JWT_SECRET) {
    throw new Error("JWT_SECRET is not set");
  }
  return jwt.sign({ userId, role }, JWT_SECRET, { expiresIn: "7d" });
};

const toSafeUser = (user: any) => ({
  _id: user._id,
  name: user.name,
  email: user.email,
  role: user.role,
});

export const register = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      throw new ValidationError("Name, email and password are required");
    }
    if (!EMAIL_REGEX.test(email)) {
      throw new ValidationError("Please provide a valid email address");
    }
    if (typeof password !== "string" || password.length < 8) {
      throw new ValidationError(
        "Password must be at least 8 characters long"
      );
    }

    const normalizedEmail = email.toLowerCase().trim();

    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) {
      throw new ValidationError("An account with this email already exists");
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const role = getAdminEmails().includes(normalizedEmail) ? "ADMIN" : "USER";

    const user = await User.create({
      name,
      email: normalizedEmail,
      password: hashedPassword,
      role,
    });

    const token = generateToken(user._id.toString(), user.role);

    res.status(201).json({ user: toSafeUser(user), token });
    return;
  } catch (error) {
    next(error);
  }
};

export const login = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      throw new ValidationError("Email and password are required");
    }

    const user = await User.findOne({ email: email.toLowerCase().trim() });
    if (!user) {
      throw new UnauthorizedError("Invalid email or password");
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedError("Invalid email or password");
    }

    const token = generateToken(user._id.toString(), user.role);

    res.status(200).json({ user: toSafeUser(user), token });
    return;
  } catch (error) {
    next(error);
  }
};

export const getCurrentUser = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const user = await User.findById(req.user?.userId);
    if (!user) {
      throw new UnauthorizedError("User not found");
    }

    res.status(200).json(toSafeUser(user));
    return;
  } catch (error) {
    next(error);
  }
};
