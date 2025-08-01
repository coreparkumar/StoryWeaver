import { useParams } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { useFarcaster } from "@/hooks/use-farcaster";
import { StoryCard } from "@/components/StoryCard";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, ArrowLeft, ExternalLink } from "lucide-react";
import { Link } from "wouter";
import type { StoryWithContributors } from "@shared/schema";

export default function StoryPage() {
  const { id } = useParams<{ id: string }>();
  const { user, isLoading: fcLoading } = useFarcaster();
  
  // Get story with full details for display
  const { data: story, isLoading: storyLoading, error } = useQuery<StoryWithContributors>({
    queryKey: ['/api/stories', id],
    enabled: !!id && !!user,
    refetchInterval: 10000, // Refresh every 10 seconds
  });

  const isLoading = fcLoading || storyLoading;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-purple-50 flex items-center justify-center">
        <Card className="w-full max-w-md mx-4">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center space-y-4">
              <Loader2 className="h-8 w-8 animate-spin text-fc-purple" />
              <div className="text-center">
                <h2 className="text-lg font-semibold text-gray-900">Loading Story</h2>
                <p className="text-sm text-gray-600">Weaving the narrative...</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error || !story) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-purple-50 flex items-center justify-center">
        <Card className="w-full max-w-md mx-4">
          <CardContent className="pt-6">
            <div className="text-center space-y-4">
              <h2 className="text-lg font-semibold text-red-600">Story Not Found</h2>
              <p className="text-sm text-gray-600">
                This story may have been removed or doesn't exist.
              </p>
              <Link href="/">
                <Button variant="outline" className="mt-4">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Stories
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-purple-50">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Navigation */}
          <div className="mb-6 flex items-center justify-between">
            <Link href="/">
              <Button variant="outline" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Stories
              </Button>
            </Link>
            
            {story.originalCastHash && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.open(`https://warpcast.com/~/conversations/${story.originalCastHash}`, '_blank')}
              >
                <ExternalLink className="h-4 w-4 mr-2" />
                View Original Cast
              </Button>
            )}
          </div>

          {/* Story Content */}
          <div className="space-y-6">
            <StoryCard story={story} />
            
            {/* Story metadata for weaved stories */}
            {story.originalCastHash && (
              <Card className="border-l-4 border-l-fc-purple">
                <CardContent className="pt-4">
                  <div className="text-sm text-gray-600">
                    <p className="font-medium text-fc-purple mb-2">🌟 Weaved Story</p>
                    <p>
                      This collaborative story was created from a Farcaster cast using Story Weaver actions.
                      The original cast serves as the "seed" for this collaborative narrative.
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}