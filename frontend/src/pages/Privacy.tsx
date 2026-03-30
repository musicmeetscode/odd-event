import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, ShieldCheck, ScrollText, Camera, AlertTriangle, Cpu } from "lucide-react";
import { useBrand } from "@/contexts/BrandContext";

const Privacy = () => {
  const { brand } = useBrand();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-slate-50 py-12 px-4 md:px-8 pt-24">
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-slate-900 leading-tight">Privacy Policy & Terms</h1>
            <p className="text-slate-500">Last updated: March 2026</p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6">
          <Card className="border-none shadow-sm overflow-hidden">
            <CardHeader className="bg-white border-b border-slate-100">
              <CardTitle className="flex items-center gap-2 text-blue-600">
                <ShieldCheck className="w-5 h-5" />
                Our Commitment
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6 prose prose-slate max-w-none">
              <p>
                Welcome to {brand.name}. By using our platform and participating in our events, you agree to the following terms and conditions. Your privacy and safety are important to us, but certain aspects of event participation require your acknowledgment of the following:
              </p>
              <div className="mt-4 p-4 bg-slate-50 rounded-lg border border-slate-100">
                <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2 mb-2">
                  <ShieldCheck className="w-4 h-4 text-blue-600" /> Data Collection & Retention
                </h4>
                <p className="text-xs text-slate-600 leading-relaxed">
                  We collect essential user data including your <b>name, email address, and profile photo</b> (shared via Google or manually uploaded) to facilitate event participation and networking. 
                  To minimize our digital footprint, we only retain this personal data for a period of <b>up to three months</b> following the conclusion of the event, after which it is securely deleted or anonymized, unless otherwise required by law.
                </p>
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Media Usage */}
            <Card className="border-none shadow-md hover:shadow-lg transition-shadow">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-indigo-600 text-lg">
                  <Camera className="w-5 h-5" />
                  Media & Photography
                </CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-slate-600 leading-relaxed">
                By signing up and attending our events, you grant {brand.name} a perpetual, worldwide, royalty-free license to use, reproduce, and distribute any media (including photography and video recordings) taken during the event. This includes images where you may be identifiable.
              </CardContent>
            </Card>
            
            {/* AI Training */}
            <Card className="border-none shadow-md hover:shadow-lg transition-shadow bg-blue-50/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-blue-700 text-lg">
                  <Cpu className="w-5 h-5" />
                  AI Training Disclosure
                </CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-slate-700 leading-relaxed font-medium">
                We embrace the future of technology. You acknowledge and agree that images, videos, and project submissions from our events may be used to train artificial intelligence (AI) models and machine learning algorithms for internal research, product development, and promotional purposes.
              </CardContent>
            </Card>

            {/* Responsibility */}
            <Card className="border-none shadow-md hover:shadow-lg transition-shadow bg-orange-50/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-orange-700 text-lg">
                  <AlertTriangle className="w-5 h-5" />
                  Liability Waiver
                </CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-slate-700 leading-relaxed">
                {brand.name} and its organizers are not responsible for any harm, injury, loss, or damage to persons or property that may occur during, or as a result of, participation in our events. Attendees assume all risks associated with event attendance and participation.
              </CardContent>
            </Card>

            {/* Data Security & Third Parties */}
            <Card className="border-none shadow-md hover:shadow-lg transition-shadow bg-emerald-50/30">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-emerald-700 text-lg">
                  <ShieldCheck className="w-5 h-5" />
                  Security & Third Parties
                </CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-slate-700 leading-relaxed">
                We use <b>Google OAuth</b> for secure authentication. While we implement industry-standard security measures, no system is 100% secure. You are responsible for maintaining the security of your account credentials. We do not sell your personal data to third parties.
              </CardContent>
            </Card>

            {/* General Terms */}
            <Card className="border-none shadow-md hover:shadow-lg transition-shadow">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-slate-700 text-lg">
                  <ScrollText className="w-5 h-5" />
                  General Terms
                </CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-slate-600 leading-relaxed">
                Participation in events is subject to our code of conduct. We reserve the right to remove any attendee who violates our community standards or causes disruption to the event environment.
              </CardContent>
            </Card>
          </div>

            <Card className="border-none shadow-sm bg-slate-900 text-white">
            <CardContent className="p-8 text-center space-y-4">
              <h3 className="text-xl font-bold">Questions about our terms?</h3>
              <p className="text-slate-400 max-w-md mx-auto text-sm">
                If you have any questions regarding these terms, please contact our legal team at {brand.email}. 
                All rights reserved by {brand.company_name}.
              </p>
              <Button variant="outline" className="border-slate-700 text-white hover:bg-slate-800" onClick={() => navigate("/login")}>
                Return to Login
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Privacy;
