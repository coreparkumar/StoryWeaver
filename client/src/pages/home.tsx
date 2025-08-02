import { useQuery } from "@tanstack/react-query";
import { useFarcaster } from "@/hooks/use-farcaster";
import { StoryCard } from "@/components/StoryCard";
import { StoryCreationModal } from "@/components/StoryCreationModal";
import { CastStoriesDashboard } from "@/components/CastStoriesDashboard";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, Sparkles, Users, MessageSquare, Plus, ArrowRight } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import type { StoryWithContributors } from "@shared/schema";
import promoImage from "../assets/story-weaver-promo.jpg";

export default function Home() {
  const { user, isLoading: fcLoading } = useFarcaster();
  
  // Check for cast share parameters
  const urlParams = new URLSearchParams(window.location.search);
  const sharedCastHash = urlParams.get('cast');
  const sharedCastText = urlParams.get('text');
  
  // Fetch all stories
  const { data: stories = [], isLoading: storiesLoading, error } = useQuery<StoryWithContributors[]>({
    queryKey: ['/api/stories'],
    refetchInterval: 15000, // Refresh every 15 seconds
  });

  // Get first story ID safely
  const firstStoryId = stories && stories.length > 0 ? stories[0].id : null;

  // Get story with full details for display
  const { data: featuredStory, isLoading: storyLoading } = useQuery<StoryWithContributors>({
    queryKey: ['/api/stories', firstStoryId],
    enabled: !!firstStoryId && !!user,
    refetchInterval: 10000, // Refresh every 10 seconds
  });

  const isLoading = fcLoading || storiesLoading || storyLoading;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-purple-50 flex items-center justify-center">
        <Card className="w-full max-w-md mx-4">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center space-y-4">
              <Loader2 className="h-8 w-8 animate-spin text-fc-purple" />
              <div className="text-center">
                <h2 className="text-lg font-semibold text-gray-900">Loading Story Weaver</h2>
                <p className="text-sm text-gray-600">
                  {sharedCastHash ? "Creating story from your cast..." : "Connecting to Farcaster..."}
                </p>
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
      <main className="max-w-4xl mx-auto px-4 py-6">
        {/* Welcome Section */}
        <div className="mb-8">
          <div className="text-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Collaborative Storytelling</h2>
            <p className="text-gray-600">Like stories to unlock contribution privileges. Share your story parts and watch creators weave them into magical narratives.</p>
          </div>

          {/* Feature Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <Card className="bg-gradient-to-br from-purple-50 to-pink-50 border-purple-200">
              <CardContent className="pt-4">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                    <Sparkles className="w-5 h-5 text-purple-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-purple-900">Like to Contribute</h3>
                    <p className="text-sm text-purple-700">Heart stories to unlock writing privileges</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-blue-50 to-cyan-50 border-blue-200">
              <CardContent className="pt-4">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                    <MessageSquare className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-blue-900">Submit Parts</h3>
                    <p className="text-sm text-blue-700">Add your story parts as comments</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-green-200">
              <CardContent className="pt-4">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                    <Users className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-green-900">Creator Approval</h3>
                    <p className="text-sm text-green-700">Authors weave approved parts into stories</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Create Story Section */}
          {user && user.fid === 977521 && (
            <div className="text-center mb-6">
              <StoryCreationModal />
            </div>
          )}
        </div>

        {/* Featured Story */}
        {featuredStory ? (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-bold text-gray-900">Featured Collaborative Story</h3>
              <Badge variant="outline" className="border-fc-purple text-fc-purple">
                Live Collaboration
              </Badge>
            </div>
            <StoryCard story={featuredStory} currentUser={user || undefined} />
          </div>
        ) : stories.length > 0 ? (
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <h2 className="text-lg font-semibold text-gray-900">Stories Available</h2>
                <p className="text-sm text-gray-600 mt-2">Connect with Farcaster to view and contribute to collaborative stories!</p>
                {!user && (
                  <div className="mt-4 p-4 bg-fc-purple/5 border border-fc-purple/20 rounded-lg">
                    <p className="text-sm text-fc-purple">
                      Please connect with Farcaster to access Story Weaver's collaborative features
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <h2 className="text-lg font-semibold text-gray-900">No Stories Available Yet</h2>
                <p className="text-sm text-gray-600 mt-2">Be the first to create a collaborative story!</p>
                {user && user.fid === 977521 && (
                  <div className="mt-4">
                    <StoryCreationModal />
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Cast Stories Dashboard for Owner */}
        {user && user.fid === 977521 && (
          <div className="mt-8">
            <CastStoriesDashboard userFid={user.fid} />
          </div>
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
