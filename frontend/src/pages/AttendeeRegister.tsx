import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { authService } from "@/services/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";

import { format } from "date-fns";

const toTitleCase = (str: string) => {
  return str.toLowerCase().split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
};

const AttendeeRegister = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) {
      toast.error("Username and Password are required.");
      return;
    }

    if (displayName.trim() && displayName.trim().length < 3) {
      toast.error("Display Name must be at least 3 characters.");
      return;
    }

    const safePattern = /^[a-zA-Z0-9 .-]+$/;
    if (displayName.trim() && !safePattern.test(displayName)) {
      toast.error("Display Name can only contain alphanumeric characters, spaces, dots, and hyphens.");
      return;
    }

    setIsLoading(true);
    try {
      const formattedName = displayName.trim() ? toTitleCase(displayName.trim()) : undefined;
      const data = await authService.register(username, password, formattedName);
      login(data.token, data.username, data.role);
      toast.success("Account created! Welcome aboard 🎉");
      navigate("/events");
    } catch (error: unknown) {
      const err = error as { response?: { data?: Record<string, string[]> } };
      const firstError =
        err.response?.data?.username?.[0] ||
        err.response?.data?.error ||
        "Registration failed. Please try again.";
      toast.error(String(firstError));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center p-4 w-full h-full">
      <Card className="w-full max-w-md border-border/50 shadow-xl">
        <CardHeader className="text-center pb-2">
          <img src="/logo.png" alt="Blue Ox Events" className="w-14 h-14 mx-auto mb-2" />
          <CardTitle className="text-2xl">Create Account</CardTitle>
          <p className="text-sm text-muted-foreground">
            Join to discover and attend events
          </p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="displayName">Display Name</Label>
              <Input
                id="displayName"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="How should we call you?"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Choose a username"
                autoComplete="username"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Min 6 characters"
                autoComplete="new-password"
                required
                minLength={6}
              />
            </div>

            <p className="text-[11px] text-muted-foreground leading-relaxed text-center px-2">
              By creating an account, you agree to our{" "}
              <Link to="/privacy" className="text-primary hover:underline font-medium">Privacy Policy & Terms</Link>. 
              You acknowledge that event media may be used for promotional and <b>AI training</b> purposes.
            </p>

            <Button type="submit" className="w-full h-11" disabled={isLoading}>
              {isLoading ? "Creating..." : "Create Account"}
            </Button>
          </form>

          <p className="text-center text-sm text-muted-foreground mt-6">
            Already have an account?{" "}
            <Link to="/login" className="text-primary hover:underline font-medium">
              Sign In
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default AttendeeRegister;
