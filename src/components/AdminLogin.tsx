import { useState } from "react";
import { useTranslation } from "react-i18next";
import { ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { toast } from "sonner";
import LanguageSwitcher from "./LanguageSwitcher";

interface AdminLoginProps {
  onLoginSuccess: () => void;
}

const AdminLogin = ({ onLoginSuccess }: AdminLoginProps) => {
  const { t } = useTranslation();
  const [passcode, setPasscode] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);

  const handleVerify = async () => {
    if (passcode.length !== 5) {
      toast.error(t('toast.enter5Digit'));
      return;
    }

    setIsVerifying(true);

    try {
      const response = await fetch('http://localhost:3001/api/admin/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ passcode }),
      });

      if (!response.ok) throw new Error('Verification failed');

      const data = await response.json();

      if (data.valid) {
        toast.success(t('toast.welcomeAdmin'));
        onLoginSuccess();
      } else {
        toast.error(t('toast.invalidPasscode'));
        setPasscode("");
      }
    } catch (error) {
      console.error("Error verifying passcode:", error);
      toast.error(t('toast.verificationFailed'));
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-card/80 backdrop-blur-md border-b border-border">
        <div className="container max-w-lg mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link
              to="/"
              className="p-2 ltr:-ml-2 rtl:-mr-2 rounded-full hover:bg-muted transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-muted-foreground rtl:rotate-180" />
            </Link>
            <img src="/logo.png" alt="Food City" className="h-9 w-auto" />
          </div>
          <LanguageSwitcher />
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center p-4">
        <Card className="w-full max-w-sm animate-scale-in">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4">
              <img src="/logo.png" alt="Food City" className="h-14 w-auto mx-auto" />
            </div>
            <CardTitle className="font-display text-xl">{t('admin.enterPasscode')}</CardTitle>
            <p className="text-sm text-muted-foreground mt-2">
              {t('admin.enterPasscodeDesc')}
            </p>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex justify-center" dir="ltr">
              <InputOTP
                maxLength={5}
                value={passcode}
                onChange={setPasscode}
              >
                <InputOTPGroup>
                  <InputOTPSlot index={0} />
                  <InputOTPSlot index={1} />
                  <InputOTPSlot index={2} />
                  <InputOTPSlot index={3} />
                  <InputOTPSlot index={4} />
                </InputOTPGroup>
              </InputOTP>
            </div>

            <Button
              onClick={handleVerify}
              className="w-full h-12"
              disabled={passcode.length !== 5 || isVerifying}
            >
              {isVerifying ? t('admin.verifying') : t('admin.loginButton')}
            </Button>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default AdminLogin;
