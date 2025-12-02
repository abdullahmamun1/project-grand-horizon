import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/lib/auth";
import { ThemeProvider } from "@/lib/theme";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { ProtectedRoute } from "@/components/ProtectedRoute";

import Home from "@/pages/Home";
import Rooms from "@/pages/Rooms";
import RoomDetail from "@/pages/RoomDetail";
import Booking from "@/pages/Booking";
import PaymentComplete from "@/pages/PaymentComplete";
import Dashboard from "@/pages/Dashboard";
import Login from "@/pages/auth/Login";
import Register from "@/pages/auth/Register";
import { AdminLayout } from "@/pages/admin/AdminLayout";
import AdminDashboard from "@/pages/admin/AdminDashboard";
import AdminRooms from "@/pages/admin/AdminRooms";
import AdminBookings from "@/pages/admin/AdminBookings";
import AdminPromoCodes from "@/pages/admin/AdminPromoCodes";
import { ManagerLayout } from "@/pages/manager/ManagerLayout";
import ManagerDashboard from "@/pages/manager/ManagerDashboard";
import ManagerBookings from "@/pages/manager/ManagerBookings";
import NotFound from "@/pages/not-found";

function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  );
}

function Router() {
  return (
    <Switch>
      <Route path="/">
        <PublicLayout>
          <Home />
        </PublicLayout>
      </Route>
      <Route path="/rooms">
        <PublicLayout>
          <Rooms />
        </PublicLayout>
      </Route>
      <Route path="/rooms/:id">
        <PublicLayout>
          <RoomDetail />
        </PublicLayout>
      </Route>
      <Route path="/login">
        <Login />
      </Route>
      <Route path="/register">
        <Register />
      </Route>
      <Route path="/booking">
        <ProtectedRoute>
          <PublicLayout>
            <Booking />
          </PublicLayout>
        </ProtectedRoute>
      </Route>
      <Route path="/payment/:bookingId">
        <ProtectedRoute>
          <PublicLayout>
            <PaymentComplete />
          </PublicLayout>
        </ProtectedRoute>
      </Route>
      <Route path="/dashboard">
        <ProtectedRoute>
          <PublicLayout>
            <Dashboard />
          </PublicLayout>
        </ProtectedRoute>
      </Route>
      <Route path="/admin">
        <ProtectedRoute requiredRole="admin">
          <AdminLayout>
            <AdminDashboard />
          </AdminLayout>
        </ProtectedRoute>
      </Route>
      <Route path="/admin/rooms">
        <ProtectedRoute requiredRole="admin">
          <AdminLayout>
            <AdminRooms />
          </AdminLayout>
        </ProtectedRoute>
      </Route>
      <Route path="/admin/bookings">
        <ProtectedRoute requiredRole="admin">
          <AdminLayout>
            <AdminBookings />
          </AdminLayout>
        </ProtectedRoute>
      </Route>
      <Route path="/admin/promo-codes">
        <ProtectedRoute requiredRole="admin">
          <AdminLayout>
            <AdminPromoCodes />
          </AdminLayout>
        </ProtectedRoute>
      </Route>
      <Route path="/manager">
        <ProtectedRoute requiredRole="manager">
          <ManagerLayout>
            <ManagerDashboard />
          </ManagerLayout>
        </ProtectedRoute>
      </Route>
      <Route path="/manager/bookings">
        <ProtectedRoute requiredRole="manager">
          <ManagerLayout>
            <ManagerBookings />
          </ManagerLayout>
        </ProtectedRoute>
      </Route>
      <Route>
        <PublicLayout>
          <NotFound />
        </PublicLayout>
      </Route>
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <AuthProvider>
          <TooltipProvider>
            <Toaster />
            <Router />
          </TooltipProvider>
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
