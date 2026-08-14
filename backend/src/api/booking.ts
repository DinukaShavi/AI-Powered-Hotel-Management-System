import express from "express";
import {
  createBooking,
  getAllBookingsForHotel,
  getAllBookings,
  getMyBookings,
} from "../application/booking";
import authenticate from "./middlewares/authenticate-middleware";

const bookingsRouter = express.Router();

bookingsRouter.route("/").post(authenticate, createBooking).get(getAllBookings);
bookingsRouter.route("/me").get(authenticate, getMyBookings);
bookingsRouter.route("/hotels/:hotelId").get(getAllBookingsForHotel);

export default bookingsRouter;
