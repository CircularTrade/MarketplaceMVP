import MessageThread from '../MessageThread';

export default function MessageThreadExample() {
  const mockMessages = [
    {
      id: "1",
      sender: "seller" as const,
      senderName: "BuildCo Supplies",
      content: "Hi! Thanks for your interest in the steel beams. They're in excellent condition.",
      timestamp: "10:30 AM",
    },
    {
      id: "2",
      sender: "buyer" as const,
      senderName: "John Doe",
      content: "Great! Can you provide more details about the dimensions?",
      timestamp: "10:35 AM",
    },
    {
      id: "3",
      sender: "seller" as const,
      senderName: "BuildCo Supplies",
      content: "Sure! Each beam is 6 meters long, 200mm wide. Perfect for structural work.",
      timestamp: "10:37 AM",
    },
  ];

  return (
    <div className="p-8 max-w-3xl mx-auto">
      <MessageThread
        messages={mockMessages}
        currentUserType="buyer"
        otherPartyName="BuildCo Supplies"
      />
    </div>
  );
}
