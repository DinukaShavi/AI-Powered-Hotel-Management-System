import { Link, useLocation } from "react-router";

import HotelListings from "@/components/HotelListings";
import HotelCard from "@/components/HotelCard";
import { Button } from "@/components/ui/button";

const HotelsPage = () => {
  const location = useLocation();
  const aiResults = location.state?.aiResults;
  const aiQuery = location.state?.aiQuery;

  if (aiResults) {
    return (
      <main className="min-h-screen px-8 py-8 lg:py-16">
        <div className="mb-8 flex items-center justify-between gap-4 flex-wrap">
          <div>
            <h2 className="text-2xl md:text-3xl font-bold mb-2">
              AI Search Results
            </h2>
            <p className="text-muted-foreground">
              Showing hotels matching &ldquo;{aiQuery}&rdquo;
            </p>
          </div>
          <Button variant="outline" asChild>
            <Link to="/hotels">Browse all hotels</Link>
          </Button>
        </div>

        {aiResults.length === 0 ? (
          <p className="text-muted-foreground">
            No hotels matched that description. Try describing it
            differently, or browse all hotels instead.
          </p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {aiResults.map((hotel) => (
              <HotelCard key={hotel._id} hotel={hotel} />
            ))}
          </div>
        )}
      </main>
    );
  }

  return (
    <main className="min-h-screen">
      <HotelListings />
    </main>
  );
};

export default HotelsPage;
