import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
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

const Sidebar = ({ onClose }: { onClose?: () => void }) => {
  const { username, role, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

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

  if (role === "admin" || role === "judge") {
    navItems.push({ name: "Judging", path: "/judge", icon: Gavel });
  }

  if (role === "admin") {
    navItems.push({ name: "Users", path: "/users", icon: Users });
  }

  return (
    <aside className="w-64 bg-white text-slate-700 flex flex-col h-screen overflow-y-auto border-r border-slate-200">
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
        <img src="/logo.png" alt="Blue Ox" className="w-8 h-8" />
        <span className="font-bold text-xl tracking-wide text-slate-800">
          Blue Ox <span className="text-[#F58220]">Events</span>
        </span>
      </div>

      {/* User Info */}
      <div className="p-6 flex flex-col items-center border-b border-slate-100">
        <div className="w-20 h-20 rounded-full bg-blue-50 text-blue-600 mb-4 flex items-center justify-center text-2xl font-bold border-2 border-[#2962FF]/20 shadow-sm">
          {username.charAt(0).toUpperCase()}
        </div>
        <h3 className="font-semibold text-lg text-slate-800">{username}</h3>
        <span className="text-xs mt-1 uppercase tracking-wider font-semibold text-[#2962FF] bg-blue-50 px-3 py-1 rounded-full">
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
                ? "bg-gradient-to-r from-[#2962FF]/10 to-[#F58220]/10 text-slate-900 font-semibold border-l-4 border-[#F58220] hover:bg-gradient-to-r hover:from-[#2962FF]/10 hover:to-[#F58220]/10"
                : "text-slate-500 hover:text-slate-900 hover:bg-slate-50 border-l-4 border-transparent"
            )}
          >
            <item.icon
              className={cn(
                "w-5 h-5 mr-3",
                isActive(item.path) ? "text-[#2962FF]" : "text-slate-400"
              )}
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
            navigate("/profile");
            onClose?.();
          }}
          className="w-full justify-start text-slate-500 hover:text-slate-900 hover:bg-slate-50"
        >
          <UserIcon className="w-5 h-5 mr-3 text-slate-400" />
          Profile
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
