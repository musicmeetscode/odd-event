import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { adminService } from "@/services/admin";
import { eventsService } from "@/services/events";
import { brandingService } from "@/services/branding";
import { useAuth } from "@/contexts/AuthContext";
import { useBrand } from "@/contexts/BrandContext";
import { GoogleLogin, CredentialResponse } from "@react-oauth/google";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { 
  User, UserCircle, Briefcase, FileText, Camera, Link as LinkIcon, 
  Save, Loader2, Palette, Globe, Mail, Hash, Type
} from "lucide-react";

const Settings = () => {
    const queryClient = useQueryClient();
    const { role } = useAuth();
    const { brand: currentBrand, refetch: refetchBrand } = useBrand();
    const isAdmin = role === "admin";

    // ─── Profile State ───
    const { data: profile, isLoading: isProfileLoading } = useQuery({
        queryKey: ["profile"],
        queryFn: () => adminService.getProfile(),
    });

    const [profileData, setProfileData] = useState({
        display_name: "",
        bio: "",
        profession: "",
        avatar_url: "",
    });

    useEffect(() => {
        if (profile) {
            setProfileData({
                display_name: profile.display_name || "",
                bio: profile.bio || "",
                profession: profile.profession || "",
                avatar_url: profile.avatar_url || "",
            });
        }
    }, [profile]);

    const updateProfileMut = useMutation({
        mutationFn: (data: typeof profileData) => adminService.updateProfile(data),
        onSuccess: (data) => {
            toast.success("Profile updated successfully");
            queryClient.setQueryData(["profile"], data);
        },
        onError: () => toast.error("Failed to update profile"),
    });

    // ─── Branding State ───
    const [brandData, setBrandData] = useState({
        name: "",
        tagline: "",
        company_name: "",
        email: "",
        website: "",
        hashtag: "",
        primary_color: "",
        accent_color: "",
        logo: null as File | string | null,
    });

    useEffect(() => {
        if (currentBrand) {
            setBrandData({
                name: currentBrand.name || "",
                tagline: currentBrand.tagline || "",
                company_name: currentBrand.company_name || "",
                email: currentBrand.email || "",
                website: currentBrand.website || "",
                hashtag: currentBrand.hashtag || "",
                primary_color: currentBrand.primary_color || "",
                accent_color: currentBrand.accent_color || "",
                logo: currentBrand.logo || null,
            });
        }
    }, [currentBrand]);

    const updateBrandingMut = useMutation({
        mutationFn: (data: any) => brandingService.updateBranding(data),
        onSuccess: () => {
            toast.success("Branding updated successfully");
            refetchBrand();
        },
        onError: () => toast.error("Failed to update branding"),
    });

    // ─── Handlers ───
    const handleProfileSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        updateProfileMut.mutate(profileData);
    };

    const handleBrandingSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        updateBrandingMut.mutate(brandData);
    };

    const handleGoogleLinkSuccess = async (credentialResponse: CredentialResponse) => {
        if (credentialResponse.credential) {
            try {
                await eventsService.googleLogin(credentialResponse.credential);
                toast.success("Google account linked successfully");
                queryClient.invalidateQueries({ queryKey: ["profile"] });
            } catch (error) {
                console.error("Google Link Error:", error);
                toast.error("Failed to link Google account.");
            }
        }
    };

    if (isProfileLoading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="max-w-6xl mx-auto p-4 md:p-8 space-y-8 animate-in fade-in duration-500 pt-20">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Settings</h1>
                    <p className="text-slate-500 mt-1">Manage your profile and application preferences.</p>
                </div>
            </div>

            <Tabs defaultValue="profile" className="w-full">
                <TabsList className="bg-slate-100/50 p-1 mb-8">
                    <TabsTrigger value="profile" className="flex items-center gap-2">
                        <User className="w-4 h-4" /> Profile
                    </TabsTrigger>
                    {isAdmin && (
                        <TabsTrigger value="branding" className="flex items-center gap-2">
                            <Palette className="w-4 h-4" /> Branding
                        </TabsTrigger>
                    )}
                </TabsList>

                <TabsContent value="profile" className="animate-in slide-in-from-left-4 duration-300">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        {/* Sidebar Card */}
                        <div className="space-y-6">
                            <Card className="overflow-hidden border-none shadow-md">
                                <div className="h-24 bg-primary/10"></div>
                                <CardContent className="relative pt-0 flex flex-col items-center text-center -mt-12">
                                    <div className="w-24 h-24 rounded-full border-4 border-white bg-white shadow-lg overflow-hidden flex items-center justify-center">
                                        {profileData.avatar_url ? (
                                            <img src={profileData.avatar_url} alt="Profile" className="w-full h-full object-cover" />
                                        ) : (
                                            <div className="w-full h-full bg-slate-100 flex items-center justify-center font-bold text-slate-400 text-3xl">
                                                {profile?.username?.charAt(0).toUpperCase()}
                                            </div>
                                        )}
                                    </div>
                                    <div className="mt-4 space-y-1">
                                        <h2 className="text-xl font-bold text-slate-900">{profileData.display_name || profile?.username}</h2>
                                        <p className="text-sm font-medium text-primary uppercase tracking-wider">{profile?.role}</p>
                                    </div>
                                </CardContent>
                            </Card>

                            <Card className="border-none shadow-sm bg-slate-50/50">
                                <CardHeader className="pb-2">
                                    <CardTitle className="text-sm font-semibold">Account Info</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-3 text-sm">
                                    <div className="flex justify-between">
                                        <span className="text-slate-500">Username</span>
                                        <span className="font-medium text-slate-800">@{profile?.username}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-slate-500">Email</span>
                                        <span className="font-medium text-slate-800">{profile?.email || "Not set"}</span>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>

                        {/* Profile Edit Area */}
                        <div className="md:col-span-2 space-y-6">
                            <Card className="border-none shadow-sm">
                                <CardHeader>
                                    <CardTitle>Connected Accounts</CardTitle>
                                    <CardDescription>Link your social accounts for faster sign-in.</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <div className="flex items-center justify-between p-4 border rounded-lg bg-slate-50">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 flex items-center justify-center bg-white rounded-full shadow-sm">
                                                <img src="https://www.google.com/favicon.ico" alt="Google" className="w-4 h-4" />
                                            </div>
                                            <div>
                                                <h4 className="text-sm font-semibold text-slate-900">Google Account</h4>
                                                <p className="text-xs text-slate-500">
                                                    {profile?.is_google_connected ? "Connected" : "Not connected"}
                                                </p>
                                            </div>
                                        </div>
                                        {profile?.is_google_connected ? (
                                            <div className="flex items-center gap-1 text-green-600 font-medium text-sm">
                                                <Save className="w-4 h-4" /> Linked
                                            </div>
                                        ) : (
                                            <GoogleLogin
                                                onSuccess={handleGoogleLinkSuccess}
                                                onError={() => toast.error("Google linking failed.")}
                                                theme="outline"
                                                shape="pill"
                                                text="continue_with"
                                            />
                                        )}
                                    </div>
                                </CardContent>
                            </Card>

                            <Card className="border-none shadow-sm">
                                <CardHeader>
                                    <CardTitle>Profile Details</CardTitle>
                                    <CardDescription>This information will be visible to other attendees and event organizers.</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <form onSubmit={handleProfileSubmit} className="space-y-6">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <div className="space-y-2">
                                                <Label htmlFor="display_name" className="flex items-center gap-2">
                                                    <UserCircle className="w-4 h-4 text-slate-400" /> Display Name
                                                </Label>
                                                <input
                                                    id="display_name"
                                                    value={profileData.display_name}
                                                    onChange={(e) => setProfileData({ ...profileData, display_name: e.target.value })}
                                                    placeholder="Your public name"
                                                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor="profession" className="flex items-center gap-2">
                                                    <Briefcase className="w-4 h-4 text-slate-400" /> Profession
                                                </Label>
                                                <input
                                                    id="profession"
                                                    value={profileData.profession}
                                                    onChange={(e) => setProfileData({ ...profileData, profession: e.target.value })}
                                                    placeholder="e.g. Software Engineer"
                                                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                                />
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="avatar_url" className="flex items-center gap-2">
                                                <Camera className="w-4 h-4 text-slate-400" /> Avatar URL
                                            </Label>
                                            <div className="flex gap-2">
                                                <input
                                                    id="avatar_url"
                                                    value={profileData.avatar_url}
                                                    onChange={(e) => setProfileData({ ...profileData, avatar_url: e.target.value })}
                                                    placeholder="Link to your profile photo"
                                                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                                />
                                                <Button type="button" variant="outline" size="icon" className="shrink-0" onClick={() => profileData.avatar_url && window.open(profileData.avatar_url, "_blank")}>
                                                    <LinkIcon className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="bio" className="flex items-center gap-2">
                                                <FileText className="w-4 h-4 text-slate-400" /> Bio
                                            </Label>
                                            <Textarea
                                                id="bio"
                                                value={profileData.bio}
                                                onChange={(e) => setProfileData({ ...profileData, bio: e.target.value })}
                                                placeholder="Tell us a bit about yourself..."
                                                className="min-h-[120px] resize-none"
                                            />
                                        </div>
                                        <div className="flex justify-end pt-4 border-t">
                                            <Button type="submit" disabled={updateProfileMut.isPending} className="px-8 bg-primary text-white">
                                                {updateProfileMut.isPending ? "Saving..." : "Save Changes"}
                                            </Button>
                                        </div>
                                    </form>
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                </TabsContent>

                {isAdmin && (
                    <TabsContent value="branding" className="animate-in slide-in-from-right-4 duration-300">
                        <div className="max-w-3xl mx-auto space-y-6">
                            <Card className="border-none shadow-sm">
                                <CardHeader>
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <CardTitle>Application Branding</CardTitle>
                                            <CardDescription>Customize the name, logo, and colors of your event platform.</CardDescription>
                                        </div>
                                        <div className="w-12 h-12 rounded-lg bg-primary/5 flex items-center justify-center">
                                            <Palette className="w-6 h-6 text-primary" />
                                        </div>
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    <form onSubmit={handleBrandingSubmit} className="space-y-8">
                                        {/* Name & Tagline */}
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <div className="space-y-2">
                                                <Label htmlFor="brand-name" className="flex items-center gap-2">
                                                    <Type className="w-4 h-4 text-slate-400" /> App Name
                                                </Label>
                                                <input
                                                    id="brand-name"
                                                    value={brandData.name}
                                                    onChange={(e) => setBrandData({ ...brandData, name: e.target.value })}
                                                    placeholder="e.g. Q&A Platform"
                                                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor="brand-tagline">Tagline</Label>
                                                <input
                                                    id="brand-tagline"
                                                    value={brandData.tagline}
                                                    onChange={(e) => setBrandData({ ...brandData, tagline: e.target.value })}
                                                    placeholder="e.g. Events"
                                                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                                />
                                            </div>
                                        </div>

                                        {/* Colors */}
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-4 bg-slate-50 rounded-xl">
                                            <div className="space-y-2">
                                                <Label className="flex items-center gap-2">
                                                  <div className="w-3 h-3 rounded-full bg-primary mb-0.5"></div> Primary Color
                                                </Label>
                                                <div className="flex items-center gap-3">
                                                    <input
                                                        type="color"
                                                        value={brandData.primary_color}
                                                        onChange={(e) => setBrandData({ ...brandData, primary_color: e.target.value })}
                                                        className="w-10 h-10 rounded cursor-pointer border-none p-0 bg-transparent"
                                                    />
                                                    <input
                                                        value={brandData.primary_color}
                                                        onChange={(e) => setBrandData({ ...brandData, primary_color: e.target.value })}
                                                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 font-mono uppercase"
                                                    />
                                                </div>
                                            </div>
                                            <div className="space-y-2">
                                                <Label className="flex items-center gap-2">
                                                  <div className="w-3 h-3 rounded-full bg-secondary mb-0.5"></div> Accent Color
                                                </Label>
                                                <div className="flex items-center gap-3">
                                                    <input
                                                        type="color"
                                                        value={brandData.accent_color}
                                                        onChange={(e) => setBrandData({ ...brandData, accent_color: e.target.value })}
                                                        className="w-10 h-10 rounded cursor-pointer border-none p-0 bg-transparent"
                                                    />
                                                    <input
                                                        value={brandData.accent_color}
                                                        onChange={(e) => setBrandData({ ...brandData, accent_color: e.target.value })}
                                                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 font-mono uppercase"
                                                    />
                                                </div>
                                            </div>
                                        </div>

                                        {/* Logo Section */}
                                        <div className="space-y-4">
                                            <Label>Application Logo</Label>
                                            <div className="flex items-center gap-6 p-4 border-2 border-dashed rounded-xl group hover:border-primary/50 transition-colors">
                                                <div className="w-20 h-20 rounded-lg bg-slate-100 flex items-center justify-center p-2">
                                                   {brandData.logo ? (
                                                       <img 
                                                           src={typeof brandData.logo === 'string' ? brandData.logo : URL.createObjectURL(brandData.logo)} 
                                                           alt="App Logo" 
                                                           className="max-w-full max-h-full object-contain" 
                                                       />
                                                   ) : <Globe className="w-8 h-8 text-slate-300" />}
                                                </div>
                                                <div className="flex flex-col gap-2">
                                                   <input 
                                                       type="file" 
                                                       accept="image/*" 
                                                       className="w-64 cursor-pointer text-sm"
                                                       onChange={(e) => {
                                                           const file = e.target.files?.[0];
                                                           if (file) setBrandData({ ...brandData, logo: file });
                                                       }}
                                                   />
                                                   <p className="text-[10px] text-slate-400">Recommended: PNG or SVG with transparency, square ratio.</p>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Contact & Meta */}
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <div className="space-y-2">
                                                <Label htmlFor="comp-name" className="flex items-center gap-2">
                                                    <Briefcase className="w-4 h-4 text-slate-400" /> Company Name
                                                </Label>
                                                <input
                                                    id="comp-name"
                                                    value={brandData.company_name}
                                                    onChange={(e) => setBrandData({ ...brandData, company_name: e.target.value })}
                                                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor="brand-email" className="flex items-center gap-2">
                                                    <Mail className="w-4 h-4 text-slate-400" /> Support Email
                                                </Label>
                                                <input
                                                    id="brand-email"
                                                    value={brandData.email}
                                                    onChange={(e) => setBrandData({ ...brandData, email: e.target.value })}
                                                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor="brand-website" className="flex items-center gap-2">
                                                    <Globe className="w-4 h-4 text-slate-400" /> Website
                                                </Label>
                                                <input
                                                    id="brand-website"
                                                    value={brandData.website}
                                                    onChange={(e) => setBrandData({ ...brandData, website: e.target.value })}
                                                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor="brand-hashtag" className="flex items-center gap-2">
                                                    <Hash className="w-4 h-4 text-slate-400" /> Social Hashtag
                                                </Label>
                                                <input
                                                    id="brand-hashtag"
                                                    value={brandData.hashtag}
                                                    onChange={(e) => setBrandData({ ...brandData, hashtag: e.target.value })}
                                                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                                />
                                            </div>
                                        </div>

                                        <div className="flex justify-end gap-3 pt-6 border-t font-semibold">
                                            <Button 
                                                type="submit" 
                                                disabled={updateBrandingMut.isPending} 
                                                className="px-10 bg-primary h-12 text-white"
                                            >
                                                {updateBrandingMut.isPending ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Updating...</> : "Update Platform Branding"}
                                            </Button>
                                        </div>
                                    </form>
                                </CardContent>
                            </Card>
                        </div>
                    </TabsContent>
                )}
            </Tabs>
        </div>
    );
};

export default Settings;
