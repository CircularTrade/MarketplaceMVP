import { Link, useLocation } from "wouter";
import { Package, MessageCircle, User, Menu, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export default function Header() {
  const [location, setLocation] = useLocation();
  const { toast } = useToast();

  const { data: authData } = useQuery({
    queryKey: ["/api/auth/me"],
    retry: false,
  });

  const user = authData?.user;
  const isLoggedIn = !!user;

  const { data: unreadData } = useQuery<{ unreadCount: number }>({
    queryKey: ["/api/messages/unread-count"],
    enabled: isLoggedIn,
    refetchInterval: 10000, // Poll every 10 seconds
  });

  const unreadCount = unreadData?.unreadCount || 0;

  const handleLogout = async () => {
    try {
      const response = await apiRequest("POST", "/api/auth/logout");
      await response.json();
      queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
      toast({
        title: "Logged out",
        description: "You have been successfully logged out.",
      });
      setLocation("/");
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to log out",
        variant: "destructive",
      });
    }
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="max-w-7xl mx-auto flex h-16 items-center justify-between px-4 gap-4">
        <div className="flex items-center gap-6">
          <Link href="/" className="flex items-center gap-2 hover-elevate active-elevate-2 rounded-lg px-2 py-1 -ml-2" data-testid="link-home">
            <Package className="h-6 w-6 text-primary" />
            <span className="font-bold text-xl">CircularTrade</span>
          </Link>

          <nav className="hidden md:flex items-center gap-1">
            <Link href="/" data-testid="link-browse">
              <Button variant={location === "/" ? "secondary" : "ghost"} size="sm">
                Browse
              </Button>
            </Link>
            <Link href="/map" data-testid="link-map">
              <Button variant={location === "/map" ? "secondary" : "ghost"} size="sm">
                Map
              </Button>
            </Link>
            <Link href="/dashboard" data-testid="link-dashboard">
              <Button variant={location === "/dashboard" ? "secondary" : "ghost"} size="sm">
                Dashboard
              </Button>
            </Link>
          </nav>
        </div>

        <div className="flex items-center gap-2">
          {isLoggedIn ? (
            <>
              <Link href="/new" data-testid="link-new-listing">
                <Button size="sm" className="gap-2">
                  <Plus className="h-4 w-4" />
                  <span className="hidden sm:inline">Post Listing</span>
                </Button>
              </Link>

              <Link href="/messages" data-testid="link-messages">
                <Button variant="ghost" size="icon" className="relative">
                  <MessageCircle className="h-5 w-5" />
                  {unreadCount > 0 && (
                    <Badge 
                      className="absolute -top-1 -right-1 h-5 min-w-5 flex items-center justify-center p-0 text-xs bg-destructive text-destructive-foreground"
                      data-testid="badge-unread-count"
                    >
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </Badge>
                  )}
                </Button>
              </Link>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="gap-2 px-2" data-testid="button-user-menu">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src="" />
                      <AvatarFallback>{user?.name.split(' ').map((n: string) => n[0]).join('')}</AvatarFallback>
                    </Avatar>
                    <span className="hidden sm:inline text-sm font-medium">{user?.name}</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuLabel>My Account</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem data-testid="menu-dashboard" onClick={() => setLocation("/dashboard")}>
                    Dashboard
                  </DropdownMenuItem>
                  <DropdownMenuItem data-testid="menu-listings" onClick={() => setLocation("/dashboard")}>
                    My Listings
                  </DropdownMenuItem>
                  <DropdownMenuItem data-testid="menu-orders" onClick={() => setLocation("/dashboard")}>
                    My Orders
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem data-testid="menu-logout" onClick={handleLogout}>
                    Log out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          ) : (
            <>
              <Link href="/login">
                <Button variant="ghost" size="sm" data-testid="button-login">
                  Log in
                </Button>
              </Link>
              <Link href="/signup">
                <Button size="sm" data-testid="button-signup">
                  Sign up
                </Button>
              </Link>
            </>
          )}

          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            data-testid="button-menu"
          >
            <Menu className="h-5 w-5" />
          </Button>
        </div>
      </div>
    </header>
  );
}
