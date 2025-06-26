// src/lib/deep-dives.ts
import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';

const deepDivesDirectory = path.join(process.cwd(), 'public', 'data', 'deep-dives');

interface DeepDiveListItem {
  slug: string;
  frontmatter: {
    title?: string; // Make properties optional if they might be missing
    date?: string;
    author?: string;
    description?: string;
    [key: string]: any; // Allow other frontmatter properties
  };
}

export async function getDeepDiveSlugs(): Promise<string[]> {
  try {
    if (!fs.existsSync(deepDivesDirectory)) {
      console.warn(`Deep dives directory not found: ${deepDivesDirectory}`);
      return [];
    }
    const fileNames = fs.readdirSync(deepDivesDirectory);
    return fileNames
      .filter(fileName => fileName.endsWith('.mdx'))
      .map(fileName => fileName.replace(/\.mdx$/, ''));
  } catch (error) {
    console.error("Error reading deep dive slugs:", error);
    return [];
  }
}

export async function getAllDeepDives(): Promise<DeepDiveListItem[]> {
  const slugs = await getDeepDiveSlugs();

  if (!slugs || slugs.length === 0) {
    return [];
  }

  const allDeepDivesData = slugs.map((slug): DeepDiveListItem | null => { // Add return type for map callback
    const fullPath = path.join(deepDivesDirectory, `${slug}.mdx`);
    if (!fs.existsSync(fullPath)) {
      console.warn(`File not found for slug ${slug} in getAllDeepDives: ${fullPath}`);
      return null;
    }
    try {
      const fileContents = fs.readFileSync(fullPath, 'utf8');
      const { data: frontmatter } = matter(fileContents);
      return {
        slug,
        frontmatter, // frontmatter will be { [key: string]: any } from gray-matter
      };
    } catch (error) {
      console.error(`Error reading or parsing frontmatter for slug ${slug}:`, error);
      return null;
    }
  }).filter((dive): dive is DeepDiveListItem => dive !== null); // Type guard for filter

  // Sort them here
  allDeepDivesData.sort((a, b) => {
    const dateAString = a.frontmatter?.date;
    const dateBString = b.frontmatter?.date;

    // Ensure dates are valid strings before creating Date objects
    const timeA = dateAString ? new Date(dateAString).getTime() : 0;
    const timeB = dateBString ? new Date(dateBString).getTime() : 0;

    // Handle NaN getTime() results if dates are invalid
    const validTimeA = isNaN(timeA) ? 0 : timeA;
    const validTimeB = isNaN(timeB) ? 0 : timeB;

    return validTimeB - validTimeA; // Sort descending by date
  });

  return allDeepDivesData;
}

// ... getDeepDiveBySlug function (ensure it also handles potentially missing frontmatter fields gracefully) ...
export async function getDeepDiveBySlug(slug: string) {
  const fullPath = path.join(deepDivesDirectory, `${slug}.mdx`);
  if (!fs.existsSync(fullPath)) {
    console.warn(`File not found for slug ${slug}: ${fullPath}`);
    return null;
  }
  try {
    const fileContents = fs.readFileSync(fullPath, 'utf8');
    const { data: frontmatter, content } = matter(fileContents);

    // No need to serialize here if page component passes raw content to MDXRemote from /rsc
    return {
      slug,
      frontmatter,
      content,
    };
  } catch (error) {
    console.error(`Error processing MDX file for slug ${slug}:`, error);
    return null;
  }
}