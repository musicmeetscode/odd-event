import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { adminService } from "@/services/admin";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { toast } from "sonner";
import { User, UserCircle, Briefcase, FileText, Camera, Link as LinkIcon, Save, Loader2 } from "lucide-react";

const Profile = () => {
  const queryClient = useQueryClient();
  
  const { data: profile, isLoading } = useQuery({
    queryKey: ["profile"],
    queryFn: () => adminService.getProfile(),
  });

  const [formData, setFormData] = useState({
    display_name: "",
    bio: "",
    profession: "",
    avatar_url: "",
  });

  useEffect(() => {
    if (profile) {
      setFormData({
        display_name: profile.display_name || "",
        bio: profile.bio || "",
        profession: profile.profession || "",
        avatar_url: profile.avatar_url || "",
      });
    }
  }, [profile]);

  const updateProfileMut = useMutation({
    mutationFn: (data: typeof formData) => adminService.updateProfile(data),
    onSuccess: (data) => {
      toast.success("Profile updated successfully");
      queryClient.setQueryData(["profile"], data);
      // Also update auth context or refresh if needed
    },
    onError: () => {
      toast.error("Failed to update profile");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateProfileMut.mutate(formData);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-8 space-y-8 animate-in fade-in duration-500 pt-20">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Your Profile</h1>
          <p className="text-slate-500 mt-1">Manage your public information and preferences.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Sidebar / Preview */}
        <div className="space-y-6">
          <Card className="overflow-hidden border-none shadow-md">
            <div className="h-24 bg-gradient-to-r from-blue-600 to-indigo-600"></div>
            <CardContent className="relative pt-0 flex flex-col items-center text-center -mt-12">
              <div className="relative">
                <div className="w-24 h-24 rounded-full border-4 border-white bg-white shadow-lg overflow-hidden flex items-center justify-center">
                  {formData.avatar_url ? (
                    <img src={formData.avatar_url} alt="Profile" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full bg-slate-100 flex items-center justify-center font-bold text-slate-400 text-3xl">
                      {profile?.username?.charAt(0).toUpperCase()}
                    </div>
                  )}
                </div>
              </div>
              
              <div className="mt-4 space-y-1">
                <h2 className="text-xl font-bold text-slate-900">{formData.display_name || profile?.username}</h2>
                <p className="text-sm font-medium text-blue-600 uppercase tracking-wider">{profile?.role}</p>
                {formData.profession && (
                  <p className="text-sm text-slate-500 flex items-center justify-center gap-1">
                    <Briefcase className="w-3 h-3" /> {formData.profession}
                  </p>
                )}
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

        {/* Edit Form */}
        <div className="md:col-span-2 space-y-6">
          <Card className="border-none shadow-sm">
            <CardHeader>
              <CardTitle>Profile Details</CardTitle>
              <CardDescription>
                This information will be visible to other attendees and event organizers.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="display_name" className="flex items-center gap-2">
                      <UserCircle className="w-4 h-4 text-slate-400" /> Display Name
                    </Label>
                    <Input
                      id="display_name"
                      value={formData.display_name}
                      onChange={(e) => setFormData({ ...formData, display_name: e.target.value })}
                      placeholder="Your public name"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="profession" className="flex items-center gap-2">
                      <Briefcase className="w-4 h-4 text-slate-400" /> Profession
                    </Label>
                    <Input
                      id="profession"
                      value={formData.profession}
                      onChange={(e) => setFormData({ ...formData, profession: e.target.value })}
                      placeholder="e.g. Software Engineer"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="avatar_url" className="flex items-center gap-2">
                    <Camera className="w-4 h-4 text-slate-400" /> Avatar URL
                  </Label>
                  <div className="flex gap-2">
                    <Input
                      id="avatar_url"
                      value={formData.avatar_url}
                      onChange={(e) => setFormData({ ...formData, avatar_url: e.target.value })}
                      placeholder="Link to your profile photo"
                    />
                    <Button type="button" variant="outline" size="icon" className="shrink-0" onClick={() => window.open(formData.avatar_url, "_blank")}>
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
                    value={formData.bio}
                    onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                    placeholder="Tell us a bit about yourself..."
                    className="min-h-[120px] resize-none"
                  />
                  <p className="text-xs text-slate-400 text-right">{formData.bio.length} characters</p>
                </div>

                <div className="flex justify-end pt-4 border-t">
                  <Button type="submit" disabled={updateProfileMut.isPending} className="px-8 bg-blue-600 hover:bg-blue-700">
                    {updateProfileMut.isPending ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4 mr-2" />
                        Save Changes
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Profile;
