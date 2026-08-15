import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  useCreateBookingMutation,
  useDeleteHotelMutation,
  useGetHotelByIdQuery,
} from "@/lib/api";
import {
  Coffee,
  MapPin,
  MenuIcon as Restaurant,
  Star,
  Tv,
  Wifi,
} from "lucide-react";

import { Link, useParams, useNavigate } from "react-router";
import { useSelector } from "react-redux";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";
import { BookingDialog } from "@/components/BookingDialog";

export default function HotelPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { data: hotel, isLoading, isError } = useGetHotelByIdQuery(id);
  const isAuthenticated = useSelector((state) => state.auth.isAuthenticated);
  const user = useSelector((state) => state.auth.user);
  const isAdmin = user?.role === "ADMIN";

  const [createBooking, { isLoading: isBooking }] = useCreateBookingMutation();
  const [deleteHotel, { isLoading: isDeleting }] = useDeleteHotelMutation();

  const handleDelete = async () => {
    if (
      !window.confirm(
        "Are you sure you want to delete this hotel? This cannot be undone."
      )
    ) {
      return;
    }

    try {
      await deleteHotel(id).unwrap();
      toast.success("Hotel deleted successfully");
      navigate("/");
    } catch (error) {
      toast.error(error?.data?.message || "Failed to delete hotel");
    }
  };

  const handleBookNowClick = () => {
    toast.error("Please sign in to book a room");
    navigate("/sign-in");
  };

  const handleBook = async (bookingData) => {
    try {
      await createBooking(bookingData).unwrap();
      toast.success("Booking confirmed!");
      navigate("/my-bookings");
    } catch (error) {
      toast.error(error?.data?.message || "Booking failed");
      throw error;
    }
  };

  if (isLoading)
    return (
      <div className="container mx-auto px-4 py-8 min-h-screen">
        <div className="grid md:grid-cols-2 gap-8">
          <div className="space-y-4">
            <Skeleton className="w-full h-[400px] rounded-lg" />
            <div className="flex space-x-2">
              <Skeleton className="h-6 w-24" />
              <Skeleton className="h-6 w-32" />
              <Skeleton className="h-6 w-28" />
            </div>
          </div>
          <div className="space-y-6">
            <div className="flex justify-between items-start">
              <div>
                <Skeleton className="h-8 w-64 mb-2" />
                <Skeleton className="h-4 w-48" />
              </div>
              <Skeleton className="h-10 w-10 rounded-full" />
            </div>
            <Skeleton className="h-4 w-36" />
            <div className="space-y-2">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
            </div>
            <Card>
              <CardContent className="p-4">
                <Skeleton className="h-6 w-32 mb-4" />
                <div className="grid grid-cols-2 gap-4">
                  {[...Array(4)].map((_, index) => (
                    <div key={index} className="flex items-center">
                      <Skeleton className="h-5 w-5 mr-2" />
                      <Skeleton className="h-4 w-24" />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
            <div className="flex items-center justify-between">
              <div>
                <Skeleton className="h-8 w-24 mb-1" />
                <Skeleton className="h-4 w-16" />
              </div>
              <Skeleton className="h-12 w-32" />
            </div>
          </div>
        </div>
      </div>
    );

  if (isError) return <p className="text-red">Failed to load this hotel.</p>;

  return (
    <div className="container mx-auto px-4 py-8 min-h-screen">
      <div className="grid md:grid-cols-2 gap-8">
        <div className="space-y-4">
          <div className="relative w-full h-[400px]">
            <img
              src={hotel.image}
              alt={hotel.name}
              className="absolute object-cover rounded-lg"
            />
          </div>
          <div className="flex space-x-2">
            <Badge variant="secondary">Rooftop View</Badge>
            <Badge variant="secondary">French Cuisine</Badge>
            <Badge variant="secondary">City Center</Badge>
          </div>
        </div>
        <div className="space-y-6">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-3xl font-bold">{hotel.name}</h1>
              <div className="flex items-center mt-2">
                <MapPin className="h-5 w-5 text-muted-foreground mr-1" />
                <p className="text-muted-foreground">{hotel.location}</p>
              </div>
            </div>
            <Button variant="outline" size="icon">
              <Star className="h-4 w-4" />
              <span className="sr-only">Add to favorites</span>
            </Button>
          </div>
          {isAdmin && (
            <div className="flex gap-2">
              <Button variant="outline" asChild>
                <Link to={`/hotels/${id}/edit`}>Edit Hotel</Link>
              </Button>
              <Button
                variant="destructive"
                onClick={handleDelete}
                disabled={isDeleting}
              >
                {isDeleting ? "Deleting..." : "Delete Hotel"}
              </Button>
            </div>
          )}
          <div className="flex items-center space-x-1">
            <Star className="h-5 w-5 fill-primary text-primary" />
            <span className="font-bold">{hotel.rating}</span>
            <span className="text-muted-foreground">
              ({hotel.reviews.toLocaleString()} reviews)
            </span>
          </div>
          <p className="text-muted-foreground">{hotel.description}</p>
          <Card>
            <CardContent className="p-4">
              <h2 className="text-xl font-semibold mb-4">Amenities</h2>
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center">
                  <Wifi className="h-5 w-5 mr-2" />
                  <span>Free Wi-Fi</span>
                </div>
                <div className="flex items-center">
                  <Restaurant className="h-5 w-5 mr-2" />
                  <span>Restaurant</span>
                </div>
                <div className="flex items-center">
                  <Tv className="h-5 w-5 mr-2" />
                  <span>Flat-screen TV</span>
                </div>
                <div className="flex items-center">
                  <Coffee className="h-5 w-5 mr-2" />
                  <span>Coffee maker</span>
                </div>
              </div>
            </CardContent>
          </Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-2xl font-bold">${hotel.price}</p>
              <p className="text-sm text-muted-foreground">per night</p>
            </div>
            {isAuthenticated ? (
              <BookingDialog
                hotelName={hotel.name}
                hotelId={id}
                onSubmit={handleBook}
                isLoading={isBooking}
              />
            ) : (
              <Button size="lg" onClick={handleBookNowClick}>
                Book Now
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
