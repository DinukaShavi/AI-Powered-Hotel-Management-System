import { useState } from "react";
import { useNavigate } from "react-router";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sparkles } from "lucide-react";
import { useAiSearchHotelsMutation } from "@/lib/api";

export default function Hero() {
  const [query, setQuery] = useState("");
  const [aiSearchHotels, { isLoading }] = useAiSearchHotelsMutation();
  const navigate = useNavigate();

  const handleSearch = async (e) => {
    e.preventDefault();

    if (isLoading) return;

    const trimmedQuery = query.trim();
    if (!trimmedQuery) {
      toast.error("Please describe what you're looking for");
      return;
    }

    try {
      const hotels = await aiSearchHotels(trimmedQuery).unwrap();
      navigate("/hotels", {
        state: { aiResults: hotels, aiQuery: trimmedQuery },
      });
    } catch (error) {
      toast.error(error?.data?.message || "AI search failed. Please try again.");
    }
  };

  return (
    <div className="">
      {/* Hero Content */}
      <div className="relative z-10 flex flex-col items-center  text-white justify-center px-8 pt-32 pb-32">
        <h1 className="text-4xl md:text-6xl font-bold  mb-8 text-center">
          Find Your Best Staycation
        </h1>
        <p className="text-xl  mb-12 text-center  max-w-2xl">
          Describe your dream destination and experience, and we&apos;ll find
          the perfect place for you.
        </p>

        {/* Search Form */}
        <form
          onSubmit={handleSearch}
          className="w-full max-w-3xl bg-black/10  backdrop-blur-md lg:h-16 rounded-full p-2 flex items-center"
        >
          <Input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Describe your destination, experience, or hotel..."
            className="flex-grow  bg-transparent lg:text-lg  text-white placeholder:text-white/50 border-none outline-none focus:border-none focus:outline-none focus-visible:ring-0"
          />
          <Button
            type="submit"
            disabled={isLoading}
            className="rounded-full w-48 flex items-center gap-x-2 lg:h-12"
          >
            <Sparkles
              style={{ width: "20px", height: "20px" }}
              className=" mr-2 animate-pulse text-sky-400"
            />
            <span className="lg:text-lg">
              {isLoading ? "Searching..." : "AI Search"}
            </span>
          </Button>
        </form>
      </div>
    </div>
  );
}
