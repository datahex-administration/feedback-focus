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

const ratingOptions: { value: RatingValue; label: string; shortLabel: string }[] = [
  { value: "excellent", label: "Excellent", shortLabel: "Exc" },
  { value: "very_good", label: "Very Good", shortLabel: "VG" },
  { value: "good", label: "Good", shortLabel: "Good" },
  { value: "average", label: "Average", shortLabel: "Avg" },
  { value: "dissatisfied", label: "Dissatisfied", shortLabel: "Dis" },
];

const RatingGrid = ({ items, ratings, onRatingChange, showLabel = true }: RatingGridProps) => {
  return (
    <div className="space-y-4">
      {/* Header Row */}
      <div className="grid grid-cols-6 gap-1 text-xs text-center">
        <div className="col-span-1"></div>
        {ratingOptions.map((option) => (
          <div key={option.value} className="text-muted-foreground font-medium truncate">
            <span className="hidden sm:inline">{option.label}</span>
            <span className="sm:hidden">{option.shortLabel}</span>
          </div>
        ))}
      </div>

      {/* Rating Rows */}
      {items.map((item) => (
        <div key={item.field} className="grid grid-cols-6 gap-1 items-center">
          {showLabel && (
            <div className="col-span-1 text-sm font-medium text-foreground pr-2">
              {item.label}
            </div>
          )}
          {!showLabel && <div className="col-span-1"></div>}
          {ratingOptions.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => onRatingChange(item.field, option.value)}
              className={cn(
                "h-10 w-full rounded-md border-2 transition-all duration-200",
                "hover:scale-105 active:scale-95",
                ratings[item.field] === option.value
                  ? "border-primary bg-primary/10 shadow-sm"
                  : "border-border bg-card hover:border-primary/50"
              )}
              aria-label={`${item.label} - ${option.label}`}
            >
              <div
                className={cn(
                  "w-3 h-3 rounded-full mx-auto transition-colors",
                  ratings[item.field] === option.value
                    ? "bg-primary"
                    : "bg-muted"
                )}
              />
            </button>
          ))}
        </div>
      ))}
    </div>
  );
};

export default RatingGrid;
