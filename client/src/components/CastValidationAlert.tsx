/**
 * Cast Validation Alert Component
 * 
 * Displays warnings and status messages for deleted or invalid Farcaster seed casts
 */

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, XCircle, CheckCircle, HelpCircle } from "lucide-react";

interface CastStatus {
  exists: boolean;
  status: "active" | "deleted" | "error";
  message: string;
}

interface CastValidationAlertProps {
  castStatus: CastStatus;
  castHash?: string;
  className?: string;
}

export function CastValidationAlert({ castStatus, castHash, className = "" }: CastValidationAlertProps) {
  const getIcon = () => {
    switch (castStatus.status) {
      case "active":
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case "deleted":
        return <AlertTriangle className="w-4 h-4 text-amber-600" />;
      case "error":
        return <XCircle className="w-4 h-4 text-red-600" />;
      default:
        return <HelpCircle className="w-4 h-4 text-gray-600" />;
    }
  };

  const getBadgeVariant = () => {
    switch (castStatus.status) {
      case "active":
        return "default";
      case "deleted":
        return "destructive";
      case "error":
        return "secondary";
      default:
        return "outline";
    }
  };

  const getAlertVariant = () => {
    switch (castStatus.status) {
      case "deleted":
        return "destructive";
      default:
        return "default";
    }
  };

  // Don't show alert for active casts
  if (castStatus.status === "active") {
    return null;
  }

  return (
    <Alert variant={getAlertVariant()} className={`${className}`}>
      <div className="flex items-start gap-3">
        {getIcon()}
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-sm font-medium">Seed Cast Status</span>
            <Badge variant={getBadgeVariant()} className="text-xs">
              {castStatus.status.toUpperCase()}
            </Badge>
          </div>
          <AlertDescription className="text-sm">
            {castStatus.message}
            {castHash && castStatus.status === "deleted" && (
              <div className="mt-2 text-xs text-muted-foreground">
                <strong>Impact:</strong> The story remains accessible and collaborative, but the original 
                Farcaster context is no longer available. New users may find it harder to understand 
                the story's origins.
              </div>
            )}
            {castStatus.status === "error" && (
              <div className="mt-2 text-xs text-muted-foreground">
                <strong>Note:</strong> Unable to verify cast status due to API limitations. 
                The cast may still be active.
              </div>
            )}
          </AlertDescription>
        </div>
      </div>
    </Alert>
  );
}

export default CastValidationAlert;