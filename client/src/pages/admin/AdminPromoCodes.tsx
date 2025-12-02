import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { format } from "date-fns";
import {
  Plus,
  Pencil,
  Trash2,
  Loader2,
  Search,
  Tag,
  Percent,
  DollarSign,
  Calendar,
  Power,
  PowerOff,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
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
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
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
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { insertPromoCodeSchema, type PromoCode, type InsertPromoCode, discountTypes } from "@shared/schema";
import { z } from "zod";

const promoCodeFormSchema = insertPromoCodeSchema.extend({
  validFrom: z.string(),
  validTo: z.string(),
});

type PromoCodeFormData = z.infer<typeof promoCodeFormSchema>;

export default function AdminPromoCodes() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingPromoCode, setEditingPromoCode] = useState<PromoCode | null>(null);
  const [deletePromoCodeId, setDeletePromoCodeId] = useState<string | null>(null);

  const { data: promoCodes, isLoading } = useQuery<PromoCode[]>({
    queryKey: ["/api/admin/promo-codes"],
  });

  const form = useForm<PromoCodeFormData>({
    resolver: zodResolver(promoCodeFormSchema),
    defaultValues: {
      code: "",
      description: "",
      discountType: "percentage",
      discountValue: 10,
      minBookingAmount: 0,
      maxDiscountAmount: undefined,
      validFrom: format(new Date(), "yyyy-MM-dd"),
      validTo: format(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), "yyyy-MM-dd"),
      usageLimit: undefined,
      isActive: true,
    },
  });

  const createMutation = useMutation({
    mutationFn: (data: PromoCodeFormData) =>
      apiRequest("POST", "/api/admin/promo-codes", {
        ...data,
        validFrom: new Date(data.validFrom).toISOString(),
        validTo: new Date(data.validTo).toISOString(),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/promo-codes"] });
      setIsDialogOpen(false);
      form.reset();
      toast({
        title: "Success",
        description: "Promo code created successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create promo code",
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data: PromoCodeFormData) =>
      apiRequest("PUT", `/api/admin/promo-codes/${editingPromoCode?._id}`, {
        ...data,
        validFrom: new Date(data.validFrom).toISOString(),
        validTo: new Date(data.validTo).toISOString(),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/promo-codes"] });
      setIsDialogOpen(false);
      setEditingPromoCode(null);
      form.reset();
      toast({
        title: "Success",
        description: "Promo code updated successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update promo code",
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", `/api/admin/promo-codes/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/promo-codes"] });
      setDeletePromoCodeId(null);
      toast({
        title: "Success",
        description: "Promo code deleted successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete promo code",
        variant: "destructive",
      });
    },
  });

  const toggleMutation = useMutation({
    mutationFn: (id: string) => apiRequest("PATCH", `/api/admin/promo-codes/${id}/toggle`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/promo-codes"] });
      toast({
        title: "Success",
        description: "Promo code status updated",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to toggle promo code",
        variant: "destructive",
      });
    },
  });

  const openCreateDialog = () => {
    setEditingPromoCode(null);
    form.reset({
      code: "",
      description: "",
      discountType: "percentage",
      discountValue: 10,
      minBookingAmount: 0,
      maxDiscountAmount: undefined,
      validFrom: format(new Date(), "yyyy-MM-dd"),
      validTo: format(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), "yyyy-MM-dd"),
      usageLimit: undefined,
      isActive: true,
    });
    setIsDialogOpen(true);
  };

  const openEditDialog = (promoCode: PromoCode) => {
    setEditingPromoCode(promoCode);
    form.reset({
      code: promoCode.code,
      description: promoCode.description || "",
      discountType: promoCode.discountType,
      discountValue: promoCode.discountValue,
      minBookingAmount: promoCode.minBookingAmount,
      maxDiscountAmount: promoCode.maxDiscountAmount,
      validFrom: format(new Date(promoCode.validFrom), "yyyy-MM-dd"),
      validTo: format(new Date(promoCode.validTo), "yyyy-MM-dd"),
      usageLimit: promoCode.usageLimit,
      isActive: promoCode.isActive,
    });
    setIsDialogOpen(true);
  };

  const onSubmit = (data: PromoCodeFormData) => {
    if (editingPromoCode) {
      updateMutation.mutate(data);
    } else {
      createMutation.mutate(data);
    }
  };

  const filteredPromoCodes = promoCodes?.filter((code) =>
    code.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
    code.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getStatusBadge = (promoCode: PromoCode) => {
    const now = new Date();
    const validFrom = new Date(promoCode.validFrom);
    const validTo = new Date(promoCode.validTo);

    if (!promoCode.isActive) {
      return <Badge variant="secondary" data-testid={`badge-status-inactive-${promoCode._id}`}>Inactive</Badge>;
    }
    if (now < validFrom) {
      return <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950 dark:text-blue-300 dark:border-blue-800" data-testid={`badge-status-scheduled-${promoCode._id}`}>Scheduled</Badge>;
    }
    if (now > validTo) {
      return <Badge variant="destructive" data-testid={`badge-status-expired-${promoCode._id}`}>Expired</Badge>;
    }
    if (promoCode.usageLimit && promoCode.usageCount >= promoCode.usageLimit) {
      return <Badge variant="secondary" data-testid={`badge-status-limit-${promoCode._id}`}>Limit Reached</Badge>;
    }
    return <Badge variant="default" className="bg-green-600" data-testid={`badge-status-active-${promoCode._id}`}>Active</Badge>;
  };

  const formatDiscount = (promoCode: PromoCode) => {
    if (promoCode.discountType === "percentage") {
      return `${promoCode.discountValue}%`;
    }
    return `$${promoCode.discountValue.toFixed(2)}`;
  };

  // Stats
  const activeCount = promoCodes?.filter(p => {
    const now = new Date();
    return p.isActive && new Date(p.validFrom) <= now && new Date(p.validTo) >= now &&
      (!p.usageLimit || p.usageCount < p.usageLimit);
  }).length || 0;

  const scheduledCount = promoCodes?.filter(p => {
    const now = new Date();
    return p.isActive && new Date(p.validFrom) > now;
  }).length || 0;

  const expiredCount = promoCodes?.filter(p => {
    const now = new Date();
    return new Date(p.validTo) < now || (p.usageLimit && p.usageCount >= p.usageLimit);
  }).length || 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold" data-testid="text-page-title">Promo Codes</h1>
          <p className="text-muted-foreground" data-testid="text-page-description">
            Manage discount codes and promotions
          </p>
        </div>
        <Button onClick={openCreateDialog} data-testid="button-create-promo">
          <Plus className="mr-2 h-4 w-4" />
          Add Promo Code
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Codes</CardTitle>
            <Tag className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-total-codes">
              {isLoading ? <Skeleton className="h-8 w-16" /> : promoCodes?.length || 0}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active</CardTitle>
            <Power className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600" data-testid="text-active-codes">
              {isLoading ? <Skeleton className="h-8 w-16" /> : activeCount}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Scheduled</CardTitle>
            <Calendar className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600" data-testid="text-scheduled-codes">
              {isLoading ? <Skeleton className="h-8 w-16" /> : scheduledCount}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Expired</CardTitle>
            <PowerOff className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-muted-foreground" data-testid="text-expired-codes">
              {isLoading ? <Skeleton className="h-8 w-16" /> : expiredCount}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search promo codes..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
          data-testid="input-search-promo"
        />
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Code</TableHead>
                <TableHead>Discount</TableHead>
                <TableHead className="hidden md:table-cell">Min. Amount</TableHead>
                <TableHead className="hidden lg:table-cell">Valid Period</TableHead>
                <TableHead className="hidden md:table-cell">Usage</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-16" /></TableCell>
                    <TableCell className="hidden md:table-cell"><Skeleton className="h-5 w-16" /></TableCell>
                    <TableCell className="hidden lg:table-cell"><Skeleton className="h-5 w-32" /></TableCell>
                    <TableCell className="hidden md:table-cell"><Skeleton className="h-5 w-16" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-20" /></TableCell>
                    <TableCell><Skeleton className="h-8 w-24 ml-auto" /></TableCell>
                  </TableRow>
                ))
              ) : filteredPromoCodes?.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="h-24 text-center">
                    <div className="flex flex-col items-center gap-2 text-muted-foreground">
                      <Tag className="h-8 w-8" />
                      <p>No promo codes found</p>
                      {searchQuery && (
                        <Button
                          variant="link"
                          onClick={() => setSearchQuery("")}
                          data-testid="button-clear-search"
                        >
                          Clear search
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                filteredPromoCodes?.map((promoCode) => (
                  <TableRow key={promoCode._id} data-testid={`row-promo-${promoCode._id}`}>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-mono font-semibold" data-testid={`text-code-${promoCode._id}`}>
                          {promoCode.code}
                        </span>
                        {promoCode.description && (
                          <span className="text-sm text-muted-foreground line-clamp-1">
                            {promoCode.description}
                          </span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        {promoCode.discountType === "percentage" ? (
                          <Percent className="h-3 w-3 text-muted-foreground" />
                        ) : (
                          <DollarSign className="h-3 w-3 text-muted-foreground" />
                        )}
                        <span className="font-semibold" data-testid={`text-discount-${promoCode._id}`}>
                          {formatDiscount(promoCode)}
                        </span>
                      </div>
                      {promoCode.maxDiscountAmount && (
                        <span className="text-xs text-muted-foreground">
                          Max: ${promoCode.maxDiscountAmount}
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      ${promoCode.minBookingAmount.toFixed(2)}
                    </TableCell>
                    <TableCell className="hidden lg:table-cell">
                      <div className="flex flex-col text-sm">
                        <span>{format(new Date(promoCode.validFrom), "MMM d, yyyy")}</span>
                        <span className="text-muted-foreground">
                          to {format(new Date(promoCode.validTo), "MMM d, yyyy")}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      <span data-testid={`text-usage-${promoCode._id}`}>
                        {promoCode.usageCount}
                        {promoCode.usageLimit && ` / ${promoCode.usageLimit}`}
                      </span>
                    </TableCell>
                    <TableCell>
                      {getStatusBadge(promoCode)}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => toggleMutation.mutate(promoCode._id)}
                          disabled={toggleMutation.isPending}
                          title={promoCode.isActive ? "Deactivate" : "Activate"}
                          data-testid={`button-toggle-${promoCode._id}`}
                        >
                          {promoCode.isActive ? (
                            <PowerOff className="h-4 w-4" />
                          ) : (
                            <Power className="h-4 w-4" />
                          )}
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => openEditDialog(promoCode)}
                          data-testid={`button-edit-${promoCode._id}`}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setDeletePromoCodeId(promoCode._id)}
                          className="text-destructive hover:text-destructive"
                          data-testid={`button-delete-${promoCode._id}`}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Create/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle data-testid="text-dialog-title">
              {editingPromoCode ? "Edit Promo Code" : "Create Promo Code"}
            </DialogTitle>
            <DialogDescription>
              {editingPromoCode
                ? "Update the promo code details below"
                : "Fill in the details to create a new promo code"}
            </DialogDescription>
          </DialogHeader>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid gap-4 sm:grid-cols-2">
                <FormField
                  control={form.control}
                  name="code"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Code</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          placeholder="SUMMER25"
                          className="uppercase"
                          data-testid="input-code"
                        />
                      </FormControl>
                      <FormDescription>
                        3-20 characters, will be converted to uppercase
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="discountType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Discount Type</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                        value={field.value}
                      >
                        <FormControl>
                          <SelectTrigger data-testid="select-discount-type">
                            <SelectValue placeholder="Select type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="percentage">Percentage (%)</SelectItem>
                          <SelectItem value="fixed">Fixed Amount ($)</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description (Optional)</FormLabel>
                    <FormControl>
                      <Textarea
                        {...field}
                        placeholder="Summer sale discount..."
                        rows={2}
                        data-testid="input-description"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid gap-4 sm:grid-cols-3">
                <FormField
                  control={form.control}
                  name="discountValue"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        Discount Value
                        {form.watch("discountType") === "percentage" ? " (%)" : " ($)"}
                      </FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          {...field}
                          onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                          min={0}
                          max={form.watch("discountType") === "percentage" ? 100 : undefined}
                          step={form.watch("discountType") === "percentage" ? 1 : 0.01}
                          data-testid="input-discount-value"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="minBookingAmount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Min. Booking ($)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          {...field}
                          onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                          min={0}
                          step={0.01}
                          data-testid="input-min-amount"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="maxDiscountAmount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Max Discount ($)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          {...field}
                          value={field.value ?? ""}
                          onChange={(e) => {
                            const val = e.target.value;
                            field.onChange(val ? parseFloat(val) : undefined);
                          }}
                          min={0}
                          step={0.01}
                          placeholder="No limit"
                          data-testid="input-max-discount"
                        />
                      </FormControl>
                      <FormDescription>
                        Leave empty for no limit
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <FormField
                  control={form.control}
                  name="validFrom"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Valid From</FormLabel>
                      <FormControl>
                        <Input
                          type="date"
                          {...field}
                          data-testid="input-valid-from"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="validTo"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Valid To</FormLabel>
                      <FormControl>
                        <Input
                          type="date"
                          {...field}
                          data-testid="input-valid-to"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <FormField
                  control={form.control}
                  name="usageLimit"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Usage Limit</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          {...field}
                          value={field.value ?? ""}
                          onChange={(e) => {
                            const val = e.target.value;
                            field.onChange(val ? parseInt(val) : undefined);
                          }}
                          min={1}
                          step={1}
                          placeholder="Unlimited"
                          data-testid="input-usage-limit"
                        />
                      </FormControl>
                      <FormDescription>
                        Leave empty for unlimited uses
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="isActive"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">Active</FormLabel>
                        <FormDescription>
                          Enable or disable this promo code
                        </FormDescription>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                          data-testid="switch-is-active"
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsDialogOpen(false)}
                  data-testid="button-cancel"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={createMutation.isPending || updateMutation.isPending}
                  data-testid="button-submit"
                >
                  {(createMutation.isPending || updateMutation.isPending) && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  {editingPromoCode ? "Update" : "Create"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog
        open={!!deletePromoCodeId}
        onOpenChange={(open) => !open && setDeletePromoCodeId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Promo Code</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this promo code? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="button-cancel-delete">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deletePromoCodeId && deleteMutation.mutate(deletePromoCodeId)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              data-testid="button-confirm-delete"
            >
              {deleteMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                "Delete"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
