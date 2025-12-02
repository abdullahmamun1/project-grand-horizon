import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { Search, Filter, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { api } from "@/lib/api";
import type { BookingWithDetails, BookingStatus } from "@shared/schema";
import { bookingStatuses } from "@shared/schema";

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

export default function AdminBookings() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedBooking, setSelectedBooking] = useState<BookingWithDetails | null>(null);

  const { data: bookings, isLoading } = useQuery<BookingWithDetails[]>({
    queryKey: ["/api/admin/bookings"],
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: BookingStatus }) => {
      return api.patch(`/admin/bookings/${id}/status`, { status });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/bookings"] });
      toast({ title: "Booking status updated" });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update status",
        variant: "destructive",
      });
    },
  });

  const filteredBookings = bookings?.filter((booking) => {
    if (statusFilter !== "all" && booking.status !== statusFilter) {
      return false;
    }
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        booking.user?.firstName?.toLowerCase().includes(query) ||
        booking.user?.lastName?.toLowerCase().includes(query) ||
        booking.user?.email?.toLowerCase().includes(query) ||
        booking.room?.name?.toLowerCase().includes(query)
      );
    }
    return true;
  });

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Bookings</h1>
        <p className="text-muted-foreground">View and manage all bookings.</p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row items-start md:items-center gap-4">
            <div className="relative flex-1 w-full md:w-auto">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by guest or room..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
                data-testid="input-search-bookings"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full md:w-48" data-testid="select-status-filter">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                {bookingStatuses.map((status) => (
                  <SelectItem key={status} value={status}>
                    {statusLabels[status]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex items-center gap-4">
                  <Skeleton className="h-12 w-12 rounded" />
                  <div className="space-y-2 flex-1">
                    <Skeleton className="h-4 w-1/4" />
                    <Skeleton className="h-3 w-1/3" />
                  </div>
                  <Skeleton className="h-6 w-20" />
                </div>
              ))}
            </div>
          ) : filteredBookings && filteredBookings.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Guest</TableHead>
                  <TableHead>Room</TableHead>
                  <TableHead>Check-in</TableHead>
                  <TableHead>Check-out</TableHead>
                  <TableHead>Guests</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredBookings.map((booking) => (
                  <TableRow key={booking._id} data-testid={`booking-row-${booking._id}`}>
                    <TableCell>
                      <div>
                        <p className="font-medium">
                          {booking.user?.firstName} {booking.user?.lastName}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {booking.user?.email}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">{booking.room?.name}</p>
                        <p className="text-xs text-muted-foreground">
                          Room {booking.room?.roomNumber}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      {format(new Date(booking.checkInDate), "MMM d, yyyy")}
                    </TableCell>
                    <TableCell>
                      {format(new Date(booking.checkOutDate), "MMM d, yyyy")}
                    </TableCell>
                    <TableCell>{booking.guestCount}</TableCell>
                    <TableCell>${booking.totalPrice}</TableCell>
                    <TableCell>
                      <Badge className={statusColors[booking.status]}>
                        {statusLabels[booking.status]}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setSelectedBooking(booking)}
                        data-testid={`button-view-${booking._id}`}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <p className="text-center text-muted-foreground py-8">
              No bookings found.
            </p>
          )}
        </CardContent>
      </Card>

      <Dialog open={!!selectedBooking} onOpenChange={() => setSelectedBooking(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Booking Details</DialogTitle>
          </DialogHeader>
          {selectedBooking && (
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                {selectedBooking.room?.images?.[0] && (
                  <img
                    src={selectedBooking.room.images[0]}
                    alt={selectedBooking.room.name}
                    className="w-20 h-20 object-cover rounded-lg"
                  />
                )}
                <div>
                  <h3 className="font-semibold">{selectedBooking.room?.name}</h3>
                  <p className="text-sm text-muted-foreground">
                    Room {selectedBooking.room?.roomNumber}
                  </p>
                </div>
              </div>

              <Separator />

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Guest</p>
                  <p className="font-medium">
                    {selectedBooking.user?.firstName} {selectedBooking.user?.lastName}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {selectedBooking.user?.email}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">Guests</p>
                  <p className="font-medium">{selectedBooking.guestCount}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Check-in</p>
                  <p className="font-medium">
                    {format(new Date(selectedBooking.checkInDate), "EEE, MMM d, yyyy")}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">Check-out</p>
                  <p className="font-medium">
                    {format(new Date(selectedBooking.checkOutDate), "EEE, MMM d, yyyy")}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">Total</p>
                  <p className="font-medium">${selectedBooking.totalPrice}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Payment</p>
                  <Badge
                    variant={
                      selectedBooking.paymentStatus === "paid"
                        ? "default"
                        : "secondary"
                    }
                  >
                    {selectedBooking.paymentStatus}
                  </Badge>
                </div>
              </div>

              {selectedBooking.specialRequests && (
                <>
                  <Separator />
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Special Requests</p>
                    <p className="text-sm">{selectedBooking.specialRequests}</p>
                  </div>
                </>
              )}

              <Separator />

              <div>
                <p className="text-sm font-medium mb-2">Update Status</p>
                <Select
                  value={selectedBooking.status}
                  onValueChange={(value) => {
                    updateStatusMutation.mutate({
                      id: selectedBooking._id,
                      status: value as BookingStatus,
                    });
                    setSelectedBooking({
                      ...selectedBooking,
                      status: value as BookingStatus,
                    });
                  }}
                >
                  <SelectTrigger data-testid="select-update-status">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {bookingStatuses.map((status) => (
                      <SelectItem key={status} value={status}>
                        {statusLabels[status]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
