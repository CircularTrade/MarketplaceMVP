import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Upload, X, Loader2 } from "lucide-react";
import Header from "@/components/Header";
import ThemeToggle from "@/components/ThemeToggle";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertListingSchema } from "@shared/schema";
import type { InsertListing } from "@shared/schema";
import { z } from "zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

const formSchema = insertListingSchema.extend({
  pickupDeadline: z.string(),
}).omit({ sellerId: true, status: true, latitude: true, longitude: true, imageUrls: true });

type FormValues = z.infer<typeof formSchema>;

const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN;
const CLOUDINARY_CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME || import.meta.env.CLOUDINARY_CLOUD_NAME;
const CLOUDINARY_UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;

declare global {
  interface Window {
    cloudinary: any;
  }
}

async function geocodeAddress(suburb: string, postcode: string): Promise<{ latitude: number; longitude: number } | null> {
  try {
    const query = encodeURIComponent(`${suburb}, ${postcode}, Australia`);
    const response = await fetch(
      `https://api.mapbox.com/geocoding/v5/mapbox.places/${query}.json?access_token=${MAPBOX_TOKEN}&country=AU&limit=1`
    );
    
    if (!response.ok) {
      throw new Error('Geocoding failed');
    }
    
    const data = await response.json();
    
    if (data.features && data.features.length > 0) {
      const [longitude, latitude] = data.features[0].center;
      return { latitude, longitude };
    }
    
    return null;
  } catch (error) {
    console.error('Geocoding error:', error);
    return null;
  }
}

export default function NewListing() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [isGeocoding, setIsGeocoding] = useState(false);
  const [isUploadingImages, setIsUploadingImages] = useState(false);

  const { data: authData } = useQuery({ queryKey: ["/api/auth/me"] });
  const user = authData?.user;

  // Load Cloudinary Upload Widget script (singleton - never removed)
  useEffect(() => {
    // Check if script is already loaded
    if (window.cloudinary) return;
    
    // Check if script is already being loaded
    const existingScript = document.querySelector('script[src*="upload-widget.cloudinary.com"]');
    if (existingScript) return;
    
    const script = document.createElement('script');
    script.src = 'https://upload-widget.cloudinary.com/global/all.js';
    script.async = true;
    script.onload = () => {
      console.log('Cloudinary widget loaded successfully');
    };
    script.onerror = () => {
      console.error('Failed to load Cloudinary widget');
      toast({
        title: "Upload widget failed to load",
        description: "Please refresh the page and try again",
        variant: "destructive",
      });
    };
    document.body.appendChild(script);
    
    // No cleanup - keep script loaded for navigation
  }, [toast]);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      description: "",
      price: "0",
      quantity: 1,
      materialType: "",
      condition: "",
      dimensions: "",
      location: "",
      suburb: "",
      postcode: "",
      pickupDeadline: "",
      forkliftAvailable: false,
    },
  });

  const createListingMutation = useMutation({
    mutationFn: async (data: InsertListing) => {
      const response = await apiRequest("POST", "/api/listings", data);
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/listings"] });
      toast({
        title: "Listing created!",
        description: "Your listing has been published successfully.",
      });
      setLocation("/dashboard");
    },
    onError: (error: any) => {
      toast({
        title: "Failed to create listing",
        description: error.message || "Please try again",
        variant: "destructive",
      });
    },
  });

  const handleImageUpload = () => {
    if (imageUrls.length >= 6) {
      toast({
        title: "Maximum images reached",
        description: "You can only upload up to 6 images",
        variant: "destructive",
      });
      return;
    }

    if (!window.cloudinary) {
      toast({
        title: "Upload widget not ready",
        description: "Please wait a moment and try again",
        variant: "destructive",
      });
      return;
    }

    const widget = window.cloudinary.createUploadWidget(
      {
        cloudName: CLOUDINARY_CLOUD_NAME,
        uploadPreset: CLOUDINARY_UPLOAD_PRESET,
        sources: ['local', 'camera'],
        multiple: true,
        maxFiles: 6 - imageUrls.length,
        clientAllowedFormats: ['jpg', 'jpeg', 'png', 'webp'],
        maxFileSize: 5000000, // 5MB
        cropping: false,
        folder: 'circularflow_listings',
      },
      (error: any, result: any) => {
        if (error) {
          console.error('Upload error:', error);
          toast({
            title: "Upload failed",
            description: error.message || "Failed to upload image",
            variant: "destructive",
          });
          setIsUploadingImages(false);
          return;
        }

        if (result.event === 'queues-start') {
          setIsUploadingImages(true);
        }

        if (result.event === 'success') {
          const newImageUrl = result.info.secure_url;
          setImageUrls(prev => [...prev, newImageUrl]);
        }

        if (result.event === 'queues-end') {
          setIsUploadingImages(false);
          toast({
            title: "Images uploaded!",
            description: "Your images have been uploaded successfully",
          });
        }
      }
    );

    widget.open();
  };

  const removeImage = (index: number) => {
    const newImages = imageUrls.filter((_, i) => i !== index);
    setImageUrls(newImages);
  };

  const onSubmit = async (data: FormValues) => {
    if (!user) {
      toast({
        title: "Please log in",
        description: "You must be logged in to create a listing",
        variant: "destructive",
      });
      setLocation("/login");
      return;
    }

    // Defensive check: Ensure imageUrls is valid and has at least one URL
    if (!imageUrls || imageUrls.length === 0) {
      toast({
        title: "At least one image required",
        description: "Please upload at least one image of your listing",
        variant: "destructive",
      });
      return;
    }

    // Validate all URLs are valid strings
    const validUrls = imageUrls.filter(url => url && typeof url === 'string' && url.startsWith('http'));
    if (validUrls.length === 0) {
      toast({
        title: "Invalid images",
        description: "Please upload valid images and try again",
        variant: "destructive",
      });
      return;
    }

    // Geocode the address if suburb and postcode are provided
    let coordinates: { latitude: number; longitude: number } | null = null;
    
    if (data.suburb && data.postcode) {
      setIsGeocoding(true);
      coordinates = await geocodeAddress(data.suburb, data.postcode);
      setIsGeocoding(false);
      
      if (!coordinates) {
        toast({
          title: "Location not found",
          description: "Could not find the specified suburb and postcode. Please check and try again.",
          variant: "destructive",
        });
        return;
      }
    }

    const listingData: InsertListing = {
      title: data.title,
      description: data.description,
      price: data.price,
      quantity: data.quantity,
      materialType: data.materialType,
      condition: data.condition,
      dimensions: data.dimensions,
      location: data.location,
      suburb: data.suburb,
      postcode: data.postcode,
      forkliftAvailable: data.forkliftAvailable,
      imageUrls: validUrls, // Use validated URLs
      pickupDeadline: new Date(data.pickupDeadline),
      status: "active",
      sellerId: user.id,
      latitude: coordinates ? coordinates.latitude.toString() : null,
      longitude: coordinates ? coordinates.longitude.toString() : null,
    };

    createListingMutation.mutate(listingData);
  };

  if (!authData) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4">
        <p className="text-muted-foreground">Please log in to create a listing</p>
        <Button onClick={() => setLocation("/login")}>Log in</Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="fixed top-4 right-4 z-50">
        <ThemeToggle />
      </div>
      
      <Header />

      <main className="max-w-4xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Create New Listing</h1>
          <p className="text-muted-foreground">List your construction materials for sale</p>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Photos</CardTitle>
                <CardDescription>Add photos of your materials (up to 6 images)</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-4">
                  {imageUrls.map((image, index) => (
                    <div key={index} className="relative aspect-square rounded-lg border-2 border-dashed overflow-hidden group">
                      <img src={image} alt={`Upload ${index + 1}`} className="w-full h-full object-cover" />
                      <Button
                        type="button"
                        variant="destructive"
                        size="icon"
                        className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={() => removeImage(index)}
                        data-testid={`button-remove-image-${index}`}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}

                  {imageUrls.length < 6 && (
                    <button
                      type="button"
                      onClick={handleImageUpload}
                      disabled={isUploadingImages}
                      className="aspect-square rounded-lg border-2 border-dashed hover-elevate active-elevate-2 flex flex-col items-center justify-center gap-2 text-muted-foreground transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      data-testid="button-upload-image"
                    >
                      {isUploadingImages ? (
                        <>
                          <Loader2 className="h-8 w-8 animate-spin" />
                          <span className="text-sm">Uploading...</span>
                        </>
                      ) : (
                        <>
                          <Upload className="h-8 w-8" />
                          <span className="text-sm">Upload</span>
                        </>
                      )}
                    </button>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Basic Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Listing Title</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="e.g., Premium Steel I-Beams - Industrial Grade"
                          data-testid="input-title"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Describe your materials, their condition, and any important details..."
                          className="min-h-[120px]"
                          data-testid="input-description"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="price"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Price per Unit ($)</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            step="0.01"
                            placeholder="850"
                            data-testid="input-price"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="quantity"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Quantity</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            placeholder="50"
                            data-testid="input-quantity"
                            {...field}
                            onChange={(e) => field.onChange(parseInt(e.target.value))}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="materialType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Material Type</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger data-testid="select-material-type">
                              <SelectValue placeholder="Select material type" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="steel">Steel & Metal</SelectItem>
                            <SelectItem value="timber">Timber & Wood</SelectItem>
                            <SelectItem value="concrete">Concrete & Masonry</SelectItem>
                            <SelectItem value="plumbing">Plumbing</SelectItem>
                            <SelectItem value="scaffolding">Scaffolding</SelectItem>
                            <SelectItem value="other">Other</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="condition"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Condition</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger data-testid="select-condition">
                              <SelectValue placeholder="Select condition" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="new">New</SelectItem>
                            <SelectItem value="like-new">Like New</SelectItem>
                            <SelectItem value="good">Good</SelectItem>
                            <SelectItem value="fair">Fair</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="dimensions"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Dimensions (L x W x H)</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="e.g., 6m x 200mm x 150mm"
                          data-testid="input-dimensions"
                          {...field}
                          value={field.value || ""}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Location & Pickup</CardTitle>
                <CardDescription>Enter suburb and postcode for automatic geocoding</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="suburb"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Suburb</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="e.g., Wetherill Park"
                            data-testid="input-suburb"
                            {...field}
                            value={field.value || ""}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="postcode"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Postcode</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="e.g., 2164"
                            data-testid="input-postcode"
                            {...field}
                            value={field.value || ""}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="location"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Full Address (Optional)</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="e.g., Wetherill Park, NSW 2164"
                          data-testid="input-location"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="pickupDeadline"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Pickup Deadline</FormLabel>
                      <FormControl>
                        <Input
                          type="date"
                          data-testid="input-deadline"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="forkliftAvailable"
                  render={({ field }) => (
                    <FormItem className="flex items-center justify-between p-4 rounded-lg border">
                      <div className="space-y-0.5">
                        <FormLabel>Forklift Available</FormLabel>
                        <p className="text-sm text-muted-foreground">
                          Is there a forklift available for loading?
                        </p>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                          data-testid="switch-forklift"
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            <div className="flex gap-4">
              <Button
                type="button"
                variant="outline"
                className="flex-1"
                data-testid="button-cancel"
                onClick={() => setLocation("/")}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="flex-1"
                data-testid="button-publish"
                disabled={createListingMutation.isPending || isGeocoding}
              >
                {isGeocoding ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Finding location...
                  </>
                ) : createListingMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Publishing...
                  </>
                ) : (
                  "Publish Listing"
                )}
              </Button>
            </div>
          </form>
        </Form>
      </main>
    </div>
  );
}
