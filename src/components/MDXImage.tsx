'use client';

import React from 'react';

const basePath = process.env.NODE_ENV === 'production' ? '/your-repo-name' : '';

interface MDXImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {}

const MDXImage: React.FC<MDXImageProps> = ({ src = '', alt = '', ...rest }) => {
  const resolvedSrc = src.startsWith('/') ? `${basePath}${src}` : src;

  return (
    <img
      {...rest}
      src={resolvedSrc}
      alt={alt}
      className="rounded-md shadow-md max-w-full h-auto"
    />
  );
};

export default MDXImage;
