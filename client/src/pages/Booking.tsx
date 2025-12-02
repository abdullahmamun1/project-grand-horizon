import { useState, useEffect } from "react";
import { useLocation, useSearch, Link } from "wouter";
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
  Tag,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/lib/auth";
import { api } from "@/lib/api";
import PaymentForm from "@/components/PaymentForm";
import type { Room, InsertBooking } from "@shared/schema";

interface BookingResponse {
  booking: {
    _id: string;
    status: string;
    totalPrice: number;
    discountAmount: number;
    finalPrice: number;
    promoCode?: string;
  };
  clientSecret?: string;
  paymentIntentId?: string;
}

interface PromoValidationResult {
  valid: boolean;
  error?: string;
  code?: string;
  discountAmount?: number;
  finalPrice?: number;
  description?: string;
  discountType?: 'percentage' | 'fixed';
  discountValue?: number;
}

type BookingStep = "review" | "payment" | "confirmation";

export default function Booking() {
  const search = useSearch();
  const [, setLocation] = useLocation();
  const { user, isAuthenticated } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const params = new URLSearchParams(search);
  const roomId = params.get("roomId");
  const checkInParam = params.get("checkIn");
  const checkOutParam = params.get("checkOut");
  const guestsParam = params.get("guests");

  const checkIn = checkInParam ? new Date(checkInParam) : null;
  const checkOut = checkOutParam ? new Date(checkOutParam) : null;
  const guests = guestsParam ? parseInt(guestsParam) : 1;

  const [step, setStep] = useState<BookingStep>("review");
  const [specialRequests, setSpecialRequests] = useState("");
  const [bookingId, setBookingId] = useState<string | null>(null);
  const [promoCodeInput, setPromoCodeInput] = useState("");
  const [appliedPromo, setAppliedPromo] = useState<PromoValidationResult | null>(null);
  const [isValidatingPromo, setIsValidatingPromo] = useState(false);
  const [isProcessingRedirect, setIsProcessingRedirect] = useState(false);

  const { data: room, isLoading: isLoadingRoom } = useQuery<Room>({
    queryKey: [`/api/rooms/${roomId}`],
    enabled: !!roomId,
  });

  const createBookingMutation = useMutation({
    mutationFn: async (data: InsertBooking) => {
      return api.post<BookingResponse>("/bookings", data);
    },
    onSuccess: (data) => {
      setBookingId(data.booking._id);
      setStep("payment");
    },
    onError: (error: any) => {
      toast({
        title: "Booking Failed",
        description: error.message || "Unable to create booking. Please try again.",
        variant: "destructive",
      });
    },
  });

  const confirmPaymentMutation = useMutation({
    mutationFn: async () => {
      return api.post<{ success: boolean }>(`/bookings/${bookingId}/confirm-payment`);
    },
    onSuccess: () => {
      setStep("confirmation");
      queryClient.invalidateQueries({ queryKey: ['/api/bookings/my'] });
      toast({
        title: "Booking Confirmed!",
        description: "Your booking has been successfully confirmed. Check your email for details.",
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

  useEffect(() => {
    if (!isAuthenticated) {
      setLocation("/login?redirect=" + encodeURIComponent(window.location.pathname + window.location.search));
    }
  }, [isAuthenticated, setLocation]);

  // Handle Stripe 3DS redirect completion
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const paymentIntentParam = urlParams.get('payment_intent');
    const redirectStatus = urlParams.get('redirect_status');
    const bookingIdParam = urlParams.get('bookingId');

    if (paymentIntentParam && redirectStatus && bookingIdParam && user) {
      setIsProcessingRedirect(true);
      setBookingId(bookingIdParam);
      setStep("payment");

      const cleanUrlParams = () => {
        const cleanUrl = window.location.pathname + '?' + new URLSearchParams({
          roomId: roomId || '',
          checkIn: checkInParam || '',
          checkOut: checkOutParam || '',
          guests: guestsParam || '',
        }).toString();
        window.history.replaceState({}, '', cleanUrl);
      };

      // First fetch the booking to verify ownership
      api.get<{ _id: string; userId: string; status: string }>(`/bookings/${bookingIdParam}`)
        .then((booking) => {
          // Verify booking belongs to current user (backend also validates this)
          if (booking.userId !== user._id) {
            throw new Error('Booking not found');
          }

          // If already confirmed, skip to confirmation step
          if (booking.status === 'confirmed') {
            setStep("confirmation");
            setIsProcessingRedirect(false);
            cleanUrlParams();
            return;
          }

          if (redirectStatus === 'succeeded') {
            // Payment succeeded via 3DS, confirm the booking
            return api.post<{ success: boolean }>(`/bookings/${bookingIdParam}/confirm-payment`)
              .then(() => {
                setStep("confirmation");
                setIsProcessingRedirect(false);
                queryClient.invalidateQueries({ queryKey: ['/api/bookings/my'] });
                toast({
                  title: "Booking Confirmed!",
                  description: "Your payment was successful and booking has been confirmed.",
                });
                cleanUrlParams();
              })
              .catch((error: any) => {
                toast({
                  title: "Payment Confirmation Failed",
                  description: error.message || "Please refresh and try again.",
                  variant: "destructive",
                });
                setIsProcessingRedirect(false);
              });
          } else {
            // Payment failed - keep URL params so user can retry
            toast({
              title: "Payment Failed",
              description: "The payment was not successful. Please try again.",
              variant: "destructive",
            });
            setIsProcessingRedirect(false);
          }
        })
        .catch((error: any) => {
          // Keep URL params on error so user can retry
          toast({
            title: "Payment Confirmation Failed",
            description: error.message || "Please refresh and try again.",
            variant: "destructive",
          });
          setIsProcessingRedirect(false);
        });
    }
  }, [roomId, checkInParam, checkOutParam, guestsParam, toast, user, queryClient]);

  if (!roomId || !checkIn || !checkOut) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 mx-auto text-destructive mb-4" />
          <h2 className="text-2xl font-semibold mb-2">Invalid Booking</h2>
          <p className="text-muted-foreground mb-4">
            Missing booking information. Please select a room and dates.
          </p>
          <Button asChild>
            <Link href="/rooms">Browse Rooms</Link>
          </Button>
        </div>
      </div>
    );
  }

  if (isLoadingRoom) {
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

  if (!room) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <h2 className="text-2xl font-semibold mb-2">Room not found</h2>
          <Button asChild>
            <Link href="/rooms">Browse Rooms</Link>
          </Button>
        </div>
      </div>
    );
  }

  const nights = differenceInDays(checkOut, checkIn);
  const totalPrice = nights * room.pricePerNight;
  const discountAmount = appliedPromo?.discountAmount || 0;
  const finalPrice = appliedPromo?.finalPrice || totalPrice;

  const handleValidatePromo = async () => {
    if (!promoCodeInput.trim()) {
      toast({
        title: "Error",
        description: "Please enter a promo code",
        variant: "destructive",
      });
      return;
    }

    setIsValidatingPromo(true);
    try {
      const result = await api.post<PromoValidationResult>("/bookings/validate-promo", {
        code: promoCodeInput.trim(),
        bookingAmount: totalPrice,
      });

      if (result.valid) {
        setAppliedPromo(result);
        setPromoCodeInput("");
        toast({
          title: "Promo Applied!",
          description: `You saved $${result.discountAmount?.toFixed(2)}`,
        });
      } else {
        toast({
          title: "Invalid Code",
          description: result.error || "Unable to apply promo code",
          variant: "destructive",
        });
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to validate promo code",
        variant: "destructive",
      });
    } finally {
      setIsValidatingPromo(false);
    }
  };

  const handleRemovePromo = () => {
    setAppliedPromo(null);
    toast({
      title: "Promo Removed",
      description: "Promo code has been removed",
    });
  };

  const handleCreateBooking = () => {
    if (!user) return;
    
    createBookingMutation.mutate({
      userId: user._id,
      roomId: room._id,
      checkInDate: checkIn,
      checkOutDate: checkOut,
      totalPrice,
      finalPrice,
      discountAmount,
      guestCount: guests,
      specialRequests: specialRequests || undefined,
      promoCode: appliedPromo?.code,
    } as any);
  };

  const handleConfirmPayment = () => {
    confirmPaymentMutation.mutate();
  };

  const stepIndicators = [
    { key: "review", label: "Review" },
    { key: "payment", label: "Payment" },
    { key: "confirmation", label: "Confirmed" },
  ];

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <Button variant="ghost" asChild className="mb-6 gap-2">
          <Link href={`/rooms/${roomId}`} data-testid="link-back-to-room">
            <ArrowLeft className="h-4 w-4" />
            Back to Room
          </Link>
        </Button>

        <div className="flex items-center justify-center mb-8">
          {stepIndicators.map((s, index) => (
            <div key={s.key} className="flex items-center">
              <div
                className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium ${
                  step === s.key || stepIndicators.findIndex((x) => x.key === step) > index
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground"
                }`}
              >
                {stepIndicators.findIndex((x) => x.key === step) > index ? (
                  <Check className="h-4 w-4" />
                ) : (
                  index + 1
                )}
              </div>
              <span
                className={`ml-2 text-sm font-medium ${
                  step === s.key ? "text-foreground" : "text-muted-foreground"
                }`}
              >
                {s.label}
              </span>
              {index < stepIndicators.length - 1 && (
                <div className="w-12 h-px bg-border mx-4" />
              )}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            {step === "review" && (
              <Card>
                <CardHeader>
                  <CardTitle>Review Your Booking</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex gap-4">
                    {room.images && room.images.length > 0 ? (
                      <img
                        src={room.images[0]}
                        alt={room.name}
                        className="w-32 h-24 object-cover rounded-lg"
                      />
                    ) : (
                      <div className="w-32 h-24 bg-muted rounded-lg flex items-center justify-center">
                        <Bed className="h-8 w-8 text-muted-foreground" />
                      </div>
                    )}
                    <div>
                      <h3 className="font-semibold text-lg">{room.name}</h3>
                      <p className="text-sm text-muted-foreground">{room.category}</p>
                      <p className="text-sm text-muted-foreground">Room {room.roomNumber}</p>
                    </div>
                  </div>

                  <Separator />

                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex items-center gap-3">
                      <Calendar className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <p className="text-sm text-muted-foreground">Check-in</p>
                        <p className="font-medium">{format(checkIn, "EEE, MMM d, yyyy")}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Calendar className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <p className="text-sm text-muted-foreground">Check-out</p>
                        <p className="font-medium">{format(checkOut, "EEE, MMM d, yyyy")}</p>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <Users className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">Guests</p>
                      <p className="font-medium">{guests} guest{guests > 1 ? "s" : ""}</p>
                    </div>
                  </div>

                  <Separator />

                  <div>
                    <label className="text-sm font-medium mb-2 block">
                      Special Requests (optional)
                    </label>
                    <Textarea
                      placeholder="Any special requests for your stay?"
                      value={specialRequests}
                      onChange={(e) => setSpecialRequests(e.target.value)}
                      className="min-h-[100px]"
                      data-testid="input-special-requests"
                    />
                  </div>

                  <Separator />

                  <div>
                    <label className="text-sm font-medium mb-2 block flex items-center gap-2">
                      <Tag className="h-4 w-4" />
                      Promo Code (optional)
                    </label>
                    {appliedPromo ? (
                      <div className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 rounded-lg">
                        <div className="flex items-center gap-2">
                          <Check className="h-4 w-4 text-green-600" />
                          <div>
                            <span className="font-mono font-semibold text-green-700 dark:text-green-400" data-testid="text-applied-promo">
                              {appliedPromo.code}
                            </span>
                            <span className="text-sm text-green-600 dark:text-green-400 ml-2">
                              ({appliedPromo.discountType === 'percentage' 
                                ? `${appliedPromo.discountValue}% off` 
                                : `$${appliedPromo.discountValue} off`})
                            </span>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={handleRemovePromo}
                          className="text-green-600 hover:text-green-700 hover:bg-green-100 dark:hover:bg-green-900"
                          data-testid="button-remove-promo"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ) : (
                      <div className="flex gap-2">
                        <Input
                          placeholder="Enter promo code"
                          value={promoCodeInput}
                          onChange={(e) => setPromoCodeInput(e.target.value.toUpperCase())}
                          className="uppercase"
                          data-testid="input-promo-code"
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              handleValidatePromo();
                            }
                          }}
                        />
                        <Button
                          variant="outline"
                          onClick={handleValidatePromo}
                          disabled={isValidatingPromo || !promoCodeInput.trim()}
                          data-testid="button-apply-promo"
                        >
                          {isValidatingPromo ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            "Apply"
                          )}
                        </Button>
                      </div>
                    )}
                  </div>

                  <Button
                    className="w-full"
                    size="lg"
                    onClick={handleCreateBooking}
                    disabled={createBookingMutation.isPending}
                    data-testid="button-proceed-to-payment"
                  >
                    {createBookingMutation.isPending && (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    )}
                    Proceed to Payment
                  </Button>
                </CardContent>
              </Card>
            )}

            {step === "payment" && bookingId && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CreditCard className="h-5 w-5" />
                    Payment
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  {isProcessingRedirect ? (
                    <div className="flex flex-col items-center justify-center py-8 space-y-4">
                      <Loader2 className="h-8 w-8 animate-spin text-primary" />
                      <p className="text-muted-foreground">Processing your payment...</p>
                    </div>
                  ) : (
                    <>
                      <Alert>
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>
                          This is a test environment. Use card number <strong>4242 4242 4242 4242</strong> with any future expiry date and any CVC.
                        </AlertDescription>
                      </Alert>

                      <PaymentForm
                        bookingId={bookingId}
                        amount={finalPrice}
                        onSuccess={() => {
                          if (!bookingId) {
                            toast({
                              title: "Error",
                              description: "Booking ID not found. Please refresh and try again.",
                              variant: "destructive",
                            });
                            return;
                          }
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
                    </>
                  )}
                </CardContent>
              </Card>
            )}

            {step === "confirmation" && (
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
            )}
          </div>

          <div className="lg:col-span-1">
            <Card className="sticky top-24">
              <CardHeader>
                <CardTitle>Booking Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-4">
                  {room.images && room.images.length > 0 ? (
                    <img
                      src={room.images[0]}
                      alt={room.name}
                      className="w-20 h-20 object-cover rounded-lg"
                    />
                  ) : (
                    <div className="w-20 h-20 bg-muted rounded-lg flex items-center justify-center">
                      <Bed className="h-6 w-6 text-muted-foreground" />
                    </div>
                  )}
                  <div>
                    <h3 className="font-semibold">{room.name}</h3>
                    <p className="text-sm text-muted-foreground">{room.category}</p>
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
                    <span>{guests}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Duration</span>
                    <span>{nights} night{nights > 1 ? "s" : ""}</span>
                  </div>
                </div>

                <Separator />

                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>${room.pricePerNight} x {nights} nights</span>
                    <span>${totalPrice}</span>
                  </div>
                  {appliedPromo && (
                    <div className="flex justify-between text-sm text-green-600 dark:text-green-400">
                      <span className="flex items-center gap-1">
                        <Tag className="h-3 w-3" />
                        {appliedPromo.code} 
                        <span className="text-muted-foreground">
                          ({appliedPromo.discountType === 'percentage' 
                            ? `${appliedPromo.discountValue}%` 
                            : `$${appliedPromo.discountValue}`})
                        </span>
                      </span>
                      <span data-testid="text-discount-amount">-${discountAmount.toFixed(2)}</span>
                    </div>
                  )}
                  <Separator />
                  <div className="flex justify-between font-semibold text-lg">
                    <span>Total</span>
                    <span data-testid="text-final-price">${finalPrice.toFixed(2)}</span>
                  </div>
                  {appliedPromo && (
                    <p className="text-xs text-green-600 dark:text-green-400 text-right">
                      You save ${discountAmount.toFixed(2)}!
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
