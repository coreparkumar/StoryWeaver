import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Wand2, Users, Share, Zap } from "lucide-react";
import { Link } from "wouter";

export default function About() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-100 via-blue-50 to-indigo-100">
      <div className="max-w-4xl mx-auto p-6 space-y-8">
        <div className="text-center pt-12 pb-8">
          <div className="mx-auto w-20 h-20 bg-purple-100 rounded-full flex items-center justify-center mb-6">
            <Wand2 className="w-10 h-10 text-purple-600" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Story Weaver</h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Transform any cast into a collaborative storytelling experience where communities create dynamic narratives together
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-3">
                <Share className="w-6 h-6 text-blue-600" />
              </div>
              <CardTitle>Cast-Based Stories</CardTitle>
              <CardDescription>
                Use the "Weave My Part" action on any interesting cast to turn it into a collaborative story seed
              </CardDescription>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-3">
                <Users className="w-6 h-6 text-green-600" />
              </div>
              <CardTitle>Community Collaboration</CardTitle>
              <CardDescription>
                Like a story to unlock commenting privileges, then submit your creative contributions for the creator to review
              </CardDescription>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-3">
                <Wand2 className="w-6 h-6 text-purple-600" />
              </div>
              <CardTitle>Creator Control</CardTitle>
              <CardDescription>
                Story creators approve comments and incorporate the best ideas into the main narrative, maintaining quality
              </CardDescription>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center mb-3">
                <Zap className="w-6 h-6 text-orange-600" />
              </div>
              <CardTitle>Viral Sharing</CardTitle>
              <CardDescription>
                Approved contributions become part of the story and trigger new weaved casts, creating viral collaboration loops
              </CardDescription>
            </CardHeader>
          </Card>
        </div>

        <Card className="bg-gradient-to-r from-purple-50 to-blue-50 border-purple-200">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl text-purple-900">How It Works</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid md:grid-cols-3 gap-4 text-center">
              <div className="space-y-2">
                <div className="w-12 h-12 bg-purple-600 text-white rounded-full flex items-center justify-center mx-auto">
                  1
                </div>
                <h3 className="font-semibold text-purple-900">Find & Weave</h3>
                <p className="text-sm text-purple-700">
                  Use "Weave My Part" action on any cast to create a story seed
                </p>
              </div>
              <div className="space-y-2">
                <div className="w-12 h-12 bg-purple-600 text-white rounded-full flex items-center justify-center mx-auto">
                  2
                </div>
                <h3 className="font-semibold text-purple-900">Like & Contribute</h3>
                <p className="text-sm text-purple-700">
                  Like the story to unlock commenting, then add your creative ideas
                </p>
              </div>
              <div className="space-y-2">
                <div className="w-12 h-12 bg-purple-600 text-white rounded-full flex items-center justify-center mx-auto">
                  3
                </div>
                <h3 className="font-semibold text-purple-900">Collaborate & Share</h3>
                <p className="text-sm text-purple-700">
                  Creators approve the best contributions and share new weaved casts
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="text-center space-y-4">
          <Button asChild size="lg" className="bg-purple-600 hover:bg-purple-700">
            <Link href="/install-action">
              <Wand2 className="w-4 h-4 mr-2" />
              Install Cast Action
            </Link>
          </Button>
          <div>
            <Button asChild variant="outline" size="lg">
              <Link href="/">
                View Active Stories
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}