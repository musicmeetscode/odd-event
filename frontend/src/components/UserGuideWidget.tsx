import React, { useState } from "react";
import { 
  HelpCircle, 
  X, 
  ChevronRight, 
  User, 
  ShieldCheck, 
  MessageSquare, 
  Search, 
  Award, 
  Users, 
  Calendar, 
  Settings,
  Zap,
  BookOpen
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

const UserGuideWidget = () => {
  const [isOpen, setIsOpen] = useState(false);

  const guideContent = {
    attendee: [
      {
        section: "Registration & Profile",
        items: [
          {
            title: "How to join an event?",
            icon: <Search className="h-4 w-4" />,
            content: "1. Go to the 'Events' page.\n2. Click on the event card you're interested in.\n3. Tap the 'Register' button in the header."
          },
          {
            title: "How to set your display name?",
            icon: <User className="h-4 w-4" />,
            content: "1. Go to your Profile Card.\n2. Edit your name to how you'd like it to appear on certificates."
          }
        ]
      },
      {
        section: "Participation",
        items: [
          {
            title: "How to submit a project?",
            icon: <Zap className="h-4 w-4" />,
            content: "1. Open the event details.\n2. Tap the 'Submissions' tab.\n3. Click 'Create Submission' and fill in your project details & repo link."
          },
          {
            title: "How to join a team?",
            icon: <Users className="h-4 w-4" />,
            content: "1. Tap the 'Teams' tab in the event.\n2. Browse existing teams and click 'Join' or 'Create' your own."
          }
        ]
      },
      {
        section: "Networking & Rewards",
        items: [
          {
            title: "How to find your buddies?",
            icon: <MessageSquare className="h-4 w-4" />,
            content: "Go to the 'Networking' tab to see your assigned Buddy Group and meet your peers."
          },
          {
            title: "How to get your certificate?",
            icon: <Award className="h-4 w-4" />,
            content: "After the event ends and admins release results, tap 'Download Certificate' in the event header."
          }
        ]
      }
    ],
    admin: [
      {
        section: "Event Management",
        items: [
          {
            title: "How to create an event?",
            icon: <Calendar className="h-4 w-4" />,
            content: "Go to the Dashboard and click 'Add Event'. Fill in the title, location, and dates."
          },
          {
            title: "How to check in attendees?",
            icon: <ShieldCheck className="h-4 w-4" />,
            content: "Use the 'Manage' tab in an event or the dedicated 'Check-In' page to scan QR codes or manually check in users."
          }
        ]
      },
      {
        section: "Competition Control",
        items: [
          {
            title: "How to set judging criteria?",
            icon: <Zap className="h-4 w-4" />,
            content: "In the event 'Manage' tab, scroll to 'Judging Criteria' to add metrics like Creativity, Technical Skill, etc."
          },
          {
            title: "How to release certificates?",
            icon: <Award className="h-4 w-4" />,
            content: "Once judging is complete, use the 'Release Certificates' option in the event dropdown menu."
          }
        ]
      }
    ],
    faq: [
      {
        section: "Common Issues",
        items: [
          {
            title: "How do I reset my password?",
            icon: <Settings className="h-4 w-4" />,
            content: "Visit the 'Settings' page or use the 'Forgot Password' link on the login screen."
          },
          {
            title: "Is the system mobile friendly?",
            icon: <Zap className="h-4 w-4" />,
            content: "Absolutely! We focus on a mobile-first experience so you can manage your events on the go."
          }
        ]
      }
    ]
  };

  return (
    <div className="fixed bottom-6 right-6 z-[100] flex flex-col items-end">
      {/* Guide Window */}
      {isOpen && (
        <Card className="mb-4 w-[calc(100vw-2rem)] sm:w-[380px] md:w-[420px] h-[600px] sm:h-[580px] shadow-2xl border-primary/20 flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-300">
          <div className="bg-gradient-to-br from-primary via-primary to-secondary p-4 text-white flex items-center justify-between">
            <div className="flex items-center gap-2">
              <BookOpen className="h-5 w-5" />
              <div className="font-bold text-lg">System Guide</div>
            </div>
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => setIsOpen(false)}
              className="text-white hover:bg-white/20 transition-colors"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>

          <Tabs defaultValue="attendee" className="flex-1 flex flex-col min-h-0">
            <TabsList className="grid grid-cols-3 bg-muted/50 p-1.5 m-4 rounded-xl border border-border/50 shrink-0">
              <TabsTrigger 
                value="attendee" 
                className="flex items-center gap-1.5 text-xs font-bold transition-all data-[state=active]:bg-primary data-[state=active]:text-white data-[state=active]:shadow-lg rounded-lg py-2"
              >
                <User className="h-3.5 w-3.5" /> Attendee
              </TabsTrigger>
              <TabsTrigger 
                value="admin" 
                className="flex items-center gap-1.5 text-xs font-bold transition-all data-[state=active]:bg-secondary data-[state=active]:text-white data-[state=active]:shadow-lg rounded-lg py-2"
              >
                <ShieldCheck className="h-3.5 w-3.5" /> Admin
              </TabsTrigger>
              <TabsTrigger 
                value="faq" 
                className="flex items-center gap-1.5 text-xs font-bold transition-all data-[state=active]:bg-amber-500 data-[state=active]:text-white data-[state=active]:shadow-lg rounded-lg py-2"
              >
                <HelpCircle className="h-3.5 w-3.5" /> FAQ
              </TabsTrigger>
            </TabsList>

            <div className="flex-1 min-h-0">
              <ScrollArea className="h-full px-4 py-2">
                <TabsContent value="attendee" className="mt-0 pb-8">
                  <div className="p-4 bg-primary/5 rounded-2xl border border-primary/10 mb-6 mx-1">
                    <div className="text-sm font-bold text-primary mb-1">Attendee Quickstart</div>
                    <div className="text-[11px] text-muted-foreground leading-relaxed">Simple steps to excel as a participant.</div>
                  </div>
                  {guideContent.attendee.map((section, si) => (
                    <div key={si} className="space-y-4 mb-6">
                      <div className="px-1 text-[11px] font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-2">
                        <span className="h-px bg-border flex-1"></span>
                        {section.section}
                        <span className="h-px bg-border flex-1"></span>
                      </div>
                      {section.items.map((item, i) => (
                        <div key={i} className="group p-4 hover:bg-muted/50 rounded-2xl transition-all border border-transparent hover:border-border cursor-default">
                          <div className="flex items-start gap-4 mb-2">
                            <div className="p-2.5 bg-primary/10 text-primary rounded-xl group-hover:scale-110 transition-transform mt-0.5">
                              {item.icon}
                            </div>
                            <div className="flex-1">
                              <div className="font-bold text-[14px] text-slate-800 mb-1">{item.title}</div>
                              <div className="text-xs text-muted-foreground leading-relaxed whitespace-pre-wrap">
                                {item.content}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ))}
                </TabsContent>

                <TabsContent value="admin" className="mt-0 pb-8">
                  <div className="p-4 bg-secondary/5 rounded-2xl border border-secondary/10 mb-6 mx-1">
                    <div className="text-sm font-bold text-secondary mb-1">Admin Operations</div>
                    <div className="text-[11px] text-muted-foreground leading-relaxed">Management procedures for event organizers.</div>
                  </div>
                  {guideContent.admin.map((section, si) => (
                    <div key={si} className="space-y-4 mb-6">
                      <div className="px-1 text-[11px] font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-2">
                        <span className="h-px bg-border flex-1"></span>
                        {section.section}
                        <span className="h-px bg-border flex-1"></span>
                      </div>
                      {section.items.map((item, i) => (
                        <div key={i} className="group p-4 hover:bg-muted/50 rounded-2xl transition-all border border-transparent hover:border-border cursor-default">
                          <div className="flex items-start gap-4 mb-2">
                            <div className="p-2.5 bg-secondary/10 text-secondary rounded-xl group-hover:scale-110 transition-transform mt-0.5">
                              {item.icon}
                            </div>
                            <div className="flex-1">
                              <div className="font-bold text-[14px] text-slate-800 mb-1">{item.title}</div>
                              <div className="text-xs text-muted-foreground leading-relaxed whitespace-pre-wrap">
                                {item.content}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ))}
                </TabsContent>

                <TabsContent value="faq" className="mt-0 pb-8">
                  <div className="p-4 bg-amber-500/5 rounded-2xl border border-amber-500/10 mb-6 mx-1">
                    <div className="text-sm font-bold text-amber-600 mb-1">Common Questions</div>
                    <div className="text-[11px] text-muted-foreground leading-relaxed">Quick answers to common situations.</div>
                  </div>
                  {guideContent.faq.map((section, si) => (
                    <div key={si} className="space-y-4 mb-6">
                      <div className="px-1 text-[11px] font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-2">
                        <span className="h-px bg-border flex-1"></span>
                        {section.section}
                        <span className="h-px bg-border flex-1"></span>
                      </div>
                      {section.items.map((item, i) => (
                        <div key={i} className="group p-4 hover:bg-muted/50 rounded-2xl transition-all border border-transparent hover:border-border cursor-default">
                          <div className="flex items-start gap-4 mb-2">
                            <div className="p-2.5 bg-amber-500/10 text-amber-600 rounded-xl group-hover:scale-110 transition-transform mt-0.5">
                              {item.icon}
                            </div>
                            <div className="flex-1">
                              <div className="font-bold text-[14px] text-slate-800 mb-1">{item.title}</div>
                              <div className="text-xs text-muted-foreground leading-relaxed whitespace-pre-wrap">
                                {item.content}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ))}
                </TabsContent>
              </ScrollArea>
            </div>

            <div className="p-4 border-t bg-muted/30 shrink-0">
              <div className="text-[11px] text-center text-muted-foreground">
                Need more help? Contact us at <span className="text-primary font-medium">support@musicmeetscode.com</span>
              </div>
            </div>
          </Tabs>
        </Card>
      )}

      {/* Floating Toggle Button */}
      <Button 
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "h-14 w-14 rounded-full shadow-2xl transition-all duration-300 transform active:scale-95",
          isOpen ? "bg-slate-800 rotate-90 scale-90" : "bg-gradient-to-br from-primary via-primary to-secondary scale-100 hover:scale-110"
        )}
      >
        {isOpen ? (
          <X className="h-6 w-6 text-white" />
        ) : (
          <HelpCircle className="h-7 w-7 text-white" />
        )}
      </Button>
    </div>
  );
};

export default UserGuideWidget;
