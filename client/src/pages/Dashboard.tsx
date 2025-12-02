import { useState } from "react";
import { Link } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format, isPast, isFuture } from "date-fns";
import {
  Calendar,
  Star,
  X,
  ArrowRight,
  MessageSquare,
  Loader2,
  Hotel,
  CreditCard,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/lib/auth";
import { api } from "@/lib/api";
import type { BookingWithDetails, BookingStatus } from "@shared/schema";

const statusColors: Record<BookingStatus, string> = {
  pending: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
  confirmed: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
  checked_in: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
  checked_out: "bg-gray-100 text-gray-800 dark:bg-gray-800/50 dark:text-gray-400",
  cancelled: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
};

const statusLabels: Record<BookingStatus, string> = {
  pending: "Pending",
  confirmed: "Confirmed",
  checked_in: "Checked In",
  checked_out: "Checked Out",
  cancelled: "Cancelled",
};

function BookingCard({
  booking,
  onCancel,
  onReview,
  isCancelling,
}: {
  booking: BookingWithDetails;
  onCancel: (id: string) => void;
  onReview: (booking: BookingWithDetails) => void;
  isCancelling: boolean;
}) {
  const canCancel =
    booking.status !== "cancelled" &&
    booking.status !== "checked_out" &&
    isFuture(new Date(booking.checkInDate));

  const canReview =
    booking.status === "checked_out" &&
    isPast(new Date(booking.checkOutDate));

  return (
    <Card className="overflow-hidden" data-testid={`booking-card-${booking._id}`}>
      <div className="flex flex-col md:flex-row">
        <div className="md:w-48 lg:w-56 shrink-0">
          <div className="aspect-[4/3] md:aspect-auto md:h-full overflow-hidden">
            {booking.room?.images?.[0] ? (
              <img
                src={booking.room.images[0]}
                alt={booking.room.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full bg-muted flex items-center justify-center min-h-[150px]">
                <Hotel className="h-8 w-8 text-muted-foreground" />
              </div>
            )}
          </div>
        </div>
        <CardContent className="flex-1 p-5">
          <div className="flex items-start justify-between gap-4 mb-3">
            <div>
              <h3 className="font-semibold text-lg">{booking.room?.name}</h3>
              <p className="text-sm text-muted-foreground">
                Room {booking.room?.roomNumber} - {booking.room?.category}
              </p>
            </div>
            <Badge className={statusColors[booking.status]}>
              {statusLabels[booking.status]}
            </Badge>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4 text-sm">
            <div>
              <p className="text-muted-foreground">Check-in</p>
              <p className="font-medium">
                {format(new Date(booking.checkInDate), "MMM d, yyyy")}
              </p>
            </div>
            <div>
              <p className="text-muted-foreground">Check-out</p>
              <p className="font-medium">
                {format(new Date(booking.checkOutDate), "MMM d, yyyy")}
              </p>
            </div>
            <div>
              <p className="text-muted-foreground">Guests</p>
              <p className="font-medium">{booking.guestCount}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Total</p>
              <p className="font-medium">${booking.totalPrice}</p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            {booking.status === "pending" ? (
              <Button size="sm" asChild>
                <Link href={`/payment/${booking._id}`} data-testid={`link-go-to-payment-${booking._id}`}>
                  <CreditCard className="mr-2 h-3 w-3" />
                  Go to Payment
                </Link>
              </Button>
            ) : (
              <Button variant="outline" size="sm" asChild>
                <Link href={`/rooms/${booking.room?._id || booking.roomId}`} data-testid={`link-view-room-${booking._id}`}>
                  View Room
                  <ArrowRight className="ml-2 h-3 w-3" />
                </Link>
              </Button>
            )}
            {canCancel && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => onCancel(booking._id)}
                disabled={isCancelling}
                className="text-destructive hover:text-destructive"
                data-testid={`button-cancel-${booking._id}`}
              >
                {isCancelling ? (
                  <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                ) : (
                  <X className="mr-2 h-3 w-3" />
                )}
                Cancel Booking
              </Button>
            )}
            {canReview && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => onReview(booking)}
                data-testid={`button-review-${booking._id}`}
              >
                <MessageSquare className="mr-2 h-3 w-3" />
                Write Review
              </Button>
            )}
          </div>
        </CardContent>
      </div>
    </Card>
  );
}

function BookingCardSkeleton() {
  return (
    <Card className="overflow-hidden">
      <div className="flex flex-col md:flex-row">
        <Skeleton className="aspect-[4/3] md:w-48 lg:w-56 md:aspect-auto md:h-48" />
        <CardContent className="flex-1 p-5 space-y-4">
          <div className="flex justify-between">
            <div className="space-y-2">
              <Skeleton className="h-6 w-40" />
              <Skeleton className="h-4 w-32" />
            </div>
            <Skeleton className="h-6 w-20" />
          </div>
          <div className="grid grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="space-y-1">
                <Skeleton className="h-4 w-16" />
                <Skeleton className="h-5 w-20" />
              </div>
            ))}
          </div>
          <div className="flex gap-2">
            <Skeleton className="h-8 w-24" />
            <Skeleton className="h-8 w-32" />
          </div>
        </CardContent>
      </div>
    </Card>
  );
}

export default function Dashboard() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [cancelBookingId, setCancelBookingId] = useState<string | null>(null);
  const [reviewBooking, setReviewBooking] = useState<BookingWithDetails | null>(null);
  const [rating, setRating] = useState(5);
  const [reviewComment, setReviewComment] = useState("");

  const { data: bookings, isLoading } = useQuery<BookingWithDetails[]>({
    queryKey: ["/api/bookings/my"],
  });

  const cancelMutation = useMutation({
    mutationFn: async (id: string) => {
      return api.patch<{ success: boolean }>(`/bookings/${id}/cancel`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/bookings/my"] });
      toast({
        title: "Booking Cancelled",
        description: "Your booking has been successfully cancelled.",
      });
      setCancelBookingId(null);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to cancel booking.",
        variant: "destructive",
      });
    },
  });

  const reviewMutation = useMutation({
    mutationFn: async (data: { bookingId: string; roomId: string; rating: number; comment: string }) => {
      return api.post("/reviews", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/bookings/my"] });
      toast({
        title: "Review Submitted",
        description: "Thank you for your feedback!",
      });
      setReviewBooking(null);
      setRating(5);
      setReviewComment("");
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to submit review.",
        variant: "destructive",
      });
    },
  });

  const activeBookings = bookings?.filter(
    (b) => b.status !== "cancelled" && b.status !== "checked_out"
  );
  const pastBookings = bookings?.filter(
    (b) => b.status === "checked_out" || b.status === "cancelled"
  );

  const handleSubmitReview = () => {
    if (!reviewBooking || !reviewComment.trim()) return;
    
    reviewMutation.mutate({
      bookingId: reviewBooking._id,
      roomId: reviewBooking.roomId,
      rating,
      comment: reviewComment,
    });
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="bg-card border-b">
        <div className="container mx-auto px-4 py-8">
          <h1 className="text-3xl font-serif font-bold mb-2">
            Welcome back, {user?.firstName}!
          </h1>
          <p className="text-muted-foreground">
            Manage your bookings and reviews.
          </p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <Tabs defaultValue="active" className="space-y-6">
          <TabsList>
            <TabsTrigger value="active" data-testid="tab-active">
              Active Bookings
              {activeBookings && activeBookings.length > 0 && (
                <Badge variant="secondary" className="ml-2">
                  {activeBookings.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="past" data-testid="tab-past">
              Past Bookings
              {pastBookings && pastBookings.length > 0 && (
                <Badge variant="secondary" className="ml-2">
                  {pastBookings.length}
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="active" className="space-y-4">
            {isLoading ? (
              <>
                <BookingCardSkeleton />
                <BookingCardSkeleton />
              </>
            ) : activeBookings && activeBookings.length > 0 ? (
              activeBookings.map((booking) => (
                <BookingCard
                  key={booking._id}
                  booking={booking}
                  onCancel={setCancelBookingId}
                  onReview={setReviewBooking}
                  isCancelling={cancelMutation.isPending}
                />
              ))
            ) : (
              <Card>
                <CardContent className="py-12 text-center">
                  <Calendar className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No active bookings</h3>
                  <p className="text-muted-foreground mb-4">
                    You don't have any upcoming stays. Browse our rooms to book your next getaway!
                  </p>
                  <Button asChild>
                    <Link href="/rooms" data-testid="link-browse-rooms">
                      Browse Rooms
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="past" className="space-y-4">
            {isLoading ? (
              <>
                <BookingCardSkeleton />
                <BookingCardSkeleton />
              </>
            ) : pastBookings && pastBookings.length > 0 ? (
              pastBookings.map((booking) => (
                <BookingCard
                  key={booking._id}
                  booking={booking}
                  onCancel={setCancelBookingId}
                  onReview={setReviewBooking}
                  isCancelling={cancelMutation.isPending}
                />
              ))
            ) : (
              <Card>
                <CardContent className="py-12 text-center">
                  <Hotel className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No past bookings</h3>
                  <p className="text-muted-foreground">
                    Your booking history will appear here after your stays.
                  </p>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>

      <AlertDialog open={!!cancelBookingId} onOpenChange={() => setCancelBookingId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancel Booking</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to cancel this booking? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep Booking</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => cancelBookingId && cancelMutation.mutate(cancelBookingId)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Cancel Booking
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={!!reviewBooking} onOpenChange={() => setReviewBooking(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Write a Review</DialogTitle>
            <DialogDescription>
              Share your experience at {reviewBooking?.room?.name}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Rating</label>
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((value) => (
                  <button
                    key={value}
                    onClick={() => setRating(value)}
                    className="p-1"
                    data-testid={`star-${value}`}
                  >
                    <Star
                      className={`h-6 w-6 ${
                        value <= rating
                          ? "fill-yellow-400 text-yellow-400"
                          : "text-muted"
                      }`}
                    />
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Your Review</label>
              <Textarea
                placeholder="Tell us about your stay..."
                value={reviewComment}
                onChange={(e) => setReviewComment(e.target.value)}
                className="min-h-[120px]"
                data-testid="input-review-comment"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setReviewBooking(null)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmitReview}
              disabled={!reviewComment.trim() || reviewMutation.isPending}
              data-testid="button-submit-review"
            >
              {reviewMutation.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Submit Review
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
