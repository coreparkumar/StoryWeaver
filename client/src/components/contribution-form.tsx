import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Lightbulb, Shield } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import type { StoryWithContributors, User } from "@shared/schema";

interface ContributionFormProps {
  story: StoryWithContributors;
  currentUser: User;
  isOpen: boolean;
  onClose: () => void;
}

export default function ContributionForm({ story, currentUser, isOpen, onClose }: ContributionFormProps) {
  const [content, setContent] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const submitMutation = useMutation({
    mutationFn: async (content: string) => {
      const response = await apiRequest("POST", `/api/stories/${story.id}/segments`, {
        authorFid: currentUser.fid,
        content
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/stories/${story.id}${currentUser?.fid ? `?viewerFid=${currentUser.fid}` : ""}`] });
      setContent("");
      onClose();
      toast({
        title: "Contribution Added!",
        description: "Your part has been added to the story.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to add contribution. Please try again.",
        variant: "destructive"
      });
    }
  });

  const handleSubmit = () => {
    if (!content.trim()) {
      toast({
        title: "Empty Contribution",
        description: "Please write something before submitting.",
        variant: "destructive"
      });
      return;
    }

    if (content.length > 280) {
      toast({
        title: "Too Long",
        description: "Please keep your contribution under 280 characters.",
        variant: "destructive"
      });
      return;
    }

    submitMutation.mutate(content.trim());
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      handleSubmit();
    }
  };

  if (!isOpen) return null;

  return (
    <Card className="p-6">
      <div className="flex items-start space-x-3">
        <img 
          src={currentUser.pfpUrl || "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-4.0.3&auto=format&fit=crop&w=150&h=150"} 
          alt="Your Avatar" 
          className="w-10 h-10 rounded-full border-2 border-fc-purple"
        />
        
        <div className="flex-1">
          <div className="mb-3">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Continue the story...
            </label>
            <Textarea 
              value={content}
              onChange={(e) => setContent(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Add your creative twist to the narrative..."
              className="w-full p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-fc-purple focus:border-transparent resize-none"
              rows={4}
            />
            
            {/* Character Counter */}
            <div className="flex justify-between items-center mt-2">
              <div className="text-sm text-gray-500">
                <span className={content.length > 280 ? "text-red-500" : ""}>{content.length}</span>/280 characters
              </div>
              <div className="text-xs text-gray-400 flex items-center">
                <Lightbulb className="w-3 h-3 mr-1" />
                Keep it engaging and family-friendly
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex items-center justify-between">
            <div className="flex space-x-2">
              <Button 
                onClick={handleSubmit}
                disabled={submitMutation.isPending || !content.trim() || content.length > 280}
                className="px-6 py-2 bg-fc-purple text-white font-medium rounded-lg hover:bg-purple-600 focus:ring-4 focus:ring-purple-200 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Plus className="w-4 h-4 mr-2" />
                {submitMutation.isPending ? "Adding..." : "Add to Story"}
              </Button>
              
              <Button 
                variant="outline"
                onClick={onClose}
                disabled={submitMutation.isPending}
              >
                Cancel
              </Button>
            </div>
            
            <div className="text-xs text-gray-500 flex items-center">
              <Shield className="w-3 h-3 mr-1" />
              Contributions are moderated
            </div>
          </div>
          
          <div className="mt-2 text-xs text-gray-400">
            Pro tip: Press Ctrl+Enter (Cmd+Enter on Mac) to submit
          </div>
        </div>
      </div>
    </Card>
  );
}
