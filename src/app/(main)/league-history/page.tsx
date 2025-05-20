// src/app/(main)/league-history/page.tsx
"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

// This page is deprecated as League History is now the main page (/).
// It redirects to the main page if accessed directly.
export default function DeprecatedLeagueHistoryPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/');
  }, [router]);

  // Render nothing or a loading indicator while redirecting
  return null; 
}
