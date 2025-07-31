import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";
import type { StoryWithContributors } from "@shared/schema";

export function useStory(storyId: string, viewerFid?: number) {
  const query = useQuery<StoryWithContributors>({
    queryKey: ["/api/stories", storyId, viewerFid],
    enabled: !!storyId,
    refetchInterval: 10000, // Refetch every 10 seconds for real-time updates
  });

  // Handle the special case for the sample story
  useEffect(() => {
    if (storyId === "sample-story-id" && query.isError) {
      // For demo purposes, use the first available story
      console.log("Sample story ID used, this would fetch the main story in production");
    }
  }, [storyId, query.isError]);

  return {
    story: query.data,
    isLoading: query.isLoading,
    error: query.error as Error | null,
    refetch: query.refetch
  };
}
