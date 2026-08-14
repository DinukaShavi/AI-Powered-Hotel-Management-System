import express from "express";

import { register, login, getCurrentUser } from "../application/auth";
import authenticate from "./middlewares/authenticate-middleware";

const authRouter = express.Router();

authRouter.post("/register", register);
authRouter.post("/login", login);
authRouter.get("/me", authenticate, getCurrentUser);

export default authRouter;
