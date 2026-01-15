import { useState } from "react";
import { Send, Paperclip } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";

interface Message {
  id: string;
  sender: "buyer" | "seller";
  senderName: string;
  content: string;
  timestamp: string;
}

interface MessageThreadProps {
  messages: Message[];
  currentUserType: "buyer" | "seller";
  otherPartyName: string;
}

export default function MessageThread({
  messages,
  currentUserType,
  otherPartyName,
}: MessageThreadProps) {
  const [newMessage, setNewMessage] = useState("");

  const handleSend = () => {
    if (newMessage.trim()) {
      console.log("Sending message:", newMessage);
      setNewMessage("");
    }
  };

  return (
    <Card className="h-[600px] flex flex-col">
      <CardHeader className="border-b">
        <div className="flex items-center gap-3">
          <Avatar>
            <AvatarImage src="" />
            <AvatarFallback>{otherPartyName.split(' ').map(n => n[0]).join('')}</AvatarFallback>
          </Avatar>
          <div>
            <CardTitle className="text-lg">{otherPartyName}</CardTitle>
            <p className="text-sm text-muted-foreground">
              {currentUserType === "buyer" ? "Seller" : "Buyer"}
            </p>
          </div>
        </div>
      </CardHeader>

      <ScrollArea className="flex-1 p-4">
        <div className="space-y-4">
          {messages.map((message) => {
            const isCurrentUser = message.sender === currentUserType;
            return (
              <div
                key={message.id}
                className={`flex gap-3 ${isCurrentUser ? "flex-row-reverse" : ""}`}
                data-testid={`message-${message.id}`}
              >
                <Avatar className="h-8 w-8">
                  <AvatarImage src="" />
                  <AvatarFallback className="text-xs">
                    {message.senderName.split(' ').map(n => n[0]).join('')}
                  </AvatarFallback>
                </Avatar>

                <div className={`flex flex-col gap-1 max-w-[70%] ${isCurrentUser ? "items-end" : ""}`}>
                  <div
                    className={`rounded-lg px-4 py-2 ${
                      isCurrentUser
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted"
                    }`}
                  >
                    <p className="text-sm">{message.content}</p>
                  </div>
                  <span className="text-xs text-muted-foreground">{message.timestamp}</span>
                </div>
              </div>
            );
          })}
        </div>
      </ScrollArea>

      <CardContent className="border-t p-4">
        <div className="flex gap-2">
          <Button variant="ghost" size="icon" data-testid="button-attach">
            <Paperclip className="h-5 w-5" />
          </Button>
          <Textarea
            placeholder="Type your message..."
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            className="min-h-[60px] resize-none"
            data-testid="input-message"
          />
          <Button onClick={handleSend} size="icon" data-testid="button-send">
            <Send className="h-5 w-5" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
