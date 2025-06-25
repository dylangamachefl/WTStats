import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';

const deepDivesDirectory = path.join(process.cwd(), 'public/data/deep-dives');

export function getDeepDiveSlugs() {
  const fileNames = fs.readdirSync(deepDivesDirectory);
  return fileNames.map((fileName) => fileName.replace(/\.mdx$/, ''));
}

export function getDeepDiveBySlug(slug: string) {
  const fullPath = path.join(deepDivesDirectory, `${slug}.mdx`);
  const fileContents = fs.readFileSync(fullPath, 'utf8');
  const { data, content } = matter(fileContents);

  return {
    slug,
    frontmatter: data,
    content,
  };
}

export function getAllDeepDives() {
  const slugs = getDeepDiveSlugs();
  const deepDives = slugs.map((slug) => getDeepDiveBySlug(slug));
  // Sort deep dives by date in descending order
  return deepDives.sort((a, b) => {
    const dateA = new Date(a.frontmatter.date);
    const dateB = new Date(b.frontmatter.date);
    return dateB.getTime() - dateA.getTime();
  });
}
