import { useState, useEffect, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { format } from "date-fns";
import {
  LogOut, RefreshCw, FileDown, Filter, X, Eye, ChevronLeft, ChevronRight,
  TrendingUp, TrendingDown, Minus, MessageSquare, Trash2,
} from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { utils, writeFile } from "xlsx";
import LanguageSwitcher from "./LanguageSwitcher";
import PlacesManager from "./PlacesManager";
import AnalyticsPage from "./AnalyticsPage";
import { QUESTIONNAIRE_OPTIONS, getQuestionnaire, type QuestionnaireType } from "@/lib/questionnaires";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3001";
const PAGE_SIZE = 15;

interface Feedback {
  _id?: string;
  id?: string;
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
  place_slug: string | null;
  place_name: string | null;
  questionnaire_type?: QuestionnaireType;
  /* housekeeping fields */
  housekeeping_overall?: string;
  toilet_clean_at_use?: string;
  toilet_supplies_available?: string;
  toilet_unpleasant_smell?: string;
  toilet_area_needs_cleaning?: string;
  toilet_cleaned_frequently?: string;
  laundry_properly_cleaned?: string;
  laundry_returned_on_time?: string;
  laundry_fresh_no_odor?: string;
  laundry_ironing_folding?: string;
  laundry_issues?: string;
  housekeeping_suggestions?: string;
  /* school canteen fields */
  sc_school?: string;
  school_name?: string;
  sc_hygiene_cleanliness?: string;
  sc_hygiene_comments?: string;
  sc_staff_hygiene?: string;
  sc_staff_hygiene_comments?: string;
  sc_employee_behavior?: string;
  sc_behavior_comments?: string;
  sc_food_quality?: string;
  sc_food_quality_comments?: string;
  sc_food_freshness?: string;
  sc_freshness_comments?: string;
  sc_suggestions?: string;
  [key: string]: unknown;
}

interface Place {
  _id: string;
  name: string;
  name_ar: string;
  slug: string;
}

interface AdminDashboardProps {
  onLogout: () => void;
  role?: string;
}

/* ── Rating badge colours ── */
const ratingBadge: Record<string, string> = {
  excellent: "bg-emerald-500 text-white",
  very_good: "bg-blue-500 text-white",
  good: "bg-amber-500 text-white",
  average: "bg-orange-500 text-white",
  dissatisfied: "bg-red-500 text-white",
  poor: "bg-red-500 text-white",
  always: "bg-emerald-500 text-white",
  most_of_the_time: "bg-blue-500 text-white",
  sometimes: "bg-orange-500 text-white",
  not_at_all: "bg-red-500 text-white",
  very_friendly: "bg-emerald-500 text-white",
  needs_improvement: "bg-red-500 text-white",
  very_fresh: "bg-emerald-500 text-white",
  fresh: "bg-blue-500 text-white",
  acceptable: "bg-orange-500 text-white",
  not_fresh: "bg-red-500 text-white",
};

const ratingDot: Record<string, string> = {
  excellent: "bg-emerald-500",
  very_good: "bg-blue-500",
  good: "bg-amber-500",
  average: "bg-orange-500",
  dissatisfied: "bg-red-500",
  poor: "bg-red-500",
  always: "bg-emerald-500",
  most_of_the_time: "bg-blue-500",
  sometimes: "bg-orange-500",
  not_at_all: "bg-red-500",
  very_friendly: "bg-emerald-500",
  needs_improvement: "bg-red-500",
  very_fresh: "bg-emerald-500",
  fresh: "bg-blue-500",
  acceptable: "bg-orange-500",
  not_fresh: "bg-red-500",
};

/* ─────────────────────────────────────────────────────────────── */

const AdminDashboard = ({ onLogout, role = "admin" }: AdminDashboardProps) => {
  const { t, i18n } = useTranslation();
  const isArabic = i18n.language === "ar";
  const isSchoolMode = role === "school";

  const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);
  const [places, setPlaces] = useState<Place[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);
  const [page, setPage] = useState(1);
  const [detailFeedback, setDetailFeedback] = useState<Feedback | null>(null);
  const [feedbackToDelete, setFeedbackToDelete] = useState<string | null>(null);

  /* Filters */
  const [filterPlace, setFilterPlace] = useState("all");
  const [filterMeal, setFilterMeal] = useState("all");
  const [filterRating, setFilterRating] = useState("all");
  const [filterFromDate, setFilterFromDate] = useState("");
  const [filterToDate, setFilterToDate] = useState("");
  const [filterQuestionnaire, setFilterQuestionnaire] = useState<string>(isSchoolMode ? "school_canteen" : "all");

  const formatRating = (r: string) => t(`ratings.${r}`);
  const getId = (f: Feedback) => f._id || f.id || "";

  /* ── Data fetching ── */
  const fetchPlaces = async () => {
    try {
      const res = await fetch(`${API_URL}/api/places`);
      setPlaces(await res.json());
    } catch { /* ignore */ }
  };

  const fetchFeedbacks = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (filterPlace !== "all") params.set("place_slug", filterPlace);
      if (filterMeal !== "all") params.set("meal_time", filterMeal);
      if (filterRating !== "all") params.set("rating", filterRating);
      if (filterFromDate) params.set("from_date", filterFromDate);
      if (filterToDate) params.set("to_date", filterToDate);
      if (filterQuestionnaire !== "all") params.set("questionnaire_type", filterQuestionnaire);

      const res = await fetch(`${API_URL}/api/feedback?${params}`);
      if (!res.ok) throw new Error();
      setFeedbacks((await res.json()) || []);
      setPage(1);
    } catch {
      toast.error(t("toast.loadFailed"));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { fetchPlaces(); }, []);
  useEffect(() => { fetchFeedbacks(); }, [filterPlace, filterMeal, filterRating, filterFromDate, filterToDate, filterQuestionnaire]);

  /* ── Filters helpers ── */
  const clearFilters = () => {
    setFilterPlace("all");
    setFilterMeal("all");
    setFilterRating("all");
    setFilterFromDate("");
    setFilterToDate("");
    setFilterQuestionnaire(isSchoolMode ? "school_canteen" : "all");
  };
  const hasActiveFilters =
    filterPlace !== "all" || filterMeal !== "all" || filterRating !== "all" || filterFromDate || filterToDate || filterQuestionnaire !== (isSchoolMode ? "school_canteen" : "all");

  /* Helper: get the overall rating field value for any feedback */
  const getOverallRating = (fb: Feedback): string => {
    const qType = fb.questionnaire_type || "food";
    const cfg = getQuestionnaire(qType);
    return (fb[cfg.overallRatingField] as string) || "";
  };

  /* Helper: get suggestions field value for any feedback */
  const getSuggestions = (fb: Feedback): string => {
    const qType = fb.questionnaire_type || "food";
    const cfg = getQuestionnaire(qType);
    return (fb[cfg.suggestionsField] as string) || "";
  };

  /* ── Stats ── */
  const stats = useMemo(() => {
    const total = feedbacks.length;
    const excellent = feedbacks.filter(f => {
      const or = getOverallRating(f);
      return or === "excellent";
    }).length;
    const positive = feedbacks.filter(f => {
      const or = getOverallRating(f);
      return ["excellent", "very_good", "good"].includes(or);
    }).length;
    const negative = feedbacks.filter(f => {
      const or = getOverallRating(f);
      return ["average", "dissatisfied", "poor", "very_poor"].includes(or);
    }).length;
    const satisfactionPct = total ? Math.round((positive / total) * 100) : 0;
    const withSuggestions = feedbacks.filter(f => getSuggestions(f)).length;
    return { total, excellent, positive, negative, satisfactionPct, withSuggestions };
  }, [feedbacks]);

  /* ── Pagination ── */
  const totalPages = Math.max(1, Math.ceil(feedbacks.length / PAGE_SIZE));
  const pagedFeedbacks = feedbacks.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  /* ── Export ── */
  const handleDeleteFeedback = async (id: string) => {
    try {
      const res = await fetch(`${API_URL}/api/feedback/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete');
      toast.success(t("admin.feedbackDeleted"));
      setFeedbackToDelete(null);
      fetchFeedbacks();
    } catch (error) {
      console.error('Delete error:', error);
      toast.error(t("admin.deleteFailed"));
    }
  };

  const exportToExcel = () => {
    const rows = feedbacks.map(f => {
      const qType = f.questionnaire_type || "food";
      const base: Record<string, string> = {
        Date: f.feedback_date,
        Place: f.place_name || "N/A",
        "Questionnaire": qType,
      };
      if (qType === "food") {
        Object.assign(base, {
          "Meal Time": f.meal_time,
          "Food Temperature": f.food_temperature,
          "Food Taste": f.food_taste,
          "Food Aroma": f.food_aroma,
          "Menu Variety": f.menu_variety,
          "Staff Attitude": f.staff_attitude,
          "Service Time": f.service_time,
          Cleanliness: f.cleanliness,
          "Overall Experience": f.overall_experience,
          Suggestions: f.suggestions || "",
        });
      } else if (qType === "housekeeping") {
        Object.assign(base, {
          "Overall Rating": (f as any).housekeeping_overall || "",
          "Toilet Clean at Use": f.toilet_clean_at_use || "",
          "Supplies Available": f.toilet_supplies_available || "",
          "Unpleasant Smell": f.toilet_unpleasant_smell || "",
          "Area Needs Cleaning": f.toilet_area_needs_cleaning || "",
          "Cleaned Frequently": f.toilet_cleaned_frequently || "",
          "Laundry Properly Cleaned": f.laundry_properly_cleaned || "",
          "Returned on Time": f.laundry_returned_on_time || "",
          "Fresh No Odor": f.laundry_fresh_no_odor || "",
          "Ironing/Folding": f.laundry_ironing_folding || "",
          "Laundry Issues": f.laundry_issues || "",
          Suggestions: (f as any).housekeeping_suggestions || "",
        });
      } else if (qType === "school_canteen") {
        Object.assign(base, {
          "School": f.school_name || "",
          "Hygiene & Cleanliness": f.sc_hygiene_cleanliness || "",
          "Hygiene Comments": f.sc_hygiene_comments || "",
          "Staff Hygiene Compliance": f.sc_staff_hygiene || "",
          "Staff Hygiene Comments": f.sc_staff_hygiene_comments || "",
          "Employee Behavior": f.sc_employee_behavior || "",
          "Behavior Comments": f.sc_behavior_comments || "",
          "Food Quality": f.sc_food_quality || "",
          "Food Quality Comments": f.sc_food_quality_comments || "",
          "Food Freshness": f.sc_food_freshness || "",
          "Freshness Comments": f.sc_freshness_comments || "",
          Suggestions: f.sc_suggestions || "",
        });
      }
      return base;
    });
    const ws = utils.json_to_sheet(rows);
    ws["!cols"] = Object.keys(rows[0] || {}).map(() => ({ wch: 18 }));
    const wb = utils.book_new();
    utils.book_append_sheet(wb, ws, "Feedback");
    writeFile(wb, `feedback-export-${format(new Date(), "yyyy-MM-dd")}.xlsx`);
    toast.success(t("admin.exportSuccess"));
  };

  /* ──────────── RENDER ──────────── */

  /* Current active questionnaire filter for table columns */
  const activeQType = filterQuestionnaire !== "all" ? filterQuestionnaire as QuestionnaireType : null;

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-card/80 backdrop-blur-md border-b border-border">
        <div className="container max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3">
            <img src="/logo.png" alt="Food City" className="h-10 w-auto" />
            <span className="font-display text-lg font-semibold text-foreground hidden sm:inline">{t("admin.dashboard")}</span>
          </Link>
          <div className="flex items-center gap-2">
            <LanguageSwitcher />
            <Button variant="ghost" size="icon" onClick={onLogout}>
              <LogOut className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </header>

      <main className="container max-w-6xl mx-auto px-4 py-6">
        <Tabs defaultValue="feedbacks" className="space-y-4">
          <TabsList className={`grid w-full ${isSchoolMode ? "grid-cols-2" : "grid-cols-3"}`}>
            <TabsTrigger value="feedbacks">{t("admin.feedbacks")}</TabsTrigger>
            {!isSchoolMode && <TabsTrigger value="places">{t("admin.places")}</TabsTrigger>}
            <TabsTrigger value="analytics">{t("admin.analytics")}</TabsTrigger>
          </TabsList>

          {/* ═══════════ FEEDBACKS TAB ═══════════ */}
          <TabsContent value="feedbacks" className="space-y-4">
            {/* Toolbar */}
            <div className="flex items-center gap-2 flex-wrap">
              <Button
                variant={showFilters ? "default" : "outline"} size="sm"
                onClick={() => setShowFilters(!showFilters)}
              >
                <Filter className="w-4 h-4 ltr:mr-2 rtl:ml-2" />
                {t("admin.filters")}
                {hasActiveFilters && (
                  <span className="ltr:ml-1 rtl:mr-1 bg-white text-primary rounded-full h-5 w-5 flex items-center justify-center text-[10px] font-bold">!</span>
                )}
              </Button>
              <Button variant="outline" size="sm" onClick={fetchFeedbacks} disabled={isLoading}>
                <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`} />
              </Button>
              <Button variant="outline" size="sm" onClick={exportToExcel} disabled={feedbacks.length === 0}>
                <FileDown className="w-4 h-4 ltr:mr-2 rtl:ml-2" />
                {t("admin.export")}
              </Button>
              <span className="text-xs text-muted-foreground ltr:ml-auto rtl:mr-auto">
                {t("admin.showing")} {feedbacks.length} {t("admin.results")}
              </span>
            </div>

            {/* Filters Panel */}
            {showFilters && (
              <Card className="animate-fade-in">
                <CardContent className="p-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                    {!isSchoolMode && (
                    <div>
                      <Label className="text-xs mb-1 block">{t("admin.questionnaireType")}</Label>
                      <Select value={filterQuestionnaire} onValueChange={setFilterQuestionnaire}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">{t("admin.allQuestionnaires")}</SelectItem>
                          {QUESTIONNAIRE_OPTIONS.map(q => (
                            <SelectItem key={q.value} value={q.value}>{t(q.labelKey)}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    )}
                    <div>
                      <Label className="text-xs mb-1 block">{t("admin.places")}</Label>
                      <Select value={filterPlace} onValueChange={setFilterPlace}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">{t("admin.allPlaces")}</SelectItem>
                          {places.map(p => (
                            <SelectItem key={p.slug} value={p.slug}>
                              {isArabic && p.name_ar ? p.name_ar : p.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label className="text-xs mb-1 block">{t("feedback.mealTime")}</Label>
                      <Select value={filterMeal} onValueChange={setFilterMeal}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">{t("admin.allMealTimes")}</SelectItem>
                          <SelectItem value="breakfast">{t("feedback.breakfast")}</SelectItem>
                          <SelectItem value="lunch">{t("feedback.lunch")}</SelectItem>
                          <SelectItem value="dinner">{t("feedback.dinner")}</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label className="text-xs mb-1 block">{t("feedback.overallExperience")}</Label>
                      <Select value={filterRating} onValueChange={setFilterRating}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">{t("admin.allRatings")}</SelectItem>
                          <SelectItem value="excellent">{t("ratings.excellent")}</SelectItem>
                          <SelectItem value="very_good">{t("ratings.very_good")}</SelectItem>
                          <SelectItem value="good">{t("ratings.good")}</SelectItem>
                          <SelectItem value="average">{t("ratings.average")}</SelectItem>
                          <SelectItem value="dissatisfied">{t("ratings.dissatisfied")}</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label className="text-xs mb-1 block">{t("admin.fromDate")}</Label>
                      <Input type="date" value={filterFromDate} onChange={e => setFilterFromDate(e.target.value)} />
                    </div>
                    <div>
                      <Label className="text-xs mb-1 block">{t("admin.toDate")}</Label>
                      <Input type="date" value={filterToDate} onChange={e => setFilterToDate(e.target.value)} />
                    </div>
                    <div className="flex items-end">
                      {hasActiveFilters && (
                        <Button variant="ghost" size="sm" onClick={clearFilters}>
                          <X className="w-4 h-4 ltr:mr-1 rtl:ml-1" />
                          {t("admin.clearFilters")}
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Stats Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
              <Card>
                <CardContent className="p-4 text-center">
                  <div className="text-2xl font-bold">{stats.total}</div>
                  <div className="text-[11px] text-muted-foreground">{t("admin.total")}</div>
                </CardContent>
              </Card>
              <Card className="border-emerald-200">
                <CardContent className="p-4 text-center">
                  <div className="flex items-center justify-center gap-1">
                    <TrendingUp className="w-4 h-4 text-emerald-500" />
                    <span className="text-2xl font-bold text-emerald-600">{stats.positive}</span>
                  </div>
                  <div className="text-[11px] text-muted-foreground">Positive</div>
                </CardContent>
              </Card>
              <Card className="border-red-200">
                <CardContent className="p-4 text-center">
                  <div className="flex items-center justify-center gap-1">
                    <TrendingDown className="w-4 h-4 text-red-500" />
                    <span className="text-2xl font-bold text-red-600">{stats.negative}</span>
                  </div>
                  <div className="text-[11px] text-muted-foreground">Negative</div>
                </CardContent>
              </Card>
              <Card className="border-blue-200">
                <CardContent className="p-4 text-center">
                  <div className="flex items-center justify-center gap-1">
                    <Minus className="w-4 h-4 text-blue-500" />
                    <span className="text-2xl font-bold text-blue-600">{stats.satisfactionPct}%</span>
                  </div>
                  <div className="text-[11px] text-muted-foreground">Satisfaction</div>
                </CardContent>
              </Card>
              <Card className="border-purple-200">
                <CardContent className="p-4 text-center">
                  <div className="flex items-center justify-center gap-1">
                    <MessageSquare className="w-4 h-4 text-purple-500" />
                    <span className="text-2xl font-bold text-purple-600">{stats.withSuggestions}</span>
                  </div>
                  <div className="text-[11px] text-muted-foreground">{t("feedback.suggestions")}</div>
                </CardContent>
              </Card>
            </div>

            {/* ─── TABLE ─── */}
            <Card>
              <CardContent className="p-0">
                {isLoading ? (
                  <div className="text-center py-12 text-muted-foreground">{t("admin.loading")}</div>
                ) : feedbacks.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">{t("admin.noFeedback")}</div>
                ) : (
                  <>
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow className="bg-muted/50">
                            <TableHead className="w-[30px] text-center">#</TableHead>
                            <TableHead>{t("admin.date")}</TableHead>
                            <TableHead>{t("admin.places")}</TableHead>
                            {(!activeQType || activeQType === "food") && activeQType !== "housekeeping" && (
                              <>
                                {activeQType === "food" && <TableHead>{t("feedback.mealTime")}</TableHead>}
                                {activeQType === "food" && <TableHead className="text-center">{t("admin.temperature")}</TableHead>}
                                {activeQType === "food" && <TableHead className="text-center">{t("admin.taste")}</TableHead>}
                                {activeQType === "food" && <TableHead className="text-center">{t("admin.aroma")}</TableHead>}
                                {activeQType === "food" && <TableHead className="text-center">{t("admin.variety")}</TableHead>}
                                {activeQType === "food" && <TableHead className="text-center">{t("admin.staff")}</TableHead>}
                                {activeQType === "food" && <TableHead className="text-center">{t("admin.time")}</TableHead>}
                                {activeQType === "food" && <TableHead className="text-center">{t("admin.clean")}</TableHead>}
                              </>
                            )}
                            {activeQType === "housekeeping" && (
                              <>
                                <TableHead className="text-center">{t("questionnaire.housekeeping.cleanAtUse")}</TableHead>
                                <TableHead className="text-center">{t("questionnaire.housekeeping.suppliesAvailable")}</TableHead>
                                <TableHead className="text-center">{t("questionnaire.housekeeping.unpleasantSmell")}</TableHead>
                                <TableHead className="text-center">{t("questionnaire.housekeeping.properlyCleaned")}</TableHead>
                                <TableHead className="text-center">{t("questionnaire.housekeeping.returnedOnTime")}</TableHead>
                              </>
                            )}
                            {activeQType === "school_canteen" && (
                              <>
                                <TableHead>{t("admin.schoolName")}</TableHead>
                                <TableHead className="text-center">{t("questionnaire.school_canteen.hygieneCleanliness")}</TableHead>
                                <TableHead className="text-center">{t("questionnaire.school_canteen.staffHygieneCompliance")}</TableHead>
                                <TableHead className="text-center">{t("questionnaire.school_canteen.employeeBehavior")}</TableHead>
                                <TableHead className="text-center">{t("questionnaire.school_canteen.foodQuality")}</TableHead>
                                <TableHead className="text-center">{t("questionnaire.school_canteen.foodFreshness")}</TableHead>
                              </>
                            )}
                            {!activeQType && <TableHead>{t("admin.questionnaireType")}</TableHead>}
                            <TableHead className="text-center">{t("feedback.overallExperience")}</TableHead>
                            <TableHead className="w-[80px]"></TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {pagedFeedbacks.map((fb, idx) => {
                            const qType = fb.questionnaire_type || "food";
                            const overallRating = getOverallRating(fb);
                            return (
                            <TableRow key={getId(fb)} className="hover:bg-muted/30 transition-colors">
                              <TableCell className="text-center text-xs text-muted-foreground">
                                {(page - 1) * PAGE_SIZE + idx + 1}
                              </TableCell>
                              <TableCell className="whitespace-nowrap text-xs">
                                {format(new Date(fb.feedback_date), "dd MMM yyyy")}
                              </TableCell>
                              <TableCell className="text-xs max-w-[100px] truncate">
                                {fb.place_name || "—"}
                              </TableCell>
                              {(!activeQType || activeQType === "food") && activeQType !== "housekeeping" && (
                                <>
                                  {activeQType === "food" && <TableCell className="capitalize text-xs">{t(`feedback.${fb.meal_time}`)}</TableCell>}
                                  {activeQType === "food" && <TableCell className="text-center"><RatingDot rating={fb.food_temperature} /></TableCell>}
                                  {activeQType === "food" && <TableCell className="text-center"><RatingDot rating={fb.food_taste} /></TableCell>}
                                  {activeQType === "food" && <TableCell className="text-center"><RatingDot rating={fb.food_aroma} /></TableCell>}
                                  {activeQType === "food" && <TableCell className="text-center"><RatingDot rating={fb.menu_variety} /></TableCell>}
                                  {activeQType === "food" && <TableCell className="text-center"><RatingDot rating={fb.staff_attitude} /></TableCell>}
                                  {activeQType === "food" && <TableCell className="text-center"><RatingDot rating={fb.service_time} /></TableCell>}
                                  {activeQType === "food" && <TableCell className="text-center"><RatingDot rating={fb.cleanliness} /></TableCell>}
                                </>
                              )}
                              {activeQType === "housekeeping" && (
                                <>
                                  <TableCell className="text-center text-xs">{fb.toilet_clean_at_use ? t(`common.${fb.toilet_clean_at_use}`) : "—"}</TableCell>
                                  <TableCell className="text-center text-xs">{fb.toilet_supplies_available ? t(`common.${fb.toilet_supplies_available}`) : "—"}</TableCell>
                                  <TableCell className="text-center text-xs">{fb.toilet_unpleasant_smell ? t(`common.${fb.toilet_unpleasant_smell}`) : "—"}</TableCell>
                                  <TableCell className="text-center text-xs">{fb.laundry_properly_cleaned ? t(`common.${fb.laundry_properly_cleaned}`) : "—"}</TableCell>
                                  <TableCell className="text-center text-xs">{fb.laundry_returned_on_time ? t(`common.${fb.laundry_returned_on_time}`) : "—"}</TableCell>
                                </>
                              )}
                              {activeQType === "school_canteen" && (
                                <>
                                  <TableCell className="text-xs max-w-[120px] truncate">{fb.school_name || "—"}</TableCell>
                                  <TableCell className="text-center"><RatingDot rating={fb.sc_hygiene_cleanliness || ""} /></TableCell>
                                  <TableCell className="text-center"><RatingDot rating={fb.sc_staff_hygiene || ""} /></TableCell>
                                  <TableCell className="text-center"><RatingDot rating={fb.sc_employee_behavior || ""} /></TableCell>
                                  <TableCell className="text-center"><RatingDot rating={fb.sc_food_quality || ""} /></TableCell>
                                  <TableCell className="text-center"><RatingDot rating={fb.sc_food_freshness || ""} /></TableCell>
                                </>
                              )}
                              {!activeQType && (
                                <TableCell className="text-xs">
                                  <Badge variant="outline" className="text-[10px]">{t(`questionnaire.${qType}.name`)}</Badge>
                                </TableCell>
                              )}
                              <TableCell className="text-center">
                                <Badge className={`${ratingBadge[overallRating] || ""} text-[10px] px-2`}>
                                  {overallRating ? formatRating(overallRating) : "—"}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center gap-1">
                                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setDetailFeedback(fb)}>
                                    <Eye className="w-3.5 h-3.5" />
                                  </Button>
                                  <Button 
                                    variant="ghost" 
                                    size="icon" 
                                    className="h-7 w-7 text-destructive hover:text-destructive" 
                                    onClick={() => setFeedbackToDelete(getId(fb))}
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          );})}
                        </TableBody>
                      </Table>
                    </div>

                    {/* Pagination */}
                    {totalPages > 1 && (
                      <div className="flex items-center justify-between px-4 py-3 border-t border-border">
                        <span className="text-xs text-muted-foreground">
                          {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, feedbacks.length)} of {feedbacks.length}
                        </span>
                        <div className="flex items-center gap-1">
                          <Button variant="outline" size="icon" className="h-7 w-7" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>
                            <ChevronLeft className="w-4 h-4" />
                          </Button>
                          {Array.from({ length: totalPages }, (_, i) => i + 1)
                            .filter(p => p === 1 || p === totalPages || Math.abs(p - page) <= 1)
                            .reduce<(number | string)[]>((acc, p, i, arr) => {
                              if (i > 0 && p - (arr[i - 1] as number) > 1) acc.push("...");
                              acc.push(p);
                              return acc;
                            }, [])
                            .map((p, i) =>
                              typeof p === "string" ? (
                                <span key={`dots-${i}`} className="text-xs px-1">…</span>
                              ) : (
                                <Button
                                  key={p} variant={p === page ? "default" : "outline"}
                                  size="icon" className="h-7 w-7 text-xs"
                                  onClick={() => setPage(p)}
                                >
                                  {p}
                                </Button>
                              )
                            )}
                          <Button variant="outline" size="icon" className="h-7 w-7" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}>
                            <ChevronRight className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* ═══════════ PLACES TAB ═══════════ */}
          <TabsContent value="places">
            <PlacesManager />
          </TabsContent>

          {/* ═══════════ ANALYTICS TAB ═══════════ */}
          <TabsContent value="analytics">
            <AnalyticsPage restrictTo={isSchoolMode ? "school_canteen" : undefined} />
          </TabsContent>
        </Tabs>
      </main>

      {/* ─── Detail Dialog ─── */}
      <Dialog open={!!detailFeedback} onOpenChange={() => setDetailFeedback(null)}>
        <DialogContent className="max-w-lg">
          {detailFeedback && (() => {
            const qType = (detailFeedback.questionnaire_type || "food") as QuestionnaireType;
            const config = getQuestionnaire(qType);
            const overallRating = (detailFeedback[config.overallRatingField] as string) || "";
            const suggestions = getSuggestions(detailFeedback);
            return (
              <>
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2 flex-wrap">
                    {qType === "food" && detailFeedback.meal_time && `${t(`feedback.${detailFeedback.meal_time}`)} — `}
                    {format(new Date(detailFeedback.feedback_date), "dd MMM yyyy")}
                    {detailFeedback.place_name && <Badge variant="outline" className="text-xs">{detailFeedback.place_name}</Badge>}
                    <Badge variant="secondary" className="text-xs">{t(config.nameKey)}</Badge>
                  </DialogTitle>
                </DialogHeader>

                <div className="space-y-4 mt-2">
                  {/* Food-specific sections */}
                  {qType === "food" && (
                    <>
                      <div>
                        <h4 className="text-sm font-semibold mb-2 text-foreground">{t("admin.foodMenu")}</h4>
                        <div className="grid grid-cols-2 gap-2">
                          <DetailRow label={t("admin.temperature")} value={detailFeedback.food_temperature} />
                          <DetailRow label={t("admin.taste")} value={detailFeedback.food_taste} />
                          <DetailRow label={t("admin.aroma")} value={detailFeedback.food_aroma} />
                          <DetailRow label={t("admin.variety")} value={detailFeedback.menu_variety} />
                        </div>
                      </div>
                      <div>
                        <h4 className="text-sm font-semibold mb-2 text-foreground">{t("admin.service")}</h4>
                        <div className="grid grid-cols-2 gap-2">
                          <DetailRow label={t("admin.staff")} value={detailFeedback.staff_attitude} />
                          <DetailRow label={t("admin.time")} value={detailFeedback.service_time} />
                          <DetailRow label={t("admin.clean")} value={detailFeedback.cleanliness} />
                        </div>
                      </div>
                    </>
                  )}

                  {/* Housekeeping-specific sections (Toilet + Laundry) */}
                  {qType === "housekeeping" && (
                    <>
                      <div>
                        <h4 className="text-sm font-semibold mb-2 text-foreground">{t("questionnaire.housekeeping.toiletSection")}</h4>
                        <div className="grid grid-cols-1 gap-2">
                          <DetailRowText label={t("questionnaire.housekeeping.cleanAtUse")} value={detailFeedback.toilet_clean_at_use === "yes" ? t("common.yes") : t("common.no")} />
                          <DetailRowText label={t("questionnaire.housekeeping.suppliesAvailable")} value={detailFeedback.toilet_supplies_available === "yes" ? t("common.yes") : t("common.no")} />
                          <DetailRowText label={t("questionnaire.housekeeping.unpleasantSmell")} value={detailFeedback.toilet_unpleasant_smell === "yes" ? t("common.yes") : t("common.no")} />
                          <DetailRowText label={t("questionnaire.housekeeping.areaNeedsCleaning")} value={detailFeedback.toilet_area_needs_cleaning || "—"} />
                          <DetailRowText label={t("questionnaire.housekeeping.cleanedFrequently")} value={
                            detailFeedback.toilet_cleaned_frequently === "yes" ? t("common.yes") :
                            detailFeedback.toilet_cleaned_frequently === "no" ? t("common.no") :
                            t("common.notSure")
                          } />
                        </div>
                      </div>
                      <div>
                        <h4 className="text-sm font-semibold mb-2 text-foreground">{t("questionnaire.housekeeping.laundrySection")}</h4>
                        <div className="grid grid-cols-1 gap-2">
                          <DetailRowText label={t("questionnaire.housekeeping.properlyCleaned")} value={detailFeedback.laundry_properly_cleaned === "yes" ? t("common.yes") : t("common.no")} />
                          <DetailRowText label={t("questionnaire.housekeeping.returnedOnTime")} value={detailFeedback.laundry_returned_on_time === "yes" ? t("common.yes") : t("common.no")} />
                          <DetailRowText label={t("questionnaire.housekeeping.freshNoOdor")} value={detailFeedback.laundry_fresh_no_odor === "yes" ? t("common.yes") : t("common.no")} />
                          <DetailRowText label={t("questionnaire.housekeeping.ironingFoldingDone")} value={
                            detailFeedback.laundry_ironing_folding === "yes" ? t("common.yes") :
                            detailFeedback.laundry_ironing_folding === "no" ? t("common.no") :
                            t("common.notApplicable")
                          } />
                          <DetailRowText label={t("questionnaire.housekeeping.issuesNoticed")} value={detailFeedback.laundry_issues || "—"} />
                        </div>
                      </div>
                    </>
                  )}

                  {/* School Canteen-specific sections */}
                  {qType === "school_canteen" && (
                    <>
                      {detailFeedback.school_name && (
                        <div className="flex items-center justify-between bg-muted/50 rounded-lg p-3">
                          <span className="text-sm font-medium">{t("admin.schoolName")}</span>
                          <span className="text-sm font-medium">{detailFeedback.school_name}</span>
                        </div>
                      )}
                      <div>
                        <h4 className="text-sm font-semibold mb-2 text-foreground">{t("questionnaire.school_canteen.hygieneCleanliness")}</h4>
                        <div className="grid grid-cols-1 gap-2">
                          <DetailRow label={t("questionnaire.school_canteen.hygieneQuestion")} value={detailFeedback.sc_hygiene_cleanliness || ""} />
                          {detailFeedback.sc_hygiene_comments && <DetailRowText label={t("questionnaire.school_canteen.commentsPlaceholder")} value={detailFeedback.sc_hygiene_comments} />}
                        </div>
                      </div>
                      <div>
                        <h4 className="text-sm font-semibold mb-2 text-foreground">{t("questionnaire.school_canteen.staffHygieneCompliance")}</h4>
                        <div className="grid grid-cols-1 gap-2">
                          <DetailRow label={t("questionnaire.school_canteen.staffHygieneQuestion")} value={detailFeedback.sc_staff_hygiene || ""} />
                          {detailFeedback.sc_staff_hygiene_comments && <DetailRowText label={t("questionnaire.school_canteen.commentsPlaceholder")} value={detailFeedback.sc_staff_hygiene_comments} />}
                        </div>
                      </div>
                      <div>
                        <h4 className="text-sm font-semibold mb-2 text-foreground">{t("questionnaire.school_canteen.employeeBehavior")}</h4>
                        <div className="grid grid-cols-1 gap-2">
                          <DetailRow label={t("questionnaire.school_canteen.employeeBehaviorQuestion")} value={detailFeedback.sc_employee_behavior || ""} />
                          {detailFeedback.sc_behavior_comments && <DetailRowText label={t("questionnaire.school_canteen.commentsPlaceholder")} value={detailFeedback.sc_behavior_comments} />}
                        </div>
                      </div>
                      <div>
                        <h4 className="text-sm font-semibold mb-2 text-foreground">{t("questionnaire.school_canteen.foodQuality")}</h4>
                        <div className="grid grid-cols-1 gap-2">
                          <DetailRow label={t("questionnaire.school_canteen.foodQualityQuestion")} value={detailFeedback.sc_food_quality || ""} />
                          {detailFeedback.sc_food_quality_comments && <DetailRowText label={t("questionnaire.school_canteen.commentsPlaceholder")} value={detailFeedback.sc_food_quality_comments} />}
                        </div>
                      </div>
                      <div>
                        <h4 className="text-sm font-semibold mb-2 text-foreground">{t("questionnaire.school_canteen.foodFreshness")}</h4>
                        <div className="grid grid-cols-1 gap-2">
                          <DetailRow label={t("questionnaire.school_canteen.foodFreshnessQuestion")} value={detailFeedback.sc_food_freshness || ""} />
                          {detailFeedback.sc_freshness_comments && <DetailRowText label={t("questionnaire.school_canteen.commentsPlaceholder")} value={detailFeedback.sc_freshness_comments} />}
                        </div>
                      </div>
                    </>
                  )}

                  {/* Overall */}
                  <div className="flex items-center justify-between bg-muted/50 rounded-lg p-3">
                    <span className="text-sm font-medium">{t("feedback.overallExperience")}</span>
                    <Badge className={`${ratingBadge[overallRating] || ""} text-xs`}>
                      {overallRating ? formatRating(overallRating) : "—"}
                    </Badge>
                  </div>

                  {/* Suggestions */}
                  {suggestions && (
                    <div>
                      <h4 className="text-sm font-semibold mb-2">{t("feedback.suggestions")}</h4>
                      <p className="text-sm text-muted-foreground bg-muted p-3 rounded-md whitespace-pre-wrap">
                        {suggestions}
                      </p>
                    </div>
                  )}
                </div>
              </>
            );
          })()}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!feedbackToDelete} onOpenChange={() => setFeedbackToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("admin.deleteFeedback")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("admin.deleteFeedbackConfirm")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("admin.cancel")}</AlertDialogCancel>
            <AlertDialogAction 
              onClick={() => feedbackToDelete && handleDeleteFeedback(feedbackToDelete)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {t("admin.delete")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

/* ── Tiny colour dot for table cells ── */
const RatingDot = ({ rating }: { rating: string }) => {
  const { t } = useTranslation();
  return (
    <span
      className={`inline-block w-3 h-3 rounded-full ${ratingDot[rating] || "bg-gray-300"}`}
      title={t(`ratings.${rating}`)}
    />
  );
};

/* ── Detail row in the dialog (for rating badges) ── */
const DetailRow = ({ label, value }: { label: string; value: string }) => {
  const { t } = useTranslation();
  return (
    <div className="flex items-center justify-between text-sm bg-muted/30 rounded px-2 py-1.5">
      <span className="text-muted-foreground text-xs">{label}</span>
      <Badge className={`${ratingBadge[value] || ""} text-[10px] px-1.5`}>
        {t(`ratings.${value}`)}
      </Badge>
    </div>
  );
};

/* ── Detail row for text values (yes/no, etc.) ── */
const DetailRowText = ({ label, value }: { label: string; value: string }) => {
  return (
    <div className="flex items-center justify-between text-sm bg-muted/30 rounded px-2 py-1.5">
      <span className="text-muted-foreground text-xs">{label}</span>
      <span className="text-xs font-medium">{value}</span>
    </div>
  );
};

export default AdminDashboard;
