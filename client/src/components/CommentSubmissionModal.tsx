import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { MessageSquare, Share } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useFarcaster } from "@/hooks/use-farcaster";
import { useToast } from "@/hooks/use-toast";
import type { StoryWithContributors } from "@shared/schema";

interface CommentSubmissionModalProps {
  story: StoryWithContributors;
  trigger?: React.ReactNode;
}

export function CommentSubmissionModal({ story, trigger }: CommentSubmissionModalProps) {
  const [open, setOpen] = useState(false);
  const [content, setContent] = useState("");
  const [shareToFarcaster, setShareToFarcaster] = useState(false);
  
  const { user, sdk } = useFarcaster();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const submitCommentMutation = useMutation({
    mutationFn: async (data: { content: string; authorFid: number; storyId: string }) => {
      const response = await apiRequest('POST', `/api/stories/${story.id}/comments`, data);
      return response.json();
    },
    onSuccess: async (comment) => {
      queryClient.invalidateQueries({ queryKey: ['/api/stories', story.id] });
      
      if (shareToFarcaster && sdk) {
        try {
          // Share comment to Farcaster
          const castText = `Just added to the collaborative story "${story.title}":\n\n"${content}"\n\nJoin the weave!`;
          
          window.open(`https://warpcast.com/~/compose?text=${encodeURIComponent(castText)}&embeds[]=${encodeURIComponent(window.location.href)}`, '_blank');
          
          toast({
            title: "Comment Shared!",
            description: "Your story contribution has been submitted and shared to Farcaster.",
          });
        } catch (error) {
          console.warn("Error sharing to Farcaster:", error);
          toast({
            title: "Comment Submitted!",
            description: "Your story contribution has been submitted for review.",
          });
        }
      } else {
        toast({
          title: "Comment Submitted!",
          description: "Your story contribution has been submitted for review by the creator.",
        });
      }
      
      setOpen(false);
      setContent("");
      setShareToFarcaster(false);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to submit comment",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = () => {
    if (!user || !content.trim()) {
      toast({
        title: "Missing Content",
        description: "Please write your story contribution before submitting.",
        variant: "destructive",
      });
      return;
    }

    submitCommentMutation.mutate({
      content: content.trim(),
      authorFid: user.fid,
      storyId: story.id,
    });
  };

  const defaultTrigger = (
    <Button 
      variant="outline" 
      className="border-fc-purple text-fc-purple hover:bg-fc-purple hover:text-white"
    >
      <MessageSquare className="w-4 h-4 mr-2" />
      Add to Story
    </Button>
  );

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || defaultTrigger}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[525px]">
        <DialogHeader>
          <DialogTitle>Add to "{story.title}"</DialogTitle>
          <DialogDescription>
            Contribute to this collaborative story. Your submission will be reviewed by the story creator.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 pt-4">
          <div className="bg-gray-50 rounded-lg p-3">
            <p className="text-sm text-gray-600 font-medium mb-2">Current Story:</p>
            <p className="text-sm text-gray-800 leading-relaxed">
              {story.initialContent}
              {story.segments.length > 0 && (
                <>
                  {" "}
                  {story.segments
                    .sort((a, b) => a.orderIndex - b.orderIndex)
                    .map(segment => segment.content)
                    .join(" ")}
                </>
              )}
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="content">Your Story Continuation</Label>
            <Textarea
              id="content"
              placeholder="Continue the story here... What happens next?"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              maxLength={280}
              rows={4}
            />
            <p className="text-xs text-gray-500">{content.length}/280 characters</p>
          </div>

          {sdk && (
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="shareToFarcaster"
                checked={shareToFarcaster}
                onChange={(e) => setShareToFarcaster(e.target.checked)}
                className="rounded border-gray-300"
              />
              <Label htmlFor="shareToFarcaster" className="text-sm cursor-pointer">
                Share my contribution to Farcaster
              </Label>
            </div>
          )}

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <div className="flex items-center gap-2 mb-2">
              <Badge variant="secondary" className="bg-blue-100 text-blue-700">
                Review Process
              </Badge>
            </div>
            <ul className="text-sm text-blue-700 space-y-1">
              <li>• Your contribution will be sent to the story creator</li>
              <li>• They can approve it to add to the main story</li>
              <li>• You'll be credited as a contributor if approved</li>
              <li>• Only approved parts become part of the story</li>
            </ul>
          </div>
        </div>
        
        <div className="flex justify-end gap-3 pt-4">
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button 
            onClick={handleSubmit} 
            disabled={submitCommentMutation.isPending || !content.trim()}
            className="bg-fc-purple hover:bg-fc-purple/90"
          >
            {submitCommentMutation.isPending ? "Submitting..." : "Submit Contribution"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}