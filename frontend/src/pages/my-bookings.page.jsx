import { useState } from "react";
import { Link } from "react-router";
import { MapPin } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useCancelBookingMutation, useGetMyBookingsQuery } from "@/lib/api";

const formatDate = (dateString) =>
  new Date(dateString).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });

export default function MyBookingsPage() {
  const { data: bookings, isLoading, isError } = useGetMyBookingsQuery();
  const [cancelBooking] = useCancelBookingMutation();
  const [cancellingId, setCancellingId] = useState(null);

  const handleCancel = async (bookingId) => {
    if (!window.confirm("Are you sure you want to cancel this booking?")) {
      return;
    }

    setCancellingId(bookingId);
    try {
      await cancelBooking(bookingId).unwrap();
      toast.success("Booking cancelled successfully");
    } catch (error) {
      toast.error(error?.data?.message || "Failed to cancel booking");
    } finally {
      setCancellingId(null);
    }
  };

  if (isLoading) {
    return (
      <main className="container mx-auto px-4 py-8 min-h-screen">
        <h1 className="text-2xl font-bold mb-6">My Bookings</h1>
        <div className="space-y-4">
          <Skeleton className="h-32 w-full rounded-lg" />
          <Skeleton className="h-32 w-full rounded-lg" />
          <Skeleton className="h-32 w-full rounded-lg" />
        </div>
      </main>
    );
  }

  if (isError) {
    return (
      <main className="container mx-auto px-4 py-8 min-h-screen">
        <h1 className="text-2xl font-bold mb-6">My Bookings</h1>
        <p className="text-red-500">Failed to load your bookings.</p>
      </main>
    );
  }

  if (!bookings || bookings.length === 0) {
    return (
      <main className="container mx-auto px-4 py-8 min-h-screen">
        <h1 className="text-2xl font-bold mb-6">My Bookings</h1>
        <p className="text-muted-foreground mb-4">
          You haven&apos;t booked any stays yet.
        </p>
        <Button asChild>
          <Link to="/">Browse Hotels</Link>
        </Button>
      </main>
    );
  }

  return (
    <main className="container mx-auto px-4 py-8 min-h-screen">
      <h1 className="text-2xl font-bold mb-6">My Bookings</h1>
      <div className="space-y-4">
        {bookings.map((booking) => (
          <Card key={booking._id}>
            <CardContent className="p-4 flex flex-col sm:flex-row gap-4">
              {booking.hotelId?.image && (
                <img
                  src={booking.hotelId.image}
                  alt={booking.hotelId.name}
                  className="w-full sm:w-40 h-32 object-cover rounded-md"
                />
              )}
              <div className="flex-1 space-y-1">
                {booking.hotelId ? (
                  <Link
                    to={`/hotels/${booking.hotelId._id}`}
                    className="text-lg font-semibold hover:underline"
                  >
                    {booking.hotelId.name}
                  </Link>
                ) : (
                  <p className="text-lg font-semibold text-muted-foreground">
                    Hotel unavailable
                  </p>
                )}
                {booking.hotelId?.location && (
                  <div className="flex items-center text-muted-foreground text-sm">
                    <MapPin className="h-4 w-4 mr-1" />
                    <span>{booking.hotelId.location}</span>
                  </div>
                )}
                <p className="text-sm">
                  {formatDate(booking.checkIn)} → {formatDate(booking.checkOut)}
                </p>
                <p className="text-sm text-muted-foreground">
                  Room {booking.roomNumber}
                </p>
              </div>
              <div className="flex items-start">
                <Button
                  variant="destructive"
                  onClick={() => handleCancel(booking._id)}
                  disabled={cancellingId === booking._id}
                >
                  {cancellingId === booking._id
                    ? "Cancelling..."
                    : "Cancel Booking"}
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </main>
  );
}
