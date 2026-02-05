import { useState } from "react";
import { Lock, ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

interface AdminLoginProps {
  onLoginSuccess: () => void;
}

const AdminLogin = ({ onLoginSuccess }: AdminLoginProps) => {
  const [passcode, setPasscode] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);

  const handleVerify = async () => {
    if (passcode.length !== 5) {
      toast.error("Please enter a 5-digit passcode");
      return;
    }

    setIsVerifying(true);

    try {
      const { data, error } = await supabase
        .from("admin_settings")
        .select("setting_value")
        .eq("setting_key", "admin_passcode")
        .single();

      if (error) throw error;

      if (data.setting_value === passcode) {
        toast.success("Welcome, Admin!");
        onLoginSuccess();
      } else {
        toast.error("Invalid passcode");
        setPasscode("");
      }
    } catch (error) {
      console.error("Error verifying passcode:", error);
      toast.error("Verification failed. Please try again.");
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-card/80 backdrop-blur-md border-b border-border">
        <div className="container max-w-lg mx-auto px-4 py-4 flex items-center">
          <Link 
            to="/" 
            className="p-2 -ml-2 rounded-full hover:bg-muted transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-muted-foreground" />
          </Link>
          <h1 className="font-display text-xl font-semibold text-foreground ml-2">
            Admin Login
          </h1>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center p-4">
        <Card className="w-full max-w-sm animate-scale-in">
          <CardHeader className="text-center">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
              <Lock className="w-8 h-8 text-primary" />
            </div>
            <CardTitle className="font-display text-xl">Enter Passcode</CardTitle>
            <p className="text-sm text-muted-foreground mt-2">
              Enter your 5-digit admin passcode
            </p>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex justify-center">
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
              {isVerifying ? "Verifying..." : "Login"}
            </Button>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default AdminLogin;
