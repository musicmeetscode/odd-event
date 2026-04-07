import { useRef, useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { adminService } from "@/services/admin";
import { eventsService } from "@/services/events";
import type { CertificateData, Partner, Signatory } from "@/types/api";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Download, Loader2, Award, ExternalLink } from "lucide-react";
import { toast } from "sonner";
import html2canvas from "html2canvas-pro";
import { jsPDF } from "jspdf";
import { useBrand } from "@/contexts/BrandContext";
import { getMediaUrl } from "@/lib/utils";

const Certificate = () => {
    const { brand } = useBrand();
    const { id } = useParams<{ id: string }>();
    const eventId = id || "";
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

    const { data: cert, isLoading, error } = useQuery<CertificateData>({
        queryKey: ["certificate", eventId],
        queryFn: () => adminService.getCertificate(eventId),
    });

    const handleDownload = async () => {
        if (!certRef.current) return;
        setIsGenerating(true);
        try {
            // Wait for fonts to be ready
            await document.fonts.ready;
            
            // On mobile, scrolling to top is critical as some browsers capture relative to viewport
            window.scrollTo(0, 0);
            
            // Wait for images and layout to settle
            await new Promise(r => setTimeout(r, 800));
            
            const canvas = await html2canvas(certRef.current, {
                useCORS: true,
                scale: 2, // Scale 2 is enough for high-res while being more mobile-friendly
                backgroundColor: "#ffffff",
                logging: false,
                allowTaint: true,
                // These properties ensure we capture the full element bounds irrespective of screen size
                windowWidth: 1000,
                windowHeight: 700,
                scrollX: 0,
                scrollY: 0,
            });
            
            const url = canvas.toDataURL("image/png");
            
            // Create PDF
            const pdf = new jsPDF({
                orientation: 'landscape',
                unit: 'px',
                format: [1000, 700]
            });
            
            pdf.addImage(url, 'PNG', 0, 0, 1000, 700);
            pdf.save(`Certificate_${cert?.attendee_name?.replace(/\s+/g, '_') || "Achievement"}.pdf`);
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

    const signatories = (event.signatories || []).slice(0, 5); // Limit to 5 for layout sanity, though we'll scale for more if needed
    const partnersList = event.partners || [];
    const serialNumber = `BOK-${new Date(event.start_date).getFullYear()}-${cert.attendee_name?.split(' ').map((n: string) => n[0]).join('').toUpperCase()}${eventId}${cert.submission?.id || '0'}`;

    // Dynamic scaling logic
    const signatureCount = signatories.length;
    const signatureWidth = signatureCount > 3 ? "w-32" : "w-48";
    const signatureGap = signatureCount > 3 ? "gap-8" : "gap-24";
    const signatureFontSize = signatureCount > 3 ? "text-[12px]" : "text-[14px]";
    const signatureTitleSize = signatureCount > 3 ? "text-[8px]" : "text-[10px]";
    const signatureMt = signatureCount > 3 ? "mt-8" : "mt-12";

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

                    {/* Left Top Banner (Orange) - SVG for robust canvas rendering */}
                    <svg className="absolute top-0 left-0 w-64 h-64" viewBox="0 0 100 100" preserveAspectRatio="none">
                        <polygon points="0,0 100,0 0,100" fill="#F58220" />
                    </svg>

                    {/* Right Bottom Banner (Blue) - SVG for robust canvas rendering */}
                    <svg className="absolute bottom-0 right-0 w-80 h-80" viewBox="0 0 100 100" preserveAspectRatio="none">
                        <polygon points="100,0 100,100 0,100" fill="#1a365d" />
                    </svg>

                    {/* Main Content Container */}
                    <div className="relative h-full flex flex-col items-center px-16 pt-12 z-10 text-center">
                        
                        {/* Header Section */}
                        <div className="flex flex-col items-center mb-2">
                            <div className="flex items-center gap-4 mb-2">
                                <img src={brand.logo || "/logo.png"} alt="Logo" className="w-14 h-14 object-contain" crossOrigin="anonymous" />
                                <div className="text-left">
                                    <div className="text-lg font-bold tracking-widest leading-none" style={{ color: brand.primary_color }}>{brand.name.toUpperCase()}</div>
                                    <div className="text-[11px] font-medium tracking-[0.3em]" style={{ color: brand.accent_color }}>{brand.tagline.toUpperCase()}</div>
                                </div>
                            </div>
                        </div>

                        {/* Title Section */}
                        <div className="mb-6 mt-1">
                            <div className="text-[12px] uppercase tracking-[0.5em] text-slate-400 mb-1 font-bold leading-none">Certificate of</div>
                            <div className="text-5xl font-bold italic" style={{ fontFamily: "'EB Garamond', serif", color: brand.primary_color }}>
                                {cert.certificate_type.split(' - ')[0] || "Excellence"}
                            </div>
                            {cert.rank && (
                                <div className="font-bold text-[12px] tracking-[0.3em] uppercase mt-1" style={{ color: brand.accent_color }}>
                                    {cert.certificate_type.includes('Winner') ? 'THE WINNER' : cert.certificate_type.split(' - ')[1]?.toUpperCase()}
                                </div>
                            )}
                        </div>

                        {/* Recipient Section */}
                        <div className="mb-6">
                            <div className="text-[12px] uppercase tracking-[0.4em] text-slate-400 mb-4 font-bold">Presented To</div>
                            <div 
                                className="text-6xl text-[#1a1a2e] mb-2" 
                                style={{ fontFamily: "'Great Vibes', cursive" }}
                            >
                                {cert.attendee_name}
                            </div>
                            <div className="max-w-2xl mx-auto text-slate-500 leading-relaxed text-[14px]">
                                {cert.rank ? (
                                    <>In recognition of outstanding achievement in the <span className="text-[#F58220] font-bold">{event?.title}</span> at <span className="font-bold text-[#1a365d] italic">{event?.location || brand.company_name}</span> on <span className="font-bold text-[#1a365d] italic">{new Date(event?.start_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}</span>, 
                                    demonstrating exceptional skill and creativity with the submission <span className="font-bold text-[#1a365d] italic">"{cert.submission?.title}"</span>.</>
                                ) : (
                                    <>In recognition of active participation and commitment to excellence during the <span className="text-[#F58220] font-bold">{event?.title}</span> held at <span className="font-bold text-[#1a365d] italic">{event?.location || brand.company_name}</span> on <span className="font-bold text-[#1a365d] italic">{new Date(event?.start_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}</span>. 
                                    This achievement reflects a dedication to growth, innovation, and the mission to Code · Connect · Learn · Grow.</>
                                )}
                            </div>
                        </div>

                        {/* Assets Section (Signatories first, then Partners) */}
                        <div className="flex flex-col items-center w-full -mt-4 space-y-4">
                            {/* Signatories Section */}
                            <div className={`flex justify-center flex-wrap ${signatureGap} w-full ${signatureMt}`}>
                                {signatories.map((sig: Signatory, idx: number) => (
                                    <div key={sig.id || idx} className={`flex flex-col items-center max-w-[220px]`}>
                                        <div className="h-16 flex items-end mb-1">
                                            {sig.signature ? (
                                                <img src={getMediaUrl(sig.signature)} alt="Signature" className="h-14 object-contain" crossOrigin="anonymous" />
                                            ) : (
                                                <div className="h-14" />
                                            )}
                                        </div>
                                        <div className={`${signatureWidth} h-[1.5px] bg-[#1a365d]/20 mb-2`}></div>
                                        <div className="text-[16px] font-bold text-[#1a1a2e] uppercase tracking-tighter">{sig.name}</div>
                                        <div className="text-[10px] uppercase text-slate-400 font-bold tracking-widest leading-tight text-center">{sig.title}</div>
                                    </div>
                                ))}
                            </div>

                            {/* Partners Section (Smaller) */}
                            <div className="pt-8 border-t border-slate-100 flex flex-col items-center w-full max-w-2xl">
                                <div className="text-[9px] uppercase tracking-[0.4em] text-slate-300 mb-3 font-bold">Supported By</div>
                                <div className="flex flex-wrap justify-center items-center gap-6 opacity-80 filter grayscale hover:grayscale-0 transition-all">
                                    {partnersList.length > 0 ? partnersList.map((p: Partner) => (
                                        <div key={p.id} className="flex items-center gap-2">
                                            {p.logo && <img src={getMediaUrl(p.logo)} alt={p.name} className="h-6 w-auto object-contain" crossOrigin="anonymous" />}
                                            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-tighter">{p.name}</span>
                                        </div>
                                    )) : <span className="text-[11px] font-bold text-slate-400 uppercase tracking-tighter">{brand.company_name}</span>}
                                </div>
                            </div>
                        </div>

                        {/* Serial Number & Verification */}
                        <div className="absolute bottom-4 inset-x-0 flex flex-col items-center text-[9px] text-slate-300 tracking-widest font-mono">
                            <div>{serialNumber}</div>
                        </div>

                        {/* Seal */}
                        <div className="absolute bottom-10 right-10 w-28 h-28 rounded-full border-4 flex items-center justify-center p-1 bg-white/10 backdrop-blur-sm shadow-xl" style={{ borderColor: `${brand.accent_color}33` }}>
                            <div className="w-full h-full rounded-full border border-dashed flex flex-col items-center justify-center" style={{ borderColor: `${brand.accent_color}66`, color: brand.accent_color }}>
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
