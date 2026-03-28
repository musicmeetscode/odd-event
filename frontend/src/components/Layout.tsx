import { useState } from "react";
import { Outlet, useNavigate, Link } from "react-router-dom";
import Sidebar from "./Sidebar";
import Footer from "./Footer";
import { useAuth } from "@/contexts/AuthContext";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Menu, ArrowLeft, Home } from "lucide-react";

const Layout = () => {
  const { isAuthenticated, role } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const navigate = useNavigate();

  const getHomePath = () => {
    if (!isAuthenticated) return "/";
    if (role === "admin") return "/dashboard";
    if (role === "judge") return "/judge";
    return "/events";
  };

  const handleHomeClick = () => {
    navigate(getHomePath());
  };

  if (!isAuthenticated) return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-background via-background to-primary/5">
      <div className="flex-1 flex flex-col items-center justify-center p-4">
        <Link 
          to={getHomePath()} 
          className="mb-6 flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-primary transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Home
        </Link>
        <Outlet />
      </div>
      <Footer />
    </div>
  );

  return (
    <div className="flex min-h-screen bg-[#f1f5f9]">
      {/* Desktop Sidebar */}
      <div className="hidden md:block sticky top-0 h-screen">
        <Sidebar />
      </div>

      {/* Mobile Sidebar (Sheet) */}
      <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
        <SheetContent side="left" className="p-0 w-64 border-none">
          <Sidebar onClose={() => setIsMobileMenuOpen(false)} />
        </SheetContent>
      </Sheet>

      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Header (Mobile & Desktop) */}
        <header className="flex items-center justify-between p-4 bg-white border-b border-slate-200 sticky top-0 z-40">
          <div className="flex items-center gap-4">
            <div className="md:hidden flex items-center gap-2 cursor-pointer" onClick={handleHomeClick}>
              <img src="/logo.png" alt="Logo" className="w-8 h-8" />
              <span className="font-bold text-lg text-slate-800">Blue Ox</span>
            </div>
            
            <Button
              variant="ghost"
              size="sm"
              className="hidden md:flex items-center gap-2 text-slate-500 hover:text-primary transition-colors"
              onClick={handleHomeClick}
            >
              <Home className="h-4 w-4" />
              <span>Back to Home</span>
            </Button>
          </div>

          <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setIsMobileMenuOpen(true)}>
            <Menu className="h-6 w-6" />
          </Button>
        </header>

        <main className="flex-1 flex flex-col w-full transition-all">
          <div className="flex-1">
            <Outlet />
          </div>
          <Footer />
        </main>
      </div>
    </div>
  );
};

export default Layout;
