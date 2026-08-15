import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import BookingForm from "./BookingForm";
import { useState } from "react";

export function BookingDialog({ hotelName, hotelId, onSubmit, isLoading }) {
  const [open, setOpen] = useState(false);

  const handleBookingSubmit = async (bookingData) => {
    try {
      await onSubmit(bookingData);
      // Only close the dialog once the booking actually succeeded.
      setOpen(false);
    } catch {
      // Keep the dialog open on failure so the user can see the error and retry.
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="lg">Book Now</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Book Your Stay</DialogTitle>
          <DialogDescription>
            Complete the form below to book your stay at {hotelName}.
          </DialogDescription>
        </DialogHeader>
        <BookingForm
          onSubmit={handleBookingSubmit}
          isLoading={isLoading}
          hotelId={hotelId}
        />
      </DialogContent>
    </Dialog>
  );
}
