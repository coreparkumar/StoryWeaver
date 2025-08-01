import { useState } from 'react';
import { Button } from './ui/button';
import { Textarea } from './ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { useFarcaster } from '../hooks/use-farcaster';
import { apiRequest } from '../lib/queryClient';
import { useToast } from '../hooks/use-toast';
import { Share, Loader2 } from 'lucide-react';

interface CastCreatorProps {
  storyId: string;
  storyTitle: string;
  currentContent: string;
  onCastCreated?: (castHash: string) => void;
}

export function CastCreator({ storyId, storyTitle, currentContent, onCastCreated }: CastCreatorProps) {
  const [isCreating, setIsCreating] = useState(false);
  const [customMessage, setCustomMessage] = useState('');
  const { user, sdk } = useFarcaster();
  const { toast } = useToast();

  const createWeaveCast = async () => {
    if (!sdk || !user) return;

    setIsCreating(true);
    try {
      // Create cast content with story update
      const castText = customMessage || 
        `📚 "${storyTitle}" - Latest Story Weave\n\n${currentContent.slice(0, 200)}${currentContent.length > 200 ? '...' : ''}\n\n✨ Add your part to the story!`;

      // Create cast via Warpcast compose URL
      const embedUrl = `${window.location.origin}?storyId=${storyId}`;
      const warpcastUrl = `https://warpcast.com/~/compose?text=${encodeURIComponent(castText)}&embeds[]=${encodeURIComponent(embedUrl)}`;
      
      window.open(warpcastUrl, '_blank');
      
      // Simulate cast creation for demo purposes
      const castResult = { hash: `cast-${Date.now()}` };

      if (castResult.hash) {
        // Update story with new weave cast hash
        const response = await fetch(`/api/stories/${storyId}/weave-cast`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            castHash: castResult.hash,
            userFid: user.fid
          })
        });

        toast({
          title: "Story Cast Created",
          description: "Your updated story has been shared to Farcaster!"
        });

        onCastCreated?.(castResult.hash);
        setCustomMessage('');
      }
    } catch (error) {
      console.error('Error creating weave cast:', error);
      toast({
        title: "Cast Creation Failed",
        description: "Unable to create cast. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsCreating(false);
    }
  };

  if (!user) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Share className="h-5 w-5" />
          Share Story Update
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Textarea
          placeholder="Add a custom message for your story cast (optional)"
          value={customMessage}
          onChange={(e) => setCustomMessage(e.target.value)}
          className="min-h-[100px]"
        />
        
        <div className="p-3 bg-muted rounded-lg">
          <p className="text-sm text-muted-foreground mb-2">Preview:</p>
          <p className="text-sm">
            {customMessage || `📚 "${storyTitle}" - Latest Story Weave`}
          </p>
          <p className="text-xs text-muted-foreground mt-2">
            Story link will be automatically included
          </p>
        </div>

        <Button 
          onClick={createWeaveCast}
          disabled={isCreating}
          className="w-full"
        >
          {isCreating ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Creating Cast...
            </>
          ) : (
            <>
              <Share className="h-4 w-4 mr-2" />
              Share Story Update
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
}