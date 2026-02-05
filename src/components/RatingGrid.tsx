import { cn } from "@/lib/utils";

type RatingValue = "excellent" | "very_good" | "good" | "average" | "dissatisfied";

interface RatingItem {
  label: string;
  field: string;
}

interface RatingGridProps {
  items: RatingItem[];
  ratings: { [key: string]: RatingValue | "" };
  onRatingChange: (field: string, value: RatingValue) => void;
  showLabel?: boolean;
}

const ratingOptions: { value: RatingValue; label: string }[] = [
  { value: "excellent", label: "Exc" },
  { value: "very_good", label: "VG" },
  { value: "good", label: "Good" },
  { value: "average", label: "Avg" },
  { value: "dissatisfied", label: "Dis" },
];

const RatingGrid = ({ items, ratings, onRatingChange, showLabel = true }: RatingGridProps) => {
  return (
    <div className="w-full">
      {/* Header Row */}
      <div className="flex items-center mb-4">
        {showLabel && <div className="w-20 shrink-0" />}
        <div className="flex-1 grid grid-cols-5 gap-2">
          {ratingOptions.map((option) => (
            <div key={option.value} className="text-center text-xs font-medium text-muted-foreground">
              {option.label}
            </div>
          ))}
        </div>
      </div>

      {/* Rating Rows */}
      <div className="space-y-3">
        {items.map((item) => (
          <div key={item.field} className="flex items-center">
            {showLabel && (
              <div className="w-20 shrink-0 text-sm font-medium text-foreground pr-3">
                {item.label}
              </div>
            )}
            <div className="flex-1 grid grid-cols-5 gap-2">
              {ratingOptions.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => onRatingChange(item.field, option.value)}
                  className={cn(
                    "aspect-square w-full max-w-[48px] mx-auto rounded-lg border-2 transition-all duration-150 flex items-center justify-center",
                    "hover:scale-105 active:scale-95",
                    ratings[item.field] === option.value
                      ? "border-primary bg-primary/5"
                      : "border-border bg-card hover:border-primary/40"
                  )}
                  aria-label={`${item.label} - ${option.label}`}
                >
                  <div
                    className={cn(
                      "w-3 h-3 rounded-full transition-colors",
                      ratings[item.field] === option.value
                        ? "bg-primary"
                        : "bg-muted-foreground/30"
                    )}
                  />
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default RatingGrid;
