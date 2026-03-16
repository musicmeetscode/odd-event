import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Mic, Loader2, Eye, EyeOff } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { authService } from "@/services/auth";
import { useAuth } from "@/contexts/AuthContext";
import { toast as sonnerToast } from "sonner";

const SpeakerLogin = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { login } = useAuth();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!username.trim() ) {
      toast({
        title: "Something is not right ..",
        description: "Yup. We need that code",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      // Call backend API for speaker authentication
      const response = await authService.loginSpeaker(username.trim(), password);

      // Store authentication in context and localStorage
      login(response.token, response.username || username, true);

      // Show success message: This might be the problematic area
      sonnerToast.success(`Welcome, ${username}! 🎤`);

      // Navigate to speaker dashboard
      navigate("/speaker-dashboard");
    } catch (err: any) {
      console.error("Login error:", err);

      // Handle specific error messages
      if (err.response?.status === 403) {
        toast({
          title: "Access Denied",
          description: "Only speakers can log in here. Please use the correct credentials.",
          variant: "destructive",
        });
      } else if (err.response?.status === 400) {
        toast({
          title: "Invalid Credentials",
          description: "Please check your username and password",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Login Failed",
          description: "Unable to connect to the server. Please try again.",
          variant: "destructive",
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Back Button */}
        <button
          onClick={() => navigate("/")}
          className="mb-6 flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to role selection
        </button>

        {/* Login Card */}
        <div className="bg-card rounded-xl p-8 shadow-material-lg border border-border">
          {/* Icon */}
          <div className="flex justify-center mb-6">
            <div className="w-16 h-16 rounded-full bg-secondary/10 flex items-center justify-center">
              <Mic className="w-8 h-8 text-secondary" />
            </div>
          </div>

          {/* Title */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-foreground mb-2">
              Speaker Login
            </h1>
            <p className="text-muted-foreground">
              Remember your speaker code? 
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleLogin} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="username">Unha. The code please</Label>
              <Input
                id="username"
                type="text"
                placeholder="Enter your speaker code"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="h-12"
              />
            </div>

            <div className="space-y-2 hidden">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="h-12 pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  disabled={isLoading}
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              className="w-full h-12 text-base"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 w-4 h-4 animate-spin" />
                  Just a moment...
                </>
              ) : (
                "Let me in"
              )}
            </Button>
          </form>
        </div>

        {/* Footer */}
        <p className="text-center text-sm text-muted-foreground mt-6">
          Having trouble? Contact the event organizers
        </p>
      </div>
    </div>
  );
};

export default SpeakerLogin;
