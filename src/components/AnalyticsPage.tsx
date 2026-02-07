import { useState, useEffect, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { X, TrendingUp, Star, AlertTriangle, Utensils } from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend, RadarChart, PolarGrid,
  PolarAngleAxis, PolarRadiusAxis, Radar, Area, AreaChart,
} from "recharts";
import { QUESTIONNAIRE_OPTIONS, getQuestionnaire, type QuestionnaireType } from "@/lib/questionnaires";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3001";

const COLORS = ["#22c55e", "#3b82f6", "#f59e0b", "#f97316", "#ef4444"];
const YESNO_COLORS = ["#22c55e", "#ef4444"];
const CHOICE_COLORS = ["#3b82f6", "#f59e0b", "#8b5cf6", "#22c55e", "#ef4444", "#f97316"];

interface Place {
  _id: string;
  name: string;
  name_ar: string;
  slug: string;
  questionnaire_type?: string;
}

interface Stats {
  total: number;
  byRating: Record<string, number>;
  byMealTime?: Record<string, number>;
  byCategory?: Record<string, Record<string, number>>;
  byField?: Record<string, Record<string, number>>;
  byDate: { date: string; count: number }[];
}

const FOOD_CATEGORY_FIELDS = [
  "food_temperature", "food_taste", "food_aroma", "menu_variety",
  "staff_attitude", "service_time", "cleanliness",
];

const AnalyticsPage = () => {
  const { t, i18n } = useTranslation();
  const isArabic = i18n.language === "ar";
  const [places, setPlaces] = useState<Place[]>([]);
  const [selectedQuestionnaire, setSelectedQuestionnaire] = useState<QuestionnaireType>("food");
  const [stats, setStats] = useState<Stats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedPlace, setSelectedPlace] = useState("all");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  const hasFilters = selectedPlace !== "all" || fromDate || toDate;

  useEffect(() => {
    fetch(`${API_URL}/api/places`).then(r => r.json()).then(setPlaces).catch(() => {});
  }, []);

  useEffect(() => { fetchStats(); }, [selectedPlace, fromDate, toDate, selectedQuestionnaire]);

  const fetchStats = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (selectedPlace !== "all") params.set("place_slug", selectedPlace);
      if (fromDate) params.set("from_date", fromDate);
      if (toDate) params.set("to_date", toDate);
      params.set("questionnaire_type", selectedQuestionnaire);
      const res = await fetch(`${API_URL}/api/feedback/stats?${params}`);
      setStats(await res.json());
    } catch {
      setStats(null);
    } finally {
      setIsLoading(false);
    }
  };

  const clearFilters = () => { setSelectedPlace("all"); setFromDate(""); setToDate(""); };

  /* Filter places by selected questionnaire type */
  const filteredPlaces = useMemo(() =>
    places.filter(p => !p.questionnaire_type || p.questionnaire_type === selectedQuestionnaire),
    [places, selectedQuestionnaire]
  );

  const config = getQuestionnaire(selectedQuestionnaire);
  const ratingKeys = config.ratingScale.map(r => r.value);
  const ratingScoreMap = Object.fromEntries(config.ratingScale.map(r => [r.value, r.score]));

  /* ── Derived Data ── */

  const ratingPieData = useMemo(() =>
    stats ? ratingKeys.map((key, i) => ({
      name: t(`ratings.${key}`),
      value: stats.byRating[key] || 0,
      color: COLORS[i % COLORS.length],
      pct: stats.total ? Math.round(((stats.byRating[key] || 0) / stats.total) * 100) : 0,
    })).filter(d => d.value > 0) : [], [stats, t, ratingKeys]);

  const mealBarData = useMemo(() =>
    stats && stats.byMealTime ? ["breakfast", "lunch", "dinner"].map(m => ({
      name: t(`feedback.${m}`),
      count: stats.byMealTime![m] || 0,
      pct: stats.total ? Math.round(((stats.byMealTime![m] || 0) / stats.total) * 100) : 0,
    })) : [], [stats, t]);

  const foodCategoryLabels: Record<string, string> = {
    food_temperature: t("feedback.foodTemperature"),
    food_taste: t("feedback.foodTaste"),
    food_aroma: t("feedback.foodAroma"),
    menu_variety: t("feedback.menuVariety"),
    staff_attitude: t("feedback.staffAttitude"),
    service_time: t("feedback.serviceTime"),
    cleanliness: t("feedback.cleanliness"),
  };

  /* Stacked bar data for category breakdown (food) */
  const categoryChartData = useMemo(() =>
    stats && stats.byCategory ? FOOD_CATEGORY_FIELDS.map(cat => ({
      category: foodCategoryLabels[cat] || cat,
      ...Object.fromEntries(ratingKeys.map(r => [t(`ratings.${r}`), stats.byCategory![cat]?.[r] || 0])),
    })) : [], [stats, t, ratingKeys]);

  /* Radar chart (food) */
  const radarData = useMemo(() => {
    if (!stats || !stats.byCategory) return [];
    return FOOD_CATEGORY_FIELDS.map(cat => {
      const ratings = stats.byCategory![cat] || {};
      const totalInCat = Object.values(ratings).reduce((s, v) => s + v, 0);
      const weightedSum = Object.entries(ratings).reduce(
        (s, [r, count]) => s + (ratingScoreMap[r] || 0) * count, 0
      );
      return {
        category: foodCategoryLabels[cat] || cat,
        score: totalInCat ? +(weightedSum / totalInCat).toFixed(2) : 0,
        fullMark: 5,
      };
    });
  }, [stats, t, ratingScoreMap]);

  /* Yes/No field chart data (toilet/laundry) */
  const yesNoChartData = useMemo(() => {
    if (!stats || !stats.byField) return [];
    return config.radioFields
      .filter(f => {
        const vals = stats.byField![f];
        if (!vals) return false;
        const keys = Object.keys(vals);
        return keys.every(k => ["yes", "no"].includes(k));
      })
      .map(f => {
        const vals = stats.byField![f] || {};
        const fieldConfig = config.sections.flatMap(s => s.fields).find(ff => ff.id === f);
        return {
          field: f,
          label: fieldConfig ? t(fieldConfig.labelKey) : f,
          yes: vals.yes || 0,
          no: vals.no || 0,
        };
      });
  }, [stats, config, t]);

  /* Choice field chart data (toilet/laundry: area, frequency, ironing, issues) */
  const choiceChartData = useMemo(() => {
    if (!stats || !stats.byField) return [];
    return config.radioFields
      .filter(f => {
        const vals = stats.byField![f];
        if (!vals) return false;
        const keys = Object.keys(vals);
        return !keys.every(k => ["yes", "no"].includes(k));
      })
      .map(f => {
        const vals = stats.byField![f] || {};
        const fieldConfig = config.sections.flatMap(s => s.fields).find(ff => ff.id === f);
        return {
          field: f,
          label: fieldConfig ? t(fieldConfig.labelKey) : f,
          data: Object.entries(vals).map(([key, count], i) => {
            const optConfig = fieldConfig?.options?.find(o => o.value === key);
            return {
              name: optConfig ? t(optConfig.labelKey) : key,
              value: count,
              color: CHOICE_COLORS[i % CHOICE_COLORS.length],
            };
          }),
        };
      });
  }, [stats, config, t]);

  /* Trend data */
  const trendData = useMemo(() =>
    stats?.byDate?.map(d => ({ date: d.date, count: d.count })) || [], [stats]);

  /* Satisfaction score */
  const satisfactionScore = useMemo(() => {
    if (!stats || !stats.total) return 0;
    const positiveKeys = ratingKeys.slice(0, Math.ceil(ratingKeys.length / 2) + (ratingKeys.length % 2 === 0 ? 0 : 0));
    // Top 3 ratings are "positive"
    const topN = Math.min(3, ratingKeys.length);
    const positive = ratingKeys.slice(0, topN).reduce((s, k) => s + (stats.byRating[k] || 0), 0);
    return Math.round((positive / stats.total) * 100);
  }, [stats, ratingKeys]);

  /* Best & worst category (food only) */
  const categoryScores = useMemo(() => {
    if (!stats || !stats.byCategory) return { best: "", worst: "", bestScore: 0, worstScore: 0 };
    let best = "", worst = "", bestScore = 0, worstScore = 6;
    for (const cat of FOOD_CATEGORY_FIELDS) {
      const ratings = stats.byCategory[cat] || {};
      const total = Object.values(ratings).reduce((s, v) => s + v, 0);
      const score = total
        ? Object.entries(ratings).reduce((s, [r, c]) => s + (ratingScoreMap[r] || 0) * c, 0) / total
        : 0;
      if (score > bestScore) { bestScore = score; best = cat; }
      if (score < worstScore && total > 0) { worstScore = score; worst = cat; }
    }
    return { best, worst, bestScore: +bestScore.toFixed(1), worstScore: +worstScore.toFixed(1) };
  }, [stats, ratingScoreMap]);

  /* Custom tooltip for pie */
  const PieTooltip = ({ active, payload }: any) => {
    if (active && payload?.length) {
      const d = payload[0].payload;
      return (
        <div className="bg-card border border-border rounded-lg px-3 py-2 shadow-md text-xs">
          <p className="font-semibold">{d.name}</p>
          <p>{d.value} ({d.pct}%)</p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-6">
      {/* Questionnaire Type Tabs */}
      <Tabs value={selectedQuestionnaire} onValueChange={(v) => { setSelectedQuestionnaire(v as QuestionnaireType); setSelectedPlace("all"); }}>
        <TabsList className="grid w-full grid-cols-3">
          {QUESTIONNAIRE_OPTIONS.map(q => (
            <TabsTrigger key={q.value} value={q.value}>{t(q.labelKey)}</TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 items-end">
            <div>
              <Label className="text-xs mb-1 block">{t("admin.places")}</Label>
              <Select value={selectedPlace} onValueChange={setSelectedPlace}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t("admin.allPlaces")}</SelectItem>
                  {filteredPlaces.map(p => (
                    <SelectItem key={p.slug} value={p.slug}>
                      {isArabic && p.name_ar ? p.name_ar : p.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs mb-1 block">{t("admin.fromDate")}</Label>
              <Input type="date" value={fromDate} onChange={e => setFromDate(e.target.value)} />
            </div>
            <div>
              <Label className="text-xs mb-1 block">{t("admin.toDate")}</Label>
              <Input type="date" value={toDate} onChange={e => setToDate(e.target.value)} />
            </div>
            <div>
              {hasFilters && (
                <Button variant="ghost" size="sm" className="w-full" onClick={clearFilters}>
                  <X className="w-4 h-4 ltr:mr-1 rtl:ml-1" />{t("admin.clearFilters")}
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {isLoading ? (
        <div className="text-center py-16 text-muted-foreground">{t("admin.loading")}</div>
      ) : !stats || stats.total === 0 ? (
        <div className="text-center py-16 text-muted-foreground">{t("admin.noFeedback")}</div>
      ) : (
        <>
          {/* ═══ KPI CARDS ═══ */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <Card>
              <CardContent className="p-4 text-center space-y-1">
                <Utensils className="w-5 h-5 mx-auto text-primary" />
                <div className="text-3xl font-bold">{stats.total}</div>
                <div className="text-[11px] text-muted-foreground">{t("admin.totalResponses")}</div>
              </CardContent>
            </Card>
            <Card className="border-emerald-200 bg-emerald-50/30">
              <CardContent className="p-4 text-center space-y-1">
                <TrendingUp className="w-5 h-5 mx-auto text-emerald-600" />
                <div className="text-3xl font-bold text-emerald-600">{satisfactionScore}%</div>
                <div className="text-[11px] text-muted-foreground">{t("admin.satisfactionRate")}</div>
              </CardContent>
            </Card>
            {selectedQuestionnaire === "food" && (
              <>
                <Card className="border-blue-200 bg-blue-50/30">
                  <CardContent className="p-4 text-center space-y-1">
                    <Star className="w-5 h-5 mx-auto text-blue-600" />
                    <div className="text-lg font-bold text-blue-600 leading-tight">
                      {foodCategoryLabels[categoryScores.best] || "—"}
                    </div>
                    <div className="text-[11px] text-muted-foreground">{t("admin.bestCategory")} ({categoryScores.bestScore}/5)</div>
                  </CardContent>
                </Card>
                <Card className="border-orange-200 bg-orange-50/30">
                  <CardContent className="p-4 text-center space-y-1">
                    <AlertTriangle className="w-5 h-5 mx-auto text-orange-600" />
                    <div className="text-lg font-bold text-orange-600 leading-tight">
                      {foodCategoryLabels[categoryScores.worst] || "—"}
                    </div>
                    <div className="text-[11px] text-muted-foreground">{t("admin.needsAttention")} ({categoryScores.worstScore}/5)</div>
                  </CardContent>
                </Card>
              </>
            )}
          </div>

          {/* ═══ OVERALL RATING BREAKDOWN ═══ */}
          <Card>
            <CardHeader className="pb-0">
              <CardTitle className="text-sm">{t("admin.overallRatings")}</CardTitle>
              <CardDescription className="text-xs">Distribution of overall experience ratings</CardDescription>
            </CardHeader>
            <CardContent className="pt-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
                <ResponsiveContainer width="100%" height={260}>
                  <PieChart>
                    <Pie
                      data={ratingPieData} cx="50%" cy="50%"
                      innerRadius={55} outerRadius={95}
                      dataKey="value" paddingAngle={2}
                    >
                      {ratingPieData.map((entry, i) => (
                        <Cell key={i} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip content={<PieTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="space-y-2">
                  {ratingKeys.map((key, i) => {
                    const count = stats.byRating[key] || 0;
                    const pct = stats.total ? Math.round((count / stats.total) * 100) : 0;
                    return (
                      <div key={key} className="space-y-0.5">
                        <div className="flex items-center justify-between text-xs">
                          <div className="flex items-center gap-2">
                            <span className="inline-block w-3 h-3 rounded-sm" style={{ background: COLORS[i % COLORS.length] }} />
                            <span>{t(`ratings.${key}`)}</span>
                          </div>
                          <span className="font-medium">{count} ({pct}%)</span>
                        </div>
                        <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all"
                            style={{ width: `${pct}%`, background: COLORS[i % COLORS.length] }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* ═══ FOOD-SPECIFIC CHARTS ═══ */}
          {selectedQuestionnaire === "food" && (
            <>
              {/* Meal Time + Radar */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card>
                  <CardHeader className="pb-0">
                    <CardTitle className="text-sm">{t("admin.mealTimeDistribution")}</CardTitle>
                    <CardDescription className="text-xs">Feedback count by meal period</CardDescription>
                  </CardHeader>
                  <CardContent className="pt-4">
                    <ResponsiveContainer width="100%" height={240}>
                      <BarChart data={mealBarData} barSize={40}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                        <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                        <YAxis allowDecimals={false} />
                        <Tooltip formatter={(value: number, _: string, props: any) => [`${value} (${props.payload.pct}%)`, "Count"]} />
                        <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                          {mealBarData.map((_, i) => (
                            <Cell key={i} fill={["#f59e0b", "#3b82f6", "#8b5cf6"][i]} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-0">
                    <CardTitle className="text-sm">{t("admin.qualityRadar")}</CardTitle>
                    <CardDescription className="text-xs">Average score per category (out of 5)</CardDescription>
                  </CardHeader>
                  <CardContent className="pt-4">
                    <ResponsiveContainer width="100%" height={240}>
                      <RadarChart data={radarData}>
                        <PolarGrid stroke="hsl(var(--border))" />
                        <PolarAngleAxis dataKey="category" tick={{ fontSize: 10 }} />
                        <PolarRadiusAxis domain={[0, 5]} tick={{ fontSize: 9 }} />
                        <Radar dataKey="score" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.25} strokeWidth={2} />
                        <Tooltip formatter={(v: number) => [`${v} / 5`, t("admin.avgScore")]} />
                      </RadarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </div>

              {/* Category Breakdown */}
              <Card>
                <CardHeader className="pb-0">
                  <CardTitle className="text-sm">{t("admin.categoryBreakdown")}</CardTitle>
                  <CardDescription className="text-xs">Rating distribution for every feedback category</CardDescription>
                </CardHeader>
                <CardContent className="pt-4">
                  <ResponsiveContainer width="100%" height={FOOD_CATEGORY_FIELDS.length * 52 + 40}>
                    <BarChart data={categoryChartData} layout="vertical" barCategoryGap={8}>
                      <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                      <XAxis type="number" allowDecimals={false} />
                      <YAxis dataKey="category" type="category" width={110} tick={{ fontSize: 11 }} />
                      <Tooltip />
                      <Legend wrapperStyle={{ fontSize: 11 }} />
                      {ratingKeys.map((key, i) => (
                        <Bar key={key} dataKey={t(`ratings.${key}`)} stackId="a" fill={COLORS[i % COLORS.length]} radius={i === 0 ? [0, 4, 4, 0] : undefined} />
                      ))}
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Category Scores Summary */}
              <Card>
                <CardHeader className="pb-0">
                  <CardTitle className="text-sm">{t("admin.categoryScoresSummary")}</CardTitle>
                  <CardDescription className="text-xs">Average score and breakdown for each category</CardDescription>
                </CardHeader>
                <CardContent className="pt-4">
                  <div className="space-y-3">
                    {radarData.map((item, idx) => {
                      const pct = Math.round((item.score / 5) * 100);
                      const color = pct >= 80 ? "#22c55e" : pct >= 60 ? "#3b82f6" : pct >= 40 ? "#f59e0b" : "#ef4444";
                      return (
                        <div key={idx} className="space-y-1">
                          <div className="flex items-center justify-between text-xs">
                            <span className="font-medium">{item.category}</span>
                            <div className="flex items-center gap-2">
                              <span className="font-bold" style={{ color }}>{item.score}/5</span>
                              <Badge variant="outline" className="text-[10px] px-1.5" style={{ borderColor: color, color }}>
                                {pct}%
                              </Badge>
                            </div>
                          </div>
                          <div className="w-full h-2.5 bg-muted rounded-full overflow-hidden">
                            <div className="h-full rounded-full transition-all duration-500" style={{ width: `${pct}%`, background: color }} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            </>
          )}

          {/* ═══ TOILET / LAUNDRY SPECIFIC CHARTS ═══ */}
          {(selectedQuestionnaire === "toilet" || selectedQuestionnaire === "laundry") && (
            <>
              {/* Yes/No Distribution */}
              {yesNoChartData.length > 0 && (
                <Card>
                  <CardHeader className="pb-0">
                    <CardTitle className="text-sm">{t("admin.yesNoDistribution")}</CardTitle>
                    <CardDescription className="text-xs">Response distribution for Yes/No questions</CardDescription>
                  </CardHeader>
                  <CardContent className="pt-4">
                    <div className="space-y-4">
                      {yesNoChartData.map((item) => {
                        const total = item.yes + item.no;
                        const yesPct = total ? Math.round((item.yes / total) * 100) : 0;
                        const noPct = total ? Math.round((item.no / total) * 100) : 0;
                        return (
                          <div key={item.field} className="space-y-1.5">
                            <div className="text-xs font-medium">{item.label}</div>
                            <div className="flex items-center gap-2">
                              <div className="flex-1 h-6 bg-muted rounded-full overflow-hidden flex">
                                {yesPct > 0 && (
                                  <div
                                    className="h-full bg-emerald-500 flex items-center justify-center text-[10px] font-medium text-white"
                                    style={{ width: `${yesPct}%` }}
                                  >
                                    {yesPct > 10 ? `${t("common.yes")} ${yesPct}%` : ""}
                                  </div>
                                )}
                                {noPct > 0 && (
                                  <div
                                    className="h-full bg-red-500 flex items-center justify-center text-[10px] font-medium text-white"
                                    style={{ width: `${noPct}%` }}
                                  >
                                    {noPct > 10 ? `${t("common.no")} ${noPct}%` : ""}
                                  </div>
                                )}
                              </div>
                              <span className="text-[10px] text-muted-foreground w-12 text-right">{total}</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Choice Fields Distribution */}
              {choiceChartData.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {choiceChartData.map((item) => (
                    <Card key={item.field}>
                      <CardHeader className="pb-0">
                        <CardTitle className="text-sm">{item.label}</CardTitle>
                        <CardDescription className="text-xs">{t("admin.fieldDistribution")}</CardDescription>
                      </CardHeader>
                      <CardContent className="pt-4">
                        <ResponsiveContainer width="100%" height={200}>
                          <PieChart>
                            <Pie
                              data={item.data} cx="50%" cy="50%"
                              innerRadius={40} outerRadius={70}
                              dataKey="value" paddingAngle={2}
                            >
                              {item.data.map((entry, i) => (
                                <Cell key={i} fill={entry.color} />
                              ))}
                            </Pie>
                            <Tooltip />
                            <Legend wrapperStyle={{ fontSize: 11 }} />
                          </PieChart>
                        </ResponsiveContainer>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </>
          )}

          {/* ═══ TREND (all types) ═══ */}
          {trendData.length > 1 && (
            <Card>
              <CardHeader className="pb-0">
                <CardTitle className="text-sm">{t("admin.feedbackTrend")}</CardTitle>
                <CardDescription className="text-xs">{t("admin.dailyVolume")}</CardDescription>
              </CardHeader>
              <CardContent className="pt-4">
                <ResponsiveContainer width="100%" height={260}>
                  <AreaChart data={trendData}>
                    <defs>
                      <linearGradient id="trendGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                    <YAxis allowDecimals={false} />
                    <Tooltip />
                    <Area
                      type="monotone" dataKey="count"
                      stroke="#3b82f6" strokeWidth={2}
                      fill="url(#trendGradient)"
                      dot={{ r: 3, fill: "#3b82f6" }}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
};

export default AnalyticsPage;
