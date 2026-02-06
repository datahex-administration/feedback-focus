import { useState, useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { QRCodeSVG } from "qrcode.react";
import { Plus, Copy, Download, Trash2, Edit2, MapPin, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3001";

interface Place {
  _id: string;
  name: string;
  name_ar: string;
  address: string;
  address_ar: string;
  slug: string;
  active: boolean;
  created_at: string;
}

const PlacesManager = () => {
  const { t, i18n } = useTranslation();
  const [places, setPlaces] = useState<Place[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [editingPlace, setEditingPlace] = useState<Place | null>(null);
  const [form, setForm] = useState({ name: "", name_ar: "", address: "", address_ar: "" });
  const qrRefs = useRef<Record<string, HTMLDivElement | null>>({});

  const isArabic = i18n.language === "ar";

  const fetchPlaces = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/places`);
      const data = await res.json();
      setPlaces(data);
    } catch {
      toast.error(t("toast.loadFailed"));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { fetchPlaces(); }, []);

  const getFeedbackUrl = (slug: string) => `${window.location.origin}/feedback/${slug}`;

  const handleSave = async () => {
    if (!form.name.trim()) return;
    try {
      if (editingPlace) {
        await fetch(`${API_URL}/api/places/${editingPlace._id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(form),
        });
        toast.success(t("admin.placeUpdated"));
      } else {
        await fetch(`${API_URL}/api/places`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(form),
        });
        toast.success(t("admin.placeCreated"));
      }
      setForm({ name: "", name_ar: "", address: "", address_ar: "" });
      setShowAddDialog(false);
      setEditingPlace(null);
      fetchPlaces();
    } catch {
      toast.error("Failed to save place");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm(t("admin.confirmDelete"))) return;
    try {
      await fetch(`${API_URL}/api/places/${id}`, { method: "DELETE" });
      toast.success(t("admin.placeDeleted"));
      fetchPlaces();
    } catch {
      toast.error("Failed to delete place");
    }
  };

  const handleToggleActive = async (place: Place) => {
    try {
      await fetch(`${API_URL}/api/places/${place._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ active: !place.active }),
      });
      fetchPlaces();
    } catch {
      toast.error("Failed to update place");
    }
  };

  const copyLink = (slug: string) => {
    navigator.clipboard.writeText(getFeedbackUrl(slug));
    toast.success(t("admin.linkCopied"));
  };

  const downloadQR = (slug: string, name: string) => {
    const container = qrRefs.current[slug];
    if (!container) return;
    const svg = container.querySelector("svg");
    if (!svg) return;

    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement("canvas");
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext("2d");
    const img = new Image();
    img.onload = () => {
      ctx?.drawImage(img, 0, 0, 512, 512);
      const link = document.createElement("a");
      link.download = `qr-${name.replace(/\s+/g, "-").toLowerCase()}.png`;
      link.href = canvas.toDataURL("image/png");
      link.click();
    };
    img.src = "data:image/svg+xml;base64," + btoa(unescape(encodeURIComponent(svgData)));
  };

  const openEdit = (place: Place) => {
    setEditingPlace(place);
    setForm({ name: place.name, name_ar: place.name_ar, address: place.address, address_ar: place.address_ar });
    setShowAddDialog(true);
  };

  const openAdd = () => {
    setEditingPlace(null);
    setForm({ name: "", name_ar: "", address: "", address_ar: "" });
    setShowAddDialog(true);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">{t("admin.places")}</h2>
        <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
          <DialogTrigger asChild>
            <Button size="sm" onClick={openAdd}>
              <Plus className="w-4 h-4 ltr:mr-2 rtl:ml-2" />
              {t("admin.addPlace")}
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingPlace ? t("admin.editPlace") : t("admin.addPlace")}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-2">
              <div>
                <Label>{t("admin.placeName")}</Label>
                <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. Food City Colombo" />
              </div>
              <div>
                <Label>{t("admin.placeNameAr")}</Label>
                <Input value={form.name_ar} onChange={(e) => setForm({ ...form, name_ar: e.target.value })} placeholder="مثال: فود سيتي كولومبو" dir="rtl" />
              </div>
              <div>
                <Label>{t("admin.address")}</Label>
                <Input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} placeholder="123 Main Street" />
              </div>
              <div>
                <Label>{t("admin.addressAr")}</Label>
                <Input value={form.address_ar} onChange={(e) => setForm({ ...form, address_ar: e.target.value })} placeholder="123 الشارع الرئيسي" dir="rtl" />
              </div>
              <div className="flex gap-2 justify-end">
                <Button variant="outline" onClick={() => setShowAddDialog(false)}>{t("admin.cancel")}</Button>
                <Button onClick={handleSave}>{t("admin.save")}</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div className="text-center py-12 text-muted-foreground">{t("admin.loading")}</div>
      ) : places.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <MapPin className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p>{t("admin.noPlaces")}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {places.map((place) => (
            <Card key={place._id}>
              <CardContent className="p-4">
                <div className="flex items-start gap-4">
                  {/* QR Code */}
                  <div
                    ref={(el) => { qrRefs.current[place.slug] = el; }}
                    className="shrink-0 p-2 bg-white rounded-lg"
                  >
                    <QRCodeSVG value={getFeedbackUrl(place.slug)} size={80} />
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold text-sm truncate">
                        {isArabic && place.name_ar ? place.name_ar : place.name}
                      </h3>
                      <Badge variant={place.active ? "default" : "secondary"} className="text-[10px]">
                        {place.active ? t("admin.active") : t("admin.inactive")}
                      </Badge>
                    </div>
                    {(isArabic ? place.address_ar : place.address) && (
                      <p className="text-xs text-muted-foreground mb-2 truncate">
                        {isArabic ? place.address_ar : place.address}
                      </p>
                    )}
                    <p className="text-[10px] text-muted-foreground font-mono truncate mb-2">
                      {getFeedbackUrl(place.slug)}
                    </p>

                    {/* Actions */}
                    <div className="flex flex-wrap gap-2">
                      <Button variant="outline" size="sm" className="h-7 text-xs" onClick={() => copyLink(place.slug)}>
                        <Copy className="w-3 h-3 ltr:mr-1 rtl:ml-1" />
                        {t("admin.copyLink")}
                      </Button>
                      <Button variant="outline" size="sm" className="h-7 text-xs" onClick={() => downloadQR(place.slug, place.name)}>
                        <Download className="w-3 h-3 ltr:mr-1 rtl:ml-1" />
                        {t("admin.downloadQR")}
                      </Button>
                      <Button variant="outline" size="sm" className="h-7 text-xs" onClick={() => openEdit(place)}>
                        <Edit2 className="w-3 h-3 ltr:mr-1 rtl:ml-1" />
                      </Button>
                      <div className="flex items-center gap-1">
                        <Switch checked={place.active} onCheckedChange={() => handleToggleActive(place)} />
                      </div>
                      <Button variant="ghost" size="sm" className="h-7 text-xs text-destructive hover:text-destructive" onClick={() => handleDelete(place._id)}>
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default PlacesManager;
