import express from "express";
import {
  getAllHotels,
  getHotelById,
  createHotel,
  deleteHotel,
  updateHotel,
} from "./../application/hotel";
import { aiSearchHotels } from "./../application/ai-search";
import authenticate from "./middlewares/authenticate-middleware";
import requireRole from "./middlewares/require-role-middleware";

const hotelsRouter = express.Router();

hotelsRouter
  .route("/")
  .get(getAllHotels)
  .post(authenticate, requireRole("ADMIN"), createHotel);
hotelsRouter.post("/ai-search", aiSearchHotels);
hotelsRouter
  .route("/:id")
  .get(getHotelById)
  .put(authenticate, requireRole("ADMIN"), updateHotel)
  .delete(authenticate, requireRole("ADMIN"), deleteHotel);

export default hotelsRouter;
