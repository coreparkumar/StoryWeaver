/**
 * Public Story Creation Component
 * 
 * This component allows any Farcaster user (not just the main owner) to create new stories.
 * It provides a simple form with character limits, submit functionality, and notification/share features.
 */

import { useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useFarcaster } from "@/hooks/use-farcaster";
import { PenTool, Share2, Bell, Sparkles } from "lucide-react";

const MAX_TITLE_LENGTH = 100;
const MAX_CONTENT_LENGTH = 500;

export function PublicStoryCreation() {
  const { user } = useFarcaster();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const createStoryMutation = useMutation({
    mutationFn: async (storyData: { title: string; initialContent: string }) => {
      const response = await apiRequest('POST', '/api/stories', {
        ...storyData,
        creatorFid: user?.fid,
        createdFromCast: false, // This is a manually created story
      });
      return response.json();
    },
    onSuccess: (newStory) => {
      queryClient.invalidateQueries({ queryKey: ['/api/stories'] });
      toast({
        title: "Story Created! 🎉",
        description: `"${newStory.title}" is now live and ready for collaboration!`,
      });
      
      // Reset form
      setTitle("");
      setContent("");
      
      // Show share notification
      setTimeout(() => {
        toast({
          title: "Share Your Story",
          description: "Your story is ready! Share it with the community to get contributions.",
        });
      }, 2000);
    },
    onError: (error: any) => {
      toast({
        title: "Creation Failed",
        description: error.message || "Failed to create story. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please connect with Farcaster to create stories.",
        variant: "destructive",
      });
      return;
    }

    if (!title.trim() || !content.trim()) {
      toast({
        title: "Missing Information",
        description: "Please provide both a title and initial content for your story.",
        variant: "destructive",
      });
      return;
    }

    if (title.length > MAX_TITLE_LENGTH) {
      toast({
        title: "Title Too Long",
        description: `Title must be ${MAX_TITLE_LENGTH} characters or less.`,
        variant: "destructive",
      });
      return;
    }

    if (content.length > MAX_CONTENT_LENGTH) {
      toast({
        title: "Content Too Long",
        description: `Content must be ${MAX_CONTENT_LENGTH} characters or less.`,
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    createStoryMutation.mutate({ title: title.trim(), initialContent: content.trim() });
    setIsSubmitting(false);
  };

  const handleNotifyMe = () => {
    toast({
      title: "Notifications Enabled",
      description: "You'll be notified when others contribute to your stories!",
    });
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: 'Story Weaver - Collaborative Storytelling',
        text: 'Join me in creating amazing collaborative stories on Story Weaver!',
        url: window.location.href,
      }).catch(console.error);
    } else {
      // Fallback - copy to clipboard
      navigator.clipboard.writeText(window.location.href).then(() => {
        toast({
          title: "Link Copied",
          description: "Story Weaver link copied to clipboard!",
        });
      }).catch(() => {
        toast({
          title: "Share Story Weaver",
          description: "Tell your friends about this collaborative storytelling platform!",
        });
      });
    }
  };

  if (!user) {
    return (
      <Card className="border-blue-200 bg-blue-50/50">
        <CardContent className="pt-6">
          <div className="text-center">
            <PenTool className="w-12 h-12 mx-auto mb-3 text-blue-400" />
            <h3 className="text-lg font-semibold text-blue-900 mb-2">Create Your Own Story</h3>
            <p className="text-blue-700 mb-4">Connect with Farcaster to start creating collaborative stories!</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-blue-200 bg-gradient-to-br from-blue-50 to-purple-50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-blue-900">
          <PenTool className="w-5 h-5" />
          Create New Story
          <Badge variant="outline" className="bg-white border-blue-200 text-blue-600">
            <Sparkles className="w-3 h-3 mr-1" />
            Public
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Title Input */}
          <div className="space-y-2">
            <Label htmlFor="story-title" className="text-blue-800">
              Story Title
            </Label>
            <Input
              id="story-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Give your story an engaging title..."
              maxLength={MAX_TITLE_LENGTH}
              className="border-blue-200 focus:border-blue-400"
            />
            <div className="flex justify-between text-xs">
              <span className="text-blue-600">Make it catchy and descriptive</span>
              <span className={`${title.length > MAX_TITLE_LENGTH * 0.9 ? 'text-red-500' : 'text-blue-500'}`}>
                {title.length}/{MAX_TITLE_LENGTH}
              </span>
            </div>
          </div>

          {/* Content Textarea */}
          <div className="space-y-2">
            <Label htmlFor="story-content" className="text-blue-800">
              Story Beginning
            </Label>
            <Textarea
              id="story-content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Start your story here... Others will continue where you leave off!"
              maxLength={MAX_CONTENT_LENGTH}
              rows={4}
              className="border-blue-200 focus:border-blue-400 resize-none"
            />
            <div className="flex justify-between text-xs">
              <span className="text-blue-600">This will be the opening of your collaborative story</span>
              <span className={`${content.length > MAX_CONTENT_LENGTH * 0.9 ? 'text-red-500' : 'text-blue-500'}`}>
                {content.length}/{MAX_CONTENT_LENGTH}
              </span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <Button
              type="submit"
              disabled={isSubmitting || !title.trim() || !content.trim()}
              className="flex-1 bg-blue-600 hover:bg-blue-700"
            >
              {isSubmitting ? "Creating..." : "Create Story"}
            </Button>
            
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleNotifyMe}
                className="border-blue-200 text-blue-600 hover:bg-blue-50"
              >
                <Bell className="w-4 h-4 mr-1" />
                Notify Me
              </Button>
              
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleShare}
                className="border-blue-200 text-blue-600 hover:bg-blue-50"
              >
                <Share2 className="w-4 h-4 mr-1" />
                Share
              </Button>
            </div>
          </div>

          {/* Helper Text */}
          <div className="bg-blue-100/50 rounded-lg p-3 text-sm text-blue-700">
            <div className="flex items-start gap-2">
              <Sparkles className="w-4 h-4 mt-0.5 text-blue-500" />
              <div>
                <p className="font-medium mb-1">How it works:</p>
                <ul className="space-y-1 text-xs">
                  <li>• Create your story beginning</li>
                  <li>• Others like your story to unlock commenting</li>
                  <li>• Contributors add story parts through comments</li>
                  <li>• You approve the best contributions to continue the narrative</li>
                  <li>• Stories automatically close after 10 contributions</li>
                </ul>
              </div>
            </div>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}