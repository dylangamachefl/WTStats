// src/app/(main)/deep-dives/[slug]/page.tsx
import { notFound } from 'next/navigation';
import { MDXRemote } from 'next-mdx-remote/rsc';
import NextImage, { ImageProps as NextImagePropsTypeOnly } from 'next/image';
import { getDeepDiveBySlug, getDeepDiveSlugs } from '@/lib/deep-dives';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Trophy, Shield, Goal, Star } from "lucide-react";
import { Metadata } from 'next';

// --- DATA IMPORT & TYPE DEFINITION ---
// Import the JSON data. Next.js will handle this.
import allDecadeTeamData from '@/data/deep-dives/data_all_decade_team.json';

// Define the type for a single player in the All-Decade team roster.
// You could also move this to a separate types file (e.g., src/types/deep-dives.ts) and import it.
interface AllDecadeTeamPlayer {
  Position: string;
  player_name: string;
  season_id: number;
  total_fantasy_points: number;
  owner_name: string;
}


// --- HELPER COMPONENTS ---

const positionIcons: { [key: string]: React.ReactNode } = {
  QB: <Star className="h-5 w-5 text-yellow-500" />,
  RB: <Trophy className="h-5 w-5 text-orange-500" />,
  WR: <Trophy className="h-5 w-5 text-green-500" />,
  TE: <Trophy className="h-5 w-5 text-blue-500" />,
  'FLEX (RB/WR)': <Trophy className="h-5 w-5 text-purple-500" />,
  K: <Goal className="h-5 w-5 text-gray-500" />,
  DST: <Shield className="h-5 w-5 text-indigo-500" />,
};

// The custom component to render the roster. Now it uses the specific type.
const AllDecadeTeamRoster = ({ data }: { data: AllDecadeTeamPlayer[] }) => {
  return (
    <div className="my-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 not-prose">
      {data.map((player, index) => (
        <div key={index} className="bg-card border rounded-lg p-4 shadow-md flex flex-col justify-between transition-transform hover:scale-105">
          <div>
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-bold text-primary flex items-center gap-2">
                {positionIcons[player.Position] || <Star />} {/* Note: player.Position, not player_position */}
                {player.Position}
              </span>
              <span className="text-xs px-2 py-1 bg-secondary rounded-full font-semibold">{player.season_id}</span>
            </div>
            <h3 className="text-xl font-bold truncate">{player.player_name}</h3>
            <p className="text-sm text-muted-foreground">
              Owned by: <span className="font-semibold">{player.owner_name}</span>
            </p>
          </div>
          <div className="mt-4 pt-4 border-t border-dashed">
            <p className="text-3xl font-black text-right text-primary">
              {player.total_fantasy_points}
              <span className="text-base font-normal text-muted-foreground ml-1">pts</span>
            </p>
          </div>
        </div>
      ))}
    </div>
  );
};


// --- NEXT.JS PAGE FUNCTIONS ---

export async function generateStaticParams() {
  const slugs = await getDeepDiveSlugs();
  return slugs.map((slug) => ({ slug }));
}

interface DeepDiveArticlePageProps {
  params: { slug: string };
}

export async function generateMetadata({ params }: DeepDiveArticlePageProps): Promise<Metadata> {
  // ... (this function remains the same)
  const { slug } = params;
  const deepDive = await getDeepDiveBySlug(slug);
  if (!deepDive || !deepDive.frontmatter) {
    return { title: 'Deep Dive Not Found' };
  }
  return {
    title: `${deepDive.frontmatter.title || 'Untitled Dive'} | WTStats`,
    description: deepDive.frontmatter.description || 'A deep dive into league stats.',
    authors: deepDive.frontmatter.author ? [{ name: deepDive.frontmatter.author }] : undefined,
  };
}


// --- MAIN PAGE COMPONENT ---

export default async function DeepDiveArticlePage({ params }: DeepDiveArticlePageProps) {
  const { slug } = params;
  const deepDiveData = await getDeepDiveBySlug(slug);

  if (!deepDiveData || !deepDiveData.content) {
    notFound();
  }
  const { frontmatter, content } = deepDiveData;

  const components = {
    // Enhanced Image component (same as before)
    Image: (props: Omit<NextImagePropsTypeOnly, 'alt'> & { src: string; alt?: string; caption?: string }) => {
      const { src, alt, caption, width, height, ...rest } = props;
      const imageSrc = typeof src === 'string' && !src.startsWith('/')
          ? `/images/deep-dives/${slug}/${src}`
          : src;
      return (
        <figure>
          <NextImage
            {...rest}
            src={imageSrc as string}
            alt={alt || ""}
            width={typeof width === 'string' ? parseInt(width) : width || 700}
            height={typeof height === 'string' ? parseInt(height) : height || 450}
            unoptimized={true}
            className="rounded-lg shadow-md"
          />
          {caption && (
            <figcaption className="mt-2 text-center text-sm italic text-muted-foreground">
              {caption}
            </figcaption>
          )}
        </figure>
      );
    },
    Callout: ({ children, type = 'info' }: { children: React.ReactNode, type?: 'info' | 'warning' | 'conclusion' }) => {
      // ... (same as before)
      const baseClasses = "my-6 p-4 border-l-4 rounded-r-lg not-prose";
      const typeClasses = {
        info: "bg-blue-50 border-blue-500 text-blue-800 dark:bg-blue-900/30 dark:border-blue-400 dark:text-blue-200",
        warning: "bg-yellow-50 border-yellow-500 text-yellow-800 dark:bg-yellow-900/30 dark:border-yellow-400 dark:text-yellow-200",
        conclusion: "bg-green-50 border-green-500 text-green-800 dark:bg-green-900/30 dark:border-green-400 dark:text-green-200",
      };
      return <div className={`${baseClasses} ${typeClasses[type]}`}>{children}</div>;
    },
    SectionBreak: () => <hr className="my-10 border-dashed border-border" />,
    ul: (props: any) => <ul className="space-y-2" {...props} />,
    h2: (props: any) => <h2 className="text-3xl font-bold mt-12 mb-4 border-b pb-2" {...props} />,
    h3: (props: any) => <h3 className="text-2xl font-semibold mt-8 mb-3" {...props} />,

    // Add the new AllDecadeTeamRoster component here
    AllDecadeTeamRoster: () => <AllDecadeTeamRoster data={allDecadeTeamData} />,
  };

  return (
    <div className="container mx-auto py-8">
      <div className="mb-6">
        <Button asChild variant="outline">
          <Link href="/deep-dives">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Deep Dives
          </Link>
        </Button>
      </div>
      <Card>
        <CardHeader>
          <CardTitle className="text-4xl font-bold mb-2">{frontmatter.title || 'Untitled Dive'}</CardTitle>
          <p className="text-gray-500 text-lg">
            {frontmatter.date ? new Date(frontmatter.date).toLocaleDateString() : 'Date N/A'} by {frontmatter.author || 'N/A'}
          </p>
        </CardHeader>
        <CardContent className="prose dark:prose-invert max-w-none">
          <MDXRemote source={content} components={components} />
        </CardContent>
      </Card>
    </div>
  );
}