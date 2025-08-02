import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ExternalLink, Wand2, RefreshCw, Trash2 } from "lucide-react";

export default function InstallAction() {
  // Direct metadata URL installation per Farcaster docs
  const installUrl = "https://warpcast.com/~/add-cast-action?url=https://worthifyme.in/api/cast-actions/weave-story";
  
  const handleInstall = () => {
    // Open Warpcast installation in new window
    window.open(installUrl, '_blank');
  };

  const handleUpdate = () => {
    // Same URL as install - Warpcast will update existing action
    window.open(installUrl, '_blank');
  };

  const handleRemove = () => {
    // Open Warpcast settings to manage cast actions
    const manageUrl = "https://warpcast.com/~/settings/actions";
    window.open(manageUrl, '_blank');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-100 via-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <Card className="max-w-lg w-full">
        <CardHeader className="text-center">
          <div className="mx-auto w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mb-4">
            <Wand2 className="w-8 h-8 text-purple-600" />
          </div>
          <CardTitle className="text-2xl font-bold text-gray-900">
            Install Story Weaver Action
          </CardTitle>
          <CardDescription className="text-gray-600">
            Add the "Weave My Part" action to your Warpcast to transform any cast into a collaborative story seed
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
            <h3 className="font-semibold text-amber-900 mb-2">📱 Installation Steps:</h3>
            <ol className="text-sm text-amber-800 space-y-1">
              <li>1. Click the "Install" button below</li>
              <li>2. Login to Warpcast if prompted</li>
              <li>3. Confirm the action installation</li>
              <li>4. Install the Story Weaver miniapp first (required)</li>
              <li>5. Start using "Weave My Part" on any cast!</li>
            </ol>
          </div>
          <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
            <h3 className="font-semibold text-purple-900 mb-2">What this action does:</h3>
            <ul className="text-sm text-purple-800 space-y-1">
              <li>• Appears as "Weave My Part" button under every cast in Warpcast</li>
              <li>• Transforms interesting casts into collaborative story seeds</li>
              <li>• Creates viral story loops with cast sharing</li>
              <li>• Enables community-driven storytelling</li>
            </ul>
          </div>
          
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="font-semibold text-blue-900 mb-2">How to use after installation:</h3>
            <ol className="text-sm text-blue-800 space-y-1">
              <li>1. Only Story Weaver owner (FID 977521) can create new story seeds</li>
              <li>2. Others can participate by liking and commenting on existing stories</li>
              <li>3. Cast actions appear only for users who install the miniapp</li>
              <li>4. Stories auto-close after 10 contributions with cleanup optimization</li>
            </ol>
          </div>
          
          <div className="space-y-3">
            <Button 
              onClick={handleInstall}
              className="w-full bg-purple-600 hover:bg-purple-700"
              size="lg"
            >
              <ExternalLink className="w-4 h-4 mr-2" />
              Install "Weave My Part" Action
            </Button>
            
            <div className="grid grid-cols-2 gap-2">
              <Button 
                onClick={handleUpdate}
                variant="outline"
                className="border-purple-300 text-purple-700 hover:bg-purple-50"
                size="sm"
                title="Update to latest version of Weave My Part action"
              >
                <RefreshCw className="w-3 h-3 mr-1" />
                Update Action
              </Button>
              
              <Button 
                onClick={handleRemove}
                variant="outline"
                className="border-red-300 text-red-700 hover:bg-red-50"
                size="sm"
                title="Remove action via Warpcast settings"
              >
                <Trash2 className="w-3 h-3 mr-1" />
                Remove Action
              </Button>
            </div>
            
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
              <h4 className="font-medium text-gray-800 text-xs mb-2">Action Management:</h4>
              <ul className="text-xs text-gray-600 space-y-1">
                <li>• <strong>Install:</strong> First-time setup of the action</li>
                <li>• <strong>Update:</strong> Get latest action version (same as install)</li>
                <li>• <strong>Remove:</strong> Opens Warpcast settings to delete action</li>
              </ul>
            </div>
          </div>
          
          <div className="text-center space-y-3">
            <p className="text-xs text-gray-500">
              Install/Update will open Warpcast • Remove opens Warpcast settings
            </p>
            <p className="text-xs text-gray-400">
              Note: Warpcast currently allows only one cast action per user
            </p>
            
            <div className="border-t pt-3">
              <p className="text-xs text-gray-600 mb-2">Alternative: Manual Installation</p>
              <div className="bg-gray-50 rounded p-2 text-xs text-left">
                <p className="font-mono break-all text-gray-700">
                  https://worthifyme.in/api/cast-actions/weave-story
                </p>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Copy this URL and add it manually in Warpcast Settings → Cast Actions
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}