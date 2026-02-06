import { useState, useEffect, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { format } from "date-fns";
import {
  LogOut, RefreshCw, FileDown, Filter, X, Eye, ChevronLeft, ChevronRight,
  TrendingUp, TrendingDown, Minus, MessageSquare,
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
import { toast } from "sonner";
import { utils, writeFile } from "xlsx";
import LanguageSwitcher from "./LanguageSwitcher";
import PlacesManager from "./PlacesManager";
import AnalyticsPage from "./AnalyticsPage";

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
}

interface Place {
  _id: string;
  name: string;
  name_ar: string;
  slug: string;
}

interface AdminDashboardProps {
  onLogout: () => void;
}

/* ── Rating badge colours ── */
const ratingBadge: Record<string, string> = {
  excellent: "bg-emerald-500 text-white",
  very_good: "bg-blue-500 text-white",
  good: "bg-amber-500 text-white",
  average: "bg-orange-500 text-white",
  dissatisfied: "bg-red-500 text-white",
};

const ratingDot: Record<string, string> = {
  excellent: "bg-emerald-500",
  very_good: "bg-blue-500",
  good: "bg-amber-500",
  average: "bg-orange-500",
  dissatisfied: "bg-red-500",
};

/* ─────────────────────────────────────────────────────────────── */

const AdminDashboard = ({ onLogout }: AdminDashboardProps) => {
  const { t, i18n } = useTranslation();
  const isArabic = i18n.language === "ar";

  const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);
  const [places, setPlaces] = useState<Place[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);
  const [page, setPage] = useState(1);
  const [detailFeedback, setDetailFeedback] = useState<Feedback | null>(null);

  /* Filters */
  const [filterPlace, setFilterPlace] = useState("all");
  const [filterMeal, setFilterMeal] = useState("all");
  const [filterRating, setFilterRating] = useState("all");
  const [filterFromDate, setFilterFromDate] = useState("");
  const [filterToDate, setFilterToDate] = useState("");

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
  useEffect(() => { fetchFeedbacks(); }, [filterPlace, filterMeal, filterRating, filterFromDate, filterToDate]);

  /* ── Filters helpers ── */
  const clearFilters = () => {
    setFilterPlace("all");
    setFilterMeal("all");
    setFilterRating("all");
    setFilterFromDate("");
    setFilterToDate("");
  };
  const hasActiveFilters =
    filterPlace !== "all" || filterMeal !== "all" || filterRating !== "all" || filterFromDate || filterToDate;

  /* ── Stats ── */
  const stats = useMemo(() => {
    const total = feedbacks.length;
    const excellent = feedbacks.filter(f => f.overall_experience === "excellent").length;
    const veryGood = feedbacks.filter(f => f.overall_experience === "very_good").length;
    const good = feedbacks.filter(f => f.overall_experience === "good").length;
    const average = feedbacks.filter(f => f.overall_experience === "average").length;
    const dissatisfied = feedbacks.filter(f => f.overall_experience === "dissatisfied").length;
    const positive = excellent + veryGood + good;
    const negative = average + dissatisfied;
    const satisfactionPct = total ? Math.round((positive / total) * 100) : 0;
    const withSuggestions = feedbacks.filter(f => f.suggestions).length;
    return { total, excellent, veryGood, good, average, dissatisfied, positive, negative, satisfactionPct, withSuggestions };
  }, [feedbacks]);

  /* ── Pagination ── */
  const totalPages = Math.max(1, Math.ceil(feedbacks.length / PAGE_SIZE));
  const pagedFeedbacks = feedbacks.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  /* ── Export ── */
  const exportToExcel = () => {
    const rows = feedbacks.map(f => ({
      Date: f.feedback_date,
      "Meal Time": f.meal_time,
      Place: f.place_name || "N/A",
      "Food Temperature": f.food_temperature,
      "Food Taste": f.food_taste,
      "Food Aroma": f.food_aroma,
      "Menu Variety": f.menu_variety,
      "Staff Attitude": f.staff_attitude,
      "Service Time": f.service_time,
      Cleanliness: f.cleanliness,
      "Overall Experience": f.overall_experience,
      Suggestions: f.suggestions || "",
    }));
    const ws = utils.json_to_sheet(rows);
    /* Auto column widths */
    ws["!cols"] = Object.keys(rows[0] || {}).map(() => ({ wch: 18 }));
    const wb = utils.book_new();
    utils.book_append_sheet(wb, ws, "Feedback");
    writeFile(wb, `feedback-export-${format(new Date(), "yyyy-MM-dd")}.xlsx`);
    toast.success(t("admin.exportSuccess"));
  };

  /* ──────────── RENDER ──────────── */
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
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="feedbacks">{t("admin.feedbacks")}</TabsTrigger>
            <TabsTrigger value="places">{t("admin.places")}</TabsTrigger>
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
                            <TableHead>{t("feedback.mealTime")}</TableHead>
                            <TableHead>{t("admin.places")}</TableHead>
                            <TableHead className="text-center">{t("admin.temperature")}</TableHead>
                            <TableHead className="text-center">{t("admin.taste")}</TableHead>
                            <TableHead className="text-center">{t("admin.aroma")}</TableHead>
                            <TableHead className="text-center">{t("admin.variety")}</TableHead>
                            <TableHead className="text-center">{t("admin.staff")}</TableHead>
                            <TableHead className="text-center">{t("admin.time")}</TableHead>
                            <TableHead className="text-center">{t("admin.clean")}</TableHead>
                            <TableHead className="text-center">{t("feedback.overallExperience")}</TableHead>
                            <TableHead className="w-[40px]"></TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {pagedFeedbacks.map((fb, idx) => (
                            <TableRow key={getId(fb)} className="hover:bg-muted/30 transition-colors">
                              <TableCell className="text-center text-xs text-muted-foreground">
                                {(page - 1) * PAGE_SIZE + idx + 1}
                              </TableCell>
                              <TableCell className="whitespace-nowrap text-xs">
                                {format(new Date(fb.feedback_date), "dd MMM yyyy")}
                              </TableCell>
                              <TableCell className="capitalize text-xs">
                                {t(`feedback.${fb.meal_time}`)}
                              </TableCell>
                              <TableCell className="text-xs max-w-[100px] truncate">
                                {fb.place_name || "—"}
                              </TableCell>
                              <TableCell className="text-center"><RatingDot rating={fb.food_temperature} /></TableCell>
                              <TableCell className="text-center"><RatingDot rating={fb.food_taste} /></TableCell>
                              <TableCell className="text-center"><RatingDot rating={fb.food_aroma} /></TableCell>
                              <TableCell className="text-center"><RatingDot rating={fb.menu_variety} /></TableCell>
                              <TableCell className="text-center"><RatingDot rating={fb.staff_attitude} /></TableCell>
                              <TableCell className="text-center"><RatingDot rating={fb.service_time} /></TableCell>
                              <TableCell className="text-center"><RatingDot rating={fb.cleanliness} /></TableCell>
                              <TableCell className="text-center">
                                <Badge className={`${ratingBadge[fb.overall_experience]} text-[10px] px-2`}>
                                  {formatRating(fb.overall_experience)}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setDetailFeedback(fb)}>
                                  <Eye className="w-3.5 h-3.5" />
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))}
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
            <AnalyticsPage />
          </TabsContent>
        </Tabs>
      </main>

      {/* ─── Detail Dialog ─── */}
      <Dialog open={!!detailFeedback} onOpenChange={() => setDetailFeedback(null)}>
        <DialogContent className="max-w-lg">
          {detailFeedback && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  {t(`feedback.${detailFeedback.meal_time}`)} — {format(new Date(detailFeedback.feedback_date), "dd MMM yyyy")}
                  {detailFeedback.place_name && <Badge variant="outline" className="text-xs">{detailFeedback.place_name}</Badge>}
                </DialogTitle>
              </DialogHeader>

              <div className="space-y-4 mt-2">
                {/* Food & Menu */}
                <div>
                  <h4 className="text-sm font-semibold mb-2 text-foreground">{t("admin.foodMenu")}</h4>
                  <div className="grid grid-cols-2 gap-2">
                    <DetailRow label={t("admin.temperature")} value={detailFeedback.food_temperature} />
                    <DetailRow label={t("admin.taste")} value={detailFeedback.food_taste} />
                    <DetailRow label={t("admin.aroma")} value={detailFeedback.food_aroma} />
                    <DetailRow label={t("admin.variety")} value={detailFeedback.menu_variety} />
                  </div>
                </div>

                {/* Service */}
                <div>
                  <h4 className="text-sm font-semibold mb-2 text-foreground">{t("admin.service")}</h4>
                  <div className="grid grid-cols-2 gap-2">
                    <DetailRow label={t("admin.staff")} value={detailFeedback.staff_attitude} />
                    <DetailRow label={t("admin.time")} value={detailFeedback.service_time} />
                    <DetailRow label={t("admin.clean")} value={detailFeedback.cleanliness} />
                  </div>
                </div>

                {/* Overall */}
                <div className="flex items-center justify-between bg-muted/50 rounded-lg p-3">
                  <span className="text-sm font-medium">{t("feedback.overallExperience")}</span>
                  <Badge className={`${ratingBadge[detailFeedback.overall_experience]} text-xs`}>
                    {formatRating(detailFeedback.overall_experience)}
                  </Badge>
                </div>

                {/* Suggestions */}
                {detailFeedback.suggestions && (
                  <div>
                    <h4 className="text-sm font-semibold mb-2">{t("feedback.suggestions")}</h4>
                    <p className="text-sm text-muted-foreground bg-muted p-3 rounded-md whitespace-pre-wrap">
                      {detailFeedback.suggestions}
                    </p>
                  </div>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
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

/* ── Detail row in the dialog ── */
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

export default AdminDashboard;
