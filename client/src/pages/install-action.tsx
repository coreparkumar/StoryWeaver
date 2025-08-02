import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ExternalLink, Wand2 } from "lucide-react";

export default function InstallAction() {
  // Correct Warpcast installation URL format
  const installUrl = "https://warpcast.com/~/add-cast-action?actionType=post&name=Weave+My+Part&icon=wand&postUrl=https://worthifyme.in/api/cast-actions/weave-story";
  
  const handleInstall = () => {
    // Open Warpcast installation in new window
    window.open(installUrl, '_blank');
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
              <li>4. Start using "Weave My Part" on any cast!</li>
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
              <li>1. Find an interesting cast in your Warpcast feed</li>
              <li>2. Click the "Weave My Part" action button</li>
              <li>3. The cast becomes a collaborative story seed</li>
              <li>4. Share and invite others to contribute!</li>
            </ol>
          </div>
          
          <Button 
            onClick={handleInstall}
            className="w-full bg-purple-600 hover:bg-purple-700"
            size="lg"
          >
            <ExternalLink className="w-4 h-4 mr-2" />
            Install "Weave My Part" Action
          </Button>
          
          <div className="text-center space-y-3">
            <p className="text-xs text-gray-500">
              This will open Warpcast to install the action
            </p>
            <p className="text-xs text-gray-400">
              Make sure you're logged into Warpcast for installation to work
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