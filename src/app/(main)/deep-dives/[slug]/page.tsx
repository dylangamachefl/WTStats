import { notFound } from 'next/navigation';
import { MDXRemote } from 'next-mdx-remote/rsc';
import Image from 'next/image';
import { getDeepDiveBySlug, getDeepDiveSlugs } from '@/lib/deep-dives';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export async function generateStaticParams() {
  const slugs = getDeepDiveSlugs();
  return slugs.map((slug) => ({ slug }));
}

interface DeepDiveArticlePageProps {
  params: {
    slug: string;
  };
}

export default async function DeepDiveArticlePage({ params }: DeepDiveArticlePageProps) {
  const { slug } = params;
  const deepDive = getDeepDiveBySlug(slug);

  if (!deepDive) {
    notFound();
  }

  const { frontmatter, content } = deepDive;

  return (
    <div className="container mx-auto py-8">
      <Card>
        <CardHeader>
          <CardTitle className="text-4xl font-bold mb-2">{frontmatter.title}</CardTitle>
          <p className="text-gray-500 text-lg">
            {new Date(frontmatter.date).toLocaleDateString()} by {frontmatter.author}
          </p>
        </CardHeader>
        <CardContent className="prose dark:prose-invert max-w-none">
          <MDXRemote source={content} components={{ Image }} />
        </CardContent>
      </Card>
    </div>
  );
}
