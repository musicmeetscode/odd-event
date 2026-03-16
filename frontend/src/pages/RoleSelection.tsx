import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Users, Mic } from "lucide-react";

const RoleSelection = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        {/* GDG Arc Header */}
        <div className="text-center mb-12 space-y-4">
          <div className="flex justify-center gap-2 mb-6">
            <div className="w-3 h-16 bg-primary rounded-full"></div>
            <div className="w-3 h-16 bg-secondary rounded-full"></div>
            <div className="w-3 h-16 bg-accent rounded-full"></div>
            <div className="w-3 h-16 bg-destructive rounded-full"></div>
          </div>

          <h1 className="text-4xl font-bold text-foreground mb-3">
            DevFest Mbarara 2025 Q&A Live
          </h1>
          <p className="text-xl text-muted-foreground">
            Lets see.. What brings you here?
          </p>
        </div>

        {/* Role Selection Buttons */}
        <div className="grid md:grid-cols-2 gap-6">
          {/* Attendee Button */}
          <button
            onClick={() => {
              localStorage.removeItem("speaker")
              navigate("/attendee-register")
            }}
            className="group relative overflow-hidden bg-card rounded-xl p-8 shadow-material-md hover:shadow-material-lg transition-all duration-300 border-2 border-transparent hover:border-primary"
          >
            <div className="relative z-10 flex flex-col items-center gap-4">
              <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                <Users className="w-10 h-10 text-primary" />
              </div>
              <div className="text-center">
                <h3 className="text-2xl font-bold text-foreground mb-2">
                  I am an Attendee
                </h3>
                <p className="text-muted-foreground">
                  Ask questions during sessions
                </p>
              </div>
            </div>
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
          </button>

          {/* Speaker Button */}
          <button
            onClick={() => {
              localStorage.setItem("speaker", "yes")
              navigate('/speaker-login')
              
            }}
            className="group relative overflow-hidden bg-card rounded-xl p-8 shadow-material-md hover:shadow-material-lg transition-all duration-300 border-2 border-transparent hover:border-secondary"
          >
            <div className="relative z-10 flex flex-col items-center gap-4">
              <div className="w-20 h-20 rounded-full bg-secondary/10 flex items-center justify-center group-hover:bg-secondary/20 transition-colors">
                <Mic className="w-10 h-10 text-secondary" />
              </div>
              <div className="text-center">
                <h3 className="text-2xl font-bold text-foreground mb-2">
                  I am a Speaker
                </h3>
                <p className="text-muted-foreground">
                  Manage your session Q&A
                </p>
              </div>
            </div>
            <div className="absolute inset-0 bg-gradient-to-br from-secondary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
          </button>
        </div>

        {/* Footer */}
        <p className="text-center text-sm text-muted-foreground mt-8">
          Powered by Google Developer Groups
        </p>
      </div>
    </div>
  );
};

export default RoleSelection;
