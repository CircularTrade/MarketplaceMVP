import { Star } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface ReviewCardProps {
  authorName: string;
  authorAvatar?: string;
  rating: number;
  date: string;
  comment: string;
}

export default function ReviewCard({
  authorName,
  authorAvatar,
  rating,
  date,
  comment,
}: ReviewCardProps) {
  return (
    <Card data-testid={`card-review-${authorName.toLowerCase().replace(/\s+/g, '-')}`}>
      <CardContent className="p-6">
        <div className="flex items-start gap-4">
          <Avatar className="h-10 w-10">
            <AvatarImage src={authorAvatar} />
            <AvatarFallback>{authorName.split(' ').map(n => n[0]).join('')}</AvatarFallback>
          </Avatar>

          <div className="flex-1">
            <div className="flex items-center justify-between mb-2">
              <div>
                <p className="font-semibold" data-testid={`text-reviewer-${authorName.toLowerCase().replace(/\s+/g, '-')}`}>
                  {authorName}
                </p>
                <p className="text-sm text-muted-foreground">{date}</p>
              </div>
              <div className="flex items-center gap-1">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    className={`h-4 w-4 ${
                      i < rating
                        ? "fill-yellow-400 text-yellow-400"
                        : "fill-muted text-muted"
                    }`}
                  />
                ))}
              </div>
            </div>

            <p className="text-sm leading-relaxed" data-testid="text-review-comment">
              {comment}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
