import React, { createContext, useContext, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { brandingService } from "@/services/branding";
import { BrandingConfiguration } from "@/types/api";
import { brand as staticBrand } from "@/config/brandConfig";
import { getMediaUrl } from "@/lib/utils";

interface BrandContextType {
  brand: BrandingConfiguration;
  isLoading: boolean;
  refetch: () => void;
}

const BrandContext = createContext<BrandContextType | undefined>(undefined);

// Helper to convert hex to HSL string compatible with our index.css variables
function hexToHSL(hex: string): string {
    // Remove # if present
    const cleanHex = hex.replace('#', '');
    
    // Convert to RGB
    const r = parseInt(cleanHex.substring(0, 2), 16) / 255;
    const g = parseInt(cleanHex.substring(2, 4), 16) / 255;
    const b = parseInt(cleanHex.substring(4, 6), 16) / 255;

    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    let h = 0, s = 0;
    const l = (max + min) / 2;

    if (max !== min) {
        const d = max - min;
        s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
        switch (max) {
            case r: h = (g - b) / d + (g < b ? 6 : 0); break;
            case g: h = (b - r) / d + 2; break;
            case b: h = (r - g) / d + 4; break;
        }
        h /= 6;
    }

    return `${Math.round(h * 360)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`;
}

export const BrandProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { data: dynamicBrand, isLoading, refetch } = useQuery({
    queryKey: ["branding"],
    queryFn: () => brandingService.getBranding(),
    staleTime: Infinity, // Branding changes rarely
  });

  // Merge static and dynamic branding
  // Fallbacks come from brandConfig.ts
  const brand: BrandingConfiguration = {
    id: dynamicBrand?.id || 1,
    name: dynamicBrand?.name || staticBrand.name,
    tagline: dynamicBrand?.tagline || staticBrand.tagline,
    logo: dynamicBrand?.logo ? getMediaUrl(dynamicBrand.logo) : staticBrand.logo,
    primary_color: dynamicBrand?.primary_color || staticBrand.colors.primary,
    accent_color: dynamicBrand?.accent_color || staticBrand.colors.accent,
    company_name: dynamicBrand?.company_name || staticBrand.company,
    email: dynamicBrand?.email || staticBrand.email,
    website: dynamicBrand?.website || staticBrand.website,
    hashtag: dynamicBrand?.hashtag || staticBrand.hashtag,
  };

  // Inject CSS variables for colors
  useEffect(() => {
    if (brand.primary_color) {
        const hsl = hexToHSL(brand.primary_color);
        document.documentElement.style.setProperty("--primary", hsl);
        document.documentElement.style.setProperty("--ring", hsl);
        document.documentElement.style.setProperty("--sidebar-primary", hsl);
        document.documentElement.style.setProperty("--sidebar-ring", hsl);
    }
    if (brand.accent_color) {
        const hsl = hexToHSL(brand.accent_color);
        document.documentElement.style.setProperty("--secondary", hsl); // Our index.css maps secondary to the blue accent
    }
  }, [brand.primary_color, brand.accent_color]);

  return (
    <BrandContext.Provider value={{ brand, isLoading, refetch }}>
      {children}
    </BrandContext.Provider>
  );
};

// eslint-disable-next-line react-refresh/only-export-components
export const useBrand = () => {
  const context = useContext(BrandContext);
  if (context === undefined) {
    throw new Error("useBrand must be used within a BrandProvider");
  }
  return context;
};
