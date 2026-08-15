import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { DatePicker } from "./DatePicker";
import { addDays, startOfDay } from "date-fns";

const formSchema = z
  .object({
    checkIn: z.date({ error: "Check-in date is required" }),
    checkOut: z.date({ error: "Check-out date is required" }),
  })
  .refine((data) => data.checkOut > data.checkIn, {
    message: "Check-out date must be after check-in date",
    path: ["checkOut"],
  });

export default function BookingForm({ onSubmit, isLoading, hotelId }) {
  const today = startOfDay(new Date());
  const tomorrow = addDays(today, 1);

  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      checkIn: today,
      checkOut: tomorrow,
    },
  });

  const handleSubmit = (values) => {
    onSubmit({
      ...values,
      hotelId,
    });
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="checkIn"
          render={({ field }) => (
            <FormItem className="flex flex-col">
              <FormLabel>Check-in Date</FormLabel>
              <DatePicker field={field} disabled={{ before: today }} />
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="checkOut"
          render={({ field }) => (
            <FormItem className="flex flex-col">
              <FormLabel>Check-out Date</FormLabel>
              <DatePicker
                field={field}
                disabled={{ before: addDays(form.watch("checkIn") || today, 1) }}
              />
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" className="w-full" disabled={isLoading}>
          {isLoading ? "Booking..." : "Book Now"}
        </Button>
      </form>
    </Form>
  );
}
