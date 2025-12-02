import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight, Star, Wifi, Coffee, Car, Dumbbell, UtensilsCrossed, Waves } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import heroImage from "@assets/generated_images/luxury_hotel_exterior_sunset.png";
import type { Room, Review } from "@shared/schema";

interface RoomWithReviews extends Room {
  reviews: Review[];
  averageRating: number;
}

const amenityIcons = [
  { icon: Wifi, label: "Free WiFi" },
  { icon: Coffee, label: "Breakfast" },
  { icon: Car, label: "Free Parking" },
  { icon: Dumbbell, label: "Fitness Center" },
  { icon: UtensilsCrossed, label: "Restaurant" },
  { icon: Waves, label: "Pool & Spa" },
];

function RoomCard({ room }: { room: RoomWithReviews }) {
  return (
    <Card className="overflow-hidden group hover-elevate" data-testid={`card-room-${room._id}`}>
      <div className="relative aspect-[4/3] overflow-hidden">
        {room.images[0] ? (
          <img
            src={room.images[0]}
            alt={room.name}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="w-full h-full bg-muted flex items-center justify-center">
            <span className="text-muted-foreground">No image</span>
          </div>
        )}
        <div className="absolute top-3 left-3">
          <span className="px-3 py-1 text-xs font-medium bg-primary text-primary-foreground rounded-full">
            {room.category}
          </span>
        </div>
      </div>
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-2 mb-2">
          <h3 className="font-semibold text-lg line-clamp-1">{room.name}</h3>
          {room.averageRating > 0 && (
            <div className="flex items-center gap-1 shrink-0">
              <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
              <span className="text-sm font-medium">{room.averageRating.toFixed(1)}</span>
            </div>
          )}
        </div>
        <p className="text-sm text-muted-foreground line-clamp-2 mb-4">
          {room.description}
        </p>
        <div className="flex items-center justify-between gap-2">
          <div>
            <span className="text-2xl font-bold">${room.pricePerNight}</span>
            <span className="text-sm text-muted-foreground">/night</span>
          </div>
          <Button asChild size="sm">
            <Link href={`/rooms/${room._id}`} data-testid={`link-view-room-${room._id}`}>
              View Details
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function RoomCardSkeleton() {
  return (
    <Card className="overflow-hidden">
      <Skeleton className="aspect-[4/3]" />
      <CardContent className="p-5 space-y-3">
        <Skeleton className="h-6 w-3/4" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-2/3" />
        <div className="flex items-center justify-between pt-2">
          <Skeleton className="h-8 w-20" />
          <Skeleton className="h-9 w-24" />
        </div>
      </CardContent>
    </Card>
  );
}

export default function Home() {
  const { data: rooms, isLoading } = useQuery<RoomWithReviews[]>({
    queryKey: ["/api/rooms", { limit: 6 }],
  });

  return (
    <div className="min-h-screen">
      <section className="relative h-[500px] md:h-[600px] flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0">
          <img
            src={heroImage}
            alt="Grand Horizon Hotel"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/40 to-black/70" />
        </div>
        
        <div className="relative z-10 container mx-auto px-4 text-center text-white">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-serif font-bold mb-4 tracking-tight">
            Welcome to Grand Horizon
          </h1>
          <p className="text-lg md:text-xl text-white/90 max-w-2xl mx-auto mb-8">
            Experience the perfect blend of luxury and comfort. 
            Your unforgettable getaway awaits with stunning ocean views and world-class amenities.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button size="lg" asChild className="min-w-[160px]">
              <Link href="/rooms" data-testid="link-explore-rooms">
                Explore Rooms
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button 
              size="lg" 
              variant="outline" 
              asChild 
              className="min-w-[160px] bg-white/10 backdrop-blur-sm border-white/30 text-white hover:bg-white/20"
            >
              <Link href="/rooms" data-testid="link-book-now">
                Book Now
              </Link>
            </Button>
          </div>
        </div>
      </section>

      <section className="py-16 md:py-24 bg-card">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-serif font-bold mb-4">
              Our Amenities
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Enjoy a wide range of premium amenities designed for your comfort and convenience.
            </p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
            {amenityIcons.map(({ icon: Icon, label }) => (
              <div
                key={label}
                className="flex flex-col items-center gap-3 p-6 rounded-xl bg-background border hover-elevate"
              >
                <div className="p-3 rounded-full bg-primary/10">
                  <Icon className="h-6 w-6 text-primary" />
                </div>
                <span className="text-sm font-medium text-center">{label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16 md:py-24">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between mb-12">
            <div>
              <h2 className="text-3xl md:text-4xl font-serif font-bold mb-2">
                Featured Rooms
              </h2>
              <p className="text-muted-foreground">
                Discover our most popular accommodations.
              </p>
            </div>
            <Button variant="outline" asChild className="hidden md:flex">
              <Link href="/rooms" data-testid="link-view-all-rooms">
                View All Rooms
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {isLoading ? (
              <>
                <RoomCardSkeleton />
                <RoomCardSkeleton />
                <RoomCardSkeleton />
              </>
            ) : rooms && rooms.length > 0 ? (
              rooms.slice(0, 6).map((room) => (
                <RoomCard key={room._id} room={room} />
              ))
            ) : (
              <div className="col-span-full text-center py-12">
                <p className="text-muted-foreground">No rooms available at the moment.</p>
              </div>
            )}
          </div>

          <div className="mt-8 text-center md:hidden">
            <Button variant="outline" asChild>
              <Link href="/rooms">
                View All Rooms
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      <section className="py-16 md:py-24 bg-primary text-primary-foreground">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-serif font-bold mb-4">
            Ready to Experience Luxury?
          </h2>
          <p className="text-primary-foreground/80 max-w-2xl mx-auto mb-8">
            Book your stay today and discover why Grand Horizon Hotel is the 
            perfect destination for your next vacation.
          </p>
          <Button 
            size="lg" 
            variant="secondary" 
            asChild
          >
            <Link href="/rooms" data-testid="link-cta-book">
              Book Your Stay
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </section>
    </div>
  );
}
