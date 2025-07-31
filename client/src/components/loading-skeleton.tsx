import { Card } from "@/components/ui/card";

export function StoryCardSkeleton() {
  return (
    <Card className="p-6 animate-pulse">
      <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
      <div className="space-y-2 mb-4">
        <div className="h-3 bg-gray-200 rounded"></div>
        <div className="h-3 bg-gray-200 rounded w-5/6"></div>
        <div className="h-3 bg-gray-200 rounded w-4/6"></div>
      </div>
      <div className="flex items-center justify-between">
        <div className="flex space-x-2">
          <div className="w-6 h-6 bg-gray-200 rounded-full"></div>
          <div className="w-6 h-6 bg-gray-200 rounded-full"></div>
          <div className="w-6 h-6 bg-gray-200 rounded-full"></div>
        </div>
        <div className="h-8 bg-gray-200 rounded w-16"></div>
      </div>
    </Card>
  );
}

export function StoryDetailSkeleton() {
  return (
    <div className="animate-pulse">
      <div className="h-8 bg-gray-200 rounded w-1/2 mb-6"></div>
      <div className="space-y-4 mb-8">
        <div className="h-4 bg-gray-200 rounded"></div>
        <div className="h-4 bg-gray-200 rounded w-5/6"></div>
        <div className="h-4 bg-gray-200 rounded w-4/6"></div>
      </div>
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="p-4">
            <div className="flex items-start space-x-3">
              <div className="w-10 h-10 bg-gray-200 rounded-full"></div>
              <div className="flex-1">
                <div className="h-3 bg-gray-200 rounded w-1/4 mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-full"></div>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}