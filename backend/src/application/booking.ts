import { Request, Response, NextFunction } from "express";

import Booking from "../infrastructure/schemas/Booking";
import Hotel from "../infrastructure/schemas/Hotel";
import ValidationError from "../domain/errors/validation-error";
import NotFoundError from "../domain/errors/not-found-error";
import ForbiddenError from "../domain/errors/forbidden-error";
import { CreateBookingDTO } from "../domain/dtos/booking";

const MAX_ROOM_NUMBER = 1000;

const findAvailableRoomNumber = async (
  hotelId: string,
  checkIn: Date,
  checkOut: Date
) => {
  let roomNumber: number;
  let isRoomAvailable = false;

  do {
    roomNumber = Math.floor(Math.random() * MAX_ROOM_NUMBER) + 1;
    const existingBooking = await Booking.findOne({
      hotelId,
      roomNumber,
      checkIn: { $lt: checkOut },
      checkOut: { $gt: checkIn },
    });
    isRoomAvailable = !existingBooking;
  } while (!isRoomAvailable);

  return roomNumber;
};

export const createBooking = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const validationResult = CreateBookingDTO.safeParse(req.body);
    if (!validationResult.success) {
      throw new ValidationError(validationResult.error.issues[0].message);
    }

    const { hotelId, checkIn, checkOut } = validationResult.data;
    const userId = req.user?.userId;

    const hotel = await Hotel.findById(hotelId);
    if (!hotel) {
      throw new NotFoundError("Hotel not found");
    }

    const roomNumber = await findAvailableRoomNumber(hotelId, checkIn, checkOut);

    const booking = await Booking.create({
      hotelId,
      userId,
      checkIn,
      checkOut,
      roomNumber,
    });

    res.status(201).json(booking);
    return;
  } catch (error) {
    next(error);
  }
};

export const getAllBookingsForHotel = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const hotelId = req.params.hotelId;
    const bookings = await Booking.find({ hotelId: hotelId }).populate("userId");

    res.status(200).json(bookings);
    return;
  } catch (error) {
    next(error);
  }
};

export const getAllBookings = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const bookings = await Booking.find();
    res.status(200).json(bookings);
    return;
  } catch (error) {
    next(error);
  }
};

export const cancelBooking = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const bookingId = req.params.id;
    const userId = req.user?.userId;

    const booking = await Booking.findById(bookingId);
    if (!booking) {
      throw new NotFoundError("Booking not found");
    }

    if (booking.userId.toString() !== userId) {
      throw new ForbiddenError(
        "You do not have permission to cancel this booking"
      );
    }

    await booking.deleteOne();

    res.status(200).send();
    return;
  } catch (error) {
    next(error);
  }
};

export const getMyBookings = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.user?.userId;
    const bookings = await Booking.find({ userId })
      .populate("hotelId")
      .sort({ createdAt: -1 });

    res.status(200).json(bookings);
    return;
  } catch (error) {
    next(error);
  }
};
