import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowRight, User, Loader2 } from "lucide-react";
import { authService } from "@/services/auth";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

const UsernameSetup = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [username, setUsername] = useState(localStorage.getItem("devfest-username")??"");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  useEffect(() => {
    if (localStorage.getItem("devfest-username")) {
      handleContinue()
    }
  }, [])
  const handleContinue = async () => {
    if (!username.trim()) {
      setError("Please enter a display name");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      // Call the backend API to register audience member
      const response = await authService.registerAudience(username.trim());

      // Store authentication in context and localStorage
      login(response.token, response.nickname || username.trim(), false);

      // Show success message
      toast.success(`Welcome, ${response.nickname}! 🎉`);

      // Navigate to sessions page
      navigate("/sessions");
    } catch (err: any) {
      console.error("Registration error:", err);

      // Handle specific error messages
      if (err.response?.data?.nickname) {
        setError(err.response.data.nickname[0]);
      } else if (err.response?.data?.error) {
        setError(err.response.data.error);
      } else {
        setError("This nickname is already taken. Please choose another.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleContinue();
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-12 space-y-4">
          {/* Icon */}
          <div className="flex justify-center mb-6">
            <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center">
              <User className="w-10 h-10 text-primary" />
            </div>
          </div>

          <h1 className="text-4xl font-bold text-foreground">
            Choose Your Display Name
          </h1>
          <p className="text-lg text-muted-foreground">
            This name will be shown next to your questions
          </p>
        </div>

        {/* Form */}
        <div className="space-y-6">
          <div className="space-y-2">
            <Input
              type="text"
              placeholder="Enter your name or nickname"
              value={username}
              onChange={(e) => {
                setUsername(e.target.value);
                setError("");
              }}
              onKeyPress={handleKeyPress}
              className="h-14 text-lg border-2 focus:border-primary transition-colors"
              maxLength={50}
              autoFocus
            />
            {error && (
              <p className="text-sm text-destructive animate-in fade-in slide-in-from-top-1">
                {error}
              </p>
            )}
            {username && (
              <p className="text-sm text-muted-foreground">
                {username.length}/50 characters
              </p>
            )}
          </div>

          <Button
            onClick={handleContinue}
            disabled={isLoading || !username.trim()}
            className="w-full h-14 text-lg font-medium shadow-material-md hover:shadow-material-lg transition-all"
            size="lg"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 w-5 h-5 animate-spin" />
                Registering...
              </>
            ) : (
              <>
                Continue
                <ArrowRight className="ml-2 w-5 h-5" />
              </>
            )}
          </Button>
        </div>

        {/* Back Link */}
        <div className="text-center mt-8">
          <button
            onClick={() => navigate("/")}
            className="text-muted-foreground hover:text-primary transition-colors text-sm"
          >
            ← Back to role selection
          </button>
        </div>
      </div>
    </div>
  );
};

export default UsernameSetup;
