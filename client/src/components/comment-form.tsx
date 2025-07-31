import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MessageSquare, Loader2 } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { User } from "@shared/schema";

const commentSchema = z.object({
  content: z.string()
    .min(10, "Comment must be at least 10 characters")
    .max(280, "Comment must be under 280 characters")
});

type CommentFormData = z.infer<typeof commentSchema>;

interface CommentFormProps {
  storyId: string;
  currentUser: User;
  onSuccess?: () => void;
}

export default function CommentForm({ storyId, currentUser, onSuccess }: CommentFormProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [charCount, setCharCount] = useState(0);

  const form = useForm<CommentFormData>({
    resolver: zodResolver(commentSchema),
    defaultValues: {
      content: ""
    }
  });

  const commentMutation = useMutation({
    mutationFn: async (data: CommentFormData) => {
      const response = await apiRequest("POST", `/api/stories/${storyId}/comments`, {
        authorFid: currentUser.fid,
        content: data.content.trim(),
        castHash: `comment-${Date.now()}`
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/stories/${storyId}`] });
      form.reset();
      setCharCount(0);
      toast({
        title: "Comment Submitted!",
        description: "Your story part has been submitted for review."
      });
      onSuccess?.();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to submit comment. Please try again.",
        variant: "destructive"
      });
    }
  });

  const onSubmit = (data: CommentFormData) => {
    commentMutation.mutate(data);
  };

  const handleContentChange = (value: string) => {
    setCharCount(value.length);
    form.setValue("content", value);
  };

  return (
    <Card className="border-fc-purple/20">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center space-x-2 text-lg">
          <MessageSquare className="w-5 h-5 text-fc-purple" />
          <span>Add Your Story Part</span>
        </CardTitle>
        <p className="text-sm text-gray-600">
          Submit a story continuation for the creator to review and potentially incorporate.
        </p>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="content"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Your Story Continuation</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Continue the story with your creative twist..."
                      className="min-h-[120px] resize-none"
                      {...field}
                      onChange={(e) => {
                        handleContentChange(e.target.value);
                        field.onChange(e);
                      }}
                    />
                  </FormControl>
                  <div className="flex justify-between items-center">
                    <FormMessage />
                    <span className={`text-sm ${charCount > 250 ? 'text-red-500' : 'text-gray-500'}`}>
                      {charCount}/280
                    </span>
                  </div>
                </FormItem>
              )}
            />
            
            <Button 
              type="submit" 
              disabled={commentMutation.isPending || !form.formState.isValid}
              className="w-full"
            >
              {commentMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Submitting...
                </>
              ) : (
                "Submit Story Part"
              )}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}