import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { eventsService } from "@/services/events";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Trash2, Edit2, Loader2, Image as ImageIcon, Globe, UserCheck, Briefcase } from "lucide-react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog";

const AdminAssetManagement = () => {
    const queryClient = useQueryClient();
    const [activeTab, setActiveTab] = useState("partners");
    
    // Partner Form State
    const [isPartnerDialogOpen, setIsPartnerDialogOpen] = useState(false);
    const [editingPartner, setEditingPartner] = useState<any>(null);
    const [partnerName, setPartnerName] = useState("");
    const [partnerWebsite, setPartnerWebsite] = useState("");
    const [partnerLogo, setPartnerLogo] = useState<File | null>(null);

    // Signatory Form State
    const [isSignatoryDialogOpen, setIsSignatoryDialogOpen] = useState(false);
    const [editingSignatory, setEditingSignatory] = useState<any>(null);
    const [sigName, setSigName] = useState("");
    const [sigTitle, setSigTitle] = useState("");
    const [sigOrg, setSigOrg] = useState("");
    const [sigSignature, setSigSignature] = useState<File | null>(null);

    const { data: partners, isLoading: isLoadingPartners } = useQuery({
        queryKey: ["partners"],
        queryFn: eventsService.listPartners,
    });

    const { data: signatories, isLoading: isLoadingSignatories } = useQuery({
        queryKey: ["signatories"],
        queryFn: eventsService.listSignatories,
    });

    // Partner Mutations
    const partnerMutation = useMutation({
        mutationFn: async () => {
            const formData = new FormData();
            formData.append("name", partnerName);
            formData.append("website_url", partnerWebsite);
            if (partnerLogo) formData.append("logo", partnerLogo);

            if (editingPartner) {
                return eventsService.updatePartner(editingPartner.id, formData);
            } else {
                return eventsService.createPartner(formData);
            }
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["partners"] });
            setIsPartnerDialogOpen(false);
            resetPartnerForm();
            toast.success(editingPartner ? "Partner updated" : "Partner created");
        },
        onError: () => toast.error("Failed to save partner")
    });

    const deletePartnerMutation = useMutation({
        mutationFn: (id: number) => eventsService.deletePartner(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["partners"] });
            toast.success("Partner deleted");
        }
    });

    // Signatory Mutations
    const signatoryMutation = useMutation({
        mutationFn: async () => {
            const formData = new FormData();
            formData.append("name", sigName);
            formData.append("title", sigTitle);
            formData.append("organization", sigOrg);
            if (sigSignature) formData.append("signature", sigSignature);

            if (editingSignatory) {
                return eventsService.updateSignatory(editingSignatory.id, formData);
            } else {
                return eventsService.createSignatory(formData);
            }
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["signatories"] });
            setIsSignatoryDialogOpen(false);
            resetSignatoryForm();
            toast.success(editingSignatory ? "Signatory updated" : "Signatory created");
        },
        onError: () => toast.error("Failed to save signatory")
    });

    const deleteSignatoryMutation = useMutation({
        mutationFn: (id: number) => eventsService.deleteSignatory(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["signatories"] });
            toast.success("Signatory deleted");
        }
    });

    const resetPartnerForm = () => {
        setEditingPartner(null);
        setPartnerName("");
        setPartnerWebsite("");
        setPartnerLogo(null);
    };

    const resetSignatoryForm = () => {
        setEditingSignatory(null);
        setSigName("");
        setSigTitle("");
        setSigOrg("");
        setSigSignature(null);
    };

    const handleEditPartner = (p: any) => {
        setEditingPartner(p);
        setPartnerName(p.name);
        setPartnerWebsite(p.website_url);
        setIsPartnerDialogOpen(true);
    };

    const handleEditSignatory = (s: any) => {
        setEditingSignatory(s);
        setSigName(s.name);
        setSigTitle(s.title);
        setSigOrg(s.organization);
        setIsSignatoryDialogOpen(true);
    };

    return (
        <div className="max-w-6xl mx-auto px-4 py-8 pt-24">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900">Certificate Assets</h1>
                    <p className="text-muted-foreground mt-1">Manage partners and signatories for event certificates.</p>
                </div>
                <div className="flex gap-2">
                   {activeTab === "partners" ? (
                        <Dialog open={isPartnerDialogOpen} onOpenChange={(open) => { setIsPartnerDialogOpen(open); if(!open) resetPartnerForm(); }}>
                            <DialogTrigger asChild>
                                <Button className="gap-2"><Plus className="w-4 h-4" /> Add Partner</Button>
                            </DialogTrigger>
                            <DialogContent>
                                <DialogHeader><DialogTitle>{editingPartner ? "Edit Partner" : "New Partner"}</DialogTitle></DialogHeader>
                                <div className="space-y-4 py-4">
                                    <div className="space-y-2">
                                        <Label>Name</Label>
                                        <Input value={partnerName} onChange={e => setPartnerName(e.target.value)} placeholder="e.g. Google Cloud" />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Website URL</Label>
                                        <Input value={partnerWebsite} onChange={e => setPartnerWebsite(e.target.value)} placeholder="https://..." />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Logo Image</Label>
                                        <Input type="file" accept="image/*" onChange={e => setPartnerLogo(e.target.files?.[0] || null)} />
                                    </div>
                                </div>
                                <DialogFooter>
                                    <Button variant="outline" onClick={() => setIsPartnerDialogOpen(false)}>Cancel</Button>
                                    <Button onClick={() => partnerMutation.mutate()} disabled={partnerMutation.isPending}>
                                        {partnerMutation.isPending ? "Saving..." : "Save Partner"}
                                    </Button>
                                </DialogFooter>
                            </DialogContent>
                        </Dialog>
                   ) : (
                        <Dialog open={isSignatoryDialogOpen} onOpenChange={(open) => { setIsSignatoryDialogOpen(open); if(!open) resetSignatoryForm(); }}>
                            <DialogTrigger asChild>
                                <Button className="gap-2"><Plus className="w-4 h-4" /> Add Signatory</Button>
                            </DialogTrigger>
                            <DialogContent>
                                <DialogHeader><DialogTitle>{editingSignatory ? "Edit Signatory" : "New Signatory"}</DialogTitle></DialogHeader>
                                <div className="space-y-4 py-4">
                                    <div className="space-y-2">
                                        <Label>Full Name</Label>
                                        <Input value={sigName} onChange={e => setSigName(e.target.value)} placeholder="e.g. Jane Smith" />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Title / Role</Label>
                                        <Input value={sigTitle} onChange={e => setSigTitle(e.target.value)} placeholder="e.g. Program Director" />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Organization (Optional)</Label>
                                        <Input value={sigOrg} onChange={e => setSigOrg(e.target.value)} placeholder="e.g. Blue Ox" />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Signature Image (Clear BG .png recommended)</Label>
                                        <Input type="file" accept="image/*" onChange={e => setSigSignature(e.target.files?.[0] || null)} />
                                    </div>
                                </div>
                                <DialogFooter>
                                    <Button variant="outline" onClick={() => setIsSignatoryDialogOpen(false)}>Cancel</Button>
                                    <Button onClick={() => signatoryMutation.mutate()} disabled={signatoryMutation.isPending}>
                                        {signatoryMutation.isPending ? "Saving..." : "Save Signatory"}
                                    </Button>
                                </DialogFooter>
                            </DialogContent>
                        </Dialog>
                   )}
                </div>
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="mb-6">
                    <TabsTrigger value="partners" className="gap-2"><Globe className="w-4 h-4" /> Partners</TabsTrigger>
                    <TabsTrigger value="signatories" className="gap-2"><UserCheck className="w-4 h-4" /> Signatories</TabsTrigger>
                </TabsList>
                
                <TabsContent value="partners">
                    {isLoadingPartners ? <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div> : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {partners?.map((p: any) => (
                                <Card key={p.id} className="overflow-hidden border-slate-100 hover:shadow-md transition-shadow">
                                    <CardHeader className="flex flex-row items-center gap-4 py-4">
                                        <div className="w-12 h-12 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-center overflow-hidden shrink-0">
                                            {p.logo ? <img src={p.logo} alt={p.name} className="w-full h-full object-contain" /> : <ImageIcon className="text-slate-300" />}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <CardTitle className="text-lg truncate">{p.name}</CardTitle>
                                            <CardDescription className="truncate text-xs">{p.website_url}</CardDescription>
                                        </div>
                                    </CardHeader>
                                    <CardContent className="flex justify-end gap-2 border-t border-slate-50 pt-3 pb-3 px-4">
                                        <Button variant="ghost" size="sm" onClick={() => handleEditPartner(p)}><Edit2 className="w-3.5 h-3.5" /></Button>
                                        <Button variant="ghost" size="sm" className="text-red-500 hover:text-red-600 hover:bg-red-50" onClick={() => deletePartnerMutation.mutate(p.id)}><Trash2 className="w-3.5 h-3.5" /></Button>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    )}
                </TabsContent>

                <TabsContent value="signatories">
                    {isLoadingSignatories ? <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div> : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {signatories?.map((s: any) => (
                                <Card key={s.id} className="overflow-hidden border-slate-100 hover:shadow-md transition-shadow">
                                    <CardHeader className="py-5">
                                        <div className="flex items-center gap-3 mb-3">
                                            <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                                                {s.name[0]}
                                            </div>
                                            <div>
                                                <CardTitle className="text-lg">{s.name}</CardTitle>
                                                <CardDescription className="text-xs uppercase font-bold tracking-wider">{s.title}</CardDescription>
                                            </div>
                                        </div>
                                        <div className="mt-2 h-12 border-b border-dashed border-slate-100 flex items-end pb-1 overflow-hidden">
                                            {s.signature ? <img src={s.signature} alt="Sign" className="max-h-10 object-contain grayscale opacity-60" /> : <p className="text-[10px] text-slate-300 italic">No signature image</p>}
                                        </div>
                                    </CardHeader>
                                    <CardContent className="flex justify-end gap-2 border-t border-slate-50 pt-2 pb-2 px-4">
                                        <Button variant="ghost" size="sm" onClick={() => handleEditSignatory(s)}><Edit2 className="w-3.5 h-3.5" /></Button>
                                        <Button variant="ghost" size="sm" className="text-red-500 hover:text-red-600 hover:bg-red-50" onClick={() => deleteSignatoryMutation.mutate(s.id)}><Trash2 className="w-3.5 h-3.5" /></Button>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    )}
                </TabsContent>
            </Tabs>
        </div>
    );
};

export default AdminAssetManagement;
