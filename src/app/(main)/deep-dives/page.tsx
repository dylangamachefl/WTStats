
"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { FileText } from "lucide-react";
import type { ReactNode } from "react";
import { Suspense } from "react";

// Wrapper client component
function DeepDivesContentWrapper({ children }: { children: ReactNode }) {
  return <>{children}</>;
}

export default function DeepDivesPage() {
  // Simple fallback for the suspense boundary
  const LoadingFallback = () => (
    <div className="text-center py-12">
      <p>Loading Deep Dives...</p>
    </div>
  );

  return (
    // Wrap the main content with Suspense
    <DeepDivesContentWrapper> {/* This wrapper is already a client component */}
      <Suspense fallback={<LoadingFallback />}>
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><FileText /> Deep Dives</CardTitle>
              <CardDescription>In-depth articles and analyses of league trends, strategies, and memorable moments.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12">
                <FileText className="mx-auto h-24 w-24 text-muted-foreground mb-4" />
                <h2 className="text-2xl font-semibold mb-2">Coming Soon!</h2>
                <p className="text-muted-foreground max-w-md mx-auto">
                  This section will feature detailed articles and statistical explorations.
                  Future content will be rendered from Markdown. For now, enjoy the rest of the platform!
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </Suspense>
    </DeepDivesContentWrapper>
  );
}
