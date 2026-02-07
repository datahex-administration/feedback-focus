export type QuestionnaireType = "food" | "toilet" | "laundry";

export interface RatingScaleOption {
  value: string;
  labelKey: string;
  score: number;
}

export interface FieldOption {
  value: string;
  labelKey: string;
}

export interface QuestionField {
  id: string;
  labelKey: string;
  type: "rating_grid" | "radio" | "textarea" | "meal_time";
  required?: boolean;
  options?: FieldOption[];
  showLabel?: boolean;
}

export interface QuestionSection {
  id: string;
  titleKey: string;
  descriptionKey?: string;
  fields: QuestionField[];
}

export interface QuestionnaireConfig {
  id: QuestionnaireType;
  nameKey: string;
  welcomeKey: string;
  subtitleKey: string;
  ratingScale: RatingScaleOption[];
  sections: QuestionSection[];
  overallRatingField: string;
  radioFields: string[];
  suggestionsField: string;
  categoryFields?: string[];
  hasMealTime?: boolean;
}

/* ── Rating Scales ── */

const FOOD_RATING_SCALE: RatingScaleOption[] = [
  { value: "excellent", labelKey: "ratings.excellent", score: 5 },
  { value: "very_good", labelKey: "ratings.very_good", score: 4 },
  { value: "good", labelKey: "ratings.good", score: 3 },
  { value: "average", labelKey: "ratings.average", score: 2 },
  { value: "dissatisfied", labelKey: "ratings.dissatisfied", score: 1 },
];

const FIVE_STAR_RATING_SCALE: RatingScaleOption[] = [
  { value: "excellent", labelKey: "ratings.excellent", score: 5 },
  { value: "good", labelKey: "ratings.good", score: 4 },
  { value: "average", labelKey: "ratings.average", score: 3 },
  { value: "poor", labelKey: "ratings.poor", score: 2 },
  { value: "very_poor", labelKey: "ratings.very_poor", score: 1 },
];

/* ── Common Options ── */

const YES_NO: FieldOption[] = [
  { value: "yes", labelKey: "common.yes" },
  { value: "no", labelKey: "common.no" },
];

const YES_NO_NOTSURE: FieldOption[] = [
  { value: "yes", labelKey: "common.yes" },
  { value: "no", labelKey: "common.no" },
  { value: "not_sure", labelKey: "common.notSure" },
];

const YES_NO_NA: FieldOption[] = [
  { value: "yes", labelKey: "common.yes" },
  { value: "no", labelKey: "common.no" },
  { value: "not_applicable", labelKey: "common.notApplicable" },
];

/* ═══════════════════════════════════════════════════════════
   QUESTIONNAIRE CONFIGS
   ═══════════════════════════════════════════════════════════ */

export const QUESTIONNAIRES: Record<QuestionnaireType, QuestionnaireConfig> = {
  /* ── Food Feedback ── */
  food: {
    id: "food",
    nameKey: "questionnaire.food.name",
    welcomeKey: "feedback.welcome",
    subtitleKey: "feedback.subtitle",
    ratingScale: FOOD_RATING_SCALE,
    hasMealTime: true,
    sections: [
      {
        id: "meal_time",
        titleKey: "feedback.mealTime",
        fields: [
          { id: "meal_time", labelKey: "feedback.mealTime", type: "meal_time", required: true },
        ],
      },
      {
        id: "food_menu",
        titleKey: "feedback.foodMenuRatings",
        descriptionKey: "feedback.selectOne",
        fields: [
          { id: "food_temperature", labelKey: "feedback.foodTemperature", type: "rating_grid", required: true, showLabel: true },
          { id: "food_taste", labelKey: "feedback.foodTaste", type: "rating_grid", required: true, showLabel: true },
          { id: "food_aroma", labelKey: "feedback.foodAroma", type: "rating_grid", required: true, showLabel: true },
          { id: "menu_variety", labelKey: "feedback.menuVariety", type: "rating_grid", required: true, showLabel: true },
        ],
      },
      {
        id: "service",
        titleKey: "feedback.serviceRatings",
        descriptionKey: "feedback.selectOne",
        fields: [
          { id: "staff_attitude", labelKey: "feedback.staffAttitude", type: "rating_grid", required: true, showLabel: true },
          { id: "service_time", labelKey: "feedback.serviceTime", type: "rating_grid", required: true, showLabel: true },
          { id: "cleanliness", labelKey: "feedback.cleanliness", type: "rating_grid", required: true, showLabel: true },
        ],
      },
      {
        id: "overall",
        titleKey: "feedback.overallExperience",
        fields: [
          { id: "overall_experience", labelKey: "", type: "rating_grid", required: true, showLabel: false },
        ],
      },
      {
        id: "suggestions",
        titleKey: "feedback.suggestions",
        fields: [
          { id: "suggestions", labelKey: "feedback.suggestionsPlaceholder", type: "textarea" },
        ],
      },
    ],
    overallRatingField: "overall_experience",
    categoryFields: [
      "food_temperature", "food_taste", "food_aroma", "menu_variety",
      "staff_attitude", "service_time", "cleanliness",
    ],
    radioFields: [],
    suggestionsField: "suggestions",
  },

  /* ── Toilet Cleaning Feedback ── */
  toilet: {
    id: "toilet",
    nameKey: "questionnaire.toilet.name",
    welcomeKey: "questionnaire.toilet.welcome",
    subtitleKey: "questionnaire.toilet.subtitle",
    ratingScale: FIVE_STAR_RATING_SCALE,
    hasMealTime: false,
    sections: [
      {
        id: "overall_rating",
        titleKey: "questionnaire.toilet.overallCleanliness",
        fields: [
          { id: "toilet_overall_cleanliness", labelKey: "", type: "rating_grid", required: true, showLabel: false },
        ],
      },
      {
        id: "cleanliness_questions",
        titleKey: "questionnaire.toilet.cleanlinessQuestions",
        fields: [
          { id: "toilet_clean_at_use", labelKey: "questionnaire.toilet.cleanAtUse", type: "radio", required: true, options: YES_NO },
          { id: "toilet_supplies_available", labelKey: "questionnaire.toilet.suppliesAvailable", type: "radio", required: true, options: YES_NO },
          { id: "toilet_unpleasant_smell", labelKey: "questionnaire.toilet.unpleasantSmell", type: "radio", required: true, options: YES_NO },
        ],
      },
      {
        id: "area_cleaning",
        titleKey: "questionnaire.toilet.areaNeedsCleaningTitle",
        fields: [
          {
            id: "toilet_area_needs_cleaning",
            labelKey: "questionnaire.toilet.areaNeedsCleaning",
            type: "radio",
            required: true,
            options: [
              { value: "toilet_seat", labelKey: "questionnaire.toilet.toiletSeat" },
              { value: "floor", labelKey: "questionnaire.toilet.floor" },
              { value: "wash_basin", labelKey: "questionnaire.toilet.washBasin" },
              { value: "none", labelKey: "questionnaire.toilet.noneOption" },
            ],
          },
        ],
      },
      {
        id: "frequency",
        titleKey: "questionnaire.toilet.cleaningFrequency",
        fields: [
          { id: "toilet_cleaned_frequently", labelKey: "questionnaire.toilet.cleanedFrequently", type: "radio", required: true, options: YES_NO_NOTSURE },
        ],
      },
      {
        id: "suggestions",
        titleKey: "feedback.suggestions",
        fields: [
          { id: "toilet_suggestions", labelKey: "questionnaire.toilet.suggestionsPlaceholder", type: "textarea" },
        ],
      },
    ],
    overallRatingField: "toilet_overall_cleanliness",
    categoryFields: [],
    radioFields: [
      "toilet_clean_at_use", "toilet_supplies_available", "toilet_unpleasant_smell",
      "toilet_area_needs_cleaning", "toilet_cleaned_frequently",
    ],
    suggestionsField: "toilet_suggestions",
  },

  /* ── Laundry Service Feedback ── */
  laundry: {
    id: "laundry",
    nameKey: "questionnaire.laundry.name",
    welcomeKey: "questionnaire.laundry.welcome",
    subtitleKey: "questionnaire.laundry.subtitle",
    ratingScale: FIVE_STAR_RATING_SCALE,
    hasMealTime: false,
    sections: [
      {
        id: "overall_rating",
        titleKey: "questionnaire.laundry.overallService",
        fields: [
          { id: "laundry_overall_service", labelKey: "", type: "rating_grid", required: true, showLabel: false },
        ],
      },
      {
        id: "service_questions",
        titleKey: "questionnaire.laundry.serviceQuestions",
        fields: [
          { id: "laundry_properly_cleaned", labelKey: "questionnaire.laundry.properlyCleaned", type: "radio", required: true, options: YES_NO },
          { id: "laundry_returned_on_time", labelKey: "questionnaire.laundry.returnedOnTime", type: "radio", required: true, options: YES_NO },
          { id: "laundry_fresh_no_odor", labelKey: "questionnaire.laundry.freshNoOdor", type: "radio", required: true, options: YES_NO },
        ],
      },
      {
        id: "ironing",
        titleKey: "questionnaire.laundry.ironingFolding",
        fields: [
          { id: "laundry_ironing_folding", labelKey: "questionnaire.laundry.ironingFoldingDone", type: "radio", required: true, options: YES_NO_NA },
        ],
      },
      {
        id: "issues",
        titleKey: "questionnaire.laundry.issuesTitle",
        fields: [
          {
            id: "laundry_issues",
            labelKey: "questionnaire.laundry.issuesNoticed",
            type: "radio",
            required: true,
            options: [
              { value: "clothes_damaged", labelKey: "questionnaire.laundry.clothesDamaged" },
              { value: "stains_not_removed", labelKey: "questionnaire.laundry.stainsNotRemoved" },
              { value: "missing_items", labelKey: "questionnaire.laundry.missingItems" },
              { value: "no_issues", labelKey: "questionnaire.laundry.noIssues" },
            ],
          },
        ],
      },
      {
        id: "suggestions",
        titleKey: "feedback.suggestions",
        fields: [
          { id: "laundry_suggestions", labelKey: "questionnaire.laundry.suggestionsPlaceholder", type: "textarea" },
        ],
      },
    ],
    overallRatingField: "laundry_overall_service",
    categoryFields: [],
    radioFields: [
      "laundry_properly_cleaned", "laundry_returned_on_time", "laundry_fresh_no_odor",
      "laundry_ironing_folding", "laundry_issues",
    ],
    suggestionsField: "laundry_suggestions",
  },
};

export const getQuestionnaire = (type: QuestionnaireType): QuestionnaireConfig => {
  return QUESTIONNAIRES[type] || QUESTIONNAIRES.food;
};

export const QUESTIONNAIRE_OPTIONS: { value: QuestionnaireType; labelKey: string }[] = [
  { value: "food", labelKey: "questionnaire.food.name" },
  { value: "toilet", labelKey: "questionnaire.toilet.name" },
  { value: "laundry", labelKey: "questionnaire.laundry.name" },
];

/** Get all non-textarea, non-meal_time field IDs for a questionnaire */
export const getAllFields = (type: QuestionnaireType): string[] => {
  const config = getQuestionnaire(type);
  const fields: string[] = [];
  config.sections.forEach(section => {
    section.fields.forEach(field => {
      if (field.type !== "textarea" && field.type !== "meal_time") {
        fields.push(field.id);
      }
    });
  });
  return fields;
};

/** Get the rating scale values for a questionnaire type */
export const getRatingValues = (type: QuestionnaireType): string[] => {
  return getQuestionnaire(type).ratingScale.map(r => r.value);
};

/** Get the score map for a questionnaire's rating scale */
export const getRatingScoreMap = (type: QuestionnaireType): Record<string, number> => {
  const config = getQuestionnaire(type);
  return Object.fromEntries(config.ratingScale.map(r => [r.value, r.score]));
};
