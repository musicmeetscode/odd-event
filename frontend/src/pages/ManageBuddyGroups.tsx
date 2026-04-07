import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { eventsService } from "@/services/events";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Users, RefreshCw, Trash2, UserPlus } from "lucide-react";
import { toast } from "sonner";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

const ManageBuddyGroups = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const eventId = id || "";

    const { data: event } = useQuery({
        queryKey: ["event", eventId],
        queryFn: () => eventsService.getEvent(eventId),
    });

    const { data: groups, isLoading } = useQuery({
        queryKey: ["buddy-groups", eventId],
        queryFn: () => eventsService.getBuddyGroups(eventId),
    });

    const generateMutation = useMutation({
        mutationFn: () => eventsService.generateBuddyGroups(eventId),
        onSuccess: (data) => {
            toast.success(data.detail);
            queryClient.invalidateQueries({ queryKey: ["buddy-groups", eventId] });
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.detail || "Failed to generate groups");
        }
    });

    const clearMutation = useMutation({
        mutationFn: () => eventsService.clearBuddyGroups(eventId),
        onSuccess: () => {
            toast.success("Groups cleared");
            queryClient.invalidateQueries({ queryKey: ["buddy-groups", eventId] });
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.detail || "Failed to clear groups");
        }
    });

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <RefreshCw className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background pt-24 pb-12">
            <div className="max-w-5xl mx-auto px-4">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                    <div className="flex items-center gap-4">
                        <Button variant="ghost" size="icon" onClick={() => navigate(`/events/${eventId}`)}>
                            <ArrowLeft className="h-5 w-5" />
                        </Button>
                        <div>
                            <h1 className="text-3xl font-bold tracking-tight">Buddy Groups</h1>
                            <p className="text-muted-foreground">{event?.title}</p>
                        </div>
                    </div>
                    <div className="flex gap-2">
                        <Button 
                            variant="outline" 
                            className="gap-2 border-destructive/20 text-destructive hover:bg-destructive/10"
                            onClick={() => {
                                if(confirm("Are you sure you want to clear all groups?")) clearMutation.mutate();
                            }}
                            disabled={clearMutation.isPending || !groups?.length}
                        >
                            <Trash2 className="h-4 w-4" /> Clear All
                        </Button>
                        <Button 
                            className="gap-2"
                            onClick={() => generateMutation.mutate()}
                            disabled={generateMutation.isPending}
                        >
                            <UserPlus className="h-4 w-4" /> Generate Groups
                        </Button>
                    </div>
                </div>

                {!groups || groups.length === 0 ? (
                    <Card className="border-dashed">
                        <CardContent className="flex flex-col items-center justify-center py-24 text-center">
                            <div className="bg-primary/10 p-6 rounded-full mb-6">
                                <Users className="h-12 w-12 text-primary" />
                            </div>
                            <h2 className="text-xl font-semibold mb-2">No Buddy Groups Yet</h2>
                            <p className="text-muted-foreground max-w-sm mb-8">
                                Groups are generated from attendees who have checked in. Make sure attendees have checked in before generating.
                            </p>
                            <Button onClick={() => generateMutation.mutate()} disabled={generateMutation.isPending}>
                                Generate Groups
                            </Button>
                        </CardContent>
                    </Card>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {groups.map((group) => (
                            <Card key={group.id} className="overflow-hidden border-border/50 hover:border-primary/30 transition-colors">
                                <CardHeader className="bg-secondary/20 pb-3">
                                    <div className="flex items-center justify-between">
                                        <CardTitle className="text-lg">{group.name}</CardTitle>
                                        <Badge variant="secondary" className="bg-background">{group.members?.length || 0} members</Badge>
                                    </div>
                                </CardHeader>
                                <CardContent className="pt-4">
                                    <div className="space-y-4">
                                        {group.members?.map((member) => (
                                            <div key={member.id} className="flex items-center gap-3">
                                                <Avatar className="h-9 w-9 border border-border/50">
                                                    <AvatarImage src={member.avatar_url} />
                                                    <AvatarFallback className="bg-primary/5 text-primary text-xs tracking-tighter">
                                                        {member.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                                                    </AvatarFallback>
                                                </Avatar>
                                                <div className="flex-1 overflow-hidden">
                                                    <p className="text-sm font-semibold truncate leading-none mb-1">{member.name}</p>
                                                    <div className="flex flex-col gap-0.5">
                                                        <p className="text-[11px] text-muted-foreground truncate uppercase tracking-wider font-medium">{member.profession || "Attendee"}</p>
                                                        {member.phone && (
                                                            <a href={`tel:${member.phone}`} className="text-[10px] text-primary hover:underline flex items-center gap-1">
                                                                {member.phone}
                                                            </a>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default ManageBuddyGroups;
