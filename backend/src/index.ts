import "dotenv/config";
import express from "express";
import connectDB from "./infrastructure/db";

import hotelsRouter from "./api/hotel";
import bookingsRouter from "./api/booking";
import authRouter from "./api/auth";
import cors from "cors";
import globalErrorHandlingMiddleware from "./api/middlewares/global-error-handling-middleware";
import tunnelGuard from "./api/middlewares/tunnel-guard-middleware";
import { getOpenApiSpec } from "./api/openapi";

// Create an Express instance
const app = express();
// Middleware to parse JSON data in the request body
app.use(express.json());
app.use(cors());

connectDB();

// app.use((req, res, next) => {
//   console.log("Hello World");
//   next();
// });

app.use(tunnelGuard);

app.get("/api-docs.json", getOpenApiSpec);

app.use("/api/hotels", hotelsRouter);
app.use("/api/bookings", bookingsRouter);
app.use("/api/auth", authRouter);

app.use(globalErrorHandlingMiddleware);

const PORT = 8000;
app.listen(PORT, () => console.log(`Server is running on port ${PORT}...`));
