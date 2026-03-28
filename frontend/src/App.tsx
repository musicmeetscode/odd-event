import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
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
            {/* Public */}
            <Route element={<Layout />}>
              <Route path="/" element={<RoleSelection />} />
              <Route path="/register" element={<AttendeeRegister />} />
              <Route path="/login" element={<Login />} />
              <Route path="/check-in" element={<CheckIn />} />
            </Route>

            {/* Protected: any authenticated user */}
            <Route element={<ProtectedRoute />}>
              <Route path="/events/:id/leaderboard" element={<Leaderboard />} />
              <Route element={<Layout />}>
                <Route path="/dashboard" element={<Dashboard />} />
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
);

export default App;
