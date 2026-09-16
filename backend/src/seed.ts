import "dotenv/config";
import mongoose from "mongoose";

import Hotel from "./infrastructure/schemas/Hotel";
import { CreateHotelDTO } from "./domain/dtos/hotel";

const unsplash = (photoId: string) =>
  `https://images.unsplash.com/photo-${photoId}?auto=format&fit=crop&w=1200&q=80`;

const hotels = [
  {
    name: "Maison Vérane",
    location: "Paris, France",
    rating: 4.8,
    reviews: 1284,
    price: 485,
    image: unsplash("1590490360182-c33d57733427"),
    description:
      "A boutique hotel in a restored Haussmann-era building in the 8th arrondissement. Rooms pair tall windows and heavy drapes with marble bathrooms, a short walk from the Champs-Élysées.",
  },
  {
    name: "Villa Sorrelle",
    location: "Taormina, Italy",
    rating: 4.6,
    reviews: 732,
    price: 340,
    image: unsplash("1445019980597-93fa8acb246c"),
    description:
      "A small hillside retreat above Taormina with a sun terrace facing the hills of eastern Sicily. Evenings are quiet, and the old town and its Greek theatre are ten minutes away on foot.",
  },
  {
    name: "Tidewater Reef Lodge",
    location: "Port Douglas, Australia",
    rating: 4.4,
    reviews: 2109,
    price: 255,
    image: unsplash("1582719508461-905c673771fd"),
    description:
      "A beachfront lodge on Four Mile Beach with a timber sun deck and a pool looking out over the Coral Sea. A convenient base for day trips to the Great Barrier Reef and the Daintree Rainforest.",
  },
  {
    name: "Masseria Calaluce",
    location: "Polignano a Mare, Italy",
    rating: 4.2,
    reviews: 518,
    price: 196,
    image: unsplash("1551882547-ff40c63fe5fa"),
    description:
      "A whitewashed country estate in Puglia, a few minutes inland from the Adriatic coast. Rooms occupy restored stone buildings around a palm-lined pool, with breakfast made from local produce.",
  },
  {
    name: "Umikaze Terrace Okinawa",
    location: "Okinawa, Japan",
    rating: 3.9,
    reviews: 968,
    price: 118,
    image: unsplash("1571896349842-33c89424de2d"),
    description:
      "A relaxed resort on Okinawa's west coast with a pool that is lit up at night and gardens planted with palms. Straightforward, well-priced rooms within a short drive of the beaches at Onna.",
  },
];

const main = async () => {
  const isDryRun = process.argv.includes("--dry-run");

  const validated = hotels.map((hotel) => CreateHotelDTO.parse(hotel));

  console.table(
    validated.map(({ name, location, price, rating, reviews }) => ({
      name,
      location,
      price,
      rating,
      reviews,
    }))
  );

  if (isDryRun) {
    console.log(`Dry run: ${validated.length} hotels validated. Database not touched.`);
    return;
  }

  const url = process.env.MONGODB_URL;
  if (!url) {
    throw new Error("MONGODB_URL is not set");
  }

  await mongoose.connect(url, { serverSelectionTimeoutMS: 10000 });
  console.log(`Connected to ${mongoose.connection.host}/${mongoose.connection.name}`);

  const result = await Hotel.bulkWrite(
    validated.map((hotel) => ({
      updateOne: {
        filter: { name: hotel.name },
        update: { $set: hotel },
        upsert: true,
      },
    }))
  );

  console.log(
    `Inserted ${result.upsertedCount}, updated ${result.modifiedCount}, ` +
      `unchanged ${result.matchedCount - result.modifiedCount}.`
  );
  console.log(`Hotels now in collection: ${await Hotel.countDocuments()}`);
};

main()
  .catch((error) => {
    console.error("Seed failed:", error instanceof Error ? error.message : error);
    process.exitCode = 1;
  })
  .finally(() => mongoose.disconnect());
