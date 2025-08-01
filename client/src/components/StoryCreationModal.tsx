import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Plus } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useFarcaster } from "@/hooks/use-farcaster";
import { useToast } from "@/hooks/use-toast";

export function StoryCreationModal() {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [maxContributions, setMaxContributions] = useState(10);
  
  const { user } = useFarcaster();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const createStoryMutation = useMutation({
    mutationFn: async (data: { title: string; initialContent: string; creatorFid: number; maxContributions: number }) => {
      const response = await apiRequest('POST', '/api/stories', data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/stories'] });
      toast({
        title: "Story Created!",
        description: "Your collaborative story has been created and is ready for contributions.",
      });
      setOpen(false);
      setTitle("");
      setContent("");
      setMaxContributions(10);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create story",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = () => {
    if (!user || !title.trim() || !content.trim()) {
      toast({
        title: "Missing Information",
        description: "Please provide both title and initial content for your story.",
        variant: "destructive",
      });
      return;
    }

    createStoryMutation.mutate({
      title: title.trim(),
      initialContent: content.trim(),
      creatorFid: user.fid,
      maxContributions,
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-fc-purple hover:bg-fc-purple/90 text-white">
          <Plus className="w-4 h-4 mr-2" />
          Create New Story
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[525px]">
        <DialogHeader>
          <DialogTitle>Create a Collaborative Story</DialogTitle>
          <DialogDescription>
            Start a new story that others can contribute to. Users will need to like your story to submit contributions.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 pt-4">
          <div className="space-y-2">
            <Label htmlFor="title">Story Title</Label>
            <Input
              id="title"
              placeholder="Enter an engaging story title..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={100}
            />
            <p className="text-xs text-gray-500">{title.length}/100 characters</p>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="content">Initial Story Content</Label>
            <Textarea
              id="content"
              placeholder="Begin your story here. This will be the opening that others can build upon..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              maxLength={280}
              rows={4}
            />
            <p className="text-xs text-gray-500">{content.length}/280 characters</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="maxContributions">Maximum Contributions (Optional)</Label>
            <Input
              id="maxContributions"
              type="number"
              min="5"
              max="50"
              value={maxContributions}
              onChange={(e) => setMaxContributions(parseInt(e.target.value) || 10)}
            />
            <p className="text-xs text-gray-500">Limit how many parts can be added to your story</p>
          </div>

          <div className="bg-fc-purple/5 border border-fc-purple/20 rounded-lg p-3">
            <div className="flex items-center gap-2 mb-2">
              <Badge variant="secondary" className="bg-fc-purple/10 text-fc-purple">
                Collaborative Features
              </Badge>
            </div>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• Users must like your story to submit contributions</li>
              <li>• You can approve or decline submitted story parts</li>
              <li>• Approved parts are added to your story automatically</li>
              <li>• You can end the collaboration at any time</li>
            </ul>
          </div>
        </div>
        
        <div className="flex justify-end gap-3 pt-4">
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button 
            onClick={handleSubmit} 
            disabled={createStoryMutation.isPending || !title.trim() || !content.trim()}
            className="bg-fc-purple hover:bg-fc-purple/90"
          >
            {createStoryMutation.isPending ? "Creating..." : "Create Story"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}