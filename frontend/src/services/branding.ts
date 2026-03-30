import apiClient from "./api";
import { BrandingConfiguration } from "@/types/api";

export const brandingService = {
  getBranding: async () => {
    const response = await apiClient.get<BrandingConfiguration>("/branding/");
    return response.data;
  },

  updateBranding: async (data: Partial<BrandingConfiguration> & { logo?: any }) => {
    // We use FormData for potential image upload, but if no logo, we can use JSON
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
    
    const response = await apiClient.patch<BrandingConfiguration>("/branding/", data);
    return response.data;
  },
};
