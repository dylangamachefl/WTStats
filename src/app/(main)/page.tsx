// src/app/(main)/league-history/page.tsx
"use client";

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import dynamic from 'next/dynamic';

// A generic loader component to show while the main components are loading
const ComponentLoader = () => (
    <div className="mt-6">
        <Skeleton className="h-96 w-full" />
    </div>
);

// Dynamically import your newly created, self-contained components.
// ssr: false is a crucial hint for static exports, as it prevents hydration mismatches.
const AllSeasonsOverview = dynamic(() => import('@/components/league-history/AllSeasonsOverview'), { 
  loading: () => <ComponentLoader />,
  ssr: false
});
const SeasonDetail = dynamic(() => import('@/components/league-history/SeasonDetail'), { 
  loading: () => <ComponentLoader />,
  ssr: false
});
const GMCareer = dynamic(() => import('@/components/league-history/GMCareer'), { 
  loading: () => <ComponentLoader />,
  ssr: false
});

export default function LeagueHistoryPage() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  
  // The state of the active tab is now derived directly and only from the URL search parameter.
  const activeTab = searchParams.get('section') || 'all-seasons';

  // This function handles tab changes. It updates the URL, which in turn
  // causes the component to re-render with the correct active tab.
  const handleTabChange = (value: string) => {
    const newUrl = `${pathname}?section=${value}`;
    // We use router.push to update the URL without a full page reload.
    router.push(newUrl, { scroll: false }); 
  };

  return (
    <div className="space-y-6">
      <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="all-seasons">All Seasons</TabsTrigger>
          <TabsTrigger value="season-detail">Season Detail</TabsTrigger>
          <TabsTrigger value="gm-career">GM Career</TabsTrigger>
        </TabsList>
      </Tabs>
      
      {/* 
        We use Suspense here to gracefully handle the loading of our dynamic components.
        The correct component is conditionally rendered based on the activeTab state from the URL.
      */}
      <Suspense fallback={<ComponentLoader />}>
        {activeTab === 'all-seasons' && <AllSeasonsOverview />}
        {activeTab === 'season-detail' && <SeasonDetail />}
        {activeTab === 'gm-career' && <GMCareer />}
      </Suspense>
    </div>
  );
}