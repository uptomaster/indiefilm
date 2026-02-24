"use client";

import { ReactNode } from "react";

interface IndiePageWrapperProps {
  children: ReactNode;
  title?: string;
  subtitle?: string;
  sectionNum?: string;
}

export function IndiePageWrapper({ children, title, subtitle, sectionNum }: IndiePageWrapperProps) {
  return (
    <div className="min-h-screen bg-[#0a0805] text-[#f0e8d8]">
      {title && (
        <div className="border-b border-[#5a5248]/20 bg-[#100e0a]">
          <div className="container mx-auto px-5 md:px-10 py-12 md:py-16">
            <div className="flex items-baseline gap-5">
              {sectionNum && (
                <div className="font-display text-[60px] md:text-[80px] leading-none text-[#1a1510] [-webkit-text-stroke:1px_var(--indie-gray)]">
                  {sectionNum}
                </div>
              )}
              <div>
                <h1 className="font-serif text-2xl md:text-3xl lg:text-4xl font-light text-[#faf6f0]">{title}</h1>
                {subtitle && (
                  <div className="text-sm md:text-base font-medium tracking-[0.15em] text-[#5a5248] uppercase mt-1">{subtitle}</div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
      <div className="container mx-auto px-5 md:px-10 py-8 md:py-12">
        {children}
      </div>
    </div>
  );
}
