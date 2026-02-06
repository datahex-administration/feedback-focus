import { useState } from "react";
import { useTranslation } from "react-i18next";
import { format } from "date-fns";
import { Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import RatingGrid from "./RatingGrid";
import { cn } from "@/lib/utils";

interface FeedbackFormProps {
  onSubmitSuccess: () => void;
  placeSlug?: string;
  placeName?: string;
}

type RatingValue = "excellent" | "very_good" | "good" | "average" | "dissatisfied";

type Ratings = {
  [key: string]: RatingValue | "";
};

const FeedbackForm = ({ onSubmitSuccess, placeSlug, placeName }: FeedbackFormProps) => {
  const { t } = useTranslation();
  const [mealTime, setMealTime] = useState<string>("");
  const [ratings, setRatings] = useState<Ratings>({
    food_temperature: "",
    food_taste: "",
    food_aroma: "",
    menu_variety: "",
    staff_attitude: "",
    service_time: "",
    cleanliness: "",
    overall_experience: "",
  });
  const [suggestions, setSuggestions] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const mealOptions = [
    { value: "breakfast", label: t('feedback.breakfast') },
    { value: "lunch", label: t('feedback.lunch') },
    { value: "dinner", label: t('feedback.dinner') },
  ];

  const handleRatingChange = (field: keyof Ratings, value: RatingValue) => {
    setRatings((prev) => ({ ...prev, [field]: value }));
  };

  const validateForm = (): boolean => {
    if (!mealTime) {
      toast.error(t('toast.selectMealTime'));
      return false;
    }

    const requiredRatings = [
      "food_temperature", "food_taste", "food_aroma", "menu_variety",
      "staff_attitude", "service_time", "cleanliness", "overall_experience"
    ];

    for (const field of requiredRatings) {
      if (!ratings[field]) {
        toast.error(t('toast.completeRatings'));
        return false;
      }
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    setIsSubmitting(true);

    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/api/feedback`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          feedback_date: format(new Date(), "yyyy-MM-dd"),
          meal_time: mealTime,
          food_temperature: ratings.food_temperature,
          food_taste: ratings.food_taste,
          food_aroma: ratings.food_aroma,
          menu_variety: ratings.menu_variety,
          staff_attitude: ratings.staff_attitude,
          service_time: ratings.service_time,
          cleanliness: ratings.cleanliness,
          overall_experience: ratings.overall_experience,
          suggestions: suggestions.trim() || null,
          place_slug: placeSlug || null,
          place_name: placeName || null,
        }),
      });

      if (!response.ok) throw new Error('Failed to submit feedback');

      toast.success(t('toast.thankYou'));
      onSubmitSuccess();
    } catch (error) {
      console.error("Error submitting feedback:", error);
      toast.error(t('toast.submitError'));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 animate-fade-in">
      {/* Welcome Header */}
      <div className="text-center mb-8">
        <h2 className="font-display text-2xl font-semibold text-foreground mb-2">
          {t('feedback.welcome')}
        </h2>
        <p className="text-muted-foreground text-sm">
          {t('feedback.subtitle')}
        </p>
      </div>

      {/* Meal Time */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-medium">
            {t('feedback.mealTime')} <span className="text-destructive">*</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {mealOptions.map((meal) => (
              <button
                key={meal.value}
                type="button"
                onClick={() => setMealTime(meal.value)}
                className="flex items-center gap-3 w-full"
              >
                <div
                  className={cn(
                    "w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all",
                    mealTime === meal.value
                      ? "border-primary"
                      : "border-muted-foreground/40"
                  )}
                >
                  {mealTime === meal.value && (
                    <div className="w-3 h-3 rounded-full bg-primary" />
                  )}
                </div>
                <Label className="cursor-pointer text-base font-normal">
                  {meal.label}
                </Label>
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Food & Menu Ratings */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-medium">{t('feedback.foodMenuRatings')}</CardTitle>
          <p className="text-xs text-muted-foreground">{t('feedback.selectOne')}</p>
        </CardHeader>
        <CardContent>
          <RatingGrid
            items={[
              { label: t('feedback.foodTemperature'), field: "food_temperature" },
              { label: t('feedback.foodTaste'), field: "food_taste" },
              { label: t('feedback.foodAroma'), field: "food_aroma" },
              { label: t('feedback.menuVariety'), field: "menu_variety" },
            ]}
            ratings={ratings}
            onRatingChange={handleRatingChange}
          />
        </CardContent>
      </Card>

      {/* Service Ratings */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-medium">{t('feedback.serviceRatings')}</CardTitle>
          <p className="text-xs text-muted-foreground">{t('feedback.selectOne')}</p>
        </CardHeader>
        <CardContent>
          <RatingGrid
            items={[
              { label: t('feedback.staffAttitude'), field: "staff_attitude" },
              { label: t('feedback.serviceTime'), field: "service_time" },
              { label: t('feedback.cleanliness'), field: "cleanliness" },
            ]}
            ratings={ratings}
            onRatingChange={handleRatingChange}
          />
        </CardContent>
      </Card>

      {/* Overall Experience */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-medium">
            {t('feedback.overallExperience')} <span className="text-destructive">*</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <RatingGrid
            items={[{ label: "", field: "overall_experience" }]}
            ratings={ratings}
            onRatingChange={handleRatingChange}
            showLabel={false}
          />
        </CardContent>
      </Card>

      {/* Suggestions */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-medium">{t('feedback.suggestions')}</CardTitle>
        </CardHeader>
        <CardContent>
          <Textarea
            placeholder={t('feedback.suggestionsPlaceholder')}
            value={suggestions}
            onChange={(e) => setSuggestions(e.target.value)}
            className="min-h-[100px] resize-none"
          />
        </CardContent>
      </Card>

      {/* Submit Button */}
      <Button
        type="submit"
        className="w-full h-12 text-base font-medium"
        disabled={isSubmitting}
      >
        {isSubmitting ? (
          t('feedback.submitting')
        ) : (
          <>
            <Send className="w-4 h-4 ltr:mr-2 rtl:ml-2" />
            {t('feedback.submit')}
          </>
        )}
      </Button>
    </form>
  );
};

export default FeedbackForm;
