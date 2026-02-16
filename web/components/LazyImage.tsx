"use client";

import { useState, useEffect, useRef, ImgHTMLAttributes, memo } from "react";

interface LazyImageProps extends Omit<ImgHTMLAttributes<HTMLImageElement>, "src"> {
  src: string;
  alt: string;
  fallback?: string;
  className?: string;
}

const LazyImage = memo(function LazyImage({ src, alt, fallback, className, ...props }: LazyImageProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    // IntersectionObserver로 뷰포트에 들어오면 이미지 로드 시작
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            observer.disconnect();
          }
        });
      },
      { rootMargin: "500px" } // 큰 마진으로 미리 로드
    );

    if (imgRef.current) {
      observer.observe(imgRef.current);
    }

    return () => observer.disconnect();
  }, []);

  const handleLoad = () => {
    setIsLoaded(true);
  };

  const handleError = () => {
    setHasError(true);
  };

  // 이미지 소스가 없으면 스켈레톤만 표시
  const finalSrc = src || fallback;
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
        <div className="absolute inset-0 bg-gray-200 animate-pulse z-10" />
      )}
      {hasError && fallback && fallback !== src && (
        <img
          src={fallback}
          alt={alt}
          className={`${className || ""}`}
          {...props}
        />
      )}
      {!hasError && (
        <img
          ref={imgRef}
          src={finalSrc}
          alt={alt}
          onLoad={handleLoad}
          onError={handleError}
          className={`transition-opacity duration-200 ${
            isLoaded ? "opacity-100 z-20 relative" : "opacity-0 absolute"
          } ${className || ""}`}
          loading="eager"
          decoding="async"
          {...props}
        />
      )}
    </div>
  );
});

export { LazyImage };
