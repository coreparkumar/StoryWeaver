import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users } from "lucide-react";
import { cn } from "@/lib/utils";
import type { User } from "@shared/schema";

interface ContributorsListProps {
  contributors: User[];
}

export default function ContributorsList({ contributors }: ContributorsListProps) {
  // Get contribution count for each contributor (mock for now)
  const getContributionCount = (user: User) => {
    // In a real app, this would come from the API
    if (user.username === "sarahm") return 1;
    if (user.username === "techwriter99") return 1;
    if (user.username === "mysticalcoder") return 1;
    return 1;
  };

  const getColorClass = (index: number) => {
    const colors = ["fc-purple", "fc-blue", "fc-emerald", "fc-amber"];
    return colors[index % colors.length];
  };

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Story Contributors</h3>
        <Badge variant="secondary" className="bg-fc-purple bg-opacity-10 text-fc-purple">
          <Users className="w-3 h-3 mr-1" />
          {contributors.length} writers
        </Badge>
      </div>

      {/* Contributors Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {contributors.map((contributor, index) => {
          const colorClass = getColorClass(index);
          const contributionCount = getContributionCount(contributor);
          const isCreator = index === contributors.length - 1; // Assuming creator is last in sample data
          
          return (
            <div 
              key={contributor.id} 
              className="flex items-center space-x-3 p-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors"
            >
              <img 
                src={contributor.pfpUrl || `https://images.unsplash.com/photo-150700321116${index}?ixlib=rb-4.0.3&auto=format&fit=crop&w=150&h=150`} 
                alt="Contributor Avatar" 
                className={cn(
                  "w-10 h-10 rounded-full",
                  isCreator && "border-2 border-fc-purple"
                )}
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-center space-x-2">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {contributor.displayName}
                  </p>
                  {isCreator && (
                    <Badge variant="secondary" className="bg-fc-purple text-white text-xs">
                      Creator
                    </Badge>
                  )}
                </div>
                <p className="text-xs text-gray-500">@{contributor.username || "worthify"}</p>
              </div>
              <div className={cn(
                "text-xs font-medium",
                `text-${colorClass}`
              )}>
                <span>{contributionCount}</span> {contributionCount === 1 ? "part" : "parts"}
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}
