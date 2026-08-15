import { NextFunction, Request, Response } from "express";

import Hotel from "../infrastructure/schemas/Hotel";
import NotFoundError from "../domain/errors/not-found-error";
import ValidationError from "../domain/errors/validation-error";
import { CreateHotelDTO, UpdateHotelDTO } from "../domain/dtos/hotel";

export const getAllHotels = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const hotels = await Hotel.find();
    res.status(200).json(hotels);
    return;
  } catch (error) {
    next(error);
  }
};

export const getHotelById = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const hotelId = req.params.id;
    const hotel = await Hotel.findById(hotelId);
     if (!hotel) {
      throw new NotFoundError("Hotel not found");
    }

    res.status(200).json(hotel);
    return;
  } catch (error) {
    next(error);
  }
};

export const createHotel = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const validationResult = CreateHotelDTO.safeParse(req.body);
    if (!validationResult.success) {
      throw new ValidationError(validationResult.error.issues[0].message);
    }

    const hotel = await Hotel.create(validationResult.data);

    res.status(201).json(hotel);
    return;
  } catch (error) {
    next(error);
  }
};

export const deleteHotel = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const hotelId = req.params.id;
    const hotel = await Hotel.findByIdAndDelete(hotelId);
    if (!hotel) {
      throw new NotFoundError("Hotel not found");
    }

    // Return the response
    res.status(200).send();
    return;
  } catch (error) {
    next(error);
  }
};

export const updateHotel = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const hotelId = req.params.id;

    const validationResult = UpdateHotelDTO.safeParse(req.body);
    if (!validationResult.success) {
      throw new ValidationError(validationResult.error.issues[0].message);
    }

    const hotel = await Hotel.findByIdAndUpdate(hotelId, validationResult.data, {
      new: true,
    });
    if (!hotel) {
      throw new NotFoundError("Hotel not found");
    }

    // Return the response
    res.status(200).json(hotel);
    return;
  } catch (error) {
    next(error);
  }
};
