import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Heart, Repeat2, Users, Clock } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import ContributionForm from "./contribution-form";
import ContributorsList from "./contributors-list";
import type { StoryWithContributors, User } from "@shared/schema";

interface StoryCardProps {
  story: StoryWithContributors;
  currentUser: User | null;
}

export default function StoryCard({ story, currentUser }: StoryCardProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showContributionForm, setShowContributionForm] = useState(false);

  const likeMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", `/api/stories/${story.id}/like`, {
        userFid: currentUser?.fid,
        castHash: story.castHash
      });
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/stories", story.id] });
      toast({
        title: data.liked ? "Story Liked!" : "Like Removed",
        description: data.liked 
          ? "You can now contribute to this story" 
          : "You can no longer contribute to this story"
      });
      
      if (data.liked) {
        setShowContributionForm(true);
      }
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to toggle like. Please try again.",
        variant: "destructive"
      });
    }
  });

  const handleLike = () => {
    if (!currentUser) {
      toast({
        title: "Authentication Required",
        description: "Please connect your Farcaster account to like stories.",
        variant: "destructive"
      });
      return;
    }
    likeMutation.mutate();
  };

  const formatTimeAgo = (date: Date) => {
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 60) {
      return `${diffInMinutes}m ago`;
    } else if (diffInMinutes < 1440) {
      return `${Math.floor(diffInMinutes / 60)}h ago`;
    } else {
      return format(date, "MMM d");
    }
  };

  return (
    <div className="space-y-6">
      {/* Story Card */}
      <Card className="overflow-hidden">
        {/* Story Header */}
        <div className="p-4 border-b border-gray-100">
          <div className="flex items-start space-x-3">
            <img 
              src={story.creator.pfpUrl || "https://images.unsplash.com/photo-1434030216411-0b793f4b4173?ixlib=rb-4.0.3&auto=format&fit=crop&w=150&h=150"} 
              alt="Story Creator Avatar" 
              className="w-10 h-10 rounded-full"
            />
            <div className="flex-1">
              <div className="flex items-center space-x-2">
                <h3 className="font-semibold text-gray-900">{story.creator.displayName}</h3>
                <span className="text-gray-500">@{story.creator.username}</span>
                <span className="text-gray-400">·</span>
                <time className="text-gray-500 text-sm">{formatTimeAgo(story.createdAt)}</time>
              </div>
              <p className="text-gray-600 text-sm mt-1">Started a collaborative story</p>
            </div>
          </div>
        </div>

        {/* Story Content */}
        <div className="p-6">
          <div className="prose max-w-none">
            <div className="text-lg leading-relaxed text-gray-800 space-y-4">
              {/* Initial Story Segment */}
              <p className="story-segment">
                <span className="story-text">{story.initialContent}</span>
                <span className="inline-flex items-center ml-2 px-2 py-1 text-xs bg-fc-purple bg-opacity-10 text-fc-purple rounded-full">
                  <Users className="w-3 h-3 mr-1" />
                  <span>{story.creator.username}</span>
                </span>
              </p>

              {/* Story Segments */}
              {story.segments.map((segment, index) => (
                <p key={segment.id} className={cn(
                  "story-segment border-l-4 pl-4",
                  index % 3 === 0 && "border-fc-blue border-opacity-30",
                  index % 3 === 1 && "border-fc-emerald border-opacity-30",
                  index % 3 === 2 && "border-fc-amber border-opacity-30"
                )}>
                  <span className="story-text">{segment.content}</span>
                  <span className={cn(
                    "inline-flex items-center ml-2 px-2 py-1 text-xs rounded-full",
                    index % 3 === 0 && "bg-fc-blue bg-opacity-10 text-fc-blue",
                    index % 3 === 1 && "bg-fc-emerald bg-opacity-10 text-fc-emerald",
                    index % 3 === 2 && "bg-fc-amber bg-opacity-10 text-fc-amber"
                  )}>
                    <Users className="w-3 h-3 mr-1" />
                    <span>{segment.author.username}</span>
                  </span>
                </p>
              ))}
            </div>
          </div>
        </div>

        {/* Story Interaction Bar */}
        <div className="px-6 py-4 border-t border-gray-100 bg-gray-50">
          <div className="flex items-center justify-between">
            {/* Like and Recast Buttons */}
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleLike}
                disabled={likeMutation.isPending}
                className={cn(
                  "flex items-center space-x-2 px-3 py-2 rounded-lg transition-all duration-200",
                  story.hasLiked 
                    ? "bg-fc-red bg-opacity-10 text-fc-red hover:bg-fc-red hover:bg-opacity-20" 
                    : "text-gray-600 hover:bg-gray-100"
                )}
              >
                <Heart className={cn("w-4 h-4", story.hasLiked && "fill-current")} />
                <span className="text-sm font-medium">{story.likeCount}</span>
              </Button>
              
              <Button
                variant="ghost"
                size="sm"
                className="flex items-center space-x-2 px-3 py-2 rounded-lg text-gray-600 hover:bg-gray-100 transition-all duration-200"
              >
                <Repeat2 className="w-4 h-4" />
                <span className="text-sm font-medium">{story.recastCount}</span>
              </Button>
            </div>

            {/* Story Stats */}
            <div className="flex items-center space-x-4 text-sm text-gray-500">
              <div className="flex items-center space-x-1">
                <Users className="w-4 h-4" />
                <span>{story.contributorCount}</span>
                <span>writers</span>
              </div>
              <div className="flex items-center space-x-1">
                <Clock className="w-4 h-4" />
                <span>Last updated {formatTimeAgo(story.updatedAt)}</span>
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Contribution Area */}
      {currentUser && (
        story.hasLiked ? (
          <ContributionForm 
            story={story} 
            currentUser={currentUser}
            isOpen={showContributionForm}
            onClose={() => setShowContributionForm(false)}
          />
        ) : (
          <Card className="p-6 text-center bg-amber-50 border-amber-200">
            <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Heart className="w-8 h-8 text-amber-600" />
            </div>
            <h3 className="text-lg font-semibold text-amber-800 mb-2">Like to Unlock Writing</h3>
            <p className="text-amber-700 mb-4">Show your support for this story by liking it above. Only supporters can add to the collaborative narrative!</p>
            <div className="text-sm text-amber-600">
              <i className="fas fa-info-circle mr-1"></i>
              This ensures quality contributions from engaged community members
            </div>
          </Card>
        )
      )}

      {/* Contributors List */}
      <ContributorsList contributors={story.contributors} />

      {/* Real-time Status */}
      <Card className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-fc-emerald rounded-full animate-pulse"></div>
            <span className="text-sm text-gray-600">Live updates enabled</span>
          </div>
          <div className="text-xs text-gray-500">
            Last sync: just now
          </div>
        </div>
      </Card>
    </div>
  );
}
