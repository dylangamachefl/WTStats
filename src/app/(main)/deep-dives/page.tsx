import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { FileText } from "lucide-react";
import Link from 'next/link';
import { getAllDeepDives } from '@/lib/deep-dives';

export default async function DeepDivesPage() {
  const deepDives = getAllDeepDives();

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><FileText /> Deep Dives</CardTitle>
          <CardDescription>In-depth articles and analyses of league trends, strategies, and memorable moments.</CardDescription>
        </CardHeader>
        <CardContent>
          {
            deepDives.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {deepDives.map((deepDive) => (
                  <Link href={`/deep-dives/${deepDive.slug}`} key={deepDive.slug} className="block">
                    <Card className="h-full hover:shadow-lg transition-shadow duration-300">
                      <CardHeader>
                        <CardTitle>{deepDive.frontmatter.title}</CardTitle>
                        <CardDescription>
                          {new Date(deepDive.frontmatter.date).toLocaleDateString()} by {deepDive.frontmatter.author}
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <p>{deepDive.frontmatter.description}</p>
                      </CardContent>
                    </Card>
                  </Link>
                ))}
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
            )
          }
        </CardContent>
      </Card>
    </div>
  );
}
