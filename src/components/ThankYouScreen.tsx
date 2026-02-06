import { useTranslation } from "react-i18next";
import { CheckCircle2, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ThankYouScreenProps {
  onNewFeedback: () => void;
}

const ThankYouScreen = ({ onNewFeedback }: ThankYouScreenProps) => {
  const { t } = useTranslation();

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center animate-scale-in">
      <div className="w-20 h-20 rounded-full bg-success/10 flex items-center justify-center mb-6">
        <CheckCircle2 className="w-12 h-12 text-success" />
      </div>

      <h2 className="font-display text-2xl font-semibold text-foreground mb-3">
        {t('thankyou.title')}
      </h2>

      <p className="text-muted-foreground mb-8 max-w-xs">
        {t('thankyou.message')}
      </p>

      <Button onClick={onNewFeedback} variant="outline" className="gap-2">
        <Plus className="w-4 h-4" />
        {t('thankyou.button')}
      </Button>
    </div>
  );
};

export default ThankYouScreen;
