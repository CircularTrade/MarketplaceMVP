import { useState, useRef, useMemo, useEffect } from "react";
import ReactMapGL, { Marker, NavigationControl } from "react-map-gl";
import useSupercluster from "use-supercluster";
import { useQuery } from "@tanstack/react-query";
import "mapbox-gl/dist/mapbox-gl.css";
import mapboxgl from "mapbox-gl";
import Header from "@/components/Header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { Listing } from "@shared/schema";
import { MapPin, DollarSign, Calendar, Package, AlertCircle } from "lucide-react";
import { formatDistance } from "date-fns";
import { useLocation } from "wouter";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN;

interface ViewportState {
  latitude: number;
  longitude: number;
  zoom: number;
}

export default function MapPage() {
  const [, setLocation] = useLocation();
  const mapRef = useRef<any>();
  const [mapSupported, setMapSupported] = useState<boolean>(true);
  
  const [viewport, setViewport] = useState<ViewportState>({
    latitude: -33.868,
    longitude: 151.209,
    zoom: 10,
  });
  
  const [radiusKm, setRadiusKm] = useState(50);
  const [materialType, setMaterialType] = useState<string>("all");
  const [maxPrice, setMaxPrice] = useState<string>("");
  const [condition, setCondition] = useState<string>("all");
  const [selectedListing, setSelectedListing] = useState<Listing | null>(null);

  useEffect(() => {
    if (!mapboxgl.supported()) {
      setMapSupported(false);
    }
  }, []);

  const { data: listings = [], isLoading } = useQuery<Listing[]>({
    queryKey: ["/api/listings/near", viewport.latitude, viewport.longitude, radiusKm, materialType, maxPrice, condition],
    queryFn: async () => {
      const params = new URLSearchParams({
        lat: viewport.latitude.toString(),
        lng: viewport.longitude.toString(),
        radiusKm: radiusKm.toString(),
      });
      
      if (materialType && materialType !== "all") params.append("materialType", materialType);
      if (maxPrice) params.append("maxPrice", maxPrice);
      if (condition && condition !== "all") params.append("condition", condition);
      
      const res = await fetch(`/api/listings/near?${params}`, {
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to fetch listings");
      return res.json();
    },
    refetchOnWindowFocus: false,
  });

  const points = useMemo(() => {
    return listings
      .filter(listing => listing.latitude && listing.longitude)
      .map(listing => ({
        type: "Feature" as const,
        properties: { 
          cluster: false,
          listingId: listing.id,
          listing,
        },
        geometry: {
          type: "Point" as const,
          coordinates: [parseFloat(listing.longitude!), parseFloat(listing.latitude!)],
        },
      }));
  }, [listings]);

  const bounds = mapRef.current
    ? mapRef.current.getMap().getBounds().toArray().flat()
    : null;

  const { clusters, supercluster } = useSupercluster({
    points,
    bounds,
    zoom: viewport.zoom,
    options: { radius: 75, maxZoom: 20 },
  });

  const handleClusterClick = (cluster: any) => {
    const [longitude, latitude] = cluster.geometry.coordinates;
    const expansionZoom = Math.min(
      supercluster!.getClusterExpansionZoom(cluster.id),
      20
    );

    setViewport({
      latitude,
      longitude,
      zoom: expansionZoom,
    });
  };

  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      {!mapSupported && (
        <div className="p-4">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Map Not Supported</AlertTitle>
            <AlertDescription>
              Your browser doesn't support WebGL, which is required for the interactive map. 
              Please use a modern browser like Chrome, Firefox, or Safari to view the map.
            </AlertDescription>
          </Alert>
        </div>
      )}
      
      <div className="flex h-[calc(100vh-64px)]">
        {/* Left Panel - Filters */}
        <div className="w-80 p-4 border-r overflow-y-auto">
          <Card>
            <CardHeader>
              <CardTitle>Filters</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Search Radius (km)</Label>
                <Input
                  type="number"
                  value={radiusKm}
                  onChange={(e) => setRadiusKm(Number(e.target.value))}
                  min={1}
                  max={500}
                  data-testid="input-radius"
                />
              </div>

              <div className="space-y-2">
                <Label>Material Type</Label>
                <Select value={materialType} onValueChange={setMaterialType}>
                  <SelectTrigger data-testid="select-material-type">
                    <SelectValue placeholder="All materials" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All materials</SelectItem>
                    <SelectItem value="Concrete & Masonry">Concrete & Masonry</SelectItem>
                    <SelectItem value="Steel & Metal">Steel & Metal</SelectItem>
                    <SelectItem value="Wood & Timber">Wood & Timber</SelectItem>
                    <SelectItem value="Electrical">Electrical</SelectItem>
                    <SelectItem value="Plumbing">Plumbing</SelectItem>
                    <SelectItem value="HVAC">HVAC</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Max Price ($)</Label>
                <Input
                  type="number"
                  value={maxPrice}
                  onChange={(e) => setMaxPrice(e.target.value)}
                  placeholder="No limit"
                  data-testid="input-max-price"
                />
              </div>

              <div className="space-y-2">
                <Label>Condition</Label>
                <Select value={condition} onValueChange={setCondition}>
                  <SelectTrigger data-testid="select-condition">
                    <SelectValue placeholder="All conditions" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All conditions</SelectItem>
                    <SelectItem value="New">New</SelectItem>
                    <SelectItem value="Like New">Like New</SelectItem>
                    <SelectItem value="Good">Good</SelectItem>
                    <SelectItem value="Fair">Fair</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Button
                onClick={() => {
                  setMaterialType("all");
                  setMaxPrice("");
                  setCondition("all");
                  setRadiusKm(50);
                }}
                variant="outline"
                className="w-full"
                data-testid="button-clear-filters"
              >
                Clear Filters
              </Button>

              <div className="pt-4 border-t">
                <p className="text-sm text-muted-foreground">
                  {isLoading ? "Loading..." : `${listings.length} listings found`}
                </p>
              </div>
            </CardContent>
          </Card>

          {selectedListing && (
            <Card className="mt-4">
              <CardHeader>
                <CardTitle className="text-lg">{selectedListing.title}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-2xl font-bold text-primary">
                    ${parseFloat(selectedListing.price).toFixed(2)}
                  </span>
                  <Badge>{selectedListing.condition}</Badge>
                </div>
                
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Package className="h-4 w-4" />
                    <span>{selectedListing.materialType}</span>
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <MapPin className="h-4 w-4" />
                    <span>{selectedListing.location}</span>
                  </div>
                  {selectedListing.latitude && selectedListing.longitude && (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <DollarSign className="h-4 w-4" />
                      <span>
                        {calculateDistance(
                          viewport.latitude,
                          viewport.longitude,
                          parseFloat(selectedListing.latitude),
                          parseFloat(selectedListing.longitude)
                        ).toFixed(1)} km away
                      </span>
                    </div>
                  )}
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Calendar className="h-4 w-4" />
                    <span>
                      Pickup: {formatDistance(new Date(selectedListing.pickupDeadline), new Date(), { addSuffix: true })}
                    </span>
                  </div>
                </div>

                <Button
                  onClick={() => setLocation(`/listing/${selectedListing.id}`)}
                  className="w-full"
                  data-testid="button-view-details"
                >
                  View Details
                </Button>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Map */}
        <div className="flex-1 relative">
          {mapSupported ? (
            <ReactMapGL
              ref={mapRef}
              {...viewport}
              onMove={(evt) => setViewport(evt.viewState)}
              mapStyle="mapbox://styles/mapbox/streets-v12"
              mapboxAccessToken={MAPBOX_TOKEN}
              style={{ width: "100%", height: "100%" }}
            >
              <NavigationControl position="top-left" />
            
            {clusters.map((cluster) => {
              const [longitude, latitude] = cluster.geometry.coordinates;
              const { cluster: isCluster, point_count: pointCount } = cluster.properties;

              if (isCluster) {
                const size = 30 + (pointCount / points.length) * 30;
                
                return (
                  <Marker
                    key={`cluster-${cluster.id}`}
                    latitude={latitude}
                    longitude={longitude}
                  >
                    <div
                      className="flex items-center justify-center rounded-full bg-primary text-primary-foreground font-bold cursor-pointer hover-elevate active-elevate-2"
                      style={{
                        width: `${size}px`,
                        height: `${size}px`,
                      }}
                      onClick={() => handleClusterClick(cluster)}
                      data-testid={`cluster-${cluster.id}`}
                    >
                      {pointCount}
                    </div>
                  </Marker>
                );
              }

              return (
                <Marker
                  key={`listing-${cluster.properties.listingId}`}
                  latitude={latitude}
                  longitude={longitude}
                >
                  <div
                    className="flex items-center justify-center w-6 h-6 rounded-full bg-accent text-accent-foreground border-2 border-background cursor-pointer hover-elevate active-elevate-2"
                    onClick={() => setSelectedListing(cluster.properties.listing)}
                    data-testid={`marker-${cluster.properties.listingId}`}
                  >
                    <MapPin className="h-4 w-4" />
                  </div>
                </Marker>
              );
            })}
            </ReactMapGL>
          ) : (
            <div className="flex items-center justify-center h-full bg-muted">
              <Card className="max-w-md">
                <CardContent className="pt-6">
                  <div className="flex flex-col items-center text-center gap-4">
                    <AlertCircle className="h-12 w-12 text-muted-foreground" />
                    <div>
                      <h3 className="font-semibold text-lg mb-2">Map Unavailable</h3>
                      <p className="text-sm text-muted-foreground">
                        Your browser doesn't support WebGL, which is required for the interactive map. 
                        Please try using a modern browser like Chrome, Firefox, or Safari.
                      </p>
                    </div>
                    <Button onClick={() => setLocation("/")} variant="outline">
                      Browse Listings Instead
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
