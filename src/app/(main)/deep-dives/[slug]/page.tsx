// src/app/(main)/deep-dives/[slug]/page.tsx
import { notFound } from 'next/navigation';
import { MDXRemote } from 'next-mdx-remote/rsc'; // Correct import for RSC
import NextImage, { ImageProps as NextImagePropsTypeOnly } from 'next/image';
import { getDeepDiveBySlug, getDeepDiveSlugs } from '@/lib/deep-dives';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { Metadata } from 'next';
// You might need to import remark/rehype plugins here if you want to pass them to MDXRemote
// import remarkGfm from 'remark-gfm';

export async function generateStaticParams() {
  const slugs = await getDeepDiveSlugs();
  return slugs.map((slug) => ({ slug }));
}

interface DeepDiveArticlePageProps {
  params: { slug: string };
}

export async function generateMetadata({ params }: DeepDiveArticlePageProps): Promise<Metadata> {
  const { slug } = params;
  // getDeepDiveBySlug now returns { slug, frontmatter, content }
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

export default async function DeepDiveArticlePage({ params }: DeepDiveArticlePageProps) {
  const { slug } = params;
  const deepDiveData = await getDeepDiveBySlug(slug);

  if (!deepDiveData || !deepDiveData.content) { // Check for content specifically now
    notFound();
  }

  const { frontmatter, content } = deepDiveData; // 'content' is now the raw MDX string

  const components = {
    Image: (props: Omit<NextImagePropsTypeOnly, 'alt' | 'width' | 'height'> & { src: string; alt?: string; width?: number | `${number}` | undefined; height?: number | `${number}` | undefined }) => {
      const { src, alt, width, height, ...rest } = props;
      const imageSrc = typeof src === 'string' && !src.startsWith('/')
          ? `/images/deep-dives/${slug}/${src}`
          : src;
      const imageWidth = typeof width === 'string' ? parseInt(width) : width || 700;
      const imageHeight = typeof height === 'string' ? parseInt(height) : height || 450;
      const finalWidth = imageWidth > 0 ? imageWidth : 700;
      const finalHeight = imageHeight > 0 ? imageHeight : 450;
      return <NextImage {...rest} src={imageSrc as string} alt={alt || ""} width={finalWidth} height={finalHeight} unoptimized={true} />;
    },
  };

  // For debugging
  console.log(`--- [${slug}] Rendering Article Page ---`);
  console.log(`[${slug}] Frontmatter:`, JSON.stringify(frontmatter, null, 2));
  console.log(`[${slug}] Raw MDX Content (first 100 chars):`, content?.substring(0, 100));

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
          <MDXRemote
            source={content} // Pass the raw MDX string here
            components={components}
            options={{ // If you need to pass remark/rehype plugins
              mdxOptions: {
                // remarkPlugins: [remarkGfm],
                // rehypePlugins: [],
              }
            }}
          />
        </CardContent>
      </Card>
    </div>
  );
}