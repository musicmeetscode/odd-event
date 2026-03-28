import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { eventsService } from "@/services/events";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Trophy, ArrowLeft, Loader2, Star, User, ExternalLink } from "lucide-react";

interface Winner {
  rank: number;
  submission_id: number;
  title: string;
  submitted_by: string;
  total_score: number;
}

const WallOfFame = () => {
  const { eventId } = useParams<{ eventId: string }>();
  const id = Number(eventId);
  const navigate = useNavigate();

  const { data: winners, isLoading } = useQuery({
    queryKey: ["wall-of-fame", id],
    queryFn: () => eventsService.getWallOfFame(id),
  });

  const { data: event } = useQuery({
    queryKey: ["event", id],
    queryFn: () => eventsService.getEvent(id),
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-yellow-500" />
      </div>
    );
  }

  const topThree = winners?.slice(0, 3) || [];
  const others = winners?.slice(3) || [];

  return (
    <div className="min-h-screen bg-slate-50 py-12 px-4 md:px-8">
      <div className="max-w-6xl mx-auto space-y-12">
        <div className="flex flex-col items-center text-center space-y-4">
          <Button
            variant="ghost"
            onClick={() => navigate(`/events/${id}`)}
            className="self-start md:absolute md:left-8 md:top-8"
          >
            <ArrowLeft className="w-4 h-4 mr-2" /> Back to Event
          </Button>
          
          <div className="w-20 h-20 bg-yellow-100 rounded-full flex items-center justify-center text-yellow-600 shadow-inner">
            <Trophy className="w-10 h-10" />
          </div>
          <h1 className="text-4xl md:text-6xl font-black text-slate-900 tracking-tight">Wall of Fame</h1>
          <p className="text-xl text-slate-500 max-w-2xl">
            Celebrating the exceptional talent and innovation at <span className="text-slate-900 font-bold">{event?.title}</span>.
          </p>
        </div>

        {/* Podium for Top 3 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-end pt-8">
          {/* 2nd Place */}
          {topThree[1] && (
            <div className="order-2 md:order-1">
              <WinnerCard winner={topThree[1]} rank={2} color="bg-slate-200" glow="shadow-slate-200" />
            </div>
          )}

          {/* 1st Place */}
          {topThree[0] && (
            <div className="order-1 md:order-2 scale-110 z-10">
              <WinnerCard winner={topThree[0]} rank={1} color="bg-yellow-400" glow="shadow-yellow-200" />
            </div>
          )}

          {/* 3rd Place */}
          {topThree[2] && (
            <div className="order-3">
              <WinnerCard winner={topThree[2]} rank={3} color="bg-orange-300" glow="shadow-orange-100" />
            </div>
          )}
        </div>

        {/* Other Honorable Mentions */}
        {others.length > 0 && (
          <div className="space-y-6 pt-12">
            <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
              <Star className="w-6 h-6 text-yellow-500 fill-yellow-500" /> Honorable Mentions
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {others.map((winner: Winner) => (
                <Card key={winner.submission_id} className="border-none shadow-sm hover:shadow-md transition-shadow">
                  <CardContent className="p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center font-bold text-slate-400">
                        {winner.rank}
                      </div>
                      <div>
                        <h4 className="font-bold text-slate-900">{winner.title}</h4>
                        <p className="text-sm text-slate-500">{winner.submitted_by}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-black text-slate-900">{winner.total_score}</p>
                      <p className="text-[10px] text-slate-400 uppercase tracking-widest">Points</p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {!winners || winners.length === 0 && (
          <div className="bg-white rounded-3xl p-12 text-center shadow-sm border-2 border-dashed border-slate-200">
            <Trophy className="w-16 h-16 text-slate-200 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-slate-800">No Winners Yet</h3>
            <p className="text-slate-500">The results are still being finalized. Check back soon!</p>
          </div>
        )}
      </div>
    </div>
  );
};

const WinnerCard = ({ winner, rank, color, glow }: { winner: Winner; rank: number; color: string; glow: string }) => (
  <Card className={`border-none shadow-xl ${glow} overflow-hidden group hover:-translate-y-2 transition-transform duration-300`}>
    <div className={`h-2 ${color}`}></div>
    <CardContent className="p-8 flex flex-col items-center text-center space-y-6">
      <div className={`relative w-24 h-24 rounded-3xl ${color} flex items-center justify-center text-white shadow-lg rotate-3 group-hover:rotate-0 transition-transform`}>
        <User className="w-12 h-12" />
        <div className="absolute -top-3 -right-3 w-10 h-10 bg-slate-900 rounded-full flex items-center justify-center text-white font-black text-lg border-4 border-white">
          {rank}
        </div>
      </div>
      
      <div>
        <h3 className="text-2xl font-black text-slate-900 line-clamp-2">{winner.title}</h3>
        <p className="text-slate-500 font-medium mt-1">{winner.submitted_by}</p>
      </div>

      <div className="w-full bg-slate-50 rounded-2xl p-4 flex justify-between items-center">
        <div className="text-left">
          <p className="text-2xl font-black text-slate-900">{winner.total_score}</p>
          <p className="text-[10px] text-slate-400 uppercase tracking-widest font-bold">Total Score</p>
        </div>
        <Button variant="outline" size="sm" className="rounded-xl border-slate-200" onClick={() => window.open(`/submissions/${winner.submission_id}`, '_blank')}>
          View <ExternalLink className="w-3 h-3 ml-2" />
        </Button>
      </div>
    </CardContent>
  </Card>
);

export default WallOfFame;
