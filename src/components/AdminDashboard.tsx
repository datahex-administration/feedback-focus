import { useState, useEffect } from "react";
import { format } from "date-fns";
import { LogOut, RefreshCw, ChevronDown, ChevronUp } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Feedback {
  id: string;
  created_at: string;
  feedback_date: string;
  meal_time: string;
  food_temperature: string;
  food_taste: string;
  food_aroma: string;
  menu_variety: string;
  staff_attitude: string;
  service_time: string;
  cleanliness: string;
  overall_experience: string;
  suggestions: string | null;
}

interface AdminDashboardProps {
  onLogout: () => void;
}

const ratingColors: Record<string, string> = {
  excellent: "bg-rating-excellent text-white",
  very_good: "bg-rating-veryGood text-white",
  good: "bg-rating-good text-white",
  average: "bg-rating-average text-white",
  dissatisfied: "bg-rating-dissatisfied text-white",
};

const formatRating = (rating: string) => {
  return rating.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase());
};

const AdminDashboard = ({ onLogout }: AdminDashboardProps) => {
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const fetchFeedbacks = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from("feedback")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setFeedbacks(data || []);
    } catch (error) {
      console.error("Error fetching feedbacks:", error);
      toast.error("Failed to load feedbacks");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchFeedbacks();
  }, []);

  const toggleExpand = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
  };

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-card/80 backdrop-blur-md border-b border-border">
        <div className="container max-w-2xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link to="/" className="font-display text-xl font-semibold text-foreground">
            Admin Dashboard
          </Link>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={fetchFeedbacks}
              disabled={isLoading}
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`} />
            </Button>
            <Button variant="ghost" size="icon" onClick={onLogout}>
              <LogOut className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container max-w-2xl mx-auto px-4 py-6">
        {/* Stats */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-foreground">{feedbacks.length}</div>
              <div className="text-xs text-muted-foreground">Total</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-foreground">
                {feedbacks.filter((f) => f.overall_experience === "excellent").length}
              </div>
              <div className="text-xs text-muted-foreground">Excellent</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-foreground">
                {feedbacks.filter((f) => f.overall_experience === "dissatisfied").length}
              </div>
              <div className="text-xs text-muted-foreground">Dissatisfied</div>
            </CardContent>
          </Card>
        </div>

        {/* Feedback List */}
        <div className="space-y-4">
          {isLoading ? (
            <div className="text-center py-12 text-muted-foreground">
              Loading feedbacks...
            </div>
          ) : feedbacks.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              No feedbacks yet
            </div>
          ) : (
            feedbacks.map((feedback) => (
              <Card key={feedback.id} className="overflow-hidden animate-fade-in">
                <CardHeader
                  className="cursor-pointer hover:bg-muted/50 transition-colors"
                  onClick={() => toggleExpand(feedback.id)}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-base font-medium capitalize">
                        {feedback.meal_time} Feedback
                      </CardTitle>
                      <p className="text-xs text-muted-foreground mt-1">
                        {format(new Date(feedback.feedback_date), "PPP")}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className={ratingColors[feedback.overall_experience]}>
                        {formatRating(feedback.overall_experience)}
                      </Badge>
                      {expandedId === feedback.id ? (
                        <ChevronUp className="w-4 h-4 text-muted-foreground" />
                      ) : (
                        <ChevronDown className="w-4 h-4 text-muted-foreground" />
                      )}
                    </div>
                  </div>
                </CardHeader>
                
                {expandedId === feedback.id && (
                  <CardContent className="border-t border-border pt-4 space-y-4">
                    {/* Food Ratings */}
                    <div>
                      <h4 className="text-sm font-medium mb-2">Food & Menu</h4>
                      <div className="grid grid-cols-2 gap-2">
                        <RatingRow label="Temperature" value={feedback.food_temperature} />
                        <RatingRow label="Taste" value={feedback.food_taste} />
                        <RatingRow label="Aroma" value={feedback.food_aroma} />
                        <RatingRow label="Variety" value={feedback.menu_variety} />
                      </div>
                    </div>

                    {/* Service Ratings */}
                    <div>
                      <h4 className="text-sm font-medium mb-2">Service</h4>
                      <div className="grid grid-cols-2 gap-2">
                        <RatingRow label="Staff" value={feedback.staff_attitude} />
                        <RatingRow label="Time" value={feedback.service_time} />
                        <RatingRow label="Clean" value={feedback.cleanliness} />
                      </div>
                    </div>

                    {/* Suggestions */}
                    {feedback.suggestions && (
                      <div>
                        <h4 className="text-sm font-medium mb-2">Suggestions</h4>
                        <p className="text-sm text-muted-foreground bg-muted p-3 rounded-md">
                          {feedback.suggestions}
                        </p>
                      </div>
                    )}
                  </CardContent>
                )}
              </Card>
            ))
          )}
        </div>
      </main>
    </div>
  );
};

const RatingRow = ({ label, value }: { label: string; value: string }) => (
  <div className="flex items-center justify-between text-sm">
    <span className="text-muted-foreground">{label}</span>
    <Badge variant="outline" className="text-xs">
      {formatRating(value)}
    </Badge>
  </div>
);

export default AdminDashboard;
