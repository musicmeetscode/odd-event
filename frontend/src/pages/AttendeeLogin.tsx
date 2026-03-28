import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { authService } from "@/services/auth";
import { eventsService } from "@/services/events";
import { GoogleLogin, useGoogleOneTapLogin, CredentialResponse } from "@react-oauth/google";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";

const Login = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleGoogleSuccess = async (credentialResponse: CredentialResponse) => {
    try {
      setIsLoading(true);
      if (!credentialResponse.credential) {
        throw new Error("No credential received from Google");
      }
      const data = await eventsService.googleLogin(credentialResponse.credential);
      login(data.token, data.username, data.role);
      toast.success(`Welcome back, ${data.display_name || data.username}!`);
      
      if (data.role === "judge") navigate("/judge");
      else navigate("/events");
    } catch (error) {
      console.error("Google Login Error:", error);
      toast.error("Google Sign-In failed. Please check your account or try again.");
    } finally {
      setIsLoading(false);
    }
  };

  useGoogleOneTapLogin({
    onSuccess: handleGoogleSuccess,
    onError: () => console.error("One Tap Login Failed"),
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) return;

    setIsLoading(true);
    try {
      const data = await authService.login(username, password);
      login(data.token, data.username, data.role);

      if (data.must_reset_password) {
        toast.info("Please set a new password to continue.");
        navigate("/reset-password");
        return;
      }

      toast.success(`Welcome back, ${data.display_name || data.username}!`);

      if (data.role === "judge") {
        navigate("/judge");
      } else {
        navigate("/events");
      }
    } catch (error: unknown) {
      const err = error as { response?: { data?: { non_field_errors?: string[] } } };
      toast.error(
        err.response?.data?.non_field_errors?.[0] ||
          "Invalid credentials. Please try again."
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center p-4 w-full h-full">
      <Card className="w-full max-w-md border-border/50 shadow-xl">
        <CardHeader className="text-center pb-2">
          <img src="/logo.png" alt="Blue Ox Events" className="w-14 h-14 mx-auto mb-2" />
          <CardTitle className="text-2xl">Sign In</CardTitle>
          <p className="text-sm text-muted-foreground">
            Login to access your events
          </p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter your username"
                autoComplete="username"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                autoComplete="current-password"
              />
            </div>

            <Button type="submit" className="w-full h-11" disabled={isLoading}>
              {isLoading ? "Signing in..." : "Sign In"}
            </Button>
          </form>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <Separator className="w-full" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">Or continue with</span>
            </div>
          </div>

          <div className="mt-8 flex flex-col items-center space-y-4">
            <GoogleLogin
              onSuccess={handleGoogleSuccess}
              onError={() => toast.error("Google login failed. Check console for details.")}
              useOneTap
              theme="outline"
              size="large"
              shape="pill"
              text="signin_with"
              width="320"
            />
            
            <p className="text-[11px] text-muted-foreground leading-relaxed text-center px-6">
              By signing in, you agree to our{" "}
              <Link to="/privacy" className="text-primary hover:underline font-medium">Privacy Policy & Terms</Link>. 
              You acknowledge that event media may be used for <b>AI training</b> and promotional purposes.
            </p>
          </div>

          <p className="text-center text-sm text-muted-foreground mt-6">
            Don't have an account?{" "}
            <Link to="/register" className="text-primary hover:underline font-medium">
              Register
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default Login;
