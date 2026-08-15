import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

const emptyValues = {
  name: "",
  location: "",
  rating: "",
  reviews: "",
  image: "",
  price: "",
  description: "",
};

const formSchema = z.object({
  name: z.string().min(1, "Hotel name is required"),
  location: z.string().min(1, "Location is required"),
  rating: z.coerce
    .number()
    .min(1, "Rating must be between 1 and 5")
    .max(5, "Rating must be between 1 and 5"),
  reviews: z.coerce.number().int().min(0, "Reviews must be a positive number"),
  image: z.string().min(1, "Image URL is required"),
  price: z.coerce.number().min(0, "Price must be a positive number"),
  description: z.string().min(1, "Description is required"),
});

export default function HotelForm({ defaultValues, onSubmit, isLoading, submitLabel }) {
  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: { ...emptyValues, ...defaultValues },
    values: defaultValues,
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Name</FormLabel>
              <FormControl>
                <Input placeholder="Hotel name" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="location"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Location</FormLabel>
              <FormControl>
                <Input placeholder="City, Country" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="rating"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Rating (1-5)</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    min="1"
                    max="5"
                    step="0.1"
                    placeholder="4.5"
                    {...field}
                    onChange={(e) => field.onChange(e.target.valueAsNumber)}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="reviews"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Reviews</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    min="0"
                    placeholder="100"
                    {...field}
                    onChange={(e) => field.onChange(e.target.valueAsNumber)}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <FormField
          control={form.control}
          name="image"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Image URL</FormLabel>
              <FormControl>
                <Input placeholder="https://..." {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="price"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Price per night ($)</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  min="0"
                  placeholder="150"
                  {...field}
                  onChange={(e) => field.onChange(e.target.valueAsNumber)}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description</FormLabel>
              <FormControl>
                <Textarea rows={4} placeholder="Describe the hotel..." {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" disabled={isLoading}>
          {isLoading ? "Saving..." : submitLabel}
        </Button>
      </form>
    </Form>
  );
}
