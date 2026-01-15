import { useState } from "react";
import Header from "@/components/Header";
import ThemeToggle from "@/components/ThemeToggle";
import DashboardStats from "@/components/DashboardStats";
import OrderTable from "@/components/OrderTable";
import ListingTable from "@/components/ListingTable";
import StripeConnectCard from "@/components/StripeConnectCard";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import steelImage from '@assets/generated_images/Steel_beams_product_photo_ca0784eb.png';
import timberImage from '@assets/generated_images/Reclaimed_timber_planks_3e3d3b19.png';
import concreteImage from '@assets/generated_images/Concrete_blocks_stack_11fecc0a.png';

export default function Dashboard() {
  const [userType] = useState<"seller" | "buyer">("seller");

  const mockOrders = [
    {
      id: "ORD-001",
      listingTitle: "Premium Steel I-Beams - Industrial Grade",
      thumbnail: steelImage,
      amount: 850,
      status: "IN_TRANSIT" as const,
      date: "Nov 15, 2024",
      otherParty: userType === "buyer" ? "BuildCo Supplies" : "John Doe",
    },
    {
      id: "ORD-002",
      listingTitle: "Reclaimed Timber Planks",
      thumbnail: timberImage,
      amount: 450,
      status: "COMPLETED" as const,
      date: "Nov 10, 2024",
      otherParty: userType === "buyer" ? "Eco Materials Ltd" : "Sarah Chen",
    },
  ];

  const mockListings = [
    {
      id: "LST-001",
      title: "Premium Steel I-Beams - Industrial Grade",
      thumbnail: steelImage,
      price: 850,
      views: 142,
      status: "active" as const,
    },
    {
      id: "LST-002",
      title: "Reclaimed Timber Planks",
      thumbnail: timberImage,
      price: 450,
      views: 89,
      status: "sold" as const,
    },
    {
      id: "LST-003",
      title: "Concrete Blocks - Grey",
      thumbnail: concreteImage,
      price: 120,
      views: 34,
      status: "active" as const,
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      <div className="fixed top-4 right-4 z-50">
        <ThemeToggle />
      </div>
      
      <Header />

      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Dashboard</h1>
          <p className="text-muted-foreground">Manage your listings and orders</p>
        </div>

        <DashboardStats userType={userType} />

        <div className="mt-8">
          <Tabs defaultValue={userType === "seller" ? "listings" : "orders"} className="w-full">
            <TabsList>
              {userType === "seller" && (
                <TabsTrigger value="listings" data-testid="tab-listings">My Listings</TabsTrigger>
              )}
              <TabsTrigger value="orders" data-testid="tab-orders">
                {userType === "seller" ? "Sales" : "My Orders"}
              </TabsTrigger>
              {userType === "seller" && (
                <TabsTrigger value="payouts" data-testid="tab-payouts">Payout Settings</TabsTrigger>
              )}
            </TabsList>

            {userType === "seller" && (
              <TabsContent value="listings" className="mt-6">
                <ListingTable listings={mockListings} />
              </TabsContent>
            )}

            <TabsContent value="orders" className="mt-6">
              <OrderTable orders={mockOrders} userType={userType} />
            </TabsContent>

            {userType === "seller" && (
              <TabsContent value="payouts" className="mt-6">
                <div className="max-w-2xl">
                  <StripeConnectCard isConnected={true} earnings={24500} />
                </div>
              </TabsContent>
            )}
          </Tabs>
        </div>
      </main>
    </div>
  );
}
