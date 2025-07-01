// src/app/(main)/league-history/page.tsx
"use client";

import { Suspense } from 'react';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import dynamic from 'next/dynamic';

const ComponentLoader = () => <div className="mt-6"><Skeleton className="h-96 w-full" /></div>;

const AllSeasonsOverview = dynamic(() => import('@/components/league-history/AllSeasonsOverview'), { loading: () => <ComponentLoader />, ssr: false });
const SeasonDetail = dynamic(() => import('@/components/league-history/SeasonDetail'), { loading: () => <ComponentLoader />, ssr: false });
const GMCareer = dynamic(() => import('@/components/league-history/GMCareer'), { loading: () => <ComponentLoader />, ssr: false });

function LeagueHistoryContent() {
  const searchParams = useSearchParams();
  const activeTab = searchParams.get('section') || 'all-seasons';

  return (
    <Suspense fallback={<ComponentLoader />}>
      <TabsContent value="all-seasons" className="mt-6">{activeTab === 'all-seasons' && <AllSeasonsOverview />}</TabsContent>
      <TabsContent value="season-detail" className="mt-6">{activeTab === 'season-detail' && <SeasonDetail />}</TabsContent>
      <TabsContent value="gm-career" className="mt-6">{activeTab === 'gm-career' && <GMCareer />}</TabsContent>
    </Suspense>
  );
}

export default function LeagueHistoryPage() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const activeTab = searchParams.get('section') || 'all-seasons';

  const handleTabChange = (value: string) => {
    const params = new URLSearchParams(window.location.search);
    params.set('section', value);
    router.push(`${pathname}?${params.toString()}`, { scroll: false });
  };

  return (
    <div className="space-y-6">
      <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="all-seasons">Overview</TabsTrigger>
          <TabsTrigger value="season-detail">Season View</TabsTrigger>
          <TabsTrigger value="gm-career">GM View</TabsTrigger>
        </TabsList>
        <LeagueHistoryContent />
      </Tabs>
    </div>
  );
}