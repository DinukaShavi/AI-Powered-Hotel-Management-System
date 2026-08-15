import express from "express";
import {
  createBooking,
  getAllBookingsForHotel,
  getAllBookings,
  getMyBookings,
  cancelBooking,
} from "../application/booking";
import authenticate from "./middlewares/authenticate-middleware";
import requireRole from "./middlewares/require-role-middleware";

const bookingsRouter = express.Router();

bookingsRouter
  .route("/")
  .post(authenticate, createBooking)
  .get(authenticate, requireRole("ADMIN"), getAllBookings);
bookingsRouter.route("/me").get(authenticate, getMyBookings);
bookingsRouter
  .route("/hotels/:hotelId")
  .get(authenticate, requireRole("ADMIN"), getAllBookingsForHotel);
bookingsRouter.route("/:id").delete(authenticate, cancelBooking);

export default bookingsRouter;
