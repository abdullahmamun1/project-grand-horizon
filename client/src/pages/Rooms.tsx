import { useState } from "react";
import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { 
  Search, 
  Star, 
  Filter, 
  X, 
  Users,
  SlidersHorizontal 
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetFooter,
} from "@/components/ui/sheet";
import { Checkbox } from "@/components/ui/checkbox";
import { Slider } from "@/components/ui/slider";
import type { Room, Review, RoomCategory, RoomFilters } from "@shared/schema";
import { roomCategories, predefinedAmenities } from "@shared/schema";

interface RoomWithReviews extends Room {
  reviews: Review[];
  averageRating: number;
}

function RoomCard({ room }: { room: RoomWithReviews }) {
  return (
    <Card className="overflow-hidden group hover-elevate" data-testid={`card-room-${room._id}`}>
      <div className="flex flex-col md:flex-row">
        <div className="relative md:w-72 lg:w-80 shrink-0">
          <div className="aspect-[4/3] md:aspect-auto md:h-full overflow-hidden">
            {room.images[0] ? (
              <img
                src={room.images[0]}
                alt={room.name}
                className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
              />
            ) : (
              <div className="w-full h-full bg-muted flex items-center justify-center min-h-[200px]">
                <span className="text-muted-foreground">No image</span>
              </div>
            )}
          </div>
          <div className="absolute top-3 left-3">
            <Badge variant="secondary" className="bg-primary text-primary-foreground">
              {room.category}
            </Badge>
          </div>
        </div>
        
        <CardContent className="flex-1 p-5 flex flex-col">
          <div className="flex items-start justify-between gap-2 mb-2">
            <h3 className="font-semibold text-xl">{room.name}</h3>
            {room.averageRating > 0 && (
              <div className="flex items-center gap-1 shrink-0">
                <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                <span className="text-sm font-medium">{room.averageRating.toFixed(1)}</span>
                <span className="text-xs text-muted-foreground">
                  ({room.reviews.length} reviews)
                </span>
              </div>
            )}
          </div>
          
          <p className="text-sm text-muted-foreground line-clamp-2 mb-4">
            {room.description}
          </p>
          
          <div className="flex flex-wrap gap-2 mb-4">
            {room.amenities.slice(0, 4).map((amenity) => (
              <Badge key={amenity} variant="outline" className="text-xs">
                {amenity}
              </Badge>
            ))}
            {room.amenities.length > 4 && (
              <Badge variant="outline" className="text-xs">
                +{room.amenities.length - 4} more
              </Badge>
            )}
          </div>
          
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
            <Users className="h-4 w-4" />
            <span>Up to {room.capacity} guests</span>
          </div>
          
          <div className="mt-auto flex items-center justify-between gap-4">
            <div>
              <span className="text-2xl font-bold">${room.pricePerNight}</span>
              <span className="text-sm text-muted-foreground">/night</span>
            </div>
            <Button asChild>
              <Link href={`/rooms/${room._id}`} data-testid={`link-view-room-${room._id}`}>
                View Details
              </Link>
            </Button>
          </div>
        </CardContent>
      </div>
    </Card>
  );
}

function RoomCardSkeleton() {
  return (
    <Card className="overflow-hidden">
      <div className="flex flex-col md:flex-row">
        <Skeleton className="aspect-[4/3] md:w-72 lg:w-80 md:aspect-auto md:h-64" />
        <CardContent className="flex-1 p-5 space-y-4">
          <div className="flex justify-between">
            <Skeleton className="h-6 w-1/2" />
            <Skeleton className="h-4 w-16" />
          </div>
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
          <div className="flex gap-2">
            <Skeleton className="h-6 w-16" />
            <Skeleton className="h-6 w-16" />
            <Skeleton className="h-6 w-16" />
          </div>
          <div className="flex justify-between items-center pt-4">
            <Skeleton className="h-8 w-24" />
            <Skeleton className="h-10 w-28" />
          </div>
        </CardContent>
      </div>
    </Card>
  );
}

export default function Rooms() {
  const [filters, setFilters] = useState<RoomFilters>({});
  const [searchQuery, setSearchQuery] = useState("");
  const [priceRange, setPriceRange] = useState([0, 1000]);
  const [selectedAmenities, setSelectedAmenities] = useState<string[]>([]);
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  const queryParams = new URLSearchParams();
  if (filters.category) queryParams.set("category", filters.category);
  if (filters.minPrice) queryParams.set("minPrice", String(filters.minPrice));
  if (filters.maxPrice) queryParams.set("maxPrice", String(filters.maxPrice));
  if (filters.amenities?.length) queryParams.set("amenities", filters.amenities.join(","));

  const { data: rooms, isLoading } = useQuery<RoomWithReviews[]>({
    queryKey: ["/api/rooms", queryParams.toString()],
  });

  const filteredRooms = rooms?.filter((room) => {
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      if (
        !room.name.toLowerCase().includes(query) &&
        !room.description.toLowerCase().includes(query)
      ) {
        return false;
      }
    }
    return true;
  });

  const applyFilters = () => {
    setFilters({
      ...filters,
      minPrice: priceRange[0] > 0 ? priceRange[0] : undefined,
      maxPrice: priceRange[1] < 1000 ? priceRange[1] : undefined,
      amenities: selectedAmenities.length > 0 ? selectedAmenities : undefined,
    });
    setIsFilterOpen(false);
  };

  const clearFilters = () => {
    setFilters({});
    setPriceRange([0, 1000]);
    setSelectedAmenities([]);
    setSearchQuery("");
  };

  const hasActiveFilters = 
    filters.category || 
    filters.minPrice || 
    filters.maxPrice || 
    (filters.amenities && filters.amenities.length > 0);

  return (
    <div className="min-h-screen bg-background">
      <div className="bg-card border-b">
        <div className="container mx-auto px-4 py-8">
          <h1 className="text-3xl md:text-4xl font-serif font-bold mb-2">
            Our Rooms
          </h1>
          <p className="text-muted-foreground">
            Find your perfect accommodation from our collection of luxury rooms.
          </p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row gap-4 mb-8">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search rooms..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
              data-testid="input-search-rooms"
            />
          </div>

          <Select
            value={filters.category || "all"}
            onValueChange={(value) =>
              setFilters({
                ...filters,
                category: value === "all" ? undefined : (value as RoomCategory),
              })
            }
          >
            <SelectTrigger className="w-full md:w-48" data-testid="select-category">
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {roomCategories.map((category) => (
                <SelectItem key={category} value={category}>
                  {category}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Sheet open={isFilterOpen} onOpenChange={setIsFilterOpen}>
            <SheetTrigger asChild>
              <Button variant="outline" className="gap-2" data-testid="button-filters">
                <SlidersHorizontal className="h-4 w-4" />
                Filters
                {hasActiveFilters && (
                  <Badge variant="secondary" className="ml-1">Active</Badge>
                )}
              </Button>
            </SheetTrigger>
            <SheetContent className="w-full sm:max-w-md">
              <SheetHeader>
                <SheetTitle>Filter Rooms</SheetTitle>
              </SheetHeader>
              
              <div className="py-6 space-y-6">
                <div className="space-y-4">
                  <Label>Price Range (per night)</Label>
                  <Slider
                    value={priceRange}
                    onValueChange={setPriceRange}
                    min={0}
                    max={1000}
                    step={50}
                    data-testid="slider-price-range"
                  />
                  <div className="flex items-center justify-between text-sm text-muted-foreground">
                    <span>${priceRange[0]}</span>
                    <span>${priceRange[1]}+</span>
                  </div>
                </div>

                <div className="space-y-4">
                  <Label>Amenities</Label>
                  <div className="grid grid-cols-2 gap-3 max-h-64 overflow-y-auto">
                    {predefinedAmenities.filter(a => a !== "Other").map((amenity) => (
                      <div key={amenity} className="flex items-center space-x-2">
                        <Checkbox
                          id={amenity}
                          checked={selectedAmenities.includes(amenity)}
                          onCheckedChange={(checked) => {
                            setSelectedAmenities(
                              checked
                                ? [...selectedAmenities, amenity]
                                : selectedAmenities.filter((a) => a !== amenity)
                            );
                          }}
                          data-testid={`checkbox-amenity-${amenity}`}
                        />
                        <label
                          htmlFor={amenity}
                          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                        >
                          {amenity}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <SheetFooter className="gap-2">
                <Button variant="outline" onClick={clearFilters} data-testid="button-clear-filters">
                  Clear All
                </Button>
                <Button onClick={applyFilters} data-testid="button-apply-filters">
                  Apply Filters
                </Button>
              </SheetFooter>
            </SheetContent>
          </Sheet>

          {hasActiveFilters && (
            <Button 
              variant="ghost" 
              size="icon"
              onClick={clearFilters}
              data-testid="button-clear-all-filters"
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>

        {hasActiveFilters && (
          <div className="flex flex-wrap gap-2 mb-6">
            {filters.category && (
              <Badge variant="secondary" className="gap-1">
                {filters.category}
                <X
                  className="h-3 w-3 cursor-pointer"
                  onClick={() => setFilters({ ...filters, category: undefined })}
                />
              </Badge>
            )}
            {(filters.minPrice || filters.maxPrice) && (
              <Badge variant="secondary" className="gap-1">
                ${filters.minPrice || 0} - ${filters.maxPrice || "1000+"}
                <X
                  className="h-3 w-3 cursor-pointer"
                  onClick={() => setFilters({ ...filters, minPrice: undefined, maxPrice: undefined })}
                />
              </Badge>
            )}
            {filters.amenities?.map((amenity) => (
              <Badge key={amenity} variant="secondary" className="gap-1">
                {amenity}
                <X
                  className="h-3 w-3 cursor-pointer"
                  onClick={() =>
                    setFilters({
                      ...filters,
                      amenities: filters.amenities?.filter((a) => a !== amenity),
                    })
                  }
                />
              </Badge>
            ))}
          </div>
        )}

        <div className="space-y-6">
          {isLoading ? (
            <>
              <RoomCardSkeleton />
              <RoomCardSkeleton />
              <RoomCardSkeleton />
            </>
          ) : filteredRooms && filteredRooms.length > 0 ? (
            filteredRooms.map((room) => (
              <RoomCard key={room._id} room={room} />
            ))
          ) : (
            <div className="text-center py-16">
              <Filter className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No rooms found</h3>
              <p className="text-muted-foreground mb-4">
                Try adjusting your filters or search criteria.
              </p>
              <Button variant="outline" onClick={clearFilters}>
                Clear Filters
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
