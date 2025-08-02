import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { CheckCircle, XCircle, Trash2, ExternalLink, StopCircle, Activity, Calendar, Hash, MessageSquare } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useFarcaster } from "@/hooks/use-farcaster";
import { useToast } from "@/hooks/use-toast";
import type { Story } from "@shared/schema";

interface CastStoriesDashboardProps {
  userFid: number;
}

type CastStoryWithMeta = Story & { 
  commentCount: number; 
  createdFromCast: boolean; 
};

export function CastStoriesDashboard({ userFid }: CastStoriesDashboardProps) {
  const { user } = useFarcaster();
  const { toast } = useToast();
  const queryClient = useQueryClient();

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
                  <TableHead className="w-[60px]">#</TableHead>
                  <TableHead>Story Title</TableHead>
                  <TableHead>Cast Hash</TableHead>
                  <TableHead className="text-center">Comments</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {castStories.map((story, index) => (
                  <TableRow key={story.id} className="hover:bg-gray-50">
                    <TableCell className="font-medium">
                      {castStories.length - index}
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
                      <code className="text-xs bg-gray-100 px-2 py-1 rounded">
                        {story.originalCastHash ? truncateHash(story.originalCastHash) : 'N/A'}
                      </code>
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge variant="secondary" className="flex items-center gap-1 w-fit mx-auto">
                        <MessageSquare className="w-3 h-3" />
                        {story.commentCount}
                      </Badge>
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
                                  onClick={() => closeStoryMutation.mutate(story.id)}
                                  disabled={closeStoryMutation.isPending}
                                  className="bg-orange-600 hover:bg-orange-700"
                                >
                                  {closeStoryMutation.isPending ? "Closing..." : "Close Story"}
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
                                onClick={() => deleteStoryMutation.mutate(story.id)}
                                disabled={deleteStoryMutation.isPending}
                                className="bg-red-600 hover:bg-red-700"
                              >
                                {deleteStoryMutation.isPending ? "Deleting..." : "Delete Story"}
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}