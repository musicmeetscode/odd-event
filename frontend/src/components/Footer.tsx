import { Link } from "react-router-dom";
import { Shield, Copyright, ExternalLink } from "lucide-react";
import { useBrand } from "@/contexts/BrandContext";

const Footer = () => {
  const { brand } = useBrand();
  const currentYear = new Date().getFullYear();

  return (
    <footer className="w-full bg-white border-t border-slate-200 mt-auto py-8">
      <div className="max-w-7xl mx-auto px-4 md:px-8">
        <div className="flex flex-col md:flex-row justify-between items-center gap-6">
          {/* Logo & Copyright */}
          <div className="flex flex-col items-center md:items-start space-y-2">
            <div className="flex items-center gap-2">
              <img src={brand.logo || "/logo.png"} alt={brand.name} className="w-6 h-6" />
              <span className="font-bold text-slate-800">{brand.name} {brand.tagline}</span>
            </div>
            <p className="text-xs text-slate-400 font-medium flex items-center gap-1">
              <Copyright className="w-3 h-3" /> {currentYear} {brand.company_name}. All rights reserved.
            </p>
          </div>

          {/* Links */}
          <div className="flex flex-wrap justify-center gap-8">
            <div className="flex flex-col items-center md:items-start space-y-3">
              <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400">Legal</h4>
              <nav className="flex flex-col items-center md:items-start space-y-2">
                <Link 
                  to="/privacy" 
                  className="text-sm text-slate-600 hover:text-blue-600 transition-colors flex items-center gap-1.5"
                >
                  <Shield className="w-3.5 h-3.5" /> Privacy Policy & Terms
                </Link>
                <a 
                  href={`mailto:${brand.email}`} 
                  className="text-sm text-slate-600 hover:text-blue-600 transition-colors flex items-center gap-1.5"
                >
                  <ExternalLink className="w-3.5 h-3.5" /> Contact Legal
                </a>
              </nav>
            </div>

            <div className="flex flex-col items-center md:items-start space-y-3">
              <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400">Platform</h4>
              <nav className="flex flex-col items-center md:items-start space-y-2">
                <Link to="/events" className="text-sm text-slate-600 hover:text-blue-600 transition-colors">
                  Browse Events
                </Link>
                <Link to="/login" className="text-sm text-slate-600 hover:text-blue-600 transition-colors">
                  Join Beta
                </Link>
              </nav>
            </div>
          </div>
        </div>

        <div className="mt-8 pt-6 border-t border-slate-100 text-center">
          <p className="text-[10px] text-slate-400 uppercase tracking-[0.2em] font-medium italic">
            Empowering event builders worldwide • Powered by {brand.company_name}
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
