"use client";

import { useState, useEffect, useRef, ImgHTMLAttributes, memo } from "react";

interface LazyImageProps extends Omit<ImgHTMLAttributes<HTMLImageElement>, "src"> {
  src: string;
  alt: string;
  fallback?: string;
  className?: string;
}

const LazyImage = memo(function LazyImage({ src, alt, fallback, className, ...props }: LazyImageProps) {
  const [imageSrc, setImageSrc] = useState<string>(fallback || "");
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setImageSrc(src);
            observer.disconnect();
          }
        });
      },
      { rootMargin: "200px" }
    );

    if (imgRef.current) {
      observer.observe(imgRef.current);
    }

    return () => observer.disconnect();
  }, [src]);

  const handleLoad = () => {
    setIsLoaded(true);
  };

  const handleError = () => {
    setHasError(true);
    if (fallback) {
      setImageSrc(fallback);
    }
  };

  // 이미지 소스가 없으면 렌더링하지 않음
  const finalSrc = imageSrc || fallback;
  if (!finalSrc) {
    return (
      <div className={`relative overflow-hidden ${className || ""}`}>
        <div className="absolute inset-0 bg-gray-200 animate-pulse" />
      </div>
    );
  }

  return (
    <div className={`relative overflow-hidden ${className || ""}`}>
      {!isLoaded && !hasError && (
        <div className="absolute inset-0 bg-gray-200 animate-pulse" />
      )}
      <img
        ref={imgRef}
        src={finalSrc}
        alt={alt}
        onLoad={handleLoad}
        onError={handleError}
        className={`transition-opacity duration-300 ${
          isLoaded ? "opacity-100" : "opacity-0"
        } ${className || ""}`}
        loading="lazy"
        decoding="async"
        {...props}
      />
    </div>
  );
});

export { LazyImage };
