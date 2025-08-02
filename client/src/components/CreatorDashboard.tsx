import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { CheckCircle, XCircle, Clock, Users, Share, StopCircle } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useFarcaster } from "@/hooks/use-farcaster";
import { useToast } from "@/hooks/use-toast";
import type { StoryComment, User, StoryWithContributors, CastComment } from "@shared/schema";
import { CastCreator } from "./CastCreator";

interface CreatorDashboardProps {
  story: StoryWithContributors;
}

export function CreatorDashboard({ story }: CreatorDashboardProps) {
  const { user, sdk } = useFarcaster();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Only show dashboard to story creator
  if (!user || story.creatorFid !== user.fid) {
    return null;
  }

  const { data: pendingComments = [], isLoading } = useQuery<(StoryComment & { author: User })[]>({
    queryKey: ['/api/stories', story.id, 'pending-comments'],
    queryFn: async () => {
      const response = await apiRequest('GET', `/api/stories/${story.id}/pending-comments?userFid=${user.fid}`);
      return response.json();
    },
    refetchInterval: 10000, // Refresh every 10 seconds
    enabled: !!user,
  });

  const { data: castComments = [] } = useQuery<CastComment[]>({
    queryKey: ['/api/stories', story.id, 'cast-comments', 'pending'],
    queryFn: async () => {
      const response = await apiRequest('GET', `/api/stories/${story.id}/cast-comments?status=pending`);
      return response.json();
    },
    refetchInterval: 5000,
    enabled: !!user,
  });

  const approveCommentMutation = useMutation({
    mutationFn: async (commentId: string) => {
      const response = await apiRequest('POST', `/api/stories/${story.id}/comments/${commentId}/incorporate`, {
        userFid: user.fid
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/stories', story.id] });
      queryClient.invalidateQueries({ queryKey: ['/api/stories', story.id, 'pending-comments'] });
      toast({
        title: "Comment Approved!",
        description: "The contribution has been added to your story.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to approve comment",
        variant: "destructive",
      });
    },
  });

  const declineCommentMutation = useMutation({
    mutationFn: async (commentId: string) => {
      const response = await apiRequest('POST', `/api/comments/${commentId}/decline`, { userFid: user.fid });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/stories', story.id, 'pending-comments'] });
      toast({
        title: "Comment Declined",
        description: "The contribution has been declined.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to decline comment",
        variant: "destructive",
      });
    },
  });

  const closeStoryMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest('POST', `/api/stories/${story.id}/close`, { userFid: user.fid });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/stories', story.id] });
      toast({
        title: "Story Closed",
        description: "Story has been permanently closed and final content compiled.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to close story",
        variant: "destructive",
      });
    },
  });

  const shareStoryToFarcaster = async () => {
    if (!sdk) return;

    try {
      const fullStory = story.initialContent + " " + 
        story.segments
          .sort((a, b) => a.orderIndex - b.orderIndex)
          .map(segment => segment.content)
          .join(" ");

      const castText = `Check out our collaborative story "${story.title}"! 🧵\n\n${fullStory.substring(0, 200)}${fullStory.length > 200 ? "..." : ""}\n\nJoin the weave!`;
      
      window.open(`https://warpcast.com/~/compose?text=${encodeURIComponent(castText)}&embeds[]=${encodeURIComponent(window.location.href)}`, '_blank');
      
      toast({
        title: "Sharing to Farcaster",
        description: "Opening compose window with your story...",
      });
    } catch (error) {
      console.warn("Error sharing to Farcaster:", error);
      toast({
        title: "Error",
        description: "Failed to open Farcaster sharing",
        variant: "destructive",
      });
    }
  };

  return (
    <Card className="border-fc-purple/20">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            Creator Dashboard
          </CardTitle>
          <div className="flex items-center gap-2">
            <Badge variant={story.sessionStatus === "active" ? "default" : "secondary"}>
              {story.sessionStatus === "active" ? "Active Session" : "Session Ended"}
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="pending" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="pending" className="flex items-center gap-2">
              <Clock className="w-4 h-4" />
              Pending ({pendingComments.length})
            </TabsTrigger>
            <TabsTrigger value="stats" className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              Stats
            </TabsTrigger>
            <TabsTrigger value="actions" className="flex items-center gap-2">
              <Share className="w-4 h-4" />
              Actions
            </TabsTrigger>
          </TabsList>

          <TabsContent value="pending" className="space-y-4">
            {isLoading ? (
              <div className="text-center py-8 text-gray-500">Loading pending contributions...</div>
            ) : pendingComments.length === 0 ? (
              <div className="text-center py-8 text-gray-500">No pending contributions</div>
            ) : (
              <div className="space-y-4">
                {pendingComments.map((comment: StoryComment & { author: User }) => (
                  <Card key={comment.id} className="border-amber-200">
                    <CardContent className="pt-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <img
                              src={comment.author.pfpUrl || "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150"}
                              alt={comment.author.displayName}
                              className="w-6 h-6 rounded-full"
                            />
                            <span className="font-medium text-sm">{comment.author.displayName}</span>
                            <span className="text-xs text-gray-500">@{comment.author.username}</span>
                          </div>
                          <p className="text-sm text-gray-800 leading-relaxed mb-3">
                            "{comment.content}"
                          </p>
                          <p className="text-xs text-gray-500">
                            Submitted {new Date(comment.createdAt!).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="flex items-center gap-2 ml-4">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => approveCommentMutation.mutate(comment.id)}
                            disabled={approveCommentMutation.isPending}
                            className="border-green-300 text-green-700 hover:bg-green-50"
                          >
                            <CheckCircle className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => declineCommentMutation.mutate(comment.id)}
                            disabled={declineCommentMutation.isPending}
                            className="border-red-300 text-red-700 hover:bg-red-50"
                          >
                            <XCircle className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="stats" className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Card>
                <CardContent className="pt-4">
                  <div className="text-2xl font-bold">{story.segments.length}</div>
                  <p className="text-xs text-gray-500">Approved Parts</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-4">
                  <div className="text-2xl font-bold">{story.contributors.length}</div>
                  <p className="text-xs text-gray-500">Contributors</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-4">
                  <div className="text-2xl font-bold">{story.likeCount}</div>
                  <p className="text-xs text-gray-500">Likes</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-4">
                  <div className="text-2xl font-bold">{pendingComments.length}</div>
                  <p className="text-xs text-gray-500">Pending</p>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="actions" className="space-y-4">
            <div className="space-y-3">
              {sdk && (
                <Button
                  onClick={shareStoryToFarcaster}
                  className="w-full bg-fc-purple hover:bg-fc-purple/90"
                >
                  <Share className="w-4 h-4 mr-2" />
                  Share Story to Farcaster
                </Button>
              )}
              
              {story.sessionStatus === "active" && (
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="outline" className="w-full border-red-300 text-red-700 hover:bg-red-50">
                      <StopCircle className="w-4 h-4 mr-2" />
                      Close Story
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Close Story Permanently?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This will permanently close your story and delete all pending comments. The final content will be compiled automatically. This action cannot be undone.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={() => closeStoryMutation.mutate()}
                        className="bg-red-600 hover:bg-red-700"
                      >
                        Close Story
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}