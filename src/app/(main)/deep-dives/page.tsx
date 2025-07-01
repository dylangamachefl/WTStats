// src/app/(main)/deep-dives/page.tsx
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { FileText } from "lucide-react";
import Link from 'next/link';
import { getAllDeepDives } from '@/lib/deep-dives';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Deep Dives | WTStats',
  description: 'In-depth articles and analyses of league trends, strategies, and memorable moments.',
};

export default async function DeepDivesPage() {
  const deepDives = await getAllDeepDives();

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><FileText /> Deep Dives</CardTitle>
          <CardDescription>In-depth articles and analyses of league trends, strategies, and memorable moments.</CardDescription>
        </CardHeader>
        <CardContent>
          {deepDives && deepDives.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {deepDives.map((deepDive) => {
                if (!deepDive || !deepDive.frontmatter || !deepDive.slug) {
                  console.warn("Skipping deep dive with missing data:", deepDive);
                  return null;
                }
                return (
                  // --- START OF THE FIX ---
                  // 1. Add legacyBehavior to the Link
                  <Link href={`/deep-dives/${deepDive.slug}`} key={deepDive.slug} legacyBehavior>
                    {/* 2. Wrap the Card in an anchor tag. Add styling to remove default link underline. */}
                    <a className="no-underline text-current block h-full">
                      <Card className="h-full hover:shadow-lg transition-shadow duration-300 flex flex-col">
                        <CardHeader>
                          <CardTitle>{deepDive.frontmatter.title || 'Untitled Dive'}</CardTitle>
                          {deepDive.frontmatter.date && deepDive.frontmatter.author && (
                            <CardDescription>
                              {new Date(deepDive.frontmatter.date).toLocaleDateString()} by {deepDive.frontmatter.author}
                            </CardDescription>
                          )}
                        </CardHeader>
                        <CardContent className="flex-grow">
                          <p>{deepDive.frontmatter.description || 'Read more...'}</p>
                        </CardContent>
                      </Card>
                    </a>
                  </Link>
                  // --- END OF THE FIX ---
                );
              })}
            </div>
          ) : (
            <div className="text-center py-12">
              <FileText className="mx-auto h-24 w-24 text-muted-foreground mb-4" />
              <h2 className="text-2xl font-semibold mb-2">No Deep Dives Yet!</h2>
              <p className="text-muted-foreground max-w-md mx-auto">
                This section will feature detailed articles and statistical explorations.
                Check back soon for new content.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}