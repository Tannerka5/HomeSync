import { useEffect, useMemo, useState } from "react";
import {
  Filter,
  MapPin,
  BedDouble,
  Bath,
  Maximize,
  Heart,
  ChevronDown,
  Loader2,
  Search,
} from "lucide-react";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

type Listing = {
  id: number;
  title: string;
  price: string;
  address: string;
  beds: number;
  baths: number;
  sqft: number;
  image: string;
  image_urls?: string[];
  description: string;
  status: string;
};

type SortOption = "recommended" | "price-asc" | "price-desc" | "newest";

type StatusFilter = "all" | "active" | "pending" | "new";

export default function ListingsPage() {
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [searchQuery, setSearchQuery] = useState("");
  const [minPrice, setMinPrice] = useState<number | undefined>(undefined);
  const [maxPrice, setMaxPrice] = useState<number | undefined>(undefined);
  const [minBeds, setMinBeds] = useState(0);
  const [minBaths, setMinBaths] = useState(0);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [sortBy, setSortBy] = useState<SortOption>("recommended");
  const [activeImageIndex, setActiveImageIndex] = useState<
    Record<number, number>
  >({});

  useEffect(() => {
    document.title = "Listings · HomeSync";
  }, []);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/listings", { credentials: "include" });
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          setError(body.message ?? "Failed to load listings.");
          return;
        }
        const data: Listing[] = await res.json();
        setListings(data);

        const numericPrices = data
          .map((l) => extractNumericPrice(l.price))
          .filter(
            (v): v is number =>
              typeof v === "number" && !Number.isNaN(v),
          );
        if (numericPrices.length > 0) {
          const min = Math.min(...numericPrices);
          const max = Math.max(...numericPrices);
          setMinPrice(min);
          setMaxPrice(max);
        }
      } catch {
        setError("Could not reach backend.");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const displayedListings = useMemo(() => {
    const withNumericPrice = listings.map((l) => {
      const num = extractNumericPrice(l.price);
      return { ...l, _priceNumber: num };
    });

    let result = withNumericPrice;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (l) =>
          l.title.toLowerCase().includes(q) ||
          l.address.toLowerCase().includes(q) ||
          l.description.toLowerCase().includes(q),
      );
    }

    if (minPrice !== undefined) {
      result = result.filter(
        (l) =>
          typeof l._priceNumber === "number" &&
          !Number.isNaN(l._priceNumber) &&
          l._priceNumber >= minPrice,
      );
    }
    if (maxPrice !== undefined) {
      result = result.filter(
        (l) =>
          typeof l._priceNumber === "number" &&
          !Number.isNaN(l._priceNumber) &&
          l._priceNumber <= maxPrice,
      );
    }

    if (minBeds > 0) {
      result = result.filter((l) => (l.beds ?? 0) >= minBeds);
    }
    if (minBaths > 0) {
      result = result.filter((l) => (l.baths ?? 0) >= minBaths);
    }

    if (statusFilter !== "all") {
      const label =
        statusFilter.charAt(0).toUpperCase() + statusFilter.slice(1);
      result = result.filter((l) => l.status === label);
    }

    if (sortBy === "price-asc") {
      result = [...result].sort(
        (a, b) => (a._priceNumber ?? 0) - (b._priceNumber ?? 0),
      );
    } else if (sortBy === "price-desc") {
      result = [...result].sort(
        (a, b) => (b._priceNumber ?? 0) - (a._priceNumber ?? 0),
      );
    } else if (sortBy === "newest") {
      result = [...result];
    }

    return result;
  }, [listings, searchQuery, minPrice, maxPrice, minBeds, minBaths, statusFilter, sortBy]);

  const handleThumbnailClick = (listingId: number, index: number) => {
    setActiveImageIndex((prev) => ({ ...prev, [listingId]: index }));
  };

  return (
    <div className="container mx-auto px-4 py-6 md:py-10 space-y-6 md:space-y-8">
      <div className="flex flex-col gap-4 md:gap-6">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Listings</h1>
            <p className="text-muted-foreground mt-1">
              Find your future home powered by Zillow data
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 md:items-center md:justify-end">
            <div className="relative w-full sm:w-72">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by address, city, or description"
                className="pl-9"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            <div className="flex gap-3 justify-end">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="gap-2">
                    <Filter className="h-4 w-4" />
                    Filters
                    <ChevronDown className="h-3 w-3 opacity-50" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  align="end"
                  className="w-72 space-y-3 p-3"
                >
                  <DropdownMenuLabel>Price range</DropdownMenuLabel>
                  <div className="space-y-2">
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>
                        Min:{" "}
                        {minPrice !== undefined
                          ? formatCurrency(minPrice)
                          : "Any"}
                      </span>
                      <span>
                        Max:{" "}
                        {maxPrice !== undefined
                          ? formatCurrency(maxPrice)
                          : "Any"}
                      </span>
                    </div>
                    {minPrice !== undefined &&
                      maxPrice !== undefined &&
                      minPrice < maxPrice && (
                        <Slider
                          min={minPrice}
                          max={maxPrice}
                          step={5000}
                          value={[minPrice, maxPrice]}
                          onValueChange={([min, max]) => {
                            setMinPrice(min);
                            setMaxPrice(max);
                          }}
                        />
                      )}
                  </div>

                  <DropdownMenuSeparator />

                  <DropdownMenuLabel>Bedrooms &amp; bathrooms</DropdownMenuLabel>
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex flex-col gap-1">
                      <span className="text-xs text-muted-foreground">
                        Min beds
                      </span>
                      <Input
                        type="number"
                        min={0}
                        className="w-20"
                        value={minBeds}
                        onChange={(e) =>
                          setMinBeds(Math.max(0, Number(e.target.value) || 0))
                        }
                      />
                    </div>
                    <div className="flex flex-col gap-1">
                      <span className="text-xs text-muted-foreground">
                        Min baths
                      </span>
                      <Input
                        type="number"
                        min={0}
                        className="w-20"
                        value={minBaths}
                        onChange={(e) =>
                          setMinBaths(Math.max(0, Number(e.target.value) || 0))
                        }
                      />
                    </div>
                  </div>

                  <DropdownMenuSeparator />

                  <DropdownMenuLabel>Status</DropdownMenuLabel>
                  <div className="flex flex-wrap gap-2">
                    {(["all", "active", "pending", "new"] as StatusFilter[]).map(
                      (s) => (
                        <Button
                          key={s}
                          type="button"
                          size="sm"
                          variant={
                            statusFilter === s ? "default" : "outline"
                          }
                          onClick={() => setStatusFilter(s)}
                        >
                          {s === "all"
                            ? "All"
                            : s.charAt(0).toUpperCase() + s.slice(1)}
                        </Button>
                      ),
                    )}
                  </div>
                </DropdownMenuContent>
              </DropdownMenu>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="outline"
                    className="gap-2 min-w-[160px] justify-between"
                  >
                    <span>
                      {sortBy === "recommended"
                        ? "Recommended"
                        : sortBy === "price-asc"
                        ? "Price: Low to High"
                        : sortBy === "price-desc"
                        ? "Price: High to Low"
                        : "Newest Listed"}
                    </span>
                    <ChevronDown className="h-3 w-3 opacity-50" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel>Sort by</DropdownMenuLabel>
                  <DropdownMenuItem
                    onClick={() => setSortBy("recommended")}
                  >
                    Recommended
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setSortBy("price-asc")}>
                    Price: Low to High
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setSortBy("price-desc")}>
                    Price: High to Low
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setSortBy("newest")}>
                    Newest Listed
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>

        {displayedListings.length > 0 && (
          <p className="text-sm text-muted-foreground">
            Showing {displayedListings.length} of {listings.length} homes
          </p>
        )}
      </div>

      {loading && (
        <div className="flex justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      )}
      {error && !loading && (
        <p className="text-center text-muted-foreground py-10">{error}</p>
      )}

      {!loading && !error && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {displayedListings.map((listing) => {
            const gallery = listing.image_urls ?? [];
            const currentIndex =
              activeImageIndex[listing.id] && gallery[activeImageIndex[listing.id]]
                ? activeImageIndex[listing.id]
                : 0;
            const primaryImage =
              gallery[currentIndex] ||
              listing.image ||
              "/images/listing-placeholder.jpg";

            return (
              <Dialog
                key={listing.id}
                onOpenChange={(open) => {
                  if (!open) {
                    setActiveImageIndex((prev) => ({
                      ...prev,
                      [listing.id]: 0,
                    }));
                  }
                }}
              >
                <DialogTrigger asChild>
                  <button
                    type="button"
                    className="group cursor-pointer overflow-hidden rounded-xl border border-border/50 bg-card text-left text-card-foreground shadow hover:shadow-lg hover:border-primary/20 transition-all duration-300 flex flex-col h-full"
                  >
                    <div className="relative aspect-[4/3] overflow-hidden">
                      <img
                        src={primaryImage}
                        alt={`Photo of ${listing.title}`}
                        className="object-cover w-full h-full transition-transform duration-500 group-hover:scale-110"
                      />
                      <div className="absolute top-3 right-3">
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8 rounded-full bg-black/20 text-white hover:bg-white hover:text-red-500 backdrop-blur-sm transition-colors"
                          aria-label="Save listing"
                          onClick={(e) => e.preventDefault()}
                        >
                          <Heart className="h-4 w-4" />
                        </Button>
                      </div>
                      <div className="absolute top-3 left-3">
                        <Badge
                          variant="secondary"
                          className="bg-white/90 text-primary font-bold backdrop-blur-md shadow-sm"
                        >
                          {listing.status}
                        </Badge>
                      </div>
                      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 to-transparent p-4">
                        <p className="text-white font-bold text-xl">
                          {listing.price}
                        </p>
                      </div>
                    </div>

                    <CardContent className="p-4 flex-1 space-y-3">
                      <div>
                        <h2 className="font-bold text-lg leading-tight group-hover:text-primary transition-colors">
                          {listing.title}
                        </h2>
                        <div className="flex items-center gap-1 text-muted-foreground text-sm mt-1">
                          <MapPin className="h-3 w-3" />
                          <span className="truncate">{listing.address}</span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between text-sm text-muted-foreground pt-2 border-t border-border/50">
                        <div className="flex items-center gap-1">
                          <BedDouble className="h-4 w-4" />
                          <span>{listing.beds} Beds</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Bath className="h-4 w-4" />
                          <span>{listing.baths} Baths</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Maximize className="h-4 w-4" />
                          <span>{listing.sqft} sqft</span>
                        </div>
                      </div>
                    </CardContent>
                  </button>
                </DialogTrigger>

                <DialogContent className="w-[min(92vw,720px)] h-[min(84vh,720px)] overflow-hidden p-0 gap-0 border-none shadow-2xl">
                  <div className="flex h-full flex-col">
                  <div className="relative h-56 sm:h-72 w-full shrink-0 bg-muted">
                    <img
                      src={primaryImage}
                      alt={`Photo of ${listing.title}`}
                      className="h-full w-full object-contain"
                    />
                    <Button
                      className="absolute top-4 right-4 rounded-full bg-white/20 hover:bg-white/40 backdrop-blur text-white border-none shadow-none"
                      size="icon"
                      aria-label="Save listing"
                    >
                      <Heart className="h-5 w-5" />
                    </Button>
                  </div>
                  {gallery.length > 1 && (
                    <div className="px-6 pt-4 pb-3 bg-card border-b border-border/40">
                      <div className="flex gap-2 overflow-x-auto pb-1">
                        {gallery.map((url, idx) => (
                          <button
                            key={url + idx}
                            type="button"
                            className={`relative flex-shrink-0 w-20 h-16 rounded-md overflow-hidden border ${
                              idx === currentIndex
                                ? "border-primary"
                                : "border-border/40"
                            }`}
                            onClick={() =>
                              handleThumbnailClick(listing.id, idx)
                            }
                          >
                            <img
                              src={url}
                              alt={`Additional photo ${idx + 1} of ${listing.title}`}
                              className="object-cover w-full h-full"
                            />
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                  <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-card">
                    <div>
                      <div className="flex justify-between items-start mb-2 gap-3">
                        <DialogTitle className="text-2xl font-bold text-foreground">
                          {listing.title}
                        </DialogTitle>
                        <div className="text-right">
                          <p className="text-2xl font-bold text-primary">
                            {listing.price}
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">
                            Status: {listing.status}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <MapPin className="h-4 w-4" />
                        {listing.address}
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-4 py-4 border-y border-border/50">
                      <div className="text-center">
                        <p className="text-sm text-muted-foreground">Bedrooms</p>
                        <p className="text-xl font-bold">{listing.beds}</p>
                      </div>
                      <div className="text-center border-l border-border/50">
                        <p className="text-sm text-muted-foreground">
                          Bathrooms
                        </p>
                        <p className="text-xl font-bold">{listing.baths}</p>
                      </div>
                      <div className="text-center border-l border-border/50">
                        <p className="text-sm text-muted-foreground">
                          Square Feet
                        </p>
                        <p className="text-xl font-bold">{listing.sqft}</p>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <h3 className="font-semibold">About this home</h3>
                      <p className="text-muted-foreground leading-relaxed">
                        {listing.description ||
                          "Detailed description for this home has not been provided yet."}
                      </p>
                    </div>

                    <div className="grid grid-cols-2 gap-4 pt-2">
                      <Button variant="outline" className="w-full">
                        Add to Board
                      </Button>
                      <Button className="w-full">Message Agent</Button>
                    </div>
                  </div>
                  </div>
                </DialogContent>
              </Dialog>
            );
          })}
        </div>
      )}
    </div>
  );
}

function extractNumericPrice(formattedPrice: string): number | undefined {
  const digits = formattedPrice.replace(/[^0-9]/g, "");
  if (!digits) return undefined;
  const n = Number(digits);
  return Number.isFinite(n) ? n : undefined;
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);
}