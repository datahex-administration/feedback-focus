import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Settings, AlertTriangle } from "lucide-react";
import FeedbackForm from "@/components/FeedbackForm";
import ThankYouScreen from "@/components/ThankYouScreen";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import { Card, CardContent } from "@/components/ui/card";

const API_URL = "http://localhost:3001";

interface Place {
  _id: string;
  name: string;
  name_ar: string;
  slug: string;
  address?: string;
  address_ar?: string;
  active: boolean;
}

const FeedbackPage = () => {
  const { slug } = useParams<{ slug: string }>();
  const { t, i18n } = useTranslation();
  const isArabic = i18n.language === "ar";

  const [place, setPlace] = useState<Place | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitted, setIsSubmitted] = useState(false);

  useEffect(() => {
    const fetchPlace = async () => {
      try {
        const res = await fetch(`${API_URL}/api/places/slug/${slug}`);
        if (!res.ok) {
          setError("not_found");
          return;
        }
        const data = await res.json();
        if (!data.active) {
          setError("inactive");
          return;
        }
        setPlace(data);
      } catch {
        setError("network");
      } finally {
        setIsLoading(false);
      }
    };
    fetchPlace();
  }, [slug]);

  const placeName = place ? (isArabic && place.name_ar ? place.name_ar : place.name) : "";
  const placeAddress = place ? (isArabic && place.address_ar ? place.address_ar : place.address) : "";

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="max-w-sm w-full">
          <CardContent className="p-8 text-center space-y-4">
            <AlertTriangle className="w-12 h-12 text-muted-foreground mx-auto" />
            <h2 className="text-lg font-semibold text-foreground">
              {error === "not_found" ? t("place.notFound") : error === "inactive" ? t("place.inactive") : t("place.networkError")}
            </h2>
            <p className="text-sm text-muted-foreground">
              {error === "not_found"
                ? t("place.notFoundDesc")
                : error === "inactive"
                ? t("place.inactiveDesc")
                : t("place.networkErrorDesc")}
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-10 bg-card/80 backdrop-blur-md border-b border-border">
        <div className="container max-w-lg mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src="/logo.png" alt="Food City" className="h-10 w-auto" />
            <div>
              <h1 className="font-display text-base font-semibold text-foreground leading-tight">
                {placeName}
              </h1>
              {placeAddress && (
                <p className="text-[11px] text-muted-foreground">{placeAddress}</p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <LanguageSwitcher />
            <Link
              to="/admin"
              className="p-2 rounded-full hover:bg-muted transition-colors"
              aria-label="Admin Login"
            >
              <Settings className="w-5 h-5 text-muted-foreground" />
            </Link>
          </div>
        </div>
      </header>

      <main className="container max-w-lg mx-auto px-4 py-6">
        {isSubmitted ? (
          <ThankYouScreen onNewFeedback={() => setIsSubmitted(false)} />
        ) : (
          <FeedbackForm
            onSubmitSuccess={() => setIsSubmitted(true)}
            placeSlug={place?.slug}
            placeName={place?.name}
          />
        )}
      </main>
    </div>
  );
};

export default FeedbackPage;
