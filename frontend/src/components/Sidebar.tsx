import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { eventsService } from "@/services/events";
import { Button } from "@/components/ui/button";
import {
  LogOut,
  CalendarDays,
  Gavel,
  Users,
  LayoutDashboard,
  User as UserIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useBrand } from "@/contexts/BrandContext";

const Sidebar = ({ onClose }: { onClose?: () => void }) => {
  const { brand } = useBrand();
  const { username, role, logout, canJudge, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Check if user has any upcoming peer judging events (supplements the login-time canJudge flag)
  const { data: myEvents } = useQuery({
    queryKey: ["my-events"],
    queryFn: eventsService.getMyEvents,
    enabled: isAuthenticated,
    staleTime: 60_000,
  });

  const hasPeerJudgingEvent = myEvents?.some(
    (e) => e.peer_judging_percent > 0 && new Date(e.end_date) >= new Date()
  ) ?? false;

  const handleLogout = async () => {
    await logout();
    onClose?.();
    navigate("/");
  };

  const isActive = (path: string) => {
    if (path === "/dashboard" && location.pathname === "/dashboard") return true;
    if (path !== "/dashboard" && location.pathname.startsWith(path)) return true;
    return false;
  };

  const navItems = [];

  if (role === "admin") {
    navItems.push({ name: "Dashboard", path: "/dashboard", icon: LayoutDashboard });
  }

  navItems.push({ name: "Events", path: "/events", icon: CalendarDays });

  if (canJudge || hasPeerJudgingEvent) {
    navItems.push({ name: "Judging", path: "/judge", icon: Gavel });
  }

  if (role === "admin") {
    navItems.push({ name: "Users", path: "/users", icon: Users });
    navItems.push({ name: "Assets", path: "/admin/assets", icon: LayoutDashboard }); 
  }

  return (
    <aside className="w-64 bg-white text-slate-700 flex flex-col h-full overflow-y-auto border-r border-slate-200">
      {/* Brand */}
      <div
        className="p-6 flex items-center gap-3 cursor-pointer border-b border-slate-100"
        onClick={() => {
          if (role === "admin") navigate("/dashboard");
          else if (role === "judge") navigate("/judge");
          else navigate("/events");
          onClose?.();
        }}
      >
        <img src={brand.logo || "/logo.png"} alt={brand.name} className="w-8 h-8" />
        <span className="font-bold text-xl tracking-wide text-slate-800">
          {brand.name} <span style={{ color: brand.accent_color }}>{brand.tagline}</span>
        </span>
      </div>

      {/* User Info */}
      <div className="p-6 flex flex-col items-center border-b border-slate-100">
        <div
          className="w-20 h-20 rounded-full mb-4 flex items-center justify-center text-2xl font-bold border-2 shadow-sm"
          style={{ backgroundColor: `${brand.primary_color}10`, color: brand.primary_color, borderColor: `${brand.primary_color}33` }}
        >
          {username.charAt(0).toUpperCase()}
        </div>
        <h3 className="font-semibold text-lg text-slate-800">{username}</h3>
        <span
          className="text-xs mt-1 uppercase tracking-wider font-semibold px-3 py-1 rounded-full"
          style={{ color: brand.primary_color, backgroundColor: `${brand.primary_color}10` }}
        >
          {role}
        </span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-6 px-4 space-y-2">
        {navItems.map((item) => (
          <Button
            key={item.name}
            variant="ghost"
            onClick={() => {
              navigate(item.path);
              onClose?.();
            }}
            className={cn(
              "w-full justify-start h-12 px-4 transition-colors",
              isActive(item.path)
                ? "text-slate-900 font-semibold border-l-4 hover:bg-opacity-80"
                : "text-slate-500 hover:text-slate-900 hover:bg-slate-50 border-l-4 border-transparent"
            )}
            style={isActive(item.path) ? {
              background: `linear-gradient(to right, ${brand.primary_color}1A, ${brand.accent_color}1A)`,
              borderLeftColor: brand.accent_color,
            } : undefined}
          >
            <item.icon
              className={cn(
                "w-5 h-5 mr-3",
                isActive(item.path) ? "" : "text-slate-400"
              )}
              style={isActive(item.path) ? { color: brand.primary_color } : undefined}
            />
            {item.name}
          </Button>
        ))}
      </nav>

      {/* Footer Nav */}
      <div className="p-4 border-t border-slate-100 space-y-2">
        <Button
          variant="ghost"
          onClick={() => {
            navigate("/settings");
            onClose?.();
          }}
          className="w-full justify-start text-slate-500 hover:text-slate-900 hover:bg-slate-50"
        >
          <UserIcon className="w-5 h-5 mr-3 text-slate-400" />
          Settings
        </Button>
        <Button
          variant="ghost"
          onClick={handleLogout}
          className="w-full justify-start text-red-500 hover:text-red-600 hover:bg-red-50"
        >
          <LogOut className="w-5 h-5 mr-3 text-red-400" />
          Logout
        </Button>
      </div>
    </aside>
  );
};

export default Sidebar;
