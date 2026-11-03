import { useState } from 'react';

export const FALLBACK_COVER = '/book-cover-fallback.svg';

export default function CoverImage({ src, alt, className, ...props }) {
  const [hasError, setHasError] = useState(false);

  return (
    <img
      {...props}
      src={hasError || !src ? FALLBACK_COVER : src}
      alt={alt}
      className={className}
      onError={() => setHasError(true)}
    />
  );
}
