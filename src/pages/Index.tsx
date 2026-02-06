import { useState } from "react";
import { useTranslation } from "react-i18next";
import FeedbackForm from "@/components/FeedbackForm";
import ThankYouScreen from "@/components/ThankYouScreen";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import { Link } from "react-router-dom";
import { Settings } from "lucide-react";

const Index = () => {
  const [isSubmitted, setIsSubmitted] = useState(false);
  const { t } = useTranslation();

  const handleSubmitSuccess = () => {
    setIsSubmitted(true);
  };

  const handleNewFeedback = () => {
    setIsSubmitted(false);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-card/80 backdrop-blur-md border-b border-border">
        <div className="container max-w-lg mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src="/logo.png" alt="Food City" className="h-10 w-auto" />
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

      {/* Main Content */}
      <main className="container max-w-lg mx-auto px-4 py-6">
        {isSubmitted ? (
          <ThankYouScreen onNewFeedback={handleNewFeedback} />
        ) : (
          <FeedbackForm onSubmitSuccess={handleSubmitSuccess} />
        )}
      </main>
    </div>
  );
};

export default Index;
