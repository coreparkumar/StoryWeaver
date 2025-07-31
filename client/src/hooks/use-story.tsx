import { useQuery } from "@tanstack/react-query";
import type { StoryWithContributors, Story } from "@shared/schema";

export function useStory(storyId: string, viewerFid?: number) {
  // For the sample story ID, get the first available story
  const shouldGetFirstStory = storyId === "sample-story-id";
  
  const storiesQuery = useQuery<Story[]>({
    queryKey: ["/api/stories"],
    enabled: shouldGetFirstStory,
  });

  const actualStoryId = shouldGetFirstStory && storiesQuery.data?.length ? storiesQuery.data[0].id : storyId;

  const storyQuery = useQuery<StoryWithContributors>({
    queryKey: [`/api/stories/${actualStoryId}${viewerFid ? `?viewerFid=${viewerFid}` : ""}`],
    enabled: !!actualStoryId && actualStoryId !== "sample-story-id",
    refetchInterval: 10000, // Refetch every 10 seconds for real-time updates
  });

  return {
    story: storyQuery.data,
    isLoading: shouldGetFirstStory ? (storiesQuery.isLoading || storyQuery.isLoading) : storyQuery.isLoading,
    error: (storiesQuery.error || storyQuery.error) as Error | null,
    refetch: storyQuery.refetch
  };
}
