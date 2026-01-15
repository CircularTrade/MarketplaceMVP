import { useState } from "react";
import { Search, MapPin, Calendar, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import heroImage from "@assets/generated_images/Construction_materials_yard_hero_b7adff70.png";

export default function HeroSection() {
  const [searchTerm, setSearchTerm] = useState("");
  const [materialType, setMaterialType] = useState("");
  const [radius, setRadius] = useState("25");

  return (
    <section className="relative w-full h-[60vh] min-h-[500px] flex items-center justify-center overflow-hidden">
      <div 
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: `url(${heroImage})` }}
      />
      <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/50 to-black/60" />
      
      <div className="relative z-10 max-w-4xl mx-auto px-4 text-center">
        <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-4" data-testid="text-hero-title">
          Quality Construction Materials,
          <br />
          Delivered to Your Site
        </h1>
        <p className="text-lg md:text-xl text-white/90 mb-8" data-testid="text-hero-subtitle">
          Connect with verified sellers across Australia. Save money, reduce waste.
        </p>

        <div className="flex flex-wrap items-center justify-center gap-4 mb-8">
          <Badge variant="secondary" className="bg-white/20 backdrop-blur-sm text-white border-white/30 px-4 py-2">
            500+ Verified Sellers
          </Badge>
          <Badge variant="secondary" className="bg-white/20 backdrop-blur-sm text-white border-white/30 px-4 py-2">
            1000+ Listings
          </Badge>
          <Badge variant="secondary" className="bg-white/20 backdrop-blur-sm text-white border-white/30 px-4 py-2">
            Secure Payments
          </Badge>
        </div>

        <div className="bg-white/95 backdrop-blur-sm rounded-lg p-6 shadow-xl">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
            <div className="md:col-span-5 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input
                placeholder="Search materials..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
                data-testid="input-search"
              />
            </div>

            <div className="md:col-span-3">
              <Select value={materialType} onValueChange={setMaterialType}>
                <SelectTrigger data-testid="select-material-type">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Material type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="steel">Steel & Metal</SelectItem>
                  <SelectItem value="timber">Timber & Wood</SelectItem>
                  <SelectItem value="concrete">Concrete & Masonry</SelectItem>
                  <SelectItem value="plumbing">Plumbing</SelectItem>
                  <SelectItem value="scaffolding">Scaffolding</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="md:col-span-2">
              <Select value={radius} onValueChange={setRadius}>
                <SelectTrigger data-testid="select-radius">
                  <MapPin className="h-4 w-4 mr-2" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="10">10 km</SelectItem>
                  <SelectItem value="25">25 km</SelectItem>
                  <SelectItem value="50">50 km</SelectItem>
                  <SelectItem value="100">100 km</SelectItem>
                  <SelectItem value="all">All locations</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="md:col-span-2">
              <Button className="w-full" size="default" data-testid="button-search">
                Search
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
