import { Request, Response, NextFunction } from "express";

import Booking from "../infrastructure/schemas/Booking";
import Hotel from "../infrastructure/schemas/Hotel";
import ValidationError from "../domain/errors/validation-error";
import NotFoundError from "../domain/errors/not-found-error";

export const createBooking = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { hotelId, checkIn, checkOut, roomNumber } = req.body;
    const userId = req.user?.userId;

    if (!hotelId || !checkIn || !checkOut || !roomNumber) {
      throw new ValidationError(
        "hotelId, checkIn, checkOut and roomNumber are required"
      );
    }

    const checkInDate = new Date(checkIn);
    const checkOutDate = new Date(checkOut);

    if (isNaN(checkInDate.getTime()) || isNaN(checkOutDate.getTime())) {
      throw new ValidationError("checkIn and checkOut must be valid dates");
    }
    if (checkInDate >= checkOutDate) {
      throw new ValidationError("checkOut must be after checkIn");
    }
    if (Number(roomNumber) <= 0) {
      throw new ValidationError("roomNumber must be a positive number");
    }

    const hotel = await Hotel.findById(hotelId);
    if (!hotel) {
      throw new NotFoundError("Hotel not found");
    }

    const booking = await Booking.create({
      hotelId,
      userId,
      checkIn: checkInDate,
      checkOut: checkOutDate,
      roomNumber: Number(roomNumber),
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
