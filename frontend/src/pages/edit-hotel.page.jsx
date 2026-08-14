import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { useGetHotelByIdQuery, useUpdateHotelMutation } from "@/lib/api";

const emptyForm = {
  name: "",
  location: "",
  rating: "",
  reviews: "",
  image: "",
  price: "",
  description: "",
};

export default function EditHotelPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const {
    data: hotel,
    isLoading: isLoadingHotel,
    isError,
  } = useGetHotelByIdQuery(id);
  const [updateHotel, { isLoading: isUpdating }] = useUpdateHotelMutation();
  const [formData, setFormData] = useState(emptyForm);

  useEffect(() => {
    if (hotel) {
      setFormData({
        name: hotel.name,
        location: hotel.location,
        rating: hotel.rating,
        reviews: hotel.reviews,
        image: hotel.image,
        price: hotel.price,
        description: hotel.description,
      });
    }
  }, [hotel]);

  const handleChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (isUpdating) return;

    const { name, location, rating, reviews, image, price, description } =
      formData;

    if (
      !name ||
      !location ||
      !rating ||
      !reviews ||
      !image ||
      !price ||
      !description
    ) {
      toast.error("Please fill in all fields");
      return;
    }

    const ratingValue = Number(rating);
    if (Number.isNaN(ratingValue) || ratingValue < 1 || ratingValue > 5) {
      toast.error("Rating must be a number between 1 and 5");
      return;
    }

    try {
      await updateHotel({
        id,
        name,
        location,
        rating: ratingValue,
        reviews: Number(reviews),
        image,
        price: Number(price),
        description,
      }).unwrap();
      toast.success("Hotel updated successfully");
      navigate(`/hotels/${id}`);
    } catch (error) {
      toast.error(error?.data?.message || "Hotel update failed");
    }
  };

  if (isLoadingHotel) {
    return (
      <main className="container mx-auto px-4 py-8 min-h-screen max-w-2xl space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-24 w-full" />
      </main>
    );
  }

  if (isError) {
    return (
      <main className="container mx-auto px-4 py-8 min-h-screen">
        <p className="text-red-500">Failed to load this hotel.</p>
      </main>
    );
  }

  return (
    <main className="container mx-auto px-4 py-8 min-h-screen max-w-2xl">
      <h1 className="text-2xl font-bold mb-6">Edit Hotel</h1>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <label htmlFor="name" className="text-sm font-medium">
            Name
          </label>
          <Input
            id="name"
            name="name"
            value={formData.name}
            onChange={handleChange}
            placeholder="Hotel name"
          />
        </div>
        <div className="space-y-2">
          <label htmlFor="location" className="text-sm font-medium">
            Location
          </label>
          <Input
            id="location"
            name="location"
            value={formData.location}
            onChange={handleChange}
            placeholder="City, Country"
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <label htmlFor="rating" className="text-sm font-medium">
              Rating (1-5)
            </label>
            <Input
              id="rating"
              name="rating"
              type="number"
              min="1"
              max="5"
              step="0.1"
              value={formData.rating}
              onChange={handleChange}
              placeholder="4.5"
            />
          </div>
          <div className="space-y-2">
            <label htmlFor="reviews" className="text-sm font-medium">
              Reviews
            </label>
            <Input
              id="reviews"
              name="reviews"
              type="number"
              min="0"
              value={formData.reviews}
              onChange={handleChange}
              placeholder="100"
            />
          </div>
        </div>
        <div className="space-y-2">
          <label htmlFor="image" className="text-sm font-medium">
            Image URL
          </label>
          <Input
            id="image"
            name="image"
            value={formData.image}
            onChange={handleChange}
            placeholder="https://..."
          />
        </div>
        <div className="space-y-2">
          <label htmlFor="price" className="text-sm font-medium">
            Price per night ($)
          </label>
          <Input
            id="price"
            name="price"
            type="number"
            min="0"
            value={formData.price}
            onChange={handleChange}
            placeholder="150"
          />
        </div>
        <div className="space-y-2">
          <label htmlFor="description" className="text-sm font-medium">
            Description
          </label>
          <Textarea
            id="description"
            name="description"
            rows={4}
            value={formData.description}
            onChange={handleChange}
            placeholder="Describe the hotel..."
          />
        </div>
        <Button type="submit" disabled={isUpdating}>
          {isUpdating ? "Saving..." : "Save Changes"}
        </Button>
      </form>
    </main>
  );
}
