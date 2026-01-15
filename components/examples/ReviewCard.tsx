import ReviewCard from '../ReviewCard';

export default function ReviewCardExample() {
  return (
    <div className="p-8 max-w-2xl space-y-4">
      <ReviewCard
        authorName="Sarah Johnson"
        rating={5}
        date="2 weeks ago"
        comment="Excellent quality steel beams, exactly as described. Seller was professional and delivery was on time. Would definitely buy from again!"
      />
      <ReviewCard
        authorName="Mike Chen"
        rating={4}
        date="1 month ago"
        comment="Good product overall. Pickup was smooth and materials were well organized. Minor issue with quantity but seller resolved it quickly."
      />
    </div>
  );
}
