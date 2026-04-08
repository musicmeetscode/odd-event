import React from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { eventsService } from "@/services/events";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { 
  Trophy, 
  Calendar, 
  Users, 
  Award, 
  Star, 
  ArrowRight, 
  Layout as LayoutIcon, 
  ChevronRight,
  Zap,
  Shield,
  Rocket,
  Compass,
  Share2
} from "lucide-react";
import { useBrand } from "@/contexts/BrandContext";
import { useAuth } from "@/contexts/AuthContext";
import { Badge } from "@/components/ui/badge";

const LandingPage = () => {
  const { brand } = useBrand();
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const { data: events } = useQuery({
    queryKey: ["events"],
    queryFn: eventsService.listEvents,
  });

  const { data: globalWinners } = useQuery({
    queryKey: ["global-wall-of-fame"],
    queryFn: eventsService.getGlobalWallOfFame,
  });

  const featuredEvents = events?.slice(0, 3) || [];

  return (
    <div className="min-h-screen bg-white">
      {/* ═══════════ Hero Section ═══════════ */}
      <section className="relative min-h-[95vh] flex items-center justify-center pt-24 pb-16 px-4 md:px-12 bg-white text-slate-900 overflow-hidden">
        {/* Abstract Background Shapes - Subtle */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0">
          <div className="absolute top-1/4 -left-20 w-96 h-96 bg-primary/5 rounded-full blur-[120px] animate-pulse"></div>
          <div className="absolute bottom-1/4 -right-20 w-96 h-96 bg-secondary/5 rounded-full blur-[120px] animate-pulse transition-all duration-1000"></div>
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(0,0,0,0.01)_1px,transparent_1px)] bg-[length:24px_24px]"></div>
        </div>

        <div className="relative z-10 max-w-7xl mx-auto w-full grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          {/* Left Side: Branding & CTA */}
          <div className="space-y-10 text-left animate-in slide-in-from-left-8 duration-1000">
            <div className="h-32 w-32">
              <img src="/logo.png" alt="MetToday" className="h-full w-full object-cover" />
            </div>

            <div className="space-y-4">
              <Badge variant="outline" className="px-3 py-1 border-primary/20 text-primary bg-primary/5 font-bold uppercase tracking-widest text-[10px]">
                The Networking Revolution
              </Badge>
              <h1 className="text-7xl md:text-8xl font-black tracking-tight leading-[0.9] text-slate-900">
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary">{brand.name}</span>
              </h1>
            </div>

            <p className="text-xl md:text-2xl text-slate-500 max-w-xl leading-relaxed font-medium">
              Register, share, and stay connected. From social posters to digital certificates, your journey doesn't have to end with the event.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 pt-4">
              {isAuthenticated ? (
                <Button
                  size="lg"
                  onClick={() => navigate("/events")}
                  className="h-16 px-10 text-lg font-bold rounded-[2rem] bg-slate-900 hover:bg-black text-white transition-all shadow-2xl shadow-slate-200"
                >
                  Go to Events <ArrowRight className="ml-2 h-6 w-6" />
                </Button>
              ) : (
                <>
                  <Button
                    size="lg"
                    onClick={() => navigate("/register")}
                    className="h-16 px-10 text-lg font-bold rounded-[2rem] bg-slate-900 hover:bg-black text-white transition-all shadow-2xl shadow-slate-200"
                  >
                    Join Today <ArrowRight className="ml-2 h-6 w-6" />
                  </Button>
                  <Button
                    size="lg"
                    variant="outline"
                    onClick={() => navigate("/login")}
                    className="h-16 px-10 text-lg font-bold rounded-[2rem] border-slate-200 bg-white hover:bg-slate-50 transition-all text-slate-700 shadow-sm"
                  >
                    Sign In
                  </Button>
                </>
              )}
            </div>
          </div>

          {/* Right Side: 4 Steps Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 animate-in slide-in-from-right-8 duration-1000">
            {[
              { id: 1, title: "Discovery", desc: "Join world-class events and manage registrations in one seamless dashboard.", icon: <Compass className="h-6 w-6" /> },
              { id: 2, title: "Amplify", desc: "Generate high-quality social posters to showcase your presence and network.", icon: <Share2 className="h-6 w-6" /> },
              { id: 3, title: "Feedback", desc: "Submit your work for real-time evaluation and receive actionable expert insights.", icon: <Zap className="h-6 w-6" /> },
              { id: 4, title: "Success", desc: "Connect with curated buddy groups and claim verified digital certificates.", icon: <Award className="h-6 w-6" /> }
            ].map((step) => (
              <Card key={step.id} className="group relative overflow-hidden border-slate-100/60 bg-slate-50/30 hover:bg-white shadow-2xl transition-all duration-500 rounded-[2.5rem]">
                <CardContent className="p-8 space-y-4 text-left">
                  <div className="h-12 w-12 rounded-2xl bg-white shadow-sm flex items-center justify-center text-primary group-hover:scale-110 group-hover:bg-primary group-hover:text-white transition-all duration-500">
                    {step.icon}
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-xl font-bold text-slate-900">{step.title}</h3>
                    <p className="text-sm text-slate-500 leading-relaxed">{step.desc}</p>
                  </div>
                  <div className="absolute top-4 right-6 text-4xl font-black text-slate-300 group-hover:text-primary/10 transition-colors">
                    0{step.id}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Scroll Indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 group cursor-pointer opacity-50 hover:opacity-100" onClick={() => document.getElementById('upcoming-events')?.scrollIntoView({ behavior: 'smooth' })}>
          <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400 transition-colors">Discover Events</span>
          <ChevronRight className="h-5 w-5 rotate-90 text-primary animate-bounce" />
        </div>
      </section>

      {/* ═══════════ Upcoming Events Section ═══════════ */}
      <section id="upcoming-events" className="py-24 px-4 md:px-8 bg-white border-t border-slate-50">
        <div className="max-w-7xl mx-auto space-y-12">
          <div className="flex flex-col md:flex-row justify-between items-end gap-6">
            <div className="space-y-4">
              <h2 className="text-3xl md:text-4xl font-black text-slate-900">Upcoming Events</h2>
              <p className="text-slate-500 max-w-xl">Don't miss out on these exclusive opportunities to learn, grow, and showcase your talent.</p>
            </div>
            <Button variant="ghost" className="font-bold text-primary hover:text-primary transition-colors h-auto p-0" onClick={() => navigate("/events")}>
              View all events <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {featuredEvents.map((event) => (
              <Card key={event.id} className="group overflow-hidden border-border/50 hover:shadow-2xl transition-all duration-500 rounded-3xl">
                <div className="relative h-48 bg-slate-100 overflow-hidden">
                  <div className={`absolute inset-0 bg-gradient-to-br from-primary/10 to-secondary/10 group-hover:scale-110 transition-transform duration-700`}></div>
                  <div className="absolute top-4 right-4">
                    <Badge className="bg-white/90 backdrop-blur-md text-slate-900 border-none px-3 py-1 font-bold shadow-sm">
                      {event.event_type.toUpperCase()}
                    </Badge>
                  </div>
                  <div className="absolute bottom-4 left-4 flex items-center gap-2">
                    <div className="h-10 w-10 rounded-xl bg-white/90 backdrop-blur-md flex items-center justify-center text-primary shadow-sm">
                      <Trophy className="h-5 w-5" />
                    </div>
                  </div>
                </div>
                <CardContent className="p-6 space-y-4">
                  <div className="space-y-2">
                    <h3 className="text-xl font-bold text-slate-900 group-hover:text-primary transition-colors">{event.title}</h3>
                    <p className="text-slate-500 text-sm line-clamp-2">{event.description}</p>
                  </div>
                  <div className="flex items-center gap-4 text-xs font-semibold text-slate-400">
                    <div className="flex items-center gap-1.5"><Calendar className="h-3.5 w-3.5" /> {new Date(event.start_date).toLocaleDateString()}</div>
                    <div className="flex items-center gap-1.5"><Users className="h-3.5 w-3.5" /> {event.attendee_count} attending</div>
                  </div>
                  <Button
                    className="w-full h-11 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-900 font-bold transition-all border border-slate-200"
                    onClick={() => navigate(`/events/${event.id}`)}
                  >
                    View Details
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════ Global Wall of Fame ═══════════ */}
      <section id="wall-of-fame" className="py-24 px-4 md:px-8 bg-white relative overflow-hidden">
        {/* Background Accents - Subtle */}
        <div className="absolute top-0 right-0 p-32 bg-yellow-400/3 rounded-full blur-3xl -mr-32 -mt-32"></div>
        <div className="absolute bottom-0 left-0 p-32 bg-primary/3 rounded-full blur-3xl -ml-32 -mb-32"></div>

        <div className="max-w-7xl mx-auto space-y-16 relative z-10">
          <div className="text-center space-y-4">
            <div className="inline-flex items-center justify-center h-16 w-16 rounded-full bg-yellow-100 text-yellow-600 mb-4 shadow-inner">
              <Trophy className="h-8 w-8" />
            </div>
            <h2 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tight leading-tight">Wall of Fame</h2>
            <p className="text-xl text-slate-500 max-w-2xl mx-auto leading-relaxed">
              Celebrating the brightest minds and most creative talents who have triumphed across our platform.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {globalWinners?.map((winner, i) => (
              <Card key={i} className="group relative overflow-hidden bg-white hover:bg-slate-900 hover:text-white transition-all duration-500 rounded-[2rem] border-none shadow-xl shadow-slate-200 hover:shadow-2xl hover:shadow-slate-900/40">
                <CardContent className="p-8 flex flex-col items-center text-center space-y-6">
                  <div className="relative">
                    <div className="h-24 w-24 rounded-[2rem] bg-slate-100 overflow-hidden group-hover:rotate-12 transition-all duration-500 border-4 border-white shadow-lg">
                      {winner.avatar_url ? (
                        <img src={winner.avatar_url} alt={winner.submitted_by} className="h-full w-full object-cover" />
                      ) : (
                        <div className="h-full w-full flex items-center justify-center bg-gradient-to-br from-primary/20 to-secondary/20 text-primary">
                          <Users className="h-10 w-10" />
                        </div>
                      )}
                    </div>
                    {i < 3 && (
                      <div className={`absolute -top-3 -right-3 h-10 w-10 rounded-full flex items-center justify-center font-black text-white border-4 border-white shadow-lg ${i === 0 ? 'bg-yellow-400' : i === 1 ? 'bg-slate-300' : 'bg-amber-600'}`}>
                        {i + 1}
                      </div>
                    )}
                  </div>

                  <div className="space-y-1">
                    <h4 className="font-black text-lg group-hover:text-white transition-colors">{winner.submitted_by}</h4>
                    <p className="text-xs font-bold text-primary uppercase tracking-widest">{winner.event_title}</p>
                  </div>

                  <div className="w-full pt-4 border-t border-slate-100 group-hover:border-white/10">
                    <div className="flex justify-between items-center px-2">
                      <div className="text-left">
                        <div className="text-2xl font-black">{winner.total_score}</div>
                        <div className="text-[10px] uppercase font-bold text-slate-400 group-hover:text-slate-500 tracking-widest">Points</div>
                      </div>
                      <Button variant="ghost" size="icon" className="h-10 w-10 rounded-xl bg-slate-50 group-hover:bg-white/10 group-hover:text-white transition-colors">
                        <Star className={`h-5 w-5 ${i < 3 ? 'fill-yellow-400 text-yellow-400' : ''}`} />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="text-center">
            <div className="p-6 bg-white/50 backdrop-blur-md rounded-[2.5rem] border border-white inline-flex items-center gap-6 shadow-sm">
              <div className="flex -space-x-3">
                {[1, 2, 3, 4].map(i => (
                  <div key={i} className="h-10 w-10 rounded-full border-2 border-white bg-slate-200"></div>
                ))}
              </div>
              <div className="text-sm font-bold text-slate-800">Explore <span className="text-primary">+500</span> more rising stars in our community</div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════ Platform Perks ═══════════ */}
      <section id="perks" className="py-24 px-4 md:px-8 bg-white overflow-hidden">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <div className="space-y-8">
            <div className="space-y-4">
              <Badge variant="outline" className="border-secondary/20 text-secondary bg-secondary/5 font-bold">Why Choose Us?</Badge>
              <h2 className="text-4xl md:text-5xl font-black text-slate-900 leading-tight">Elevate Your Events Through Expert Judging</h2>
              <p className="text-xl text-slate-500 leading-relaxed">Our platform is designed to streamline event management, from registration to final results, with professional tools built for success.</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="p-6 bg-white border border-slate-100 rounded-3xl space-y-4 hover:shadow-xl hover:shadow-slate-200/60 transition-all duration-300 group">
                <div className="h-12 w-12 rounded-2xl bg-orange-100 text-orange-600 flex items-center justify-center group-hover:scale-110 transition-transform"><Zap className="h-6 w-6" /></div>
                <h4 className="font-bold text-slate-900">Rapid Networking</h4>
                <p className="text-sm text-slate-500 leading-relaxed">Join Buddy Groups and connect with like-minded creators instantly.</p>
              </div>
              <div className="p-6 bg-white border border-slate-100 rounded-3xl space-y-4 hover:shadow-xl hover:shadow-slate-200/60 transition-all duration-300 group">
                <div className="h-12 w-12 rounded-2xl bg-blue-100 text-blue-600 flex items-center justify-center group-hover:scale-110 transition-transform"><Shield className="h-6 w-6" /></div>
                <h4 className="font-bold text-slate-900">Fair Judging</h4>
                <p className="text-sm text-slate-500 leading-relaxed">Transparent criteria and real-time leaderboards for every competition.</p>
              </div>
              <div className="p-6 bg-white border border-slate-100 rounded-3xl space-y-4 hover:shadow-xl hover:shadow-slate-200/60 transition-all duration-300 group">
                <div className="h-12 w-12 rounded-2xl bg-green-100 text-green-600 flex items-center justify-center group-hover:scale-110 transition-transform"><Award className="h-6 w-6" /></div>
                <h4 className="font-bold text-slate-900">Verified Skills</h4>
                <p className="text-sm text-slate-500 leading-relaxed">Download smart-certificates representing your unique participation rank.</p>
              </div>
              <div className="p-6 bg-white border border-slate-100 rounded-3xl space-y-4 hover:shadow-xl hover:shadow-slate-200/60 transition-all duration-300 group">
                <div className="h-12 w-12 rounded-2xl bg-purple-100 text-purple-600 flex items-center justify-center group-hover:scale-110 transition-transform"><Users className="h-6 w-6" /></div>
                <h4 className="font-bold text-slate-900">Community First</h4>
                <p className="text-sm text-slate-500 leading-relaxed">Be part of an ecosystem that thrives on collaboration and talent.</p>
              </div>
            </div>
          </div>

          <div className="relative">
            <div className="relative z-10 rounded-[3rem] overflow-hidden shadow-2xl rotate-3 hover:rotate-0 transition-all duration-700 aspect-square lg:aspect-auto lg:h-[600px] bg-slate-900">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/40 to-secondary/40"></div>
              {/* Abstract UI Elements */}
              <div className="absolute inset-0 flex items-center justify-center p-8">
                <Card className="w-full max-w-sm bg-white/10 backdrop-blur-2xl border-white/20 shadow-2xl -translate-y-12">
                  <CardContent className="p-8 space-y-6">
                    <div className="h-4 w-1/2 bg-white/20 rounded-full"></div>
                    <div className="space-y-3">
                      <div className="h-12 w-full bg-white/10 rounded-2xl"></div>
                      <div className="h-12 w-full bg-white/10 rounded-2xl"></div>
                      <div className="h-12 w-3/4 bg-white/10 rounded-2xl"></div>
                    </div>
                    <div className="h-14 w-full bg-primary rounded-2xl"></div>
                  </CardContent>
                </Card>
              </div>
            </div>
            {/* Decorative Dots */}
            <div className="absolute -bottom-10 -left-10 grid grid-cols-6 gap-4 opacity-20">
              {[...Array(24)].map((_, i) => (
                <div key={i} className="h-2 w-2 rounded-full bg-slate-900"></div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════ CTA Section ═══════════ */}
      <section className="py-24 px-4 bg-slate-900 text-white text-center">
        <div className="max-w-4xl mx-auto space-y-10">
          <h2 className="text-4xl md:text-6xl font-black tracking-tight leading-tight">Ready to Make Your Mark?</h2>
          <p className="text-xl text-slate-400 max-w-2xl mx-auto">Join thousands of creators and professionals in our next big event. Your journey starts with a single click.</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-6">
            <Button
              size="lg"
              onClick={() => navigate("/register")}
              className="h-14 px-10 text-lg font-bold rounded-2xl bg-gradient-to-r from-primary to-secondary hover:scale-105 transition-transform"
            >
              Get Started for Free
            </Button>
            <Button
              size="lg"
              variant="outline"
              onClick={() => navigate("/events")}
              className="h-14 px-10 text-lg font-bold rounded-2xl border-white/10 bg-white/5 hover:bg-white/10 transition-colors"
            >
              Explore Events
            </Button>
          </div>
          {/* Minimal Footer */}
          <div className="pt-24 opacity-30 text-xs font-medium tracking-[0.3em] uppercase">
            &copy; 2026 {brand.name}. All Rights Reserved.
          </div>
        </div>
      </section>
    </div>
  );
};

export default LandingPage;
