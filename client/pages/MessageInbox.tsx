import { useState } from "react";
import { useLocation } from "wouter";
import { MessageCircle, Loader2, Package } from "lucide-react";
import Header from "@/components/Header";
import ThemeToggle from "@/components/ThemeToggle";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";
import { useUser } from "@/hooks/use-user";
import { formatDistanceToNow } from "date-fns";
import type { ChatThread, Listing, User, ChatMessage } from "@shared/schema";

type ThreadWithDetails = ChatThread & {
  listing: Listing;
  otherUser: User;
  lastMessage?: ChatMessage;
};

export default function MessageInbox() {
  const [, setLocation] = useLocation();
  const { user } = useUser();

  const { data: threads, isLoading } = useQuery<ThreadWithDetails[]>({
    queryKey: ["/api/messages/threads"],
    enabled: !!user,
  });

  if (!user) {
    setLocation("/login");
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="fixed top-4 right-4 z-50">
        <ThemeToggle />
      </div>

      <Header />

      <main className="max-w-4xl mx-auto px-4 py-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold mb-2" data-testid="text-messages-title">
            Messages
          </h1>
          <p className="text-muted-foreground">
            Your conversations with buyers and sellers
          </p>
        </div>

        {isLoading ? (
          <div className="flex justify-center items-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : threads && threads.length > 0 ? (
          <div className="space-y-3">
            {threads.map((thread) => {
              const isBuyer = thread.buyerId === user.id;
              const lastReadAt = isBuyer ? thread.lastReadAtBuyer : thread.lastReadAtSeller;
              const hasUnread = thread.lastMessage && (!lastReadAt || new Date(thread.lastMessage.createdAt) > new Date(lastReadAt));

              return (
                <Card
                  key={thread.id}
                  className="hover-elevate active-elevate-2 cursor-pointer transition-all"
                  onClick={() => setLocation(`/messages/${thread.id}`)}
                  data-testid={`thread-card-${thread.id}`}
                >
                  <CardContent className="p-4">
                    <div className="flex gap-4">
                      <Avatar className="h-12 w-12 flex-shrink-0">
                        <AvatarFallback>
                          {thread.otherUser.name.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2 mb-1">
                          <div className="flex-1 min-w-0">
                            <h3 className="font-semibold truncate" data-testid={`text-other-user-${thread.id}`}>
                              {thread.otherUser.name}
                            </h3>
                            <div className="flex items-center gap-2 mt-1">
                              <Package className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                              <p className="text-sm text-muted-foreground truncate">
                                {thread.listing.title}
                              </p>
                            </div>
                          </div>
                          <div className="flex flex-col items-end gap-1 flex-shrink-0">
                            {thread.lastMessage && (
                              <span className="text-xs text-muted-foreground whitespace-nowrap">
                                {formatDistanceToNow(new Date(thread.lastMessage.createdAt), { addSuffix: true })}
                              </span>
                            )}
                            {hasUnread && (
                              <Badge className="bg-primary text-primary-foreground" data-testid={`badge-unread-${thread.id}`}>
                                New
                              </Badge>
                            )}
                          </div>
                        </div>

                        {thread.lastMessage && (
                          <p className={`text-sm truncate ${hasUnread ? 'font-semibold' : 'text-muted-foreground'}`}>
                            {thread.lastMessage.senderId === user.id ? 'You: ' : ''}
                            {thread.lastMessage.messageText}
                          </p>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        ) : (
          <Card>
            <CardContent className="p-12 text-center">
              <MessageCircle className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="font-semibold mb-2">No conversations yet</h3>
              <p className="text-sm text-muted-foreground max-w-sm mx-auto">
                Start a conversation by messaging sellers directly from their listings
              </p>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
}
