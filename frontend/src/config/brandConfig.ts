/**
 * ═══════════════════════════════════════════════════════════════
 *  BRAND CONFIGURATION — White-Label Settings
 * ═══════════════════════════════════════════════════════════════
 *
 *  To rebrand this app, override these environment variables in your
 *  frontend/.env file, and swap /public/logo.png with your own.
 */

export const brand = {
  /** Short brand name, e.g. "Blue Ox" */
  name: import.meta.env.VITE_BRAND_NAME || "White Label",

  /** Tagline shown after the name, e.g. "Events" → "Blue Ox Events" */
  tagline: import.meta.env.VITE_BRAND_TAGLINE || "Events",

  /** Full display name used in titles and headings */
  get fullName() {
    return `${this.name} ${this.tagline}`;
  },

  /** Legal entity name for copyright notices */
  company: import.meta.env.VITE_BRAND_COMPANY || "White Label Corp",

  /** Path to logo in /public (or a full URL) */
  logo: "/logo.png",

  /** Contact email for legal / support */
  email: import.meta.env.VITE_BRAND_EMAIL || "contact@example.com",

  /** Website domain shown on profile cards, badges, etc. */
  website: import.meta.env.VITE_BRAND_WEBSITE || "EXAMPLE.COM",

  /** Hashtag used on check-in cards, social sharing */
  hashtag: import.meta.env.VITE_BRAND_HASHTAG || "#EVENTS2026",

  /** Default password for auto-created accounts (judges, check-in) */
  defaultPassword: "blueox2026",

  /** Theme colors used across the UI */
  colors: {
    /** Primary brand color (sidebar accents, active states) - Default: Blue */
    primary: import.meta.env.VITE_BRAND_COLOR_PRIMARY || "#2962FF",
    /** Secondary/accent color (highlights, CTAs) - Default: Orange */
    accent: import.meta.env.VITE_BRAND_COLOR_ACCENT || "#F58220",
    /** Surface colors for cards and sections */
    surface: import.meta.env.VITE_BRAND_COLOR_SURFACE || "#FFFFFF",
    /** Border colors for UI elements */
    border: import.meta.env.VITE_BRAND_COLOR_BORDER || "#E2E8F0",
  },
} as const;
