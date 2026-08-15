import { useNavigate, useParams } from "react-router";
import { toast } from "sonner";

import HotelForm from "@/components/HotelForm";
import { Skeleton } from "@/components/ui/skeleton";
import { useGetHotelByIdQuery, useUpdateHotelMutation } from "@/lib/api";

export default function EditHotelPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const {
    data: hotel,
    isLoading: isLoadingHotel,
    isError,
  } = useGetHotelByIdQuery(id);
  const [updateHotel, { isLoading: isUpdating }] = useUpdateHotelMutation();

  const handleSubmit = async (values) => {
    try {
      await updateHotel({ id, ...values }).unwrap();
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
      <HotelForm
        defaultValues={{
          name: hotel.name,
          location: hotel.location,
          rating: hotel.rating,
          reviews: hotel.reviews,
          image: hotel.image,
          price: hotel.price,
          description: hotel.description,
        }}
        onSubmit={handleSubmit}
        isLoading={isUpdating}
        submitLabel="Save Changes"
      />
    </main>
  );
}
