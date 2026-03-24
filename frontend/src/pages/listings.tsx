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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  ListingChatAction,
  ListingHeartAction,
} from "@/components/listing-actions";

type Listing = {
  id: number;
  title: string;
  price: string;
  address: string;
  addressLine1: string;
  city: string;
  state: string;
  zip: string;
  beds: number;
  baths: number;
  sqft: number;
  image: string;
  image_urls?: string[];
  description: string;
  status: string;
};

type ChatPreview = {
  id: number;
  name: string;
  role: string;
  avatar: string;
  lastMessage: string;
  time: string;
  unread: boolean;
  pinned: boolean;
  category: string;
};

type SortOption = "recommended" | "price-asc" | "price-desc" | "newest";

type StatusFilter = "all" | "active" | "pending" | "new";

function buildGoogleMapsUrl(listing: Listing): string {
  const address = [
    listing.addressLine1,
    listing.city,
    listing.state,
    listing.zip,
  ].filter(Boolean).join(", ");

  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`;
}

function buildListingCandidateBodyText(listing: Listing): string {
  const fullAddress = [
    listing.addressLine1,
    listing.city,
    listing.state,
    listing.zip,
  ]
    .filter(Boolean)
    .join(", ");

  const mapsUrl = buildGoogleMapsUrl(listing);
  return JSON.stringify({
    address: fullAddress,
    mapsUrl,
    price: listing.price,
    beds: listing.beds,
    baths: listing.baths,
    sqft: listing.sqft,
    image: listing.image,
  });
}

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
  const [openListingId, setOpenListingId] = useState<number | null>(null);
  const [pendingDeepLinkListingId, setPendingDeepLinkListingId] = useState<number | null>(null);
  const [chatDialogOpen, setChatDialogOpen] = useState(false);
  const [chatListingId, setChatListingId] = useState<number | null>(null);
  const [chats, setChats] = useState<ChatPreview[]>([]);
  const [chatsLoading, setChatsLoading] = useState(false);
  const [chatsError, setChatsError] = useState<string | null>(null);
  const [selectedChatId, setSelectedChatId] = useState<number | null>(null);
  const [chatSending, setChatSending] = useState(false);
  const [chatSendError, setChatSendError] = useState<string | null>(null);
  const [hasLoadedChatsForDialogOpen, setHasLoadedChatsForDialogOpen] = useState(false);
  const [boardAddLoadingId, setBoardAddLoadingId] = useState<number | null>(null);
  const [boardAddMessage, setBoardAddMessage] = useState<{
    listingId: number;
    kind: "success" | "error";
    message: string;
  } | null>(null);
  const [boardCandidatesLoading, setBoardCandidatesLoading] = useState(false);
  const [boardCandidatesError, setBoardCandidatesError] = useState<string | null>(null);
  const [collabItemIdByListingId, setCollabItemIdByListingId] = useState<
    Record<number, number>
  >({});
  const [boardHeartLoadingId, setBoardHeartLoadingId] = useState<number | null>(null);

  useEffect(() => {
    document.title = "Listings · HomeSync";
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const listingIdParam = params.get("listingId");
    const parsed = listingIdParam ? Number(listingIdParam) : NaN;
    if (Number.isFinite(parsed) && parsed > 0) {
      setPendingDeepLinkListingId(parsed);
    }
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

  useEffect(() => {
    if (listings.length === 0) return;
    let cancelled = false;

    async function loadCandidates() {
      setBoardCandidatesLoading(true);
      setBoardCandidatesError(null);
      try {
        const res = await fetch("/api/board/items?type=listing_candidate", {
          credentials: "include",
        });
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          if (!cancelled) {
            setBoardCandidatesError(body.message ?? "Failed to load board items.");
          }
          return;
        }

        const data = (await res.json()) as Array<{
          listingId?: number;
          numericId?: number;
          type?: string;
        }>;

        if (cancelled) return;
        const next: Record<number, number> = {};
        for (const item of data) {
          if (
            item.type === "listing_candidate" &&
            typeof item.listingId === "number" &&
            typeof item.numericId === "number"
          ) {
            next[item.listingId] = item.numericId;
          }
        }
        setCollabItemIdByListingId(next);
      } catch {
        if (!cancelled) setBoardCandidatesError("Could not reach backend.");
      } finally {
        if (!cancelled) setBoardCandidatesLoading(false);
      }
    }

    loadCandidates();
    return () => {
      cancelled = true;
    };
  }, [listings.length]);

  useEffect(() => {
    if (pendingDeepLinkListingId === null) return;
    if (listings.length === 0) return;

    const target = listings.find((l) => l.id === pendingDeepLinkListingId);
    if (!target) return;

    setOpenListingId(target.id);
    setPendingDeepLinkListingId(null);
  }, [pendingDeepLinkListingId, listings]);

  useEffect(() => {
    if (!chatDialogOpen) return;
    if (hasLoadedChatsForDialogOpen) return;

    let cancelled = false;
    async function loadChats() {
      setChatsLoading(true);
      setChatsError(null);
      try {
        const res = await fetch("/api/chats", { credentials: "include" });
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          if (!cancelled) {
            setChatsError(body.message ?? "Failed to load chats.");
          }
          return;
        }

        const data: ChatPreview[] = await res.json();
        if (cancelled) return;
        setChats(data);
        setSelectedChatId(data.length > 0 ? data[0].id : null);
        setHasLoadedChatsForDialogOpen(true);
      } catch {
        if (!cancelled) setChatsError("Could not reach backend.");
      } finally {
        if (!cancelled) setChatsLoading(false);
      }
    }

    loadChats();
    return () => {
      cancelled = true;
    };
  }, [chatDialogOpen, hasLoadedChatsForDialogOpen]);

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

  const chatListing =
    chatListingId !== null
      ? listings.find((l) => l.id === chatListingId) ?? null
      : null;

  function openChatDialogForListing(listingId: number) {
    setChatListingId(listingId);
    setChatDialogOpen(true);
    setHasLoadedChatsForDialogOpen(false);
    setChats([]);
    setChatsError(null);
    setChatSendError(null);
    setChatSending(false);
    setSelectedChatId(null);
  }

  async function sendListingToChat() {
    if (!chatListing) return;
    if (!selectedChatId) return;

    setChatSending(true);
    setChatSendError(null);
    try {
      const fullAddress = [
        chatListing.addressLine1,
        chatListing.city,
        chatListing.state,
        chatListing.zip,
      ]
        .filter(Boolean)
        .join(", ");

      const mapsUrl = buildGoogleMapsUrl(chatListing);
      const listingUrl = `${window.location.origin}/listings?listingId=${chatListing.id}`;
      const messageText = `Shared a listing: ${chatListing.title} (${chatListing.price})`;

      const res = await fetch(`/api/chats/${selectedChatId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          messageText,
          messageType: "listing_share",
          payload: {
            listingId: chatListing.id,
            title: chatListing.title,
            price: chatListing.price,
            address: fullAddress,
            image: chatListing.image,
            listingUrl,
            mapsUrl,
          },
        }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        setChatSendError(body.message ?? "Unable to send message.");
        return;
      }

      setChatDialogOpen(false);
      setChatListingId(null);
    } catch {
      setChatSendError("Could not reach backend.");
    } finally {
      setChatSending(false);
    }
  }

  function retryLoadChats() {
    setHasLoadedChatsForDialogOpen(false);
    setChats([]);
    setSelectedChatId(null);
    setChatsError(null);
  }

  async function addListingToBoard(listing: Listing) {
    setBoardAddLoadingId(listing.id);
    setBoardAddMessage(null);

    try {
      const fullAddress = [
        listing.addressLine1,
        listing.city,
        listing.state,
        listing.zip,
      ]
        .filter(Boolean)
        .join(", ");

      const mapsUrl = buildGoogleMapsUrl(listing);
      const bodyText = JSON.stringify({
        address: fullAddress,
        mapsUrl,
        price: listing.price,
        beds: listing.beds,
        baths: listing.baths,
        sqft: listing.sqft,
        image: listing.image,
      });

      const res = await fetch("/api/board/items", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          listingId: listing.id,
          itemType: "listing_candidate",
          title: listing.title,
          bodyText,
        }),
      });

      if (!res.ok) {
        const payload = await res.json().catch(() => ({}));
        throw new Error(payload.message ?? "Unable to add to board.");
      }

      const payload = await res.json().catch(() => ({}));
      if (typeof payload.numericId === "number") {
        setCollabItemIdByListingId((prev) => ({
          ...prev,
          [listing.id]: payload.numericId,
        }));
      }

      setBoardAddMessage({
        listingId: listing.id,
        kind: "success",
        message: "Added to Potential Homes.",
      });
    } catch (error) {
      const msg =
        error instanceof Error ? error.message : "Unable to add to board.";
      setBoardAddMessage({
        listingId: listing.id,
        kind: "error",
        message: msg,
      });
    } finally {
      setBoardAddLoadingId(null);
    }
  }

  async function addListingCandidateForHeart(listing: Listing) {
    setBoardHeartLoadingId(listing.id);
    try {
      const res = await fetch("/api/board/items", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          listingId: listing.id,
          itemType: "listing_candidate",
          title: listing.title,
          bodyText: buildListingCandidateBodyText(listing),
        }),
      });

      if (!res.ok) {
        const payload = await res.json().catch(() => ({}));
        throw new Error(payload.message ?? "Unable to add to board.");
      }

      const payload = await res.json().catch(() => ({}));
      if (typeof payload.numericId === "number") {
        setCollabItemIdByListingId((prev) => ({
          ...prev,
          [listing.id]: payload.numericId,
        }));
      }
    } catch {
      // Keep UI state unchanged on failure.
    } finally {
      setBoardHeartLoadingId(null);
    }
  }

  async function removeListingCandidateForHeart(listingId: number) {
    const collabItemId = collabItemIdByListingId[listingId];
    if (typeof collabItemId !== "number") return;

    setBoardHeartLoadingId(listingId);
    try {
      const res = await fetch(`/api/board/items/${collabItemId}`, {
        method: "DELETE",
        credentials: "include",
      });

      if (!res.ok) {
        const payload = await res.json().catch(() => ({}));
        throw new Error(payload.message ?? "Unable to remove from board.");
      }

      setCollabItemIdByListingId((prev) => {
        const next = { ...prev };
        delete next[listingId];
        return next;
      });
    } catch {
      // Keep UI state unchanged on failure.
    } finally {
      setBoardHeartLoadingId(null);
    }
  }

  async function toggleListingCandidateOnBoard(listing: Listing) {
    const collabItemId = collabItemIdByListingId[listing.id];
    const isInBoard = typeof collabItemId === "number";

    if (isInBoard) {
      await removeListingCandidateForHeart(listing.id);
      return;
    }

    await addListingCandidateForHeart(listing);
  }

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

            const collabItemId = collabItemIdByListingId[listing.id];
            const isInBoard = typeof collabItemId === "number";
            const heartHoverText = isInBoard
              ? "Remove from collaboration board"
              : "Add to collaboration board";

            return (
              <Dialog
                key={listing.id}
                open={openListingId === listing.id}
                onOpenChange={(open) => {
                  if (open) {
                    setOpenListingId(listing.id);
                  } else {
                    if (openListingId === listing.id) {
                      setOpenListingId(null);
                    }
                    setActiveImageIndex((prev) => ({
                      ...prev,
                      [listing.id]: 0,
                    }));
                  }
                }}
              >
                <DialogTrigger asChild>
                  <div
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        (e.currentTarget as HTMLDivElement).click();
                      }
                    }}
                    className="group cursor-pointer rounded-xl border border-border/50 bg-card text-left text-card-foreground shadow hover:shadow-lg hover:border-primary/20 transition-all duration-300 flex flex-col h-full p-4"
                  >
                    <div className="relative aspect-[4/3] rounded-lg overflow-hidden bg-muted/20">
                      <img
                        src={primaryImage}
                        alt={`Photo of ${listing.title}`}
                        className="object-cover w-full h-full transition-transform duration-500 group-hover:scale-110"
                      />
                      <div className="absolute top-3 right-3 flex flex-col gap-2 items-end">
                        <ListingChatAction
                          onClick={() => openChatDialogForListing(listing.id)}
                          disabled={chatSending}
                          label="Send to chat"
                        />
                        <ListingHeartAction
                          onClick={() => toggleListingCandidateOnBoard(listing)}
                          inBoard={isInBoard}
                          loading={boardHeartLoadingId === listing.id}
                          hoverLabel={heartHoverText}
                        />
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

                    <CardContent className="p-0 flex-1 space-y-3 pt-4">
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
                  </div>
                </DialogTrigger>

                <DialogContent className="w-[min(92vw,760px)] h-[min(88vh,760px)] overflow-hidden p-0 gap-0 border-none shadow-2xl">
                  <div className="flex h-full min-h-0 flex-col">
                  <div className="w-full shrink-0 bg-card p-4 border-b border-border/40">
                    <div className="relative h-56 sm:h-72 w-full rounded-xl overflow-hidden bg-muted">
                      <img
                        src={primaryImage}
                        alt={`Photo of ${listing.title}`}
                        className="h-full w-full object-contain"
                      />
                    </div>
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
                  <div className="flex-1 min-h-0 overflow-y-auto p-6 space-y-6 bg-card">
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
                      <a
                        href={buildGoogleMapsUrl(listing)}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center gap-2 text-muted-foreground hover:text-primary cursor-pointer transition-colors"
                        aria-label={`Open ${listing.title} on Google Maps`}
                      >
                        <MapPin className="h-4 w-4" />
                        {listing.addressLine1}, {listing.city}, {listing.state}{" "}
                        {listing.zip}
                      </a>
                      <p className="text-sm text-muted-foreground mt-2">
                        Property details: {listing.beds} beds • {listing.baths} baths •{" "}
                        {listing.sqft} sqft
                      </p>
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
                      <Button
                        type="button"
                        variant="outline"
                        className="w-full"
                        onClick={() => addListingToBoard(listing)}
                        disabled={boardAddLoadingId !== null}
                      >
                        {boardAddLoadingId === listing.id ? (
                          <span className="inline-flex items-center gap-2">
                            <Loader2 className="h-4 w-4 animate-spin" />
                            Adding...
                          </span>
                        ) : (
                          "Add to collaboration board"
                        )}
                      </Button>
                      <Button
                        type="button"
                        className="w-full"
                        onClick={() => openChatDialogForListing(listing.id)}
                        disabled={chatSending}
                      >
                        Send to Chat
                      </Button>
                    </div>

                    {boardAddMessage?.listingId === listing.id ? (
                      <p
                        className={`text-sm mt-3 ${
                          boardAddMessage.kind === "success"
                            ? "text-primary"
                            : "text-destructive"
                        }`}
                      >
                        {boardAddMessage.message}
                      </p>
                    ) : null}
                  </div>
                  </div>
                </DialogContent>
              </Dialog>
            );
          })}
        </div>
      )}

      <Dialog
        open={chatDialogOpen}
        onOpenChange={(open) => {
          setChatDialogOpen(open);
          if (!open) {
            setChatListingId(null);
            setSelectedChatId(null);
            setHasLoadedChatsForDialogOpen(false);
            setChatsError(null);
            setChatSendError(null);
            setChatSending(false);
            setChats([]);
          }
        }}
      >
        <DialogContent className="w-[min(92vw,720px)] overflow-hidden">
          <div className="space-y-3">
            <DialogTitle className="text-2xl font-bold text-foreground">
              Send to Chat
            </DialogTitle>

            <div className="rounded-2xl border border-border/40 bg-muted/20 p-4">
              {chatListing ? (
                <div className="space-y-1">
                  <p className="font-bold">{chatListing.title}</p>
                  <p className="text-sm text-muted-foreground">
                    {chatListing.addressLine1}, {chatListing.city},{" "}
                    {chatListing.state} {chatListing.zip}
                  </p>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Select a home from Listings first.
                </p>
              )}
            </div>

            {chatsError ? (
              <div className="space-y-2">
                <p className="text-sm text-destructive">{chatsError}</p>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={retryLoadChats}
                >
                  Retry loading conversations
                </Button>
              </div>
            ) : null}

            {chatsLoading ? (
              <div className="flex items-center gap-2 text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                Loading conversations...
              </div>
            ) : chats.length > 0 ? (
              <div className="space-y-2">
                <p className="text-sm font-semibold">Choose a person</p>
                <Select
                  value={selectedChatId !== null ? String(selectedChatId) : undefined}
                  onValueChange={(v) => {
                    const num = Number(v);
                    setSelectedChatId(Number.isFinite(num) ? num : null);
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a conversation" />
                  </SelectTrigger>
                  <SelectContent>
                    {chats.map((c) => (
                      <SelectItem key={c.id} value={String(c.id)}>
                        {c.name} ({c.role})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            ) : (
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">
                  No conversations found. Start a chat with someone first.
                </p>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={retryLoadChats}
                >
                  Refresh conversations
                </Button>
              </div>
            )}

            {chatSendError ? (
              <p className="text-sm text-destructive">{chatSendError}</p>
            ) : null}

            <div className="flex gap-3 pt-2">
              <Button
                type="button"
                variant="outline"
                className="flex-1"
                onClick={() => setChatDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button
                type="button"
                className="flex-1"
                disabled={!selectedChatId || chatSending || !chatListing}
                onClick={sendListingToChat}
              >
                {chatSending ? (
                  <span className="inline-flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Sending...
                  </span>
                ) : (
                  "Send"
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
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