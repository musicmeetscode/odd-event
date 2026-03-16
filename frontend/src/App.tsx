import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import RoleSelection from "./pages/RoleSelection";
import AttendeeRegister from "./pages/AttendeeRegister";
import AttendeeLogin from "./pages/AttendeeLogin";
import UsernameSetup from "./pages/UsernameSetup";
import SessionSelection from "./pages/SessionSelection";
import QuestionBoard from "./pages/QuestionBoard";
import SpeakerLogin from "./pages/SpeakerLogin";
import SpeakerDashboard from "./pages/SpeakerDashboard";
import SpeakerQAManagement from "./pages/SpeakerQAManagement";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<RoleSelection />} />
            <Route path="/attendee-register" element={<AttendeeRegister />} />
            <Route path="/attendee-login" element={<AttendeeLogin />} />
            <Route path="/username-setup" element={<UsernameSetup />} />
            <Route path="/speaker-login" element={<SpeakerLogin />} />
            <Route path="/questions" element={<QuestionBoard />} />

            <Route element={<ProtectedRoute />}>
              <Route path="/sessions" element={<SessionSelection />} />
              <Route path="/speaker-dashboard" element={<SpeakerDashboard />} />
            </Route>

            <Route element={<ProtectedRoute requireSpeaker />}>
              <Route path="/speaker-qa/:id" element={<SpeakerQAManagement />} />
            </Route>

            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
