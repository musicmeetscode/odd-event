import { useRef, useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { adminService } from "@/services/admin";
import { eventsService } from "@/services/events";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Download, Loader2, Award, ExternalLink } from "lucide-react";
import { toast } from "sonner";
import html2canvas from "html2canvas-pro";
import { brand } from "@/config/brandConfig";

const Certificate = () => {
    const { id } = useParams<{ id: string }>();
    const eventId = Number(id);
    const navigate = useNavigate();
    const certRef = useRef<HTMLDivElement>(null);
    const [isGenerating, setIsGenerating] = useState(false);

    // Load Google Fonts
    useEffect(() => {
        const link = document.createElement("link");
        link.href = "https://fonts.googleapis.com/css2?family=EB+Garamond:wght@400;700&family=Great+Vibes&family=Inter:wght@300;400;600&display=swap";
        link.rel = "stylesheet";
        document.head.appendChild(link);
    }, []);

    const { data: eventData } = useQuery({
        queryKey: ["event", eventId],
        queryFn: () => eventsService.getEvent(eventId),
    });

    const { data: cert, isLoading, error } = useQuery<any>({
        queryKey: ["certificate", eventId],
        queryFn: () => adminService.getCertificate(eventId),
    });

    const handleDownload = async () => {
        if (!certRef.current) return;
        setIsGenerating(true);
        try {
            // Wait for images and fonts to load
            await new Promise(r => setTimeout(r, 500));
            const canvas = await html2canvas(certRef.current, {
                useCORS: true,
                scale: 3,
                backgroundColor: "#ffffff",
                logging: false,
                allowTaint: true,
            });
            
            const url = canvas.toDataURL("image/png");
            const link = document.createElement("a");
            link.href = url;
            link.download = `Certificate_${cert?.attendee_name?.replace(/\s+/g, '_') || "Achievement"}.png`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            setIsGenerating(false);
            toast.success("Certificate downloaded! 🎉");
        } catch (err) {
            console.error(err);
            toast.error("Failed to generate certificate.");
            setIsGenerating(false);
        }
    };

    if (isLoading) return <div className="flex justify-center pt-32"><Loader2 className="h-8 w-8 animate-spin" /></div>;
    if (error || !cert) return (
        <div className="max-w-md mx-auto pt-32 text-center">
            <p className="text-muted-foreground">Certificate data not found. Are you registered?</p>
            <Button variant="outline" className="mt-4" onClick={() => navigate(`/events/${eventId}`)}>Back to Event</Button>
        </div>
    );

    const event = cert.event;
    const isReleased = event?.certificates_released;

    if (!isReleased) return (
        <div className="max-w-md mx-auto pt-32 text-center">
            <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-4 border-2 border-primary/10">
                <Award className="w-8 h-8" />
            </div>
            <h2 className="text-xl font-bold text-slate-900 mb-2">Not Yet Available</h2>
            <p className="text-muted-foreground">Certificates haven't been released by the admin yet.</p>
            <Button variant="outline" className="mt-6" onClick={() => navigate(`/events/${eventId}`)}>Back to Event</Button>
        </div>
    );

    const signatories = [event.signatory_1, event.signatory_2, event.signatory_3].filter(Boolean);
    const partnersList = event.partners || [];
    const serialNumber = `BOK-${new Date(event.start_date).getFullYear()}-${cert.attendee_name?.split(' ').map((n: string) => n[0]).join('').toUpperCase()}${eventId}${cert.submission?.id || '0'}`;

    return (
        <div className="max-w-5xl mx-auto px-4 py-6 pt-20">
            <div className="flex items-center justify-between mb-8 no-print">
                <div className="flex items-center gap-2">
                    <Button variant="ghost" size="icon" onClick={() => navigate(`/events/${eventId}`)}><ArrowLeft className="h-4 w-4" /></Button>
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">Your Achievement</h1>
                        <p className="text-sm text-muted-foreground">{event?.title}</p>
                    </div>
                </div>
                <div className="flex gap-2">
                    {cert.sharing_url && (
                        <Button variant="outline" onClick={() => window.open(cert.sharing_url, '_blank')}>
                            <ExternalLink className="h-4 w-4 mr-2" /> Verify Details
                        </Button>
                    )}
                    <Button onClick={handleDownload} disabled={isGenerating} className="bg-primary hover:bg-primary/90">
                        {isGenerating ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Download className="h-4 w-4 mr-2" />}
                        {isGenerating ? "Preparing..." : "Download High-Res"}
                    </Button>
                </div>
            </div>

            <div className="flex justify-center overflow-x-auto pb-10">
                <div
                    ref={certRef}
                    className="relative bg-white shadow-2xl overflow-hidden shrink-0 select-none"
                    style={{
                        width: "1000px",
                        height: "700px",
                        fontFamily: "'Inter', sans-serif",
                    }}
                >
                    {/* Background Grid */}
                    <div className="absolute inset-0 opacity-[0.03]" style={{ 
                        backgroundImage: `radial-gradient(#1a365d 1px, transparent 1px)`,
                        backgroundSize: '24px 24px'
                    }}></div>

                    {/* Left Top Banner (Orange) */}
                    <div className="absolute top-0 left-0 w-64 h-64 bg-[#F58220]" style={{ 
                        clipPath: 'polygon(0 0, 100% 0, 0 100%)' 
                    }}></div>

                    {/* Right Bottom Banner (Blue) */}
                    <div className="absolute bottom-0 right-0 w-80 h-80 bg-[#1a365d]" style={{ 
                        clipPath: 'polygon(100% 0, 100% 100%, 0 100%)' 
                    }}></div>

                    {/* Main Content Container */}
                    <div className="relative h-full flex flex-col items-center px-16 pt-16 z-10 text-center">
                        
                        {/* Header Section */}
                        <div className="flex flex-col items-center mb-4">
                            <div className="flex items-center gap-4 mb-4">
                                <img src="/logo.png" alt="Logo" className="w-16 h-16 object-contain" crossOrigin="anonymous" />
                                <div className="text-left">
                                    <div className="text-xl font-bold tracking-widest leading-none" style={{ color: brand.colors.primary }}>{brand.name.toUpperCase()}</div>
                                    <div className="text-sm font-medium tracking-[0.3em]" style={{ color: brand.colors.accent }}>{brand.tagline.toUpperCase()}</div>
                                </div>
                            </div>
                            {/* <div className="text-[12px] uppercase tracking-[0.4em] text-slate-400 mb-1 font-semibold">Presents</div>
                            <div className="text-lg font-bold text-[#F58220] uppercase tracking-widest">
                                {event?.title}
                            </div>
                            <div className="text-sm text-slate-400 font-medium mt-1">
                                {new Date(event?.start_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }).toUpperCase()}
                            </div> */}
                        </div>

                        {/* Title Section */}
                        <div className="mb-8 mt-2">
                            <div className="text-[14px] uppercase tracking-[0.5em] text-slate-400 mb-2 font-bold leading-none">Certificate of</div>
                            <div className="text-6xl font-bold italic" style={{ fontFamily: "'EB Garamond', serif", color: brand.colors.primary }}>
                                {cert.certificate_type.split(' - ')[0] || "Excellence"}
                            </div>
                            {cert.rank && (
                                <div className="font-bold text-sm tracking-[0.3em] uppercase mt-2" style={{ color: brand.colors.accent }}>
                                    {cert.certificate_type.includes('Winner') ? 'THE WINNER' : cert.certificate_type.split(' - ')[1]?.toUpperCase()}
                                </div>
                            )}
                        </div>

                        {/* Recipient Section */}
                        <div className="mb-8">
                            <div className="text-[14px] uppercase tracking-[0.4em] text-slate-400 mb-6 font-bold">Presented To</div>
                            <div 
                                className="text-7xl text-[#1a1a2e] mb-4" 
                                style={{ fontFamily: "'Great Vibes', cursive" }}
                            >
                                {cert.attendee_name}
                            </div>
                            <div className="max-w-2xl mx-auto text-slate-500 leading-relaxed text-[15px]">
                                {cert.rank ? (
                                    <>In recognition of outstanding achievement in the <span className="text-[#F58220] font-bold">{event?.title}</span>, 
                                    demonstrating exceptional skill and creativity with the submission <span className="font-bold text-[#1a365d] italic">"{cert.submission?.title}"</span>.</>
                                ) : (
                                    <>In recognition of active participation and commitment to excellence during the <span className="text-[#F58220] font-bold">{event?.title}</span>. 
                                    This achievement reflects a dedication to growth, innovation, and the mission to Code · Connect · Learn · Grow.</>
                                )}
                            </div>
                        </div>

                        {/* Footer Info Grid */}
                        <div className="grid grid-cols-3 gap-12 w-full max-w-4xl mt-1 border-t border-slate-100 pt-8">
                            <div className="text-center">
                                <div className="text-[11px] uppercase tracking-[0.3em] text-slate-400 mb-1 font-bold">Date</div>
                                <div className="text-[14px] font-bold text-[#1a1a2e]">
                                    {new Date(event?.start_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
                                </div>
                            </div>
                            <div className="text-center">
                                <div className="text-[11px] uppercase tracking-[0.3em] text-slate-400 mb-1 font-bold">Venue</div>
                                <div className="text-[14px] font-bold text-[#1a1a2e]">{event?.location || brand.company}</div>
                            </div>
                            <div className="text-center">
                                <div className="text-[11px] uppercase tracking-[0.3em] text-slate-400 mb-1 font-bold">Partners</div>
                                <div className="text-[13px] font-bold text-[#1a1a2e]">
                                    {partnersList.length > 0 ? partnersList.map((p: any) => p.name).join(' · ') : brand.company}
                                </div>
                            </div>
                        </div>

                        {/* Signatories Section */}
                        <div className="flex justify-center gap-24 w-full mt-12 mb-4">
                            {signatories.map((sig: any, idx: number) => (
                                <div key={idx} className="flex flex-col items-center">
                                    <div className="h-16 flex items-end mb-1">
                                        {sig.signature && (
                                            <img src={sig.signature} alt="Signature" className="h-14 object-contain" crossOrigin="anonymous" />
                                        )}
                                    </div>
                                    <div className="w-48 h-[1px] bg-slate-200 mb-2"></div>
                                    <div className="text-[14px] font-bold text-[#1a1a2e] uppercase">{sig.name}</div>
                                    <div className="text-[10px] uppercase text-slate-400 font-bold tracking-wider leading-tight">{sig.title}</div>
                                </div>
                            ))}
                        </div>

                        {/* Serial Number & Verification */}
                        <div className="absolute bottom-4 inset-x-0 flex flex-col items-center text-[9px] text-slate-300 tracking-widest font-mono">
                            <div>{serialNumber}</div>
                        </div>

                        {/* Seal */}
                        <div className="absolute bottom-10 right-10 w-28 h-28 rounded-full border-4 flex items-center justify-center p-1 bg-white/10 backdrop-blur-sm shadow-xl" style={{ borderColor: `${brand.colors.accent}33` }}>
                            <div className="w-full h-full rounded-full border border-dashed flex flex-col items-center justify-center" style={{ borderColor: `${brand.colors.accent}66`, color: brand.colors.accent }}>
                                <div className="text-[8px] font-black tracking-tighter leading-none mb-1 text-center">{brand.name.toUpperCase()}<br/>{brand.tagline.toUpperCase()}</div>
                                <Award className="w-8 h-8 opacity-40" />
                                <div className="text-[8px] font-bold mt-1 tracking-widest">{new Date().getFullYear()}</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <style>{`
                @media print {
                    .no-print { display: none; }
                    body { background: white; }
                }
            `}</style>
        </div>
    );
};

export default Certificate;
