import { useNavigate } from "react-router";
import { toast } from "sonner";

import HotelForm from "@/components/HotelForm";
import { useCreateHotelMutation } from "@/lib/api";

export default function CreateHotelPage() {
  const [createHotel, { isLoading }] = useCreateHotelMutation();
  const navigate = useNavigate();

  const handleSubmit = async (values) => {
    try {
      const hotel = await createHotel(values).unwrap();
      toast.success("Hotel created successfully");
      navigate(`/hotels/${hotel._id}`);
    } catch (error) {
      toast.error(error?.data?.message || "Hotel creation failed");
    }
  };

  return (
    <main className="container mx-auto px-4 py-8 min-h-screen max-w-2xl">
      <h1 className="text-2xl font-bold mb-6">Create a Hotel</h1>
      <HotelForm onSubmit={handleSubmit} isLoading={isLoading} submitLabel="Create Hotel" />
    </main>
  );
}
