import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { eventsService } from "@/services/events";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Trophy, ArrowLeft, Loader2, Award, Star, Info, CheckCircle2 } from "lucide-react";
import { format } from "date-fns";
import { brand } from "@/config/brandConfig";

const PublicSubmission = () => {
    const { id } = useParams<{ id: string }>();
    const submissionId = Number(id);
    const navigate = useNavigate();

    // Re-use an existing service or create a public one
    const { data: result, isLoading, error } = useQuery<any>({
        queryKey: ["public-submission", submissionId],
        queryFn: async () => {
            const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/api/public/submission/${submissionId}/`);
            if (!res.ok) throw new Error("Failed to fetch submission details");
            return res.json();
        },
    });

    if (isLoading) return <div className="flex justify-center pt-32"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
    
    if (error || !result) return (
        <div className="max-w-md mx-auto pt-32 text-center px-4">
            <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <Info className="w-8 h-8" />
            </div>
            <h2 className="text-xl font-bold mb-2">Not Found</h2>
            <p className="text-muted-foreground">This submission or win details could not be found. It might be private or deleted.</p>
            <Button variant="outline" className="mt-6" onClick={() => navigate('/')}>Go to Homepage</Button>
        </div>
    );

    const { event_title, submission_title, submitted_by, total_score, rank, scores, is_competition } = result;

    return (
        <div className="min-h-screen bg-slate-50/50 pt-24 pb-12 px-4">
            <div className="max-w-3xl mx-auto">
                <div className="flex items-center gap-2 mb-8 no-print">
                    <Button variant="ghost" size="icon" onClick={() => navigate(-1)}><ArrowLeft className="h-4 w-4" /></Button>
                    <div className="flex items-center gap-2">
                        <img src={brand.logo} alt={brand.name} className="w-8 h-8" />
                        <span className="font-bold text-slate-900 tracking-tight">{brand.name} Verification</span>
                    </div>
                </div>

                {/* Hero Certificate Card */}
                <Card className="border-none shadow-2xl bg-white overflow-hidden relative mb-8">
                    <div className="absolute top-0 right-0 p-4">
                        <Badge className="bg-green-500/10 text-green-600 border-green-500/20 gap-1.5 px-3 py-1">
                            <CheckCircle2 className="w-3.5 h-3.5" /> Verified Achievement
                        </Badge>
                    </div>
                    
                    <CardHeader className="pt-12 pb-8 text-center border-b border-slate-50">
                        <div className="flex justify-center mb-6">
                            <div className="relative">
                                <div className="w-24 h-24 bg-blue-50 rounded-full flex items-center justify-center border-4 border-white shadow-lg">
                                    <Trophy className={`w-12 h-12 ${rank === 1 ? 'text-yellow-500' : rank === 2 ? 'text-slate-400' : 'text-amber-700'}`} />
                                </div>
                                {rank && (
                                    <div className="absolute -bottom-2 -right-2 bg-primary text-white text-xs font-bold w-10 h-10 rounded-full border-4 border-white flex items-center justify-center">
                                        #{rank}
                                    </div>
                                )}
                            </div>
                        </div>
                        <CardTitle className="text-3xl font-bold text-slate-900 mb-2">{submission_title}</CardTitle>
                        <CardDescription className="text-lg font-medium text-slate-500 italic">
                            Submitted by <span className="text-slate-900 font-bold not-italic">{submitted_by}</span>
                        </CardDescription>
                    </CardHeader>

                    <CardContent className="py-8">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="space-y-6">
                                <div>
                                    <h4 className="text-[10px] uppercase font-bold text-slate-400 tracking-widest mb-3">Event Overview</h4>
                                    <div className="flex items-start gap-3">
                                        <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center shrink-0">
                                            <Award className="w-5 h-5 text-slate-600" />
                                        </div>
                                        <div>
                                            <div className="font-bold text-slate-900">{event_title}</div>
                                            <div className="text-sm text-slate-500">Official {brand.name} Event</div>
                                        </div>
                                    </div>
                                </div>

                                {is_competition && (
                                    <div>
                                        <h4 className="text-[10px] uppercase font-bold text-slate-400 tracking-widest mb-3">Ranking Information</h4>
                                        <div className="flex items-center gap-4 p-4 bg-blue-50/50 rounded-xl border border-blue-100/50">
                                            <div className="text-center">
                                                <div className="text-2xl font-black text-blue-600">{rank || 'N/A'}</div>
                                                <div className="text-[9px] uppercase font-bold text-blue-400">Rank</div>
                                            </div>
                                            <div className="h-8 w-[1px] bg-blue-200/50" />
                                            <div className="text-center">
                                                <div className="text-2xl font-black text-blue-600">{total_score}</div>
                                                <div className="text-[9px] uppercase font-bold text-blue-400">Total Score</div>
                                            </div>
                                            <div className="flex-1 text-right">
                                                <div className="text-sm font-bold text-blue-600">
                                                    {rank === 1 ? 'Gold Medalist' : rank === 2 ? 'Silver Medalist' : rank === 3 ? 'Bronze Medalist' : 'Top Performer'}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div className="space-y-6">
                                <h4 className="text-[10px] uppercase font-bold text-slate-400 tracking-widest mb-3">Judging Score Breakdown</h4>
                                <div className="space-y-3">
                                    {scores.map((score: any, idx: number) => (
                                        <div key={idx} className="space-y-1">
                                            <div className="flex justify-between text-sm font-medium">
                                                <span className="text-slate-600">{score.criteria_name}</span>
                                                <span className="font-bold">{score.score} / {score.criteria_max}</span>
                                            </div>
                                            <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                                <div 
                                                    className="h-full bg-primary" 
                                                    style={{ width: `${(score.score / score.criteria_max) * 100}%` }}
                                                />
                                            </div>
                                        </div>
                                    ))}
                                    {scores.length === 0 && (
                                        <div className="text-sm text-slate-400 italic py-4 text-center bg-slate-50 rounded-lg">
                                            No detailed scores released yet.
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </CardContent>

                    <div className="bg-slate-900 p-8 text-center text-white">
                        <div className="max-w-md mx-auto">
                            <div className="text-sm font-bold mb-2">Authentic {brand.name} Achievement</div>
                            <p className="text-xs text-slate-400 leading-relaxed mb-6">
                                This achievement is cryptographically tied to the user's verified identity and official judging results recorded during {event_title}.
                            </p>
                            <Button className="bg-white text-slate-900 hover:bg-slate-100 font-bold" onClick={() => navigate('/')}>
                                Explore More Events
                            </Button>
                        </div>
                    </div>
                </Card>

                {/* Footer */}
                <div className="text-center">
                    <p className="text-sm text-slate-400">© {new Date().getFullYear()} {brand.company} · All rights reserved.</p>
                </div>
            </div>
        </div>
    );
};

export default PublicSubmission;
