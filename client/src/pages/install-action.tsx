import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ExternalLink, Wand2 } from "lucide-react";

export default function InstallAction() {
  const installUrl = "https://worthifyme.in/api/cast-actions";
  
  const handleInstall = () => {
    // Open the installation URL in the same window
    window.open(installUrl, '_self');
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
          <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
            <h3 className="font-semibold text-purple-900 mb-2">What this action does:</h3>
            <ul className="text-sm text-purple-800 space-y-1">
              <li>• Appears as a button under every cast in Warpcast</li>
              <li>• Transforms interesting casts into collaborative story seeds</li>
              <li>• Creates viral story loops with cast sharing</li>
              <li>• Enables community-driven storytelling</li>
            </ul>
          </div>
          
          <Button 
            onClick={handleInstall}
            className="w-full bg-purple-600 hover:bg-purple-700"
            size="lg"
          >
            <ExternalLink className="w-4 h-4 mr-2" />
            Install "Weave My Part" Action
          </Button>
          
          <div className="text-center">
            <p className="text-xs text-gray-500">
              This will open Warpcast to install the action
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}