import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { CheckCircle, XCircle, Trash2, ExternalLink, StopCircle, Activity, Calendar, Hash, MessageSquare, ChevronDown, ChevronRight, User } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useFarcaster } from "@/hooks/use-farcaster";
import { useToast } from "@/hooks/use-toast";
import type { Story, StoryComment, CastComment, User as UserType } from "@shared/schema";

interface CastStoriesDashboardProps {
  userFid: number;
}

type CastStoryWithMeta = Story & { 
  commentCount: number; 
  createdFromCast: boolean;
  castSummary: string;
};

type PendingComment = StoryComment & { author: UserType };
type PendingCastComment = CastComment & { author: UserType };

interface PendingCommentsData {
  storyComments: PendingComment[];
  castComments: PendingCastComment[];
}

export function CastStoriesDashboard({ userFid }: CastStoriesDashboardProps) {
  const { user } = useFarcaster();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());

  // Only show to authorized owner
  if (!user || userFid !== 977521) {
    return null;
  }

  const { data: castStories = [], isLoading } = useQuery<CastStoryWithMeta[]>({
    queryKey: ['/api/cast-stories'],
    queryFn: async () => {
      const response = await apiRequest('GET', `/api/cast-stories?creatorFid=${userFid}`);
      return response.json();
    },
    refetchInterval: 10000, // Refresh every 10 seconds
    enabled: !!user,
  });

  const closeStoryMutation = useMutation({
    mutationFn: async (storyId: string) => {
      const response = await apiRequest('POST', `/api/stories/${storyId}/close`, { userFid });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/cast-stories'] });
      queryClient.invalidateQueries({ queryKey: ['/api/stories'] });
      toast({
        title: "Story Closed",
        description: "Story has been permanently closed.",
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

  const deleteStoryMutation = useMutation({
    mutationFn: async (storyId: string) => {
      const response = await apiRequest('DELETE', `/api/stories/${storyId}`, { userFid });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/cast-stories'] });
      queryClient.invalidateQueries({ queryKey: ['/api/stories'] });
      toast({
        title: "Story Removed",
        description: "Story and all associated data have been permanently deleted.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete story",
        variant: "destructive",
      });
    },
  });

  const approveCommentMutation = useMutation({
    mutationFn: async ({ commentId, type }: { commentId: string; type: 'story' | 'cast' }) => {
      const endpoint = type === 'story' 
        ? `/api/comments/${commentId}/approve`
        : `/api/cast-comments/${commentId}/approve`;
      const response = await apiRequest('POST', endpoint, { userFid });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/cast-stories'] });
      // Invalidate all pending comments queries
      queryClient.invalidateQueries({ 
        predicate: query => 
          Array.isArray(query.queryKey) && 
          query.queryKey.includes('pending-comments')
      });
      toast({
        title: "Comment Approved",
        description: "Comment has been approved and added to the story.",
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

  const rejectCommentMutation = useMutation({
    mutationFn: async ({ commentId, type }: { commentId: string; type: 'story' | 'cast' }) => {
      const endpoint = type === 'story' 
        ? `/api/comments/${commentId}/reject`
        : `/api/cast-comments/${commentId}/reject`;
      const response = await apiRequest('POST', endpoint, { userFid });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/cast-stories'] });
      // Invalidate all pending comments queries
      queryClient.invalidateQueries({ 
        predicate: query => 
          Array.isArray(query.queryKey) && 
          query.queryKey.includes('pending-comments')
      });
      toast({
        title: "Comment Rejected",
        description: "Comment has been rejected and removed from consideration.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to reject comment",
        variant: "destructive",
      });
    },
  });

  const formatDateTime = (dateString: string | Date) => {
    const date = typeof dateString === 'string' ? new Date(dateString) : dateString;
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const truncateHash = (hash: string) => {
    return `${hash.substring(0, 8)}...${hash.substring(hash.length - 6)}`;
  };

  const toggleRowExpansion = (storyId: string) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(storyId)) {
      newExpanded.delete(storyId);
    } else {
      newExpanded.add(storyId);
    }
    setExpandedRows(newExpanded);
  };

  // Helper function to get pending comments for a story
  const getPendingCommentsData = async (storyId: string): Promise<PendingCommentsData> => {
    const url = `/api/stories/${storyId}/pending-comments?creatorFid=${userFid}`;
    const response = await fetch(url, {
      credentials: "include",
    });
    if (!response.ok) {
      const text = await response.text();
      throw new Error(`${response.status}: ${text}`);
    }
    return response.json();
  };

  return (
    <Card className="border-fc-purple/20">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Activity className="w-5 h-5" />
            Stories from Cast Actions
          </CardTitle>
          <Badge variant="outline" className="flex items-center gap-1">
            <Hash className="w-3 h-3" />
            {castStories.length} Total
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="text-center py-8 text-gray-500">Loading cast stories...</div>
        ) : castStories.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <MessageSquare className="w-12 h-12 mx-auto mb-3 text-gray-300" />
            <p>No stories created from cast actions yet</p>
            <p className="text-sm mt-1">Stories will appear here when users use the "Weave My Part" action</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[40px]"></TableHead>
                  <TableHead className="w-[60px]">#</TableHead>
                  <TableHead>Story Title</TableHead>
                  <TableHead>Cast Summary</TableHead>
                  <TableHead className="text-center">Comments</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {castStories.map((story, index) => {
                  const isExpanded = expandedRows.has(story.id);
                  
                  return (
                    <StoryRow 
                      key={story.id}
                      story={story}
                      index={index}
                      totalStories={castStories.length}
                      isExpanded={isExpanded}
                      onToggleExpand={() => toggleRowExpansion(story.id)}
                      onCloseStory={(storyId) => closeStoryMutation.mutate(storyId)}
                      onDeleteStory={(storyId) => deleteStoryMutation.mutate(storyId)}
                      onApproveComment={(commentId, type) => approveCommentMutation.mutate({ commentId, type })}
                      onRejectComment={(commentId, type) => rejectCommentMutation.mutate({ commentId, type })}
                      closeStoryPending={closeStoryMutation.isPending}
                      deleteStoryPending={deleteStoryMutation.isPending}
                      approvePending={approveCommentMutation.isPending}
                      rejectPending={rejectCommentMutation.isPending}
                      getPendingCommentsData={getPendingCommentsData}
                      formatDateTime={formatDateTime}
                    />
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Separate component for story rows to avoid hook violations
interface StoryRowProps {
  story: CastStoryWithMeta;
  index: number;
  totalStories: number;
  isExpanded: boolean;
  onToggleExpand: () => void;
  onCloseStory: (storyId: string) => void;
  onDeleteStory: (storyId: string) => void;
  onApproveComment: (commentId: string, type: 'story' | 'cast') => void;
  onRejectComment: (commentId: string, type: 'story' | 'cast') => void;
  closeStoryPending: boolean;
  deleteStoryPending: boolean;
  approvePending: boolean;
  rejectPending: boolean;
  getPendingCommentsData: (storyId: string) => Promise<PendingCommentsData>;
  formatDateTime: (date: Date) => string;
}

function StoryRow({ 
  story, 
  index, 
  totalStories, 
  isExpanded, 
  onToggleExpand,
  onCloseStory,
  onDeleteStory,
  onApproveComment,
  onRejectComment,
  closeStoryPending,
  deleteStoryPending,
  approvePending,
  rejectPending,
  getPendingCommentsData,
  formatDateTime 
}: StoryRowProps) {
  const pendingComments = useQuery<PendingCommentsData>({
    queryKey: ['/api/stories', story.id, 'pending-comments'],
    queryFn: () => getPendingCommentsData(story.id),
    enabled: isExpanded,
    refetchInterval: isExpanded ? 5000 : false,
  });

  const totalPendingCount = (pendingComments.data?.storyComments.length || 0) + (pendingComments.data?.castComments.length || 0);

  return (
    <>
      <TableRow className="hover:bg-gray-50">
        <TableCell>
          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0"
            onClick={onToggleExpand}
          >
            {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
          </Button>
        </TableCell>
        <TableCell className="font-medium">
          {totalStories - index}
        </TableCell>
        <TableCell>
          <div className="flex items-center gap-2">
            <span className="font-medium">{story.title}</span>
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0"
              onClick={() => window.open(`/story/${story.id}`, '_blank')}
            >
              <ExternalLink className="w-3 h-3" />
            </Button>
          </div>
        </TableCell>
        <TableCell>
          <div className="text-sm text-gray-600 max-w-xs">
            {story.castSummary}
          </div>
        </TableCell>
        <TableCell className="text-center">
          <div className="flex flex-col items-center gap-1">
            <Badge variant="secondary" className="flex items-center gap-1 w-fit">
              <MessageSquare className="w-3 h-3" />
              {story.commentCount}
            </Badge>
            {totalPendingCount > 0 && (
              <Badge variant="outline" className="text-xs text-orange-600 border-orange-300">
                {totalPendingCount} pending
              </Badge>
            )}
          </div>
        </TableCell>
        <TableCell>
          <Badge 
            variant={story.sessionStatus === "active" ? "default" : "secondary"}
            className={story.sessionStatus === "active" ? "bg-green-100 text-green-800" : ""}
          >
            {story.sessionStatus === "active" ? "Active" : "Closed"}
          </Badge>
        </TableCell>
        <TableCell>
          <div className="flex items-center gap-1 text-sm text-gray-600">
            <Calendar className="w-3 h-3" />
            {formatDateTime(story.createdAt!)}
          </div>
        </TableCell>
        <TableCell>
          <div className="flex items-center gap-1 justify-end">
            {story.sessionStatus === "active" && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-7 text-orange-700 border-orange-300 hover:bg-orange-50"
                  >
                    <StopCircle className="w-3 h-3" />
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Close Story</AlertDialogTitle>
                    <AlertDialogDescription>
                      This will permanently close the story and stop accepting new contributions. 
                      This action cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={() => onCloseStory(story.id)}
                      disabled={closeStoryPending}
                      className="bg-orange-600 hover:bg-orange-700"
                    >
                      {closeStoryPending ? "Closing..." : "Close Story"}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
            
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  size="sm"
                  variant="outline"
                  className="h-7 text-red-700 border-red-300 hover:bg-red-50"
                >
                  <Trash2 className="w-3 h-3" />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete Story</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will permanently delete the story and all associated comments, likes, and segments. 
                    This action cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={() => onDeleteStory(story.id)}
                    disabled={deleteStoryPending}
                    className="bg-red-600 hover:bg-red-700"
                  >
                    {deleteStoryPending ? "Deleting..." : "Delete Story"}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </TableCell>
      </TableRow>
      
      {/* Child rows for pending comments */}
      {isExpanded && (
        <TableRow key={`${story.id}-expanded`}>
          <TableCell colSpan={8} className="bg-gray-50 p-0">
            <div className="p-4">
              {pendingComments.isLoading ? (
                <div className="text-center py-4 text-gray-500">Loading pending comments...</div>
              ) : totalPendingCount === 0 ? (
                <div className="text-center py-4 text-gray-500">No pending comments</div>
              ) : (
                <div className="space-y-3">
                  <h4 className="font-medium text-gray-900">Pending Comments & Cast Replies</h4>
                  
                  {/* Story Comments */}
                  {pendingComments.data?.storyComments.map((comment) => (
                    <div key={comment.id} className="bg-white p-3 rounded-lg border border-gray-200">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-3 flex-1">
                          <img 
                            src={comment.author?.pfpUrl || "/default-avatar.png"} 
                            alt={comment.author?.displayName || "User"} 
                            className="w-8 h-8 rounded-full"
                          />
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-medium text-sm">{comment.author?.displayName || "Anonymous"}</span>
                              <span className="text-xs text-gray-500">@{comment.author?.username}</span>
                              <Badge variant="outline" className="text-xs">Story Comment</Badge>
                            </div>
                            <p className="text-sm text-gray-700">{comment.content}</p>
                            <p className="text-xs text-gray-500 mt-1">{formatDateTime(comment.createdAt!)}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 ml-4">
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-8 text-green-700 border-green-300 hover:bg-green-50"
                            onClick={() => onApproveComment(comment.id, 'story')}
                            disabled={approvePending || rejectPending}
                          >
                            <CheckCircle className="w-3 h-3 mr-1" />
                            Approve
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-8 text-red-700 border-red-300 hover:bg-red-50"
                            onClick={() => onRejectComment(comment.id, 'story')}
                            disabled={approvePending || rejectPending}
                          >
                            <XCircle className="w-3 h-3 mr-1" />
                            Reject
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                  
                  {/* Cast Comments */}
                  {pendingComments.data?.castComments.map((comment) => (
                    <div key={comment.id} className="bg-white p-3 rounded-lg border border-gray-200">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-3 flex-1">
                          <img 
                            src={comment.author?.pfpUrl || "/default-avatar.png"} 
                            alt={comment.author?.displayName || "User"} 
                            className="w-8 h-8 rounded-full"
                          />
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-medium text-sm">{comment.author?.displayName || "Anonymous"}</span>
                              <span className="text-xs text-gray-500">@{comment.author?.username}</span>
                              <Badge variant="outline" className="text-xs bg-purple-50 text-purple-700 border-purple-200">Cast Reply</Badge>
                            </div>
                            <p className="text-sm text-gray-700">{comment.content}</p>
                            <p className="text-xs text-gray-500 mt-1">{formatDateTime(comment.createdAt!)}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 ml-4">
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-8 text-green-700 border-green-300 hover:bg-green-50"
                            onClick={() => onApproveComment(comment.id, 'cast')}
                            disabled={approvePending || rejectPending}
                          >
                            <CheckCircle className="w-3 h-3 mr-1" />
                            Approve
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-8 text-red-700 border-red-300 hover:bg-red-50"
                            onClick={() => onRejectComment(comment.id, 'cast')}
                            disabled={approvePending || rejectPending}
                          >
                            <XCircle className="w-3 h-3 mr-1" />
                            Reject
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </TableCell>
        </TableRow>
      )}
    </>
  );
}