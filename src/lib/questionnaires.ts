export type QuestionnaireType = "food" | "housekeeping" | "school_canteen";

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
  type: "rating_grid" | "radio" | "textarea" | "meal_time" | "school_select";
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
  hasSchoolSelect?: boolean;
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

  /* ── Housekeeping (Laundry & Toilet Cleaning) Feedback ── */
  housekeeping: {
    id: "housekeeping",
    nameKey: "questionnaire.housekeeping.name",
    welcomeKey: "questionnaire.housekeeping.welcome",
    subtitleKey: "questionnaire.housekeeping.subtitle",
    ratingScale: FIVE_STAR_RATING_SCALE,
    hasMealTime: false,
    sections: [
      {
        id: "overall_rating",
        titleKey: "questionnaire.housekeeping.overallRating",
        fields: [
          { id: "housekeeping_overall", labelKey: "", type: "rating_grid", required: true, showLabel: false },
        ],
      },
      {
        id: "toilet_questions",
        titleKey: "questionnaire.housekeeping.toiletSection",
        fields: [
          { id: "toilet_clean_at_use", labelKey: "questionnaire.housekeeping.cleanAtUse", type: "radio", required: true, options: YES_NO },
          { id: "toilet_supplies_available", labelKey: "questionnaire.housekeeping.suppliesAvailable", type: "radio", required: true, options: YES_NO },
          { id: "toilet_unpleasant_smell", labelKey: "questionnaire.housekeeping.unpleasantSmell", type: "radio", required: true, options: YES_NO },
          {
            id: "toilet_area_needs_cleaning",
            labelKey: "questionnaire.housekeeping.areaNeedsCleaning",
            type: "radio",
            required: true,
            options: [
              { value: "toilet_seat", labelKey: "questionnaire.housekeeping.toiletSeat" },
              { value: "floor", labelKey: "questionnaire.housekeeping.floor" },
              { value: "wash_basin", labelKey: "questionnaire.housekeeping.washBasin" },
              { value: "none", labelKey: "questionnaire.housekeeping.noneOption" },
            ],
          },
          { id: "toilet_cleaned_frequently", labelKey: "questionnaire.housekeeping.cleanedFrequently", type: "radio", required: true, options: YES_NO_NOTSURE },
        ],
      },
      {
        id: "laundry_questions",
        titleKey: "questionnaire.housekeeping.laundrySection",
        fields: [
          { id: "laundry_properly_cleaned", labelKey: "questionnaire.housekeeping.properlyCleaned", type: "radio", required: true, options: YES_NO },
          { id: "laundry_returned_on_time", labelKey: "questionnaire.housekeeping.returnedOnTime", type: "radio", required: true, options: YES_NO },
          { id: "laundry_fresh_no_odor", labelKey: "questionnaire.housekeeping.freshNoOdor", type: "radio", required: true, options: YES_NO },
          { id: "laundry_ironing_folding", labelKey: "questionnaire.housekeeping.ironingFoldingDone", type: "radio", required: true, options: YES_NO_NA },
          {
            id: "laundry_issues",
            labelKey: "questionnaire.housekeeping.issuesNoticed",
            type: "radio",
            required: true,
            options: [
              { value: "clothes_damaged", labelKey: "questionnaire.housekeeping.clothesDamaged" },
              { value: "stains_not_removed", labelKey: "questionnaire.housekeeping.stainsNotRemoved" },
              { value: "missing_items", labelKey: "questionnaire.housekeeping.missingItems" },
              { value: "no_issues", labelKey: "questionnaire.housekeeping.noIssues" },
            ],
          },
        ],
      },
      {
        id: "suggestions",
        titleKey: "feedback.suggestions",
        fields: [
          { id: "housekeeping_suggestions", labelKey: "questionnaire.housekeeping.suggestionsPlaceholder", type: "textarea" },
        ],
      },
    ],
    overallRatingField: "housekeeping_overall",
    categoryFields: [],
    radioFields: [
      "toilet_clean_at_use", "toilet_supplies_available", "toilet_unpleasant_smell",
      "toilet_area_needs_cleaning", "toilet_cleaned_frequently",
      "laundry_properly_cleaned", "laundry_returned_on_time", "laundry_fresh_no_odor",
      "laundry_ironing_folding", "laundry_issues",
    ],
    suggestionsField: "housekeeping_suggestions",
  },

  /* ── School Canteen Feedback ── */
  school_canteen: {
    id: "school_canteen",
    nameKey: "questionnaire.school_canteen.name",
    welcomeKey: "questionnaire.school_canteen.welcome",
    subtitleKey: "questionnaire.school_canteen.subtitle",
    ratingScale: FOOD_RATING_SCALE,
    hasMealTime: false,
    hasSchoolSelect: true,
    sections: [
      {
        id: "school_selection",
        titleKey: "questionnaire.school_canteen.selectSchool",
        fields: [
          { id: "sc_school", labelKey: "questionnaire.school_canteen.selectSchool", type: "school_select", required: true },
        ],
      },
      {
        id: "hygiene_cleanliness",
        titleKey: "questionnaire.school_canteen.hygieneCleanliness",
        descriptionKey: "questionnaire.school_canteen.hygieneDesc",
        fields: [
          {
            id: "sc_hygiene_cleanliness",
            labelKey: "questionnaire.school_canteen.hygieneQuestion",
            type: "radio",
            options: [
              { value: "excellent", labelKey: "ratings.excellent" },
              { value: "good", labelKey: "ratings.good" },
              { value: "average", labelKey: "ratings.average" },
              { value: "poor", labelKey: "ratings.poor" },
            ],
          },
          { id: "sc_hygiene_comments", labelKey: "questionnaire.school_canteen.commentsPlaceholder", type: "textarea" },
        ],
      },
      {
        id: "staff_hygiene",
        titleKey: "questionnaire.school_canteen.staffHygieneCompliance",
        descriptionKey: "questionnaire.school_canteen.staffHygieneDesc",
        fields: [
          {
            id: "sc_staff_hygiene",
            labelKey: "questionnaire.school_canteen.staffHygieneQuestion",
            type: "radio",
            options: [
              { value: "always", labelKey: "questionnaire.school_canteen.always" },
              { value: "most_of_the_time", labelKey: "questionnaire.school_canteen.mostOfTheTime" },
              { value: "sometimes", labelKey: "questionnaire.school_canteen.sometimes" },
              { value: "not_at_all", labelKey: "questionnaire.school_canteen.notAtAll" },
            ],
          },
          { id: "sc_staff_hygiene_comments", labelKey: "questionnaire.school_canteen.commentsPlaceholder", type: "textarea" },
        ],
      },
      {
        id: "employee_behavior",
        titleKey: "questionnaire.school_canteen.employeeBehavior",
        descriptionKey: "questionnaire.school_canteen.employeeBehaviorDesc",
        fields: [
          {
            id: "sc_employee_behavior",
            labelKey: "questionnaire.school_canteen.employeeBehaviorQuestion",
            type: "radio",
            options: [
              { value: "very_friendly", labelKey: "questionnaire.school_canteen.veryFriendly" },
              { value: "good", labelKey: "ratings.good" },
              { value: "average", labelKey: "ratings.average" },
              { value: "needs_improvement", labelKey: "questionnaire.school_canteen.needsImprovement" },
            ],
          },
          { id: "sc_behavior_comments", labelKey: "questionnaire.school_canteen.commentsPlaceholder", type: "textarea" },
        ],
      },
      {
        id: "food_quality",
        titleKey: "questionnaire.school_canteen.foodQuality",
        descriptionKey: "questionnaire.school_canteen.foodQualityDesc",
        fields: [
          {
            id: "sc_food_quality",
            labelKey: "questionnaire.school_canteen.foodQualityQuestion",
            type: "radio",
            options: [
              { value: "excellent", labelKey: "ratings.excellent" },
              { value: "good", labelKey: "ratings.good" },
              { value: "average", labelKey: "ratings.average" },
              { value: "poor", labelKey: "ratings.poor" },
            ],
          },
          { id: "sc_food_quality_comments", labelKey: "questionnaire.school_canteen.commentsPlaceholder", type: "textarea" },
        ],
      },
      {
        id: "food_freshness",
        titleKey: "questionnaire.school_canteen.foodFreshness",
        descriptionKey: "questionnaire.school_canteen.foodFreshnessDesc",
        fields: [
          {
            id: "sc_food_freshness",
            labelKey: "questionnaire.school_canteen.foodFreshnessQuestion",
            type: "radio",
            options: [
              { value: "very_fresh", labelKey: "questionnaire.school_canteen.veryFresh" },
              { value: "fresh", labelKey: "questionnaire.school_canteen.fresh" },
              { value: "acceptable", labelKey: "questionnaire.school_canteen.acceptable" },
              { value: "not_fresh", labelKey: "questionnaire.school_canteen.notFresh" },
            ],
          },
          { id: "sc_freshness_comments", labelKey: "questionnaire.school_canteen.commentsPlaceholder", type: "textarea" },
        ],
      },
      {
        id: "suggestions",
        titleKey: "questionnaire.school_canteen.suggestionsTitle",
        descriptionKey: "questionnaire.school_canteen.suggestionsDesc",
        fields: [
          { id: "sc_suggestions", labelKey: "questionnaire.school_canteen.suggestionsPlaceholder", type: "textarea" },
        ],
      },
    ],
    overallRatingField: "sc_food_quality",
    categoryFields: [],
    radioFields: [
      "sc_hygiene_cleanliness", "sc_staff_hygiene", "sc_employee_behavior",
      "sc_food_quality", "sc_food_freshness",
    ],
    suggestionsField: "sc_suggestions",
  },
};

export const getQuestionnaire = (type: QuestionnaireType): QuestionnaireConfig => {
  return QUESTIONNAIRES[type] || QUESTIONNAIRES.food;
};

export const QUESTIONNAIRE_OPTIONS: { value: QuestionnaireType; labelKey: string }[] = [
  { value: "food", labelKey: "questionnaire.food.name" },
  { value: "housekeeping", labelKey: "questionnaire.housekeeping.name" },
  { value: "school_canteen", labelKey: "questionnaire.school_canteen.name" },
];

/** Get all non-textarea, non-meal_time field IDs for a questionnaire */
export const getAllFields = (type: QuestionnaireType): string[] => {
  const config = getQuestionnaire(type);
  const fields: string[] = [];
  config.sections.forEach(section => {
    section.fields.forEach(field => {
      if (field.type !== "textarea" && field.type !== "meal_time" && field.type !== "school_select") {
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
