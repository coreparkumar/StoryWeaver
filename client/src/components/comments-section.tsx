import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MessageSquare, Plus, Clock, CheckCircle } from "lucide-react";
import { format } from "date-fns";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { StoryComment, User } from "@shared/schema";

interface CommentsSectionProps {
  storyId: string;
  comments: (StoryComment & { author: User })[];
  currentUser: User | null;
  isCreator: boolean;
}

export default function CommentsSection({ storyId, comments, currentUser, isCreator }: CommentsSectionProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const incorporateMutation = useMutation({
    mutationFn: async (commentId: string) => {
      const response = await apiRequest("POST", `/api/stories/${storyId}/comments/${commentId}/incorporate`, {
        userFid: currentUser?.fid
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/stories/${storyId}`] });
      toast({
        title: "Comment Incorporated!",
        description: "The story part has been added to the main story."
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to incorporate comment.",
        variant: "destructive"
      });
    }
  });

  const handleIncorporate = (commentId: string) => {
    incorporateMutation.mutate(commentId);
  };

  const formatTimeAgo = (dateInput: Date | string | null) => {
    if (!dateInput) return 'Recently';
    
    try {
      const date = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
      if (isNaN(date.getTime())) return 'Recently';
      
      const now = new Date();
      const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
      
      if (diffInMinutes < 60) {
        return `${diffInMinutes}m ago`;
      } else if (diffInMinutes < 1440) {
        return `${Math.floor(diffInMinutes / 60)}h ago`;
      } else {
        return format(date, "MMM d");
      }
    } catch (error) {
      return 'Recently';
    }
  };

  const pendingComments = comments.filter(c => !c.isIncorporated);
  const incorporatedComments = comments.filter(c => c.isIncorporated);

  if (comments.length === 0) {
    return (
      <Card className="border-gray-200">
        <CardContent className="pt-6">
          <div className="text-center py-8">
            <MessageSquare className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Story Parts Yet</h3>
            <p className="text-gray-600">
              Be the first to like this story and add your creative twist!
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Pending Comments */}
      {pendingComments.length > 0 && (
        <Card className="border-orange-200">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center space-x-2 text-lg">
              <Clock className="w-5 h-5 text-orange-500" />
              <span>Pending Story Parts</span>
              <Badge variant="secondary">{pendingComments.length}</Badge>
            </CardTitle>
            {isCreator && (
              <p className="text-sm text-gray-600">
                Review and select story parts to incorporate into the main story.
              </p>
            )}
          </CardHeader>
          <CardContent className="space-y-4">
            {pendingComments.map((comment) => (
              <div key={comment.id} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center space-x-3">
                    <img 
                      src={comment.author.pfpUrl || "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-4.0.3&auto=format&fit=crop&w=150&h=150"} 
                      alt="Comment Author Avatar" 
                      className="w-8 h-8 rounded-full"
                    />
                    <div>
                      <div className="flex items-center space-x-2">
                        <h4 className="font-medium text-gray-900">{comment.author.displayName}</h4>
                        <span className="text-gray-500 text-sm">@{comment.author.username}</span>
                      </div>
                      <time className="text-gray-500 text-xs">
                        {formatTimeAgo(comment.createdAt)}
                      </time>
                    </div>
                  </div>
                  
                  {isCreator && (
                    <Button
                      onClick={() => handleIncorporate(comment.id)}
                      disabled={incorporateMutation.isPending}
                      size="sm"
                      className="shrink-0"
                    >
                      <Plus className="w-4 h-4 mr-1" />
                      Add to Story
                    </Button>
                  )}
                </div>
                
                <p className="text-gray-800 leading-relaxed">{comment.content}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Incorporated Comments */}
      {incorporatedComments.length > 0 && (
        <Card className="border-green-200">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center space-x-2 text-lg">
              <CheckCircle className="w-5 h-5 text-green-500" />
              <span>Incorporated Story Parts</span>
              <Badge variant="secondary">{incorporatedComments.length}</Badge>
            </CardTitle>
            <p className="text-sm text-gray-600">
              These story parts have been added to the main story.
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            {incorporatedComments.map((comment) => (
              <div key={comment.id} className="border border-green-200 rounded-lg p-4 bg-green-50">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center space-x-3">
                    <img 
                      src={comment.author.pfpUrl || "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-4.0.3&auto=format&fit=crop&w=150&h=150"} 
                      alt="Comment Author Avatar" 
                      className="w-8 h-8 rounded-full"
                    />
                    <div>
                      <div className="flex items-center space-x-2">
                        <h4 className="font-medium text-gray-900">{comment.author.displayName}</h4>
                        <span className="text-gray-500 text-sm">@{comment.author.username}</span>
                        <Badge variant="outline" className="text-green-600 border-green-600">
                          Incorporated
                        </Badge>
                      </div>
                      <time className="text-gray-500 text-xs">
                        Added {formatTimeAgo(comment.incorporatedAt)}
                      </time>
                    </div>
                  </div>
                </div>
                
                <p className="text-gray-800 leading-relaxed">{comment.content}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}