import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";

interface RatingScaleOption {
  value: string;
  labelKey: string;
}

interface RatingItem {
  label: string;
  field: string;
}

interface RatingGridProps {
  items: RatingItem[];
  ratings: { [key: string]: string };
  onRatingChange: (field: string, value: string) => void;
  showLabel?: boolean;
  ratingScale?: RatingScaleOption[];
}

const defaultRatingKeys: RatingScaleOption[] = [
  { value: "excellent", labelKey: "ratings.excellent" },
  { value: "very_good", labelKey: "ratings.very_good" },
  { value: "good", labelKey: "ratings.good" },
  { value: "average", labelKey: "ratings.average" },
  { value: "dissatisfied", labelKey: "ratings.dissatisfied" },
];

const RatingGrid = ({ items, ratings, onRatingChange, showLabel = true, ratingScale }: RatingGridProps) => {
  const { t } = useTranslation();
  const ratingKeys = ratingScale || defaultRatingKeys;

  return (
    <div className="w-full">
      {/* Header Row */}
      <div className="flex items-center mb-4">
        {showLabel && <div className="w-20 shrink-0" />}
        <div className="flex-1 grid grid-cols-5 gap-2">
          {ratingKeys.map((option) => (
            <div key={option.value} className="text-center text-[10px] font-medium text-muted-foreground leading-tight">
              {t(option.labelKey)}
            </div>
          ))}
        </div>
      </div>

      {/* Rating Rows */}
      <div className="space-y-3">
        {items.map((item) => (
          <div key={item.field} className="flex items-center">
            {showLabel && (
              <div className="w-20 shrink-0 text-sm font-medium text-foreground ltr:pr-3 rtl:pl-3">
                {item.label}
              </div>
            )}
            <div className="flex-1 grid grid-cols-5 gap-2">
              {ratingKeys.map((option) => (
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
                  aria-label={`${item.label} - ${t(option.labelKey)}`}
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
