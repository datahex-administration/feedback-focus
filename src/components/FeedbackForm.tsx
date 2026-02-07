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
import {
  type QuestionnaireType,
  type QuestionField,
  type QuestionSection,
  getQuestionnaire,
} from "@/lib/questionnaires";

interface FeedbackFormProps {
  onSubmitSuccess: () => void;
  placeSlug?: string;
  placeName?: string;
  questionnaireType?: QuestionnaireType;
}

const FeedbackForm = ({
  onSubmitSuccess,
  placeSlug,
  placeName,
  questionnaireType = "food",
}: FeedbackFormProps) => {
  const { t } = useTranslation();
  const config = getQuestionnaire(questionnaireType);

  /* Build initial values from config */
  const buildInitialValues = (): Record<string, string> => {
    const initial: Record<string, string> = {};
    config.sections.forEach((section) => {
      section.fields.forEach((field) => {
        initial[field.id] = "";
      });
    });
    return initial;
  };

  const [values, setValues] = useState<Record<string, string>>(buildInitialValues);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleValueChange = (fieldId: string, value: string) => {
    setValues((prev) => ({ ...prev, [fieldId]: value }));
  };

  const mealOptions = [
    { value: "breakfast", label: t("feedback.breakfast") },
    { value: "lunch", label: t("feedback.lunch") },
    { value: "dinner", label: t("feedback.dinner") },
  ];

  const validateForm = (): boolean => {
    for (const section of config.sections) {
      for (const field of section.fields) {
        if (field.required && !values[field.id]) {
          if (field.type === "meal_time") {
            toast.error(t("toast.selectMealTime"));
          } else {
            toast.error(t("toast.completeAllFields"));
          }
          return false;
        }
      }
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsSubmitting(true);
    try {
      /* Build payload: include only non-empty values */
      const payload: Record<string, unknown> = {
        feedback_date: format(new Date(), "yyyy-MM-dd"),
        place_slug: placeSlug || null,
        place_name: placeName || null,
        questionnaire_type: questionnaireType,
      };

      config.sections.forEach((section) => {
        section.fields.forEach((field) => {
          if (field.type === "textarea") {
            const v = (values[field.id] || "").trim();
            payload[field.id] = v || null;
          } else {
            payload[field.id] = values[field.id] || null;
          }
        });
      });

      const response = await fetch(
        `${import.meta.env.VITE_API_URL || "http://localhost:3001"}/api/feedback`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      );

      if (!response.ok) throw new Error("Failed to submit feedback");

      toast.success(t("toast.thankYou"));
      onSubmitSuccess();
    } catch (error) {
      console.error("Error submitting feedback:", error);
      toast.error(t("toast.submitError"));
    } finally {
      setIsSubmitting(false);
    }
  };

  /* ── Field Renderers ── */

  const renderMealTimeField = () => (
    <div className="space-y-3">
      {mealOptions.map((meal) => (
        <button
          key={meal.value}
          type="button"
          onClick={() => handleValueChange("meal_time", meal.value)}
          className="flex items-center gap-3 w-full"
        >
          <div
            className={cn(
              "w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all",
              values.meal_time === meal.value
                ? "border-primary"
                : "border-muted-foreground/40"
            )}
          >
            {values.meal_time === meal.value && (
              <div className="w-3 h-3 rounded-full bg-primary" />
            )}
          </div>
          <Label className="cursor-pointer text-base font-normal">{meal.label}</Label>
        </button>
      ))}
    </div>
  );

  const renderRadioField = (field: QuestionField) => (
    <div className="space-y-2">
      {field.labelKey && (
        <Label className="text-sm font-medium">
          {t(field.labelKey)} {field.required && <span className="text-destructive">*</span>}
        </Label>
      )}
      <div className="space-y-2 pt-1">
        {(field.options || []).map((option) => (
          <button
            key={option.value}
            type="button"
            onClick={() => handleValueChange(field.id, option.value)}
            className="flex items-center gap-3 w-full"
          >
            <div
              className={cn(
                "w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all",
                values[field.id] === option.value
                  ? "border-primary"
                  : "border-muted-foreground/40"
              )}
            >
              {values[field.id] === option.value && (
                <div className="w-2.5 h-2.5 rounded-full bg-primary" />
              )}
            </div>
            <Label className="cursor-pointer text-sm font-normal">{t(option.labelKey)}</Label>
          </button>
        ))}
      </div>
    </div>
  );

  const renderRatingGridFields = (fields: QuestionField[]) => {
    const ratingScaleForGrid = config.ratingScale.map((r) => ({
      value: r.value,
      labelKey: r.labelKey,
    }));

    const showLabel = fields.length === 1 ? (fields[0].showLabel ?? false) : true;

    return (
      <RatingGrid
        items={fields.map((f) => ({ label: t(f.labelKey), field: f.id }))}
        ratings={values}
        onRatingChange={handleValueChange}
        showLabel={showLabel}
        ratingScale={ratingScaleForGrid}
      />
    );
  };

  const renderSection = (section: QuestionSection) => {
    const ratingGridFields = section.fields.filter((f) => f.type === "rating_grid");
    const radioFields = section.fields.filter((f) => f.type === "radio");
    const textareaFields = section.fields.filter((f) => f.type === "textarea");
    const mealTimeFields = section.fields.filter((f) => f.type === "meal_time");

    const hasRequired = section.fields.some((f) => f.required);

    return (
      <Card key={section.id}>
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-medium">
            {t(section.titleKey)} {hasRequired && <span className="text-destructive">*</span>}
          </CardTitle>
          {section.descriptionKey && (
            <p className="text-xs text-muted-foreground">{t(section.descriptionKey)}</p>
          )}
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Meal time */}
          {mealTimeFields.length > 0 && renderMealTimeField()}

          {/* Rating grids (grouped together for header alignment) */}
          {ratingGridFields.length > 0 && renderRatingGridFields(ratingGridFields)}

          {/* Radio fields */}
          {radioFields.map((field) => (
            <div key={field.id}>{renderRadioField(field)}</div>
          ))}

          {/* Textarea fields */}
          {textareaFields.map((field) => (
            <Textarea
              key={field.id}
              placeholder={t(field.labelKey)}
              value={values[field.id] || ""}
              onChange={(e) => handleValueChange(field.id, e.target.value)}
              className="min-h-[100px] resize-none"
            />
          ))}
        </CardContent>
      </Card>
    );
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 animate-fade-in">
      {/* Welcome Header */}
      <div className="text-center mb-8">
        <h2 className="font-display text-2xl font-semibold text-foreground mb-2">
          {t(config.welcomeKey)}
        </h2>
        <p className="text-muted-foreground text-sm">{t(config.subtitleKey)}</p>
      </div>

      {/* Dynamic Sections */}
      {config.sections.map((section) => renderSection(section))}

      {/* Submit Button */}
      <Button type="submit" className="w-full h-12 text-base font-medium" disabled={isSubmitting}>
        {isSubmitting ? (
          t("feedback.submitting")
        ) : (
          <>
            <Send className="w-4 h-4 ltr:mr-2 rtl:ml-2" />
            {t("feedback.submit")}
          </>
        )}
      </Button>
    </form>
  );
};

export default FeedbackForm;
