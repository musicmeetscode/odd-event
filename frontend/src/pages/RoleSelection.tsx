import { useNavigate, Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { CalendarDays } from "lucide-react";
import { useBrand } from "@/contexts/BrandContext";

const RoleSelection = () => {
  const { brand } = useBrand();
  const navigate = useNavigate();
  const { isAuthenticated, role } = useAuth();

  // Redirect authenticated users to their home page
  if (isAuthenticated) {
    if (role === "admin") return <Navigate to="/dashboard" replace />;
    if (role === "judge") return <Navigate to="/judge" replace />;
    return <Navigate to="/events" replace />;
  }

  return (
    <div className="flex items-center justify-center p-4 w-full h-full">
      <Card className="w-full max-w-md border-border/50 shadow-xl">
        <CardContent className="pt-8 pb-8 px-8">
          <div className="text-center mb-8">
            <img src={brand.logo || "/logo.png"} alt={brand.name} className="w-20 h-20 mx-auto mb-4" />
            <h1 className="text-3xl font-bold tracking-tight">
              {brand.name} <span className="text-primary">{brand.tagline}</span>
            </h1>
            <p className="text-muted-foreground mt-2">
              Discover events, compete, and connect
            </p>
          </div>

          <div className="space-y-3">
            <Button
              className="w-full h-14 text-base font-semibold gap-2"
              onClick={() => navigate("/login")}
            >
              <CalendarDays className="h-5 w-5" />
              Login
            </Button>

            <div className="relative my-4">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-border/50" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-card px-2 text-muted-foreground">or</span>
              </div>
            </div>

            <Button
              variant="outline"
              className="w-full h-12 text-sm"
              onClick={() => navigate("/register")}
            >
              Create an Account
            </Button>

            <Button
              variant="secondary"
              className="w-full h-12 text-sm"
              onClick={() => navigate("/check-in")}
            >
              Event Check-In
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default RoleSelection;
