import { useEffect } from 'react';
import { useFarcaster } from '../hooks/use-farcaster';
import { apiRequest } from '../lib/queryClient';
import { useToast } from '../hooks/use-toast';

interface CastShareHandlerProps {
  onCastComment?: (commentData: any) => void;
}

export function CastShareHandler({ onCastComment }: CastShareHandlerProps) {
  const { user, sdk } = useFarcaster();
  const { toast } = useToast();

  useEffect(() => {
    if (!sdk) return;

    // Handle cast sharing context when user shares a cast to the mini app
    const handleCastContext = async () => {
      try {
        const context = await sdk.context;
        
        if (context.cast) {
          const { hash: castHash, text, author } = context.cast;
          
          // Extract story ID from cast text or URL parameters
          const storyIdMatch = text.match(/story\/([a-f0-9-]+)/);
          const storyId = storyIdMatch?.[1] || new URLSearchParams(window.location.search).get('storyId');
          
          if (storyId && user) {
            // Create cast comment for collaborative storytelling
            const commentData = {
              storyId,
              commentCastHash: castHash,
              authorFid: author.fid,
              content: text
            };

            const response = await fetch(`/api/stories/${storyId}/cast-comment`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(commentData)
            });

            toast({
              title: "Story Contribution Received",
              description: "Your cast comment has been submitted for review by the story creator."
            });

            onCastComment?.(commentData);
          }
        }
      } catch (error) {
        console.warn('Error handling cast context:', error);
      }
    };

    handleCastContext();
  }, [sdk, user, onCastComment, toast]);

  return null; // This is a handler component, no UI
}