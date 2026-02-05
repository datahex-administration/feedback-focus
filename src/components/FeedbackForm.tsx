import { useState } from "react";
import { format } from "date-fns";
import { Calendar as CalendarIcon, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import RatingGrid from "./RatingGrid";
import { cn } from "@/lib/utils";

interface FeedbackFormProps {
  onSubmitSuccess: () => void;
}

type RatingValue = "excellent" | "very_good" | "good" | "average" | "dissatisfied";

type Ratings = {
  [key: string]: RatingValue | "";
};

const FeedbackForm = ({ onSubmitSuccess }: FeedbackFormProps) => {
  const [date, setDate] = useState<Date>(new Date());
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

  const handleRatingChange = (field: keyof Ratings, value: RatingValue) => {
    setRatings((prev) => ({ ...prev, [field]: value }));
  };

  const validateForm = (): boolean => {
    if (!mealTime) {
      toast.error("Please select a meal time");
      return false;
    }
    
    const requiredRatings = [
      "food_temperature", "food_taste", "food_aroma", "menu_variety",
      "staff_attitude", "service_time", "cleanliness", "overall_experience"
    ];
    
    for (const field of requiredRatings) {
      if (!ratings[field]) {
        toast.error("Please complete all ratings");
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
      const { error } = await supabase.from("feedback").insert({
        feedback_date: format(date, "yyyy-MM-dd"),
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
      });

      if (error) throw error;
      
      toast.success("Thank you for your feedback!");
      onSubmitSuccess();
    } catch (error) {
      console.error("Error submitting feedback:", error);
      toast.error("Failed to submit feedback. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 animate-fade-in">
      {/* Welcome Header */}
      <div className="text-center mb-8">
        <h2 className="font-display text-2xl font-semibold text-foreground mb-2">
          Welcome to Your Valued Feedback
        </h2>
        <p className="text-muted-foreground text-sm">
          Help us serve you better
        </p>
      </div>

      {/* Date Selection */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-medium">Date</CardTitle>
        </CardHeader>
        <CardContent>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-full justify-start text-left font-normal",
                  !date && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {date ? format(date, "PPP") : <span>Pick a date</span>}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={date}
                onSelect={(d) => d && setDate(d)}
                initialFocus
              />
            </PopoverContent>
          </Popover>
        </CardContent>
      </Card>

      {/* Meal Time */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-medium">
            Meal Time <span className="text-destructive">*</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <RadioGroup value={mealTime} onValueChange={setMealTime} className="space-y-3">
            {["breakfast", "lunch", "dinner"].map((meal) => (
              <div key={meal} className="flex items-center space-x-3">
                <RadioGroupItem value={meal} id={meal} />
                <Label htmlFor={meal} className="capitalize cursor-pointer">
                  {meal}
                </Label>
              </div>
            ))}
          </RadioGroup>
        </CardContent>
      </Card>

      {/* Food & Menu Ratings */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-medium">Food & Menu Ratings</CardTitle>
          <p className="text-xs text-muted-foreground">Select one option each</p>
        </CardHeader>
        <CardContent>
          <RatingGrid
            items={[
              { label: "Food Temperature", field: "food_temperature" },
              { label: "Food Taste", field: "food_taste" },
              { label: "Food Aroma", field: "food_aroma" },
              { label: "Menu Variety", field: "menu_variety" },
            ]}
            ratings={ratings}
            onRatingChange={handleRatingChange}
          />
        </CardContent>
      </Card>

      {/* Service Ratings */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-medium">Service Ratings</CardTitle>
          <p className="text-xs text-muted-foreground">Select one option each</p>
        </CardHeader>
        <CardContent>
          <RatingGrid
            items={[
              { label: "Staff Attitude", field: "staff_attitude" },
              { label: "Service Time", field: "service_time" },
              { label: "Cleanliness", field: "cleanliness" },
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
            Overall Experience <span className="text-destructive">*</span>
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
          <CardTitle className="text-base font-medium">Your Suggestions</CardTitle>
        </CardHeader>
        <CardContent>
          <Textarea
            placeholder="Share your thoughts with us..."
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
          "Submitting..."
        ) : (
          <>
            <Send className="mr-2 h-4 w-4" />
            Submit Feedback
          </>
        )}
      </Button>
    </form>
  );
};

export default FeedbackForm;
