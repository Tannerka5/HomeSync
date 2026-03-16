import { useState, useEffect } from "react";
import { 
  Filter, 
  MapPin, 
  BedDouble, 
  Bath, 
  Maximize, 
  Heart,
  ChevronDown,
  Loader2
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
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
  description: string;
  status: string;
};

export default function ListingsPage() {
  const [sortOrder, setSortOrder] = useState("Recommended");
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/listings", { credentials: "include" });
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          setError(body.message ?? "Failed to load listings.");
          return;
        }
        setListings(await res.json());
      } catch {
        setError("Could not reach backend.");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  return (
    <div className="container mx-auto px-4 py-6 md:py-10 space-y-8">
      {/* Header & Controls */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Listings</h1>
          <p className="text-muted-foreground mt-1">Find your future home</p>
        </div>
        
        <div className="flex gap-3">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="gap-2">
                <Filter className="h-4 w-4" />
                Filter
                <ChevronDown className="h-3 w-3 opacity-50" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuLabel>Saved Searches</DropdownMenuLabel>
              <DropdownMenuItem>My Dream Homes</DropdownMenuItem>
              <DropdownMenuItem>Condos under 500k</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem>Create new search...</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="gap-2 min-w-[140px] justify-between">
                <span>{sortOrder}</span>
                <ChevronDown className="h-3 w-3 opacity-50" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuLabel>Sort By</DropdownMenuLabel>
              <DropdownMenuItem onClick={() => setSortOrder("Recommended")}>Recommended</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setSortOrder("Price: Low to High")}>Price: Low to High</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setSortOrder("Price: High to Low")}>Price: High to Low</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setSortOrder("Newest Listed")}>Newest Listed</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Loading / Error */}
      {loading && (
        <div className="flex justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      )}
      {error && !loading && (
        <p className="text-center text-muted-foreground py-10">{error}</p>
      )}

      {/* Listings Grid */}
      {!loading && !error && (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {listings.map((listing) => (
          <Dialog key={listing.id}>
            <DialogTrigger asChild>
              <Card className="group cursor-pointer overflow-hidden border-border/50 bg-card hover:shadow-lg hover:border-primary/20 transition-all duration-300 flex flex-col h-full">
                {/* Image */}
                <div className="relative aspect-[4/3] overflow-hidden">
                  <img 
                    src={listing.image} 
                    alt={listing.title} 
                    className="object-cover w-full h-full transition-transform duration-500 group-hover:scale-110"
                  />
                  <div className="absolute top-3 right-3">
                    <Button size="icon" variant="ghost" className="h-8 w-8 rounded-full bg-black/20 text-white hover:bg-white hover:text-red-500 backdrop-blur-sm transition-colors">
                      <Heart className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="absolute top-3 left-3">
                     <Badge variant="secondary" className="bg-white/90 text-primary font-bold backdrop-blur-md shadow-sm">
                        {listing.status}
                     </Badge>
                  </div>
                  <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 to-transparent p-4">
                     <p className="text-white font-bold text-xl">{listing.price}</p>
                  </div>
                </div>

                {/* Content */}
                <CardContent className="p-4 flex-1 space-y-3">
                  <div>
                    <h3 className="font-bold text-lg leading-tight group-hover:text-primary transition-colors">
                      {listing.title}
                    </h3>
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
              </Card>
            </DialogTrigger>
            
            <DialogContent className="sm:max-w-[600px] overflow-hidden p-0 gap-0 border-none shadow-2xl">
              <div className="relative aspect-video w-full">
                <img 
                  src={listing.image} 
                  alt={listing.title} 
                  className="object-cover w-full h-full"
                />
                <Button 
                  className="absolute top-4 right-4 rounded-full bg-white/20 hover:bg-white/40 backdrop-blur text-white border-none shadow-none"
                  size="icon"
                >
                   <Heart className="h-5 w-5" />
                </Button>
              </div>
              <div className="p-6 space-y-6 bg-card">
                 <div>
                    <div className="flex justify-between items-start mb-2">
                       <DialogTitle className="text-2xl font-bold text-foreground">{listing.title}</DialogTitle>
                       <p className="text-2xl font-bold text-primary">{listing.price}</p>
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
                       <p className="text-sm text-muted-foreground">Bathrooms</p>
                       <p className="text-xl font-bold">{listing.baths}</p>
                    </div>
                    <div className="text-center border-l border-border/50">
                       <p className="text-sm text-muted-foreground">Square Feet</p>
                       <p className="text-xl font-bold">{listing.sqft}</p>
                    </div>
                 </div>

                 <div className="space-y-2">
                    <h4 className="font-semibold">About this home</h4>
                    <p className="text-muted-foreground leading-relaxed">
                       {listing.description} This home features premium finishes, hardwood floors throughout, and lots of natural light. Perfect for entertaining or relaxing in your private oasis.
                    </p>
                 </div>

                 <div className="grid grid-cols-2 gap-4 pt-2">
                    <Button variant="outline" className="w-full">Add to Board</Button>
                    <Button className="w-full">Message Agent</Button>
                 </div>
              </div>
            </DialogContent>
          </Dialog>
        ))}
      </div>
      )}
    </div>
  );
}