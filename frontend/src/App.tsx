import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { BrandProvider } from "@/contexts/BrandContext";
import { GoogleOAuthProvider } from "@react-oauth/google";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import Layout from "@/components/Layout";
import RoleSelection from "./pages/RoleSelection";
import AttendeeRegister from "./pages/AttendeeRegister";
import Login from "./pages/AttendeeLogin";
import EventList from "./pages/EventList";
import EventDetail from "./pages/EventDetail";
import SubmissionForm from "./pages/SubmissionForm";
import JudgeDashboard from "./pages/JudgeDashboard";
import Leaderboard from "./pages/Leaderboard";
import QuestionBoard from "./pages/QuestionBoard";
import CheckIn from "./pages/CheckIn";
import ResetPassword from "./pages/ResetPassword";
import AdminEventForm from "./pages/AdminEventForm";
import Agenda from "./pages/Agenda";
import Speakers from "./pages/Speakers";
import Certificate from "./pages/Certificate";
import Dashboard from "./pages/Dashboard";
import Users from "./pages/Users";
import Settings from "./pages/Settings";
import WallOfFame from "./pages/WallOfFame";
import LandingPage from "./pages/LandingPage";
import ProfileCard from "./pages/ProfileCard";
import Privacy from "./pages/Privacy";
import PublicSubmission from "./pages/PublicSubmission";
import AdminAssetManagement from "./pages/AdminAssetManagement";
import ManageBuddyGroups from "./pages/ManageBuddyGroups";
import NotFound from "./pages/NotFound";
import ScrollToTop from "./components/ScrollToTop";
import UserGuideWidget from "./components/UserGuideWidget";

const queryClient = new QueryClient();
const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || "503556441696-noc9guh0kb19hr11pqtlmeo0cl3efsbr.apps.googleusercontent.com";

const App = () => (
  <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
    <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <BrandProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
          <ScrollToTop />
          <Routes>
            {/* Public */}
            <Route element={<Layout />}>
              <Route path="/" element={<LandingPage />} />
              <Route path="/register" element={<AttendeeRegister />} />
              <Route path="/login" element={<Login />} />
              <Route path="/check-in" element={<CheckIn />} />
              <Route path="/events/:eventId/wall-of-fame" element={<WallOfFame />} />
              <Route path="/profile/:eventId/:userId?" element={<ProfileCard />} />
              <Route path="/privacy" element={<Privacy />} />
              <Route path="/verify/:id" element={<PublicSubmission />} />
              <Route path="/admin/assets" element={<AdminAssetManagement />} />
            </Route>

            {/* Protected: any authenticated user */}
            <Route element={<ProtectedRoute />}>
              <Route path="/events/:id/leaderboard" element={<Leaderboard />} />
              <Route element={<Layout />}>
              <Route path="/events" element={<EventList />} />
                <Route path="/events/create" element={<AdminEventForm />} />
                <Route path="/events/:id/edit" element={<AdminEventForm />} />
                <Route path="/events/:id" element={<EventDetail />} />
                <Route path="/events/:id/submit" element={<SubmissionForm />} />
                <Route path="/events/:id/agenda" element={<Agenda />} />
                <Route path="/events/:id/speakers" element={<Speakers />} />
                <Route path="/events/:id/certificate" element={<Certificate />} />
                <Route path="/events/:id/sessions/:sid/questions" element={<QuestionBoard />} />
                <Route path="/reset-password" element={<ResetPassword />} />
                <Route path="/settings" element={<Settings />} />
                
                {/* Protected: judges only */}
                <Route element={<ProtectedRoute requireRole="judge" />}>
                  <Route path="/judge" element={<JudgeDashboard />} />
                </Route>
                
                {/* Protected: admin only */}
                <Route element={<ProtectedRoute requireRole="admin" />}>
                  <Route path="/dashboard" element={<Dashboard />} />
                  <Route path="/users" element={<Users />} />
                  <Route path="/events/:id/buddy-groups" element={<ManageBuddyGroups />} />
                </Route>
              </Route>
            </Route>

            {/* Catch-all */}
            <Route path="*" element={<NotFound />} />
          </Routes>
          <UserGuideWidget />
        </BrowserRouter>
      </TooltipProvider>
      </BrandProvider>
    </AuthProvider>
  </QueryClientProvider>
  </GoogleOAuthProvider>
);

export default App;
