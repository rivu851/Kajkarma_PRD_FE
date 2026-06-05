"use client";

import Image from "next/image";
import { useState } from "react";
import { cn } from "@/lib/utils";

interface LogoMarkProps {
  className?: string;
  size?: number;
}

function LogoMarkSvg({ className, size = 44 }: LogoMarkProps) {
  return (
    <svg
      viewBox="0 0 120 120"
      width={size}
      height={size}
      aria-hidden
      className={cn("shrink-0", className)}
    >
      <defs>
        <linearGradient id="kajkarma-k-light" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#C084FC" />
          <stop offset="55%" stopColor="#A855F7" />
          <stop offset="100%" stopColor="#9333EA" />
        </linearGradient>
        <linearGradient id="kajkarma-k-dark" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#9333EA" />
          <stop offset="100%" stopColor="#581C87" />
        </linearGradient>
      </defs>
      <rect width="120" height="120" rx="18" fill="white" />
      <path
        d="M28 22h18c6 0 10 4 10 10v12c0 4-2 7-5 9l28 34c4 5 2 13-5 13H52c-4 0-7-2-9-5L28 66V22z"
        fill="url(#kajkarma-k-light)"
      />
      <path
        d="M46 44l34 42c3 4 1 10-4 10H58L38 66l8-22z"
        fill="url(#kajkarma-k-dark)"
      />
      <path
        d="M72 78l18 14c4 3 2 10-4 10H72c-3 0-5-2-6-4l-8-10 14-10z"
        fill="#7E22CE"
      />
    </svg>
  );
}

export function LogoMark({ className, size = 44 }: LogoMarkProps) {
  const [useFallback, setUseFallback] = useState(false);

  if (useFallback) {
    return <LogoMarkSvg className={className} size={size} />;
  }

  return (
    <Image
      src="/logo.png"
      alt="KajKarma"
      width={size}
      height={size}
      className={cn("shrink-0 rounded-lg object-contain", className)}
      onError={() => setUseFallback(true)}
      priority
    />
  );
}
