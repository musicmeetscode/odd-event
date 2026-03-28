import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
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
import Profile from "./pages/Profile";
import WallOfFame from "./pages/WallOfFame";
import ProfileCard from "./pages/ProfileCard";
import Privacy from "./pages/Privacy";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();
const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || "733475143372-r6cl89i8l2h3n3t68g71h4e0h7o5v0h9.apps.googleusercontent.com"; // Placeholder

const App = () => (
  <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
    <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            {/* Public */}
            <Route element={<Layout />}>
              <Route path="/" element={<RoleSelection />} />
              <Route path="/register" element={<AttendeeRegister />} />
              <Route path="/login" element={<Login />} />
              <Route path="/check-in" element={<CheckIn />} />
              <Route path="/events/:eventId/wall-of-fame" element={<WallOfFame />} />
              <Route path="/profile/:eventId/:userId?" element={<ProfileCard />} />
              <Route path="/privacy" element={<Privacy />} />
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
                <Route path="/profile" element={<Profile />} />
                
                {/* Protected: judges only */}
                <Route element={<ProtectedRoute requireRole="judge" />}>
                  <Route path="/judge" element={<JudgeDashboard />} />
                </Route>
                
                {/* Protected: admin only */}
                <Route element={<ProtectedRoute requireRole="admin" />}>
                  <Route path="/dashboard" element={<Dashboard />} />
                  <Route path="/users" element={<Users />} />
                </Route>
              </Route>
            </Route>

            {/* Catch-all */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
  </GoogleOAuthProvider>
);

export default App;
