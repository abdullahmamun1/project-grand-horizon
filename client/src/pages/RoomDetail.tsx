import { useState } from "react";
import { useRoute, Link, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { format, differenceInDays, addDays } from "date-fns";
import {
  ArrowLeft,
  Star,
  Users,
  ChevronLeft,
  ChevronRight,
  Check,
  Calendar,
  Minus,
  Plus,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useAuth } from "@/lib/auth";
import type { RoomWithReviews } from "@shared/schema";

export default function RoomDetail() {
  const [, params] = useRoute("/rooms/:id");
  const [, setLocation] = useLocation();
  const { isAuthenticated } = useAuth();
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [checkIn, setCheckIn] = useState<Date>();
  const [checkOut, setCheckOut] = useState<Date>();
  const [guests, setGuests] = useState(1);

  const { data: room, isLoading } = useQuery<RoomWithReviews>({
    queryKey: [`/api/rooms/${params?.id}`],
    enabled: !!params?.id,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8">
          <Skeleton className="h-8 w-32 mb-6" />
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-6">
              <Skeleton className="aspect-[16/9] rounded-xl" />
              <Skeleton className="h-10 w-64" />
              <Skeleton className="h-20 w-full" />
            </div>
            <div>
              <Skeleton className="h-96 w-full rounded-xl" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!room) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-semibold mb-2">Room not found</h2>
          <p className="text-muted-foreground mb-4">
            The room you're looking for doesn't exist.
          </p>
          <Button asChild>
            <Link href="/rooms">Back to Rooms</Link>
          </Button>
        </div>
      </div>
    );
  }

  const nights = checkIn && checkOut ? differenceInDays(checkOut, checkIn) : 0;
  const totalPrice = nights * room.pricePerNight;

  const handleBookNow = () => {
    if (!isAuthenticated) {
      setLocation("/login?redirect=/rooms/" + room._id);
      return;
    }
    if (!checkIn || !checkOut) return;
    
    const bookingParams = new URLSearchParams({
      roomId: room._id,
      checkIn: checkIn.toISOString(),
      checkOut: checkOut.toISOString(),
      guests: String(guests),
    });
    setLocation(`/booking?${bookingParams.toString()}`);
  };

  const images = room?.images || [];
  const reviews = room?.reviews || [];
  const amenities = room?.amenities || [];

  const nextImage = () => {
    setCurrentImageIndex((prev) => 
      prev === images.length - 1 ? 0 : prev + 1
    );
  };

  const prevImage = () => {
    setCurrentImageIndex((prev) => 
      prev === 0 ? images.length - 1 : prev - 1
    );
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <Button variant="ghost" asChild className="mb-6 gap-2">
          <Link href="/rooms" data-testid="link-back-to-rooms">
            <ArrowLeft className="h-4 w-4" />
            Back to Rooms
          </Link>
        </Button>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <div className="relative aspect-[16/9] rounded-xl overflow-hidden bg-muted">
              {images.length > 0 ? (
                <>
                  <img
                    src={images[currentImageIndex]}
                    alt={`${room.name} - Image ${currentImageIndex + 1}`}
                    className="w-full h-full object-cover"
                  />
                  {images.length > 1 && (
                    <>
                      <Button
                        variant="secondary"
                        size="icon"
                        className="absolute left-4 top-1/2 -translate-y-1/2"
                        onClick={prevImage}
                        data-testid="button-prev-image"
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="secondary"
                        size="icon"
                        className="absolute right-4 top-1/2 -translate-y-1/2"
                        onClick={nextImage}
                        data-testid="button-next-image"
                      >
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
                        {images.map((_, index) => (
                          <button
                            key={index}
                            onClick={() => setCurrentImageIndex(index)}
                            className={`w-2 h-2 rounded-full transition-colors ${
                              index === currentImageIndex
                                ? "bg-white"
                                : "bg-white/50"
                            }`}
                            data-testid={`button-image-dot-${index}`}
                          />
                        ))}
                      </div>
                    </>
                  )}
                </>
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <span className="text-muted-foreground">No images available</span>
                </div>
              )}
            </div>

            {images.length > 1 && (
              <div className="flex gap-2 overflow-x-auto pb-2">
                {images.map((image, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentImageIndex(index)}
                    className={`shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 transition-colors ${
                      index === currentImageIndex
                        ? "border-primary"
                        : "border-transparent"
                    }`}
                    data-testid={`button-thumbnail-${index}`}
                  >
                    <img
                      src={image}
                      alt={`Thumbnail ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            )}

            <div>
              <div className="flex items-start justify-between gap-4 mb-4">
                <div>
                  <Badge className="mb-2">{room.category}</Badge>
                  <h1 className="text-3xl font-serif font-bold" data-testid="text-room-name">
                    {room.name}
                  </h1>
                </div>
                {room.averageRating > 0 && (
                  <div className="flex items-center gap-1 shrink-0">
                    <Star className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                    <span className="text-lg font-semibold">
                      {room.averageRating.toFixed(1)}
                    </span>
                    <span className="text-sm text-muted-foreground">
                      ({reviews.length} reviews)
                    </span>
                  </div>
                )}
              </div>

              <div className="flex items-center gap-4 text-muted-foreground mb-4">
                <div className="flex items-center gap-1">
                  <Users className="h-4 w-4" />
                  <span>Up to {room.capacity} guests</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="font-semibold text-foreground">
                    Room {room.roomNumber}
                  </span>
                </div>
              </div>

              <p className="text-muted-foreground leading-relaxed" data-testid="text-room-description">
                {room.description}
              </p>
            </div>

            <div>
              <h2 className="text-xl font-semibold mb-4">Amenities</h2>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {amenities.map((amenity) => (
                  <div
                    key={amenity}
                    className="flex items-center gap-2 p-3 rounded-lg bg-muted"
                    data-testid={`amenity-${amenity}`}
                  >
                    <Check className="h-4 w-4 text-primary shrink-0" />
                    <span className="text-sm">{amenity}</span>
                  </div>
                ))}
              </div>
            </div>

            <Separator />

            <div>
              <h2 className="text-xl font-semibold mb-4">
                Reviews ({reviews.length})
              </h2>
              {reviews.length > 0 ? (
                <div className="space-y-4">
                  {reviews.map((review) => (
                    <Card key={review._id} data-testid={`review-${review._id}`}>
                      <CardContent className="p-4">
                        <div className="flex items-start gap-4">
                          <Avatar>
                            <AvatarFallback>
                              {(review as any).user?.firstName?.[0] || "U"}
                              {(review as any).user?.lastName?.[0] || ""}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1">
                            <div className="flex items-center justify-between mb-2">
                              <div>
                                <p className="font-medium">
                                  {(review as any).user?.firstName}{" "}
                                  {(review as any).user?.lastName}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  {format(new Date(review.createdAt), "MMMM d, yyyy")}
                                </p>
                              </div>
                              <div className="flex items-center gap-1">
                                {Array.from({ length: 5 }).map((_, i) => (
                                  <Star
                                    key={i}
                                    className={`h-4 w-4 ${
                                      i < review.rating
                                        ? "fill-yellow-400 text-yellow-400"
                                        : "text-muted"
                                    }`}
                                  />
                                ))}
                              </div>
                            </div>
                            <p className="text-sm text-muted-foreground">
                              {review.comment}
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground">
                  No reviews yet. Be the first to review this room!
                </p>
              )}
            </div>
          </div>

          <div className="lg:col-span-1">
            <Card className="sticky top-24">
              <CardHeader>
                <CardTitle className="flex items-baseline gap-2">
                  <span className="text-3xl font-bold">${room.pricePerNight}</span>
                  <span className="text-muted-foreground font-normal">/night</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-sm font-medium mb-1 block">Check-in</label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className="w-full justify-start text-left font-normal"
                          data-testid="button-check-in"
                        >
                          <Calendar className="mr-2 h-4 w-4" />
                          {checkIn ? format(checkIn, "MMM d") : "Select"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <CalendarComponent
                          mode="single"
                          selected={checkIn}
                          onSelect={setCheckIn}
                          disabled={(date) => date < new Date()}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-1 block">Check-out</label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className="w-full justify-start text-left font-normal"
                          data-testid="button-check-out"
                        >
                          <Calendar className="mr-2 h-4 w-4" />
                          {checkOut ? format(checkOut, "MMM d") : "Select"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <CalendarComponent
                          mode="single"
                          selected={checkOut}
                          onSelect={setCheckOut}
                          disabled={(date) =>
                            date < (checkIn ? addDays(checkIn, 1) : new Date())
                          }
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium mb-1 block">Guests</label>
                  <div className="flex items-center justify-between p-3 border rounded-md">
                    <span>{guests} guest{guests > 1 ? "s" : ""}</span>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => setGuests(Math.max(1, guests - 1))}
                        disabled={guests <= 1}
                        data-testid="button-decrease-guests"
                      >
                        <Minus className="h-4 w-4" />
                      </Button>
                      <span className="w-8 text-center">{guests}</span>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => setGuests(Math.min(room.capacity, guests + 1))}
                        disabled={guests >= room.capacity}
                        data-testid="button-increase-guests"
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>

                {nights > 0 && (
                  <div className="space-y-2 pt-4 border-t">
                    <div className="flex justify-between text-sm">
                      <span>
                        ${room.pricePerNight} x {nights} night{nights > 1 ? "s" : ""}
                      </span>
                      <span>${totalPrice}</span>
                    </div>
                    <Separator />
                    <div className="flex justify-between font-semibold">
                      <span>Total</span>
                      <span>${totalPrice}</span>
                    </div>
                  </div>
                )}

                <Button
                  className="w-full"
                  size="lg"
                  disabled={!checkIn || !checkOut || nights < 1}
                  onClick={handleBookNow}
                  data-testid="button-book-now"
                >
                  {isAuthenticated ? "Book Now" : "Sign in to Book"}
                </Button>

                {!isAuthenticated && (
                  <p className="text-xs text-center text-muted-foreground">
                    You need to be signed in to make a booking.
                  </p>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
