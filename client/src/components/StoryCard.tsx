import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Heart, MessageSquare, Users, Clock, Share } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useFarcaster } from "@/hooks/use-farcaster";
import { useToast } from "@/hooks/use-toast";
import { CommentSubmissionModal } from "./CommentSubmissionModal";
import { CreatorDashboard } from "./CreatorDashboard";
import type { StoryWithContributors } from "@shared/schema";

interface StoryCardProps {
  story: StoryWithContributors;
  currentUser?: any;
}

export function StoryCard({ story, currentUser }: StoryCardProps) {
  const { user } = useFarcaster();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const toggleLikeMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest('POST', `/api/stories/${story.id}/like`, {
        userFid: user?.fid,
        castHash: null
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/stories', story.id] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to toggle like",
        variant: "destructive",
      });
    },
  });

  const handleLike = () => {
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please connect with Farcaster to like stories",
        variant: "destructive",
      });
      return;
    }
    toggleLikeMutation.mutate();
  };

  const shareToFarcaster = () => {
    const storyText = story.initialContent + " " + 
      story.segments
        .sort((a, b) => a.orderIndex - b.orderIndex)
        .map(segment => segment.content)
        .join(" ");

    const castText = `Check out this collaborative story: "${story.title}"\n\n${storyText.substring(0, 200)}${storyText.length > 200 ? "..." : ""}\n\nJoin the weave!`;
    
    window.open(`https://warpcast.com/~/compose?text=${encodeURIComponent(castText)}&embeds[]=${encodeURIComponent(window.location.href)}`, '_blank');
  };

  const fullStory = story.initialContent + (story.segments.length > 0 ? 
    " " + story.segments
      .sort((a, b) => a.orderIndex - b.orderIndex)
      .map(segment => segment.content)
      .join(" ") 
    : ""
  );

  const isCreator = user && story.creatorFid === user.fid;
  const canComment = user && story.hasLiked && story.sessionStatus === "active";
  const sessionEnded = story.sessionStatus === "ended";

  return (
    <div className="space-y-6">
      <Card className="overflow-hidden">
        <CardHeader className="pb-4">
          <div className="flex items-start justify-between">
            <div className="flex items-center space-x-3">
              <Avatar>
                <AvatarImage src={story.creator.pfpUrl || undefined} />
                <AvatarFallback>{story.creator.displayName.charAt(0)}</AvatarFallback>
              </Avatar>
              <div>
                <CardTitle className="text-lg">{story.title}</CardTitle>
                <div className="flex items-center space-x-2 text-sm text-gray-500">
                  <span>by {story.creator.displayName}</span>
                  <span>•</span>
                  <span>@{story.creator.username}</span>
                  <span>•</span>
                  <span>{new Date(story.createdAt!).toLocaleDateString()}</span>
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Badge variant={sessionEnded ? "secondary" : "default"}>
                {sessionEnded ? "Completed" : "Active"}
              </Badge>
              {isCreator && (
                <Badge variant="outline" className="border-fc-purple text-fc-purple">
                  Creator
                </Badge>
              )}
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Story Content */}
          <div className="prose prose-sm max-w-none">
            <p className="text-gray-800 leading-relaxed text-base">
              {fullStory}
            </p>
          </div>

          {/* Contributors */}
          {story.contributors.length > 1 && (
            <div className="flex items-center space-x-3">
              <div className="flex items-center space-x-1 text-sm text-gray-600">
                <Users className="w-4 h-4" />
                <span>Contributors:</span>
              </div>
              <div className="flex -space-x-2">
                {story.contributors.slice(0, 5).map((contributor) => (
                  <Avatar key={contributor.fid} className="w-8 h-8 border-2 border-white">
                    <AvatarImage src={contributor.pfpUrl || undefined} />
                    <AvatarFallback className="text-xs">
                      {contributor.displayName.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                ))}
                {story.contributors.length > 5 && (
                  <div className="w-8 h-8 rounded-full bg-gray-100 border-2 border-white flex items-center justify-center text-xs text-gray-600">
                    +{story.contributors.length - 5}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Stats */}
          <div className="flex items-center justify-between pt-4 border-t border-gray-100">
            <div className="flex items-center space-x-6">
              <div className="flex items-center space-x-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleLike}
                  disabled={!user || toggleLikeMutation.isPending}
                  className={story.hasLiked ? "text-red-500" : "text-gray-500"}
                >
                  <Heart className={`w-4 h-4 ${story.hasLiked ? "fill-current" : ""}`} />
                  <span>{story.likeCount}</span>
                </Button>
              </div>
              
              <div className="flex items-center space-x-2 text-gray-500">
                <MessageSquare className="w-4 h-4" />
                <span>{story.segments.length} parts</span>
              </div>

              {!sessionEnded && (
                <div className="flex items-center space-x-2 text-gray-500">
                  <Clock className="w-4 h-4" />
                  <span>Active session</span>
                </div>
              )}
            </div>

            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={shareToFarcaster}
                className="text-fc-purple border-fc-purple hover:bg-fc-purple hover:text-white"
              >
                <Share className="w-4 h-4 mr-1" />
                Share
              </Button>

              {canComment && (
                <CommentSubmissionModal story={story} />
              )}

              {!story.hasLiked && !sessionEnded && user && !isCreator && (
                <div className="text-sm text-gray-500 bg-gray-50 px-3 py-1 rounded-full">
                  Like to contribute
                </div>
              )}
            </div>
          </div>

          {/* Session ended message */}
          {sessionEnded && (
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-center">
              <p className="text-sm text-gray-600">
                This collaborative story session has ended. No new contributions can be added.
              </p>
            </div>
          )}

          {/* Not liked message */}
          {!story.hasLiked && !sessionEnded && user && !isCreator && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm text-blue-700">
                💫 <strong>Like this story</strong> to unlock the ability to contribute your own story parts!
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Creator Dashboard */}
      {isCreator && (
        <CreatorDashboard story={story} />
      )}
    </div>
  );
}