import { useState } from "react";
import { X, SlidersHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const materialCategories = [
  "Steel & Metal",
  "Timber & Wood",
  "Concrete & Masonry",
  "Plumbing",
  "Scaffolding",
  "Other"
];

export default function FilterBar() {
  const [selectedMaterials, setSelectedMaterials] = useState<string[]>(["Steel & Metal"]);
  const [distance, setDistance] = useState([25]);
  const [sortBy, setSortBy] = useState("recent");

  const toggleMaterial = (material: string) => {
    setSelectedMaterials(prev =>
      prev.includes(material)
        ? prev.filter(m => m !== material)
        : [...prev, material]
    );
  };

  const clearFilters = () => {
    setSelectedMaterials([]);
    setDistance([25]);
    setSortBy("recent");
  };

  return (
    <div className="sticky top-16 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="max-w-7xl mx-auto px-4 py-3">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-2 flex-wrap">
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2" data-testid="button-filters">
                  <SlidersHorizontal className="h-4 w-4" />
                  Filters
                  {selectedMaterials.length > 0 && (
                    <Badge variant="secondary" className="ml-1">
                      {selectedMaterials.length}
                    </Badge>
                  )}
                </Button>
              </SheetTrigger>
              <SheetContent>
                <SheetHeader>
                  <SheetTitle>Filters</SheetTitle>
                  <SheetDescription>
                    Refine your search results
                  </SheetDescription>
                </SheetHeader>
                <div className="mt-6 space-y-6">
                  <div className="space-y-3">
                    <Label>Material Categories</Label>
                    <div className="flex flex-wrap gap-2">
                      {materialCategories.map((material) => (
                        <Badge
                          key={material}
                          variant={selectedMaterials.includes(material) ? "default" : "outline"}
                          className="cursor-pointer hover-elevate active-elevate-2"
                          onClick={() => toggleMaterial(material)}
                          data-testid={`filter-material-${material.toLowerCase().replace(/\s+/g, '-')}`}
                        >
                          {material}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Label>Distance: {distance[0]} km</Label>
                    </div>
                    <Slider
                      value={distance}
                      onValueChange={setDistance}
                      max={100}
                      step={5}
                      data-testid="slider-distance"
                    />
                  </div>

                  <div className="space-y-3">
                    <Label>Sort By</Label>
                    <Select value={sortBy} onValueChange={setSortBy}>
                      <SelectTrigger data-testid="select-sort">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="recent">Most Recent</SelectItem>
                        <SelectItem value="price-low">Price: Low to High</SelectItem>
                        <SelectItem value="price-high">Price: High to Low</SelectItem>
                        <SelectItem value="distance">Nearest First</SelectItem>
                        <SelectItem value="deadline">Urgent Pickup</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={clearFilters}
                    data-testid="button-clear-filters"
                  >
                    Clear All Filters
                  </Button>
                </div>
              </SheetContent>
            </Sheet>

            {selectedMaterials.map((material) => (
              <Badge
                key={material}
                variant="secondary"
                className="gap-1 pr-1"
                data-testid={`badge-active-filter-${material.toLowerCase().replace(/\s+/g, '-')}`}
              >
                {material}
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-4 w-4 p-0 hover:bg-transparent"
                  onClick={() => toggleMaterial(material)}
                >
                  <X className="h-3 w-3" />
                </Button>
              </Badge>
            ))}

            {selectedMaterials.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={clearFilters}
                data-testid="button-clear-all"
              >
                Clear all
              </Button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">
              147 listings found
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
