import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useBrand } from "@/contexts/BrandContext";
import { useAuth } from "@/contexts/AuthContext";
import { Menu, X, ArrowRight } from "lucide-react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

const Navbar = () => {
  const { brand } = useBrand();
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [isScrolled, setIsScrolled] = React.useState(false);

  React.useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const navLinks = [
    { name: "Events", href: "/events" },
    { name: "Wall of Fame", href: "#wall-of-fame", isAnchor: true },
    { name: "Perks", href: "#perks", isAnchor: true },
  ];

  const handleNavClick = (href: string, isAnchor?: boolean) => {
    if (isAnchor && window.location.pathname === "/") {
      const element = document.querySelector(href);
      element?.scrollIntoView({ behavior: "smooth" });
    } else {
      navigate(href);
    }
  };

  const NavItems = ({ className = "" }: { className?: string }) => (
    <div className={`flex items-center gap-8 ${className}`}>
      {navLinks.map((link) => (
        <button
          key={link.name}
          onClick={() => handleNavClick(link.href, link.isAnchor)}
          className="text-sm font-semibold text-slate-600 hover:text-primary transition-colors cursor-pointer"
        >
          {link.name}
        </button>
      ))}
    </div>
  );

  return (
    <nav 
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled 
          ? "bg-white/80 backdrop-blur-xl border-b border-slate-200 py-3" 
          : "bg-transparent py-5"
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 md:px-8 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-3 group">
          <div className="h-10 w-10 rounded-xl overflow-hidden shadow-lg group-hover:scale-110 transition-transform">
            <img src="/logo.png" alt={brand.name} className="h-full w-full object-cover" />
          </div>
          <span className="text-xl font-black text-slate-900 tracking-tight">MetToday</span>
        </Link>

        {/* Desktop Nav */}
        <div className="hidden md:flex items-center gap-12">
          <NavItems />
          <div className="h-6 w-px bg-slate-200" />
          <div className="flex items-center gap-4">
            {isAuthenticated ? (
              <Button 
                onClick={() => navigate("/events")}
                className="bg-slate-900 hover:bg-black text-white rounded-full px-6 font-bold"
              >
                Go to App
              </Button>
            ) : (
              <>
                <Button 
                  variant="ghost" 
                  onClick={() => navigate("/login")}
                  className="font-bold text-slate-700 hover:text-primary"
                >
                  Sign In
                </Button>
                <Button 
                  onClick={() => navigate("/register")}
                  className="bg-slate-900 hover:bg-black text-white rounded-full px-6 font-bold shadow-lg shadow-slate-200"
                >
                  Join Today <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </>
            )}
          </div>
        </div>

        {/* Mobile Nav */}
        <div className="md:hidden">
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="text-slate-900">
                <Menu className="h-6 w-6" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[300px] sm:w-[400px] p-8">
              <div className="flex flex-col gap-8 pt-8">
                <NavItems className="flex-col items-start gap-6" />
                <div className="h-px w-full bg-slate-100" />
                <div className="flex flex-col gap-4">
                  {isAuthenticated ? (
                    <Button 
                      className="w-full bg-slate-900 py-6 text-lg font-bold rounded-2xl"
                      onClick={() => navigate("/events")}
                    >
                      Go to App
                    </Button>
                  ) : (
                    <>
                      <Button 
                        variant="outline" 
                        className="w-full py-6 text-lg font-bold rounded-2xl border-slate-200"
                        onClick={() => navigate("/login")}
                      >
                        Sign In
                      </Button>
                      <Button 
                        className="w-full bg-slate-900 py-6 text-lg font-bold rounded-2xl"
                        onClick={() => navigate("/register")}
                      >
                        Join Today
                      </Button>
                    </>
                  )}
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
