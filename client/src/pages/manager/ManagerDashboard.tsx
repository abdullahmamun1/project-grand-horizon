import { useQuery } from "@tanstack/react-query";
import { format, isToday, isTomorrow, startOfDay } from "date-fns";
import {
  Calendar,
  UserCheck,
  UserMinus,
  Clock,
  ArrowRight,
} from "lucide-react";
import { Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
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

interface ManagerStats {
  todayCheckIns: number;
  todayCheckOuts: number;
  currentGuests: number;
  pendingBookings: number;
}

export default function ManagerDashboard() {
  const { data: stats, isLoading: isLoadingStats } = useQuery<ManagerStats>({
    queryKey: ["/api/manager/stats"],
  });

  const { data: todayBookings, isLoading: isLoadingBookings } = useQuery<BookingWithDetails[]>({
    queryKey: ["/api/manager/bookings/today"],
  });

  const checkInsToday = todayBookings?.filter(
    (b) =>
      (b.status === "confirmed" || b.status === "pending") &&
      isToday(new Date(b.checkInDate))
  );

  const checkOutsToday = todayBookings?.filter(
    (b) => b.status === "checked_in" && isToday(new Date(b.checkOutDate))
  );

  const statCards = [
    {
      title: "Today's Check-ins",
      value: stats?.todayCheckIns ?? 0,
      icon: UserCheck,
      color: "text-green-600",
      bgColor: "bg-green-100 dark:bg-green-900/30",
    },
    {
      title: "Today's Check-outs",
      value: stats?.todayCheckOuts ?? 0,
      icon: UserMinus,
      color: "text-blue-600",
      bgColor: "bg-blue-100 dark:bg-blue-900/30",
    },
    {
      title: "Current Guests",
      value: stats?.currentGuests ?? 0,
      icon: Calendar,
      color: "text-purple-600",
      bgColor: "bg-purple-100 dark:bg-purple-900/30",
    },
    {
      title: "Pending Bookings",
      value: stats?.pendingBookings ?? 0,
      icon: Clock,
      color: "text-amber-600",
      bgColor: "bg-amber-100 dark:bg-amber-900/30",
    },
  ];

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Manager Dashboard</h1>
          <p className="text-muted-foreground">
            {format(new Date(), "EEEE, MMMM d, yyyy")}
          </p>
        </div>
        <Button asChild>
          <Link href="/manager/bookings" data-testid="link-view-all-bookings">
            View All Bookings
            <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((stat) => (
          <Card key={stat.title}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">{stat.title}</p>
                  {isLoadingStats ? (
                    <Skeleton className="h-8 w-16 mt-1" />
                  ) : (
                    <p className="text-2xl font-bold" data-testid={`stat-${stat.title.toLowerCase().replace(/'/g, "").replace(/ /g, "-")}`}>
                      {stat.value}
                    </p>
                  )}
                </div>
                <div className={`p-3 rounded-full ${stat.bgColor}`}>
                  <stat.icon className={`h-5 w-5 ${stat.color}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserCheck className="h-5 w-5 text-green-600" />
              Check-ins Today
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoadingBookings ? (
              <div className="space-y-3">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <Skeleton className="h-10 w-10 rounded" />
                    <div className="flex-1 space-y-1">
                      <Skeleton className="h-4 w-1/2" />
                      <Skeleton className="h-3 w-1/3" />
                    </div>
                  </div>
                ))}
              </div>
            ) : checkInsToday && checkInsToday.length > 0 ? (
              <div className="space-y-3">
                {checkInsToday.map((booking) => (
                  <div
                    key={booking._id}
                    className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
                    data-testid={`checkin-${booking._id}`}
                  >
                    <div>
                      <p className="font-medium">
                        {booking.user?.firstName} {booking.user?.lastName}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {booking.room?.name} - Room {booking.room?.roomNumber}
                      </p>
                    </div>
                    <Badge className={statusColors[booking.status]}>
                      {statusLabels[booking.status]}
                    </Badge>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-muted-foreground py-8">
                No check-ins scheduled for today.
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserMinus className="h-5 w-5 text-blue-600" />
              Check-outs Today
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoadingBookings ? (
              <div className="space-y-3">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <Skeleton className="h-10 w-10 rounded" />
                    <div className="flex-1 space-y-1">
                      <Skeleton className="h-4 w-1/2" />
                      <Skeleton className="h-3 w-1/3" />
                    </div>
                  </div>
                ))}
              </div>
            ) : checkOutsToday && checkOutsToday.length > 0 ? (
              <div className="space-y-3">
                {checkOutsToday.map((booking) => (
                  <div
                    key={booking._id}
                    className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
                    data-testid={`checkout-${booking._id}`}
                  >
                    <div>
                      <p className="font-medium">
                        {booking.user?.firstName} {booking.user?.lastName}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {booking.room?.name} - Room {booking.room?.roomNumber}
                      </p>
                    </div>
                    <Badge className={statusColors[booking.status]}>
                      {statusLabels[booking.status]}
                    </Badge>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-muted-foreground py-8">
                No check-outs scheduled for today.
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
