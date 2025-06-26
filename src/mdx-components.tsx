// mdx-components.tsx (place this in your project root or src/)
import type { MDXComponents } from 'mdx/types';
import Image, { ImageProps } from 'next/image'; // For handling Next.js Image

// This file allows you to provide custom React components
// to be used in MDX files, or to customize an HTML element.
export function useMDXComponents(components: MDXComponents): MDXComponents {
  return {
    // Allows customizing built-in components, e.g. to add styling.
    // h1: ({ children }) => <h1 style={{ fontSize: "100px" }}>{children}</h1>,

    // Pass through Next.js Image component if you want to use <Image /> in MDX
    // without importing it in every MDX file.
    // Ensure your MDX uses <Image> not <img> if you map it like this.
    // Or map the standard 'img' tag to NextImage:
    img: (props) => {
      // You might need to adjust props here based on how they come from MDX
      // For example, MDX might pass `src` and `alt` but not `width` and `height`
      // which NextImage requires.
      // This example assumes you'll provide width/height in the MDX or it has defaults.
      const { src, alt } = props as { src: string; alt: string };
      return (
        <Image
          src={src}
          alt={alt || ""}
          width={700} // Default width, adjust or make dynamic
          height={450} // Default height, adjust or make dynamic
          unoptimized={true} // From your next.config.js
          layout="responsive" // Or your preferred layout
          {...props} // Pass other props through
        />
      );
    },
    ...components, // Spread any components passed from individual page/layout
  };
}