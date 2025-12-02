import { useState } from "react";
import { Link, useParams, useLocation } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format, differenceInDays } from "date-fns";
import {
  ArrowLeft,
  Calendar,
  Users,
  CreditCard,
  Check,
  Loader2,
  AlertCircle,
  Bed,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { api } from "@/lib/api";
import PaymentForm from "@/components/PaymentForm";
import type { BookingWithDetails } from "@shared/schema";

export default function PaymentComplete() {
  const { bookingId } = useParams<{ bookingId: string }>();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isConfirmed, setIsConfirmed] = useState(false);

  const { data: booking, isLoading, error } = useQuery<BookingWithDetails>({
    queryKey: [`/api/bookings/${bookingId}`],
    enabled: !!bookingId,
  });

  const confirmPaymentMutation = useMutation({
    mutationFn: async () => {
      return api.post<{ success: boolean }>(`/bookings/${bookingId}/confirm-payment`);
    },
    onSuccess: () => {
      setIsConfirmed(true);
      queryClient.invalidateQueries({ queryKey: ["/api/bookings/my"] });
      toast({
        title: "Payment Successful!",
        description: "Your booking has been confirmed. Check your email for details.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Payment Failed",
        description: error.message || "Payment processing failed. Please try again.",
        variant: "destructive",
      });
    },
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8">
          <Skeleton className="h-8 w-32 mb-6" />
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
              <Skeleton className="h-64 rounded-xl" />
            </div>
            <div>
              <Skeleton className="h-96 rounded-xl" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !booking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 mx-auto text-destructive mb-4" />
          <h2 className="text-2xl font-semibold mb-2">Booking Not Found</h2>
          <p className="text-muted-foreground mb-4">
            We couldn't find this booking. It may have been cancelled or doesn't exist.
          </p>
          <Button asChild>
            <Link href="/dashboard" data-testid="link-back-to-dashboard">
              Back to Dashboard
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  if (booking.status !== "pending" && !isConfirmed) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <Check className="h-12 w-12 mx-auto text-green-500 mb-4" />
          <h2 className="text-2xl font-semibold mb-2">Already Processed</h2>
          <p className="text-muted-foreground mb-4">
            This booking has already been processed. Current status: {booking.status}
          </p>
          <Button asChild>
            <Link href="/dashboard" data-testid="link-back-to-dashboard">
              Back to Dashboard
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  const room = booking.room;
  const checkIn = new Date(booking.checkInDate);
  const checkOut = new Date(booking.checkOutDate);
  const nights = differenceInDays(checkOut, checkIn);

  if (isConfirmed) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-2xl mx-auto">
            <Card>
              <CardContent className="py-12 text-center">
                <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Check className="h-8 w-8 text-green-600 dark:text-green-400" />
                </div>
                <h2 className="text-2xl font-semibold mb-2">Booking Confirmed!</h2>
                <p className="text-muted-foreground mb-6">
                  Your reservation has been successfully confirmed.
                  A confirmation email has been sent to your registered email address.
                </p>
                <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                  <Button asChild>
                    <Link href="/dashboard" data-testid="link-view-bookings">
                      View My Bookings
                    </Link>
                  </Button>
                  <Button variant="outline" asChild>
                    <Link href="/rooms" data-testid="link-browse-more">
                      Browse More Rooms
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <Button variant="ghost" asChild className="mb-6 gap-2">
          <Link href="/dashboard" data-testid="link-back-to-dashboard">
            <ArrowLeft className="h-4 w-4" />
            Back to Dashboard
          </Link>
        </Button>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5" />
                  Complete Your Payment
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    This is a test environment. Use card number <strong>4242 4242 4242 4242</strong> with any expiry and CVC.
                  </AlertDescription>
                </Alert>

                <PaymentForm
                  bookingId={bookingId || ''}
                  amount={booking.totalPrice}
                  onSuccess={() => {
                    confirmPaymentMutation.mutate();
                  }}
                  onError={(error) => {
                    toast({
                      title: "Payment Error",
                      description: error,
                      variant: "destructive",
                    });
                  }}
                />
              </CardContent>
            </Card>
          </div>

          <div className="lg:col-span-1">
            <Card className="sticky top-24">
              <CardHeader>
                <CardTitle>Booking Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-4">
                  {room?.images && room.images.length > 0 ? (
                    <img
                      src={room.images[0]}
                      alt={room?.name}
                      className="w-20 h-20 object-cover rounded-lg"
                    />
                  ) : (
                    <div className="w-20 h-20 bg-muted rounded-lg flex items-center justify-center">
                      <Bed className="h-6 w-6 text-muted-foreground" />
                    </div>
                  )}
                  <div>
                    <h3 className="font-semibold">{room?.name || "Room"}</h3>
                    <p className="text-sm text-muted-foreground">{room?.category}</p>
                  </div>
                </div>

                <Separator />

                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Check-in</span>
                    <span>{format(checkIn, "MMM d, yyyy")}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Check-out</span>
                    <span>{format(checkOut, "MMM d, yyyy")}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Guests</span>
                    <span>{booking.guestCount}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Duration</span>
                    <span>{nights} night{nights > 1 ? "s" : ""}</span>
                  </div>
                </div>

                <Separator />

                <div className="flex justify-between font-semibold text-lg">
                  <span>Total</span>
                  <span>${booking.totalPrice}</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
