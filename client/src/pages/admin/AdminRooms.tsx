import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useDropzone } from "react-dropzone";
import {
  Plus,
  Pencil,
  Trash2,
  Loader2,
  Upload,
  X,
  Search,
  Image as ImageIcon,
  Building,
  CheckCircle,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
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
import { useToast } from "@/hooks/use-toast";
import { api, uploadImages } from "@/lib/api";
import { insertRoomSchema, roomCategories, predefinedAmenities, type Room, type InsertRoom } from "@shared/schema";
import { z } from "zod";

const roomFormSchema = insertRoomSchema.extend({
  customAmenity: z.string().optional(),
});

type RoomFormData = z.infer<typeof roomFormSchema>;

interface CategoryStats {
  category: string;
  totalRooms: number;
  availableRooms: number;
  occupiedRooms: number;
}

interface RoomStats {
  statsByCategory: CategoryStats[];
  totals: {
    totalRooms: number;
    availableRooms: number;
    occupiedRooms: number;
  };
  occupiedRoomIds: string[];
}

export default function AdminRooms() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingRoom, setEditingRoom] = useState<Room | null>(null);
  const [deleteRoomId, setDeleteRoomId] = useState<string | null>(null);
  const [uploadedImages, setUploadedImages] = useState<string[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [selectedAmenities, setSelectedAmenities] = useState<string[]>([]);
  const [showCustomAmenity, setShowCustomAmenity] = useState(false);

  const { data: rooms, isLoading } = useQuery<Room[]>({
    queryKey: ["/api/admin/rooms"],
  });

  const { data: roomStats, isLoading: statsLoading } = useQuery<RoomStats>({
    queryKey: ["/api/admin/room-stats"],
  });

  const form = useForm<RoomFormData>({
    resolver: zodResolver(roomFormSchema),
    defaultValues: {
      name: "",
      description: "",
      category: "Standard",
      pricePerNight: 100,
      capacity: 2,
      roomNumber: "",
      images: [],
      amenities: [],
      isAvailable: true,
      customAmenity: "",
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: InsertRoom) => {
      return api.post<Room>("/admin/rooms", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/rooms"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/room-stats"] });
      queryClient.invalidateQueries({ queryKey: ["/api/rooms"] });
      toast({ title: "Room created successfully" });
      handleCloseDialog();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create room",
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<InsertRoom> }) => {
      return api.put<Room>(`/admin/rooms/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/rooms"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/room-stats"] });
      queryClient.invalidateQueries({ queryKey: ["/api/rooms"] });
      toast({ title: "Room updated successfully" });
      handleCloseDialog();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update room",
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return api.delete(`/admin/rooms/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/rooms"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/room-stats"] });
      queryClient.invalidateQueries({ queryKey: ["/api/rooms"] });
      toast({ title: "Room deleted successfully" });
      setDeleteRoomId(null);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete room",
        variant: "destructive",
      });
    },
  });

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: { "image/*": [".jpeg", ".jpg", ".png", ".webp"] },
    maxFiles: 5,
    onDrop: async (acceptedFiles) => {
      if (acceptedFiles.length === 0) return;
      setIsUploading(true);
      try {
        const urls = await uploadImages(acceptedFiles);
        setUploadedImages((prev) => [...prev, ...urls]);
      } catch (error: any) {
        toast({
          title: "Upload Failed",
          description: error.message,
          variant: "destructive",
        });
      } finally {
        setIsUploading(false);
      }
    },
  });

  const handleOpenDialog = (room?: Room) => {
    if (room) {
      setEditingRoom(room);
      form.reset({
        name: room.name,
        description: room.description,
        category: room.category,
        pricePerNight: room.pricePerNight,
        capacity: room.capacity,
        roomNumber: room.roomNumber,
        images: room.images,
        amenities: room.amenities,
        isAvailable: room.isAvailable,
        customAmenity: "",
      });
      setUploadedImages(room.images);
      setSelectedAmenities(room.amenities);
      const hasCustom = room.amenities.some(
        (a) => !predefinedAmenities.includes(a as any)
      );
      setShowCustomAmenity(hasCustom);
    } else {
      setEditingRoom(null);
      form.reset({
        name: "",
        description: "",
        category: "Standard",
        pricePerNight: 100,
        capacity: 2,
        roomNumber: "",
        images: [],
        amenities: [],
        isAvailable: true,
        customAmenity: "",
      });
      setUploadedImages([]);
      setSelectedAmenities([]);
      setShowCustomAmenity(false);
    }
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingRoom(null);
    setUploadedImages([]);
    setSelectedAmenities([]);
    setShowCustomAmenity(false);
    form.reset();
  };

  const handleRemoveImage = (index: number) => {
    setUploadedImages((prev) => prev.filter((_, i) => i !== index));
  };

  const handleAmenityToggle = (amenity: string, checked: boolean) => {
    if (amenity === "Other") {
      setShowCustomAmenity(checked);
      if (!checked) {
        form.setValue("customAmenity", "");
      }
    } else {
      setSelectedAmenities((prev) =>
        checked ? [...prev, amenity] : prev.filter((a) => a !== amenity)
      );
    }
  };

  const onSubmit = (data: RoomFormData) => {
    let amenities = [...selectedAmenities];
    if (showCustomAmenity && data.customAmenity?.trim()) {
      amenities.push(data.customAmenity.trim());
    }

    const roomData: InsertRoom = {
      name: data.name,
      description: data.description,
      category: data.category,
      pricePerNight: data.pricePerNight,
      capacity: data.capacity,
      roomNumber: data.roomNumber,
      images: uploadedImages,
      amenities,
      isAvailable: data.isAvailable,
    };

    if (editingRoom) {
      updateMutation.mutate({ id: editingRoom._id, data: roomData });
    } else {
      createMutation.mutate(roomData);
    }
  };

  const filteredRooms = rooms?.filter((room) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      room.name.toLowerCase().includes(query) ||
      room.roomNumber.toLowerCase().includes(query) ||
      room.category.toLowerCase().includes(query)
    );
  });

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Rooms</h1>
          <p className="text-muted-foreground">Manage your hotel rooms.</p>
        </div>
        <Button onClick={() => handleOpenDialog()} data-testid="button-add-room">
          <Plus className="mr-2 h-4 w-4" />
          Add Room
        </Button>
      </div>

      {/* Room Statistics by Category */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Room Statistics by Category</CardTitle>
        </CardHeader>
        <CardContent>
          {statsLoading ? (
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
              {[...Array(7)].map((_, i) => (
                <Skeleton key={i} className="h-24" />
              ))}
            </div>
          ) : roomStats ? (
            <>
              {/* Overall Totals */}
              <div className="flex flex-wrap items-center gap-4 mb-4 pb-4 border-b">
                <div className="flex items-center gap-2">
                  <Building className="h-5 w-5 text-primary" />
                  <span className="text-sm text-muted-foreground">Total:</span>
                  <span className="font-semibold" data-testid="text-total-rooms">{roomStats.totals.totalRooms}</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-green-500" />
                  <span className="text-sm text-muted-foreground">Available:</span>
                  <span className="font-semibold text-green-600" data-testid="text-available-rooms">{roomStats.totals.availableRooms}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-orange-500" />
                  <span className="text-sm text-muted-foreground">Occupied:</span>
                  <span className="font-semibold text-orange-600" data-testid="text-occupied-rooms">{roomStats.totals.occupiedRooms}</span>
                </div>
              </div>

              {/* Stats by Category */}
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
                {roomStats.statsByCategory
                  .filter((stat) => stat.totalRooms > 0)
                  .map((stat) => (
                    <Card key={stat.category} className="bg-muted/30" data-testid={`card-stats-${stat.category}`}>
                      <CardContent className="p-4 text-center">
                        <h4 className="font-medium text-sm mb-2 truncate" title={stat.category}>
                          {stat.category}
                        </h4>
                        <div className="space-y-1 text-xs">
                          <div className="flex justify-between gap-1">
                            <span className="text-muted-foreground">Total:</span>
                            <span className="font-semibold">{stat.totalRooms}</span>
                          </div>
                          <div className="flex justify-between gap-1">
                            <span className="text-muted-foreground">Available:</span>
                            <span className="font-semibold text-green-600">{stat.availableRooms}</span>
                          </div>
                          <div className="flex justify-between gap-1">
                            <span className="text-muted-foreground">Occupied:</span>
                            <span className="font-semibold text-orange-600">{stat.occupiedRooms}</span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                {roomStats.statsByCategory.every((stat) => stat.totalRooms === 0) && (
                  <p className="col-span-full text-center text-muted-foreground py-4">
                    No rooms added yet.
                  </p>
                )}
              </div>
            </>
          ) : null}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search rooms..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
                data-testid="input-search-rooms"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex items-center gap-4">
                  <Skeleton className="h-16 w-24 rounded" />
                  <div className="space-y-2 flex-1">
                    <Skeleton className="h-4 w-1/4" />
                    <Skeleton className="h-3 w-1/3" />
                  </div>
                  <Skeleton className="h-8 w-20" />
                </div>
              ))}
            </div>
          ) : filteredRooms && filteredRooms.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Room</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Room #</TableHead>
                  <TableHead>Capacity</TableHead>
                  <TableHead>Price/Night</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredRooms.map((room) => (
                  <TableRow key={room._id} data-testid={`room-row-${room._id}`}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        {room.images[0] ? (
                          <img
                            src={room.images[0]}
                            alt={room.name}
                            className="w-16 h-12 object-cover rounded"
                          />
                        ) : (
                          <div className="w-16 h-12 bg-muted rounded flex items-center justify-center">
                            <ImageIcon className="h-4 w-4 text-muted-foreground" />
                          </div>
                        )}
                        <span className="font-medium">{room.name}</span>
                      </div>
                    </TableCell>
                    <TableCell>{room.category}</TableCell>
                    <TableCell>{room.roomNumber}</TableCell>
                    <TableCell>{room.capacity}</TableCell>
                    <TableCell>${room.pricePerNight}</TableCell>
                    <TableCell>
                      {roomStats?.occupiedRoomIds?.includes(room._id) ? (
                        <Badge variant="destructive" data-testid={`status-occupied-${room._id}`}>
                          Occupied
                        </Badge>
                      ) : room.isAvailable ? (
                        <Badge variant="default" data-testid={`status-available-${room._id}`}>
                          Available
                        </Badge>
                      ) : (
                        <Badge variant="secondary" data-testid={`status-unavailable-${room._id}`}>
                          Unavailable
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleOpenDialog(room)}
                          data-testid={`button-edit-${room._id}`}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setDeleteRoomId(room._id)}
                          className="text-destructive hover:text-destructive"
                          data-testid={`button-delete-${room._id}`}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <p className="text-center text-muted-foreground py-8">
              No rooms found. Add your first room to get started.
            </p>
          )}
        </CardContent>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingRoom ? "Edit Room" : "Add New Room"}
            </DialogTitle>
            <DialogDescription>
              {editingRoom
                ? "Update the room details below."
                : "Fill in the details to create a new room."}
            </DialogDescription>
          </DialogHeader>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Room Name</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Deluxe Ocean View"
                          {...field}
                          data-testid="input-room-name"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="roomNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Room Number</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="101"
                          {...field}
                          data-testid="input-room-number"
                        />
                      </FormControl>
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
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Describe the room..."
                        className="min-h-[100px]"
                        {...field}
                        data-testid="input-room-description"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-3 gap-4">
                <FormField
                  control={form.control}
                  name="category"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Category</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger data-testid="select-room-category">
                            <SelectValue placeholder="Select category" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {roomCategories.map((category) => (
                            <SelectItem key={category} value={category}>
                              {category}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="pricePerNight"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Price/Night ($)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min={1}
                          {...field}
                          onChange={(e) => field.onChange(Number(e.target.value))}
                          data-testid="input-room-price"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="capacity"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Capacity</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min={1}
                          {...field}
                          onChange={(e) => field.onChange(Number(e.target.value))}
                          data-testid="input-room-capacity"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div>
                <FormLabel>Amenities</FormLabel>
                <div className="grid grid-cols-3 gap-3 mt-2 max-h-48 overflow-y-auto p-2 border rounded-md">
                  {predefinedAmenities.map((amenity) => (
                    <div key={amenity} className="flex items-center space-x-2">
                      <Checkbox
                        id={`amenity-${amenity}`}
                        checked={
                          amenity === "Other"
                            ? showCustomAmenity
                            : selectedAmenities.includes(amenity)
                        }
                        onCheckedChange={(checked) =>
                          handleAmenityToggle(amenity, checked as boolean)
                        }
                        data-testid={`checkbox-${amenity}`}
                      />
                      <label
                        htmlFor={`amenity-${amenity}`}
                        className="text-sm cursor-pointer"
                      >
                        {amenity}
                      </label>
                    </div>
                  ))}
                </div>
                {showCustomAmenity && (
                  <FormField
                    control={form.control}
                    name="customAmenity"
                    render={({ field }) => (
                      <FormItem className="mt-2">
                        <FormControl>
                          <Input
                            placeholder="Enter custom amenity..."
                            {...field}
                            data-testid="input-custom-amenity"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}
              </div>

              <div>
                <FormLabel>Images</FormLabel>
                <div
                  {...getRootProps()}
                  className={`mt-2 border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
                    isDragActive
                      ? "border-primary bg-primary/5"
                      : "border-muted-foreground/25 hover:border-primary"
                  }`}
                >
                  <input {...getInputProps()} data-testid="input-images" />
                  {isUploading ? (
                    <div className="flex items-center justify-center gap-2">
                      <Loader2 className="h-5 w-5 animate-spin" />
                      <span>Uploading...</span>
                    </div>
                  ) : (
                    <>
                      <Upload className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                      <p className="text-sm text-muted-foreground">
                        Drag & drop images here, or click to select
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Max 5 images (JPEG, PNG, WebP)
                      </p>
                    </>
                  )}
                </div>
                {uploadedImages.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-4">
                    {uploadedImages.map((url, index) => (
                      <div key={index} className="relative group">
                        <img
                          src={url}
                          alt={`Room image ${index + 1}`}
                          className="w-20 h-20 object-cover rounded-lg"
                        />
                        <button
                          type="button"
                          onClick={() => handleRemoveImage(index)}
                          className="absolute -top-2 -right-2 p-1 bg-destructive text-destructive-foreground rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                          data-testid={`button-remove-image-${index}`}
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <FormField
                control={form.control}
                name="isAvailable"
                render={({ field }) => (
                  <FormItem className="flex items-center space-x-2">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        data-testid="checkbox-available"
                      />
                    </FormControl>
                    <FormLabel className="!mt-0">Room is available for booking</FormLabel>
                  </FormItem>
                )}
              />

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleCloseDialog}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={createMutation.isPending || updateMutation.isPending}
                  data-testid="button-save-room"
                >
                  {(createMutation.isPending || updateMutation.isPending) && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  {editingRoom ? "Update Room" : "Create Room"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteRoomId} onOpenChange={() => setDeleteRoomId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Room</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this room? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteRoomId && deleteMutation.mutate(deleteRoomId)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
