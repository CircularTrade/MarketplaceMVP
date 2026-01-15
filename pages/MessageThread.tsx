import { useState, useEffect, useRef } from "react";
import { useRoute, useLocation } from "wouter";
import { ArrowLeft, Send, Loader2, Package } from "lucide-react";
import Header from "@/components/Header";
import ThemeToggle from "@/components/ThemeToggle";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useUser } from "@/hooks/use-user";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import type { ChatThread, Listing, User, ChatMessage } from "@shared/schema";

type ThreadWithDetails = {
  thread: ChatThread;
  listing: Listing;
  buyer: User;
  seller: User;
  messages: ChatMessage[];
};

export default function MessageThread() {
  const [, params] = useRoute("/messages/:threadId");
  const [, setLocation] = useLocation();
  const { user } = useUser();
  const { toast } = useToast();
  const [messageText, setMessageText] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const threadId = params?.threadId;

  const { data: threadData, isLoading } = useQuery<ThreadWithDetails>({
    queryKey: ["/api/messages/thread", threadId],
    enabled: !!user && !!threadId,
    refetchInterval: 3000, // Poll every 3 seconds
  });

  const sendMessageMutation = useMutation({
    mutationFn: async (text: string) => {
      const res = await apiRequest("POST", "/api/messages/send", {
        threadId,
        messageText: text,
      });
      return await res.json();
    },
    onSuccess: () => {
      setMessageText("");
      queryClient.invalidateQueries({ queryKey: ["/api/messages/thread", threadId] });
      queryClient.invalidateQueries({ queryKey: ["/api/messages/threads"] });
      queryClient.invalidateQueries({ queryKey: ["/api/messages/unread-count"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to send message",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleSend = () => {
    const trimmed = messageText.trim();
    if (!trimmed) return;
    sendMessageMutation.mutate(trimmed);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [threadData?.messages]);

  if (!user) {
    setLocation("/login");
    return null;
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="fixed top-4 right-4 z-50">
          <ThemeToggle />
        </div>
        <Header />
        <div className="flex justify-center items-center py-24">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  if (!threadData) {
    return (
      <div className="min-h-screen bg-background">
        <div className="fixed top-4 right-4 z-50">
          <ThemeToggle />
        </div>
        <Header />
        <div className="flex flex-col justify-center items-center py-24">
          <p className="text-muted-foreground mb-4">Conversation not found</p>
          <Button onClick={() => setLocation("/messages")}>Back to Messages</Button>
        </div>
      </div>
    );
  }

  const { thread, listing, buyer, seller, messages } = threadData;
  const otherUser = thread.buyerId === user.id ? seller : buyer;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <div className="fixed top-4 right-4 z-50">
        <ThemeToggle />
      </div>

      <Header />

      <main className="flex-1 max-w-4xl w-full mx-auto px-4 py-8 flex flex-col">
        {/* Header */}
        <div className="mb-6">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setLocation("/messages")}
            className="mb-4"
            data-testid="button-back-to-messages"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Messages
          </Button>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <Avatar className="h-10 w-10">
                  <AvatarFallback>
                    {otherUser.name.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <h2 className="font-semibold" data-testid="text-other-user-name">
                    {otherUser.name}
                  </h2>
                  <div
                    className="flex items-center gap-2 text-sm text-muted-foreground cursor-pointer hover-elevate px-2 py-1 -mx-2 rounded-md"
                    onClick={() => setLocation(`/listing/${listing.id}`)}
                  >
                    <Package className="h-3 w-3" />
                    <span className="truncate" data-testid="text-listing-title">
                      {listing.title}
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Messages */}
        <Card className="flex-1 flex flex-col mb-4">
          <CardContent className="p-4 flex-1 overflow-y-auto">
            {messages.length === 0 ? (
              <div className="text-center text-muted-foreground py-12">
                <p>No messages yet. Start the conversation!</p>
              </div>
            ) : (
              <div className="space-y-4">
                {messages.map((message) => {
                  const isCurrentUser = message.senderId === user.id;
                  return (
                    <div
                      key={message.id}
                      className={`flex ${isCurrentUser ? "justify-end" : "justify-start"}`}
                      data-testid={`message-${message.id}`}
                    >
                      <div className={`max-w-[70%] ${isCurrentUser ? "order-2" : "order-1"}`}>
                        <div
                          className={`rounded-lg px-4 py-2 ${
                            isCurrentUser
                              ? "bg-primary text-primary-foreground"
                              : "bg-muted"
                          }`}
                        >
                          <p className="text-sm whitespace-pre-wrap break-words">
                            {message.messageText}
                          </p>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1 px-1">
                          {format(new Date(message.createdAt), "MMM d, h:mm a")}
                        </p>
                      </div>
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>
            )}
          </CardContent>
        </Card>

        {/* Message Input */}
        <Card>
          <CardContent className="p-4">
            <div className="flex gap-2">
              <Textarea
                value={messageText}
                onChange={(e) => setMessageText(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Type a message..."
                className="resize-none"
                rows={2}
                disabled={sendMessageMutation.isPending}
                data-testid="input-message"
              />
              <Button
                onClick={handleSend}
                disabled={!messageText.trim() || sendMessageMutation.isPending}
                size="icon"
                className="h-full"
                data-testid="button-send-message"
              >
                {sendMessageMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Press Enter to send, Shift+Enter for new line
            </p>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
