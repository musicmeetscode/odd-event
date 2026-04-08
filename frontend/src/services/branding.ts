import apiClient from "./api";
import { BrandingConfiguration } from "@/types/api";

export const brandingService = {
  getBranding: async () => {
    const response = await apiClient.get<BrandingConfiguration>("/branding/");
    return response.data;
  },

  updateBranding: async (data: Partial<BrandingConfiguration> & { logo?: any }) => {
    // We use FormData for potential image upload
    if (data.logo && typeof data.logo !== 'string') {
        const formData = new FormData();
        Object.entries(data).forEach(([key, value]) => {
            if (value !== undefined && value !== null) {
                formData.append(key, value as any);
            }
        });
        const response = await apiClient.patch<BrandingConfiguration>("/branding/", formData, {
            headers: { "Content-Type": "multipart/form-data" },
        });
        return response.data;
    }
    
    // If logo is a string, it means it hasn't changed. Send other data via JSON without the logo field.
    const payload = { ...data };
    if (typeof payload.logo === 'string') {
        delete payload.logo;
    }
    
    const response = await apiClient.patch<BrandingConfiguration>("/branding/", payload);
    return response.data;
  },
};
