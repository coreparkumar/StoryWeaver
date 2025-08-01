import { useEffect } from "react";
import { useFarcaster } from "@/hooks/use-farcaster";
import { useStory } from "@/hooks/use-story";
import StoryCard from "@/components/story-card";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import promoImage from "../assets/story-weaver-promo.jpg";

export default function Home() {
  const { user, isLoading: fcLoading, ready } = useFarcaster();
  const { story, isLoading: storyLoading, error } = useStory("sample-story-id", user?.fid);

  // SDK ready() is now called automatically in the FarcasterProvider
  // No need to call it manually in components

  if (fcLoading || storyLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-purple-50 flex items-center justify-center">
        <Card className="w-full max-w-md mx-4">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center space-y-4">
              <Loader2 className="h-8 w-8 animate-spin text-fc-purple" />
              <div className="text-center">
                <h2 className="text-lg font-semibold text-gray-900">Loading Story Weaver</h2>
                <p className="text-sm text-gray-600">Connecting to Farcaster...</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-purple-50 flex items-center justify-center">
        <Card className="w-full max-w-md mx-4">
          <CardContent className="pt-6">
            <div className="text-center">
              <h2 className="text-lg font-semibold text-red-600">Error Loading Story</h2>
              <p className="text-sm text-gray-600 mt-2">{error.message}</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-purple-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-2xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-fc-purple rounded-lg flex items-center justify-center">
                <i className="fas fa-feather-alt text-white text-sm"></i>
              </div>
              <div>
                <h1 className="text-lg font-bold text-gray-900">Story Weaver</h1>
                <p className="text-xs text-gray-500">Collaborative Stories</p>
              </div>
            </div>
            
            {/* User Profile */}
            {user && (
              <div className="flex items-center space-x-2">
                <img 
                  src={user.pfpUrl || "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-4.0.3&auto=format&fit=crop&w=150&h=150"} 
                  alt="User Avatar" 
                  className="w-8 h-8 rounded-full border-2 border-fc-purple"
                />
                <div className="text-right">
                  <p className="text-sm font-medium text-gray-900">{user.displayName}</p>
                  <p className="text-xs text-gray-500">@{user.username}</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Promotional Banner */}
      <div className="relative h-48 overflow-hidden">
        <img 
          src={promoImage} 
          alt="Story Weaver - Collaborative Storytelling" 
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-black bg-opacity-40 flex items-center justify-center">
          <div className="text-center text-white">
            <h2 className="text-3xl font-bold mb-2">Story Weaver</h2>
            <p className="text-lg">Write together, create magic</p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-2xl mx-auto px-4 py-6">
        {story ? (
          <StoryCard story={story} currentUser={user} />
        ) : (
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <h2 className="text-lg font-semibold text-gray-900">No Story Available</h2>
                <p className="text-sm text-gray-600 mt-2">Check back later for collaborative stories!</p>
              </div>
            </CardContent>
          </Card>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 mt-12">
        <div className="max-w-2xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <div className="w-6 h-6 bg-fc-purple rounded-md flex items-center justify-center">
                  <i className="fas fa-feather-alt text-white text-xs"></i>
                </div>
                <span className="text-sm font-medium text-gray-700">Story Weaver</span>
              </div>
              <span className="text-gray-400">·</span>
              <span className="text-sm text-gray-500">Powered by Farcaster</span>
            </div>
            
            <div className="flex items-center space-x-4 text-sm text-gray-500">
              <button className="hover:text-fc-purple transition-colors">
                <i className="fas fa-question-circle mr-1"></i>
                Help
              </button>
              <button className="hover:text-fc-purple transition-colors">
                <i className="fas fa-flag mr-1"></i>
                Report
              </button>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
