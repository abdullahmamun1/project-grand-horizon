import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { Search, Filter, UserCheck, UserMinus, Loader2 } from "lucide-react";
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

export default function ManagerBookings() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const { data: bookings, isLoading } = useQuery<BookingWithDetails[]>({
    queryKey: ["/api/manager/bookings"],
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: BookingStatus }) => {
      return api.patch(`/manager/bookings/${id}/status`, { status });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/manager/bookings"] });
      queryClient.invalidateQueries({ queryKey: ["/api/manager/stats"] });
      queryClient.invalidateQueries({ queryKey: ["/api/manager/bookings/today"] });
      toast({ title: "Booking status updated" });
      setUpdatingId(null);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update status",
        variant: "destructive",
      });
      setUpdatingId(null);
    },
  });

  const handleCheckIn = (bookingId: string) => {
    setUpdatingId(bookingId);
    updateStatusMutation.mutate({ id: bookingId, status: "checked_in" });
  };

  const handleCheckOut = (bookingId: string) => {
    setUpdatingId(bookingId);
    updateStatusMutation.mutate({ id: bookingId, status: "checked_out" });
  };

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
        booking.room?.name?.toLowerCase().includes(query) ||
        booking.room?.roomNumber?.toLowerCase().includes(query)
      );
    }
    return true;
  });

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Bookings</h1>
        <p className="text-muted-foreground">
          Manage guest check-ins and check-outs.
        </p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row items-start md:items-center gap-4">
            <div className="relative flex-1 w-full md:w-auto">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by guest, room, or room number..."
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
                  <div className="space-y-2 flex-1">
                    <Skeleton className="h-4 w-1/4" />
                    <Skeleton className="h-3 w-1/3" />
                  </div>
                  <Skeleton className="h-6 w-20" />
                  <Skeleton className="h-9 w-24" />
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
                    <TableCell>
                      <Badge className={statusColors[booking.status]}>
                        {statusLabels[booking.status]}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        {(booking.status === "confirmed" || booking.status === "pending") && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleCheckIn(booking._id)}
                            disabled={updatingId === booking._id}
                            data-testid={`button-checkin-${booking._id}`}
                          >
                            {updatingId === booking._id ? (
                              <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                            ) : (
                              <UserCheck className="mr-2 h-3 w-3" />
                            )}
                            Check In
                          </Button>
                        )}
                        {booking.status === "checked_in" && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleCheckOut(booking._id)}
                            disabled={updatingId === booking._id}
                            data-testid={`button-checkout-${booking._id}`}
                          >
                            {updatingId === booking._id ? (
                              <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                            ) : (
                              <UserMinus className="mr-2 h-3 w-3" />
                            )}
                            Check Out
                          </Button>
                        )}
                      </div>
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
    </div>
  );
}
