// src/app/(main)/draft-history/page.tsx
"use client";

import { Suspense } from 'react';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import dynamic from 'next/dynamic';

const ComponentLoader = () => <div className="mt-6"><Skeleton className="h-96 w-full" /></div>;

// Update these import paths if your draft components are in a different folder
const DraftOverview = dynamic(() => import('@/components/draft-history/DraftOverview'), { loading: () => <ComponentLoader />, ssr: false });
const SeasonDraftDetail = dynamic(() => import('@/components/draft-history/SeasonDraftDetail'), { loading: () => <ComponentLoader />, ssr: false });
const GMDraftHistory = dynamic(() => import('@/components/draft-history/GMDraftHistory'), { loading: () => <ComponentLoader />, ssr: false });

function DraftHistoryContent() {
  const searchParams = useSearchParams();
  const activeTab = searchParams.get('section') || 'overview';

  return (
    <Suspense fallback={<ComponentLoader />}>
      <TabsContent value="overview" className="mt-6">{activeTab === 'overview' && <DraftOverview />}</TabsContent>
      <TabsContent value="season-view" className="mt-6">{activeTab === 'season-view' && <SeasonDraftDetail />}</TabsContent>
      <TabsContent value="gm-view" className="mt-6">{activeTab === 'gm-view' && <GMDraftHistory />}</TabsContent>
    </Suspense>
  );
}

export default function DraftHistoryPage() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const activeTab = searchParams.get('section') || 'overview';

  const handleTabChange = (value: string) => {
    const params = new URLSearchParams(window.location.search);
    params.set('section', value);
    router.push(`${pathname}?${params.toString()}`, { scroll: false });
  };

  return (
    <div className="space-y-6">
      <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="season-view">Season View</TabsTrigger>
          <TabsTrigger value="gm-view">GM View</TabsTrigger>
        </TabsList>
        <DraftHistoryContent />
      </Tabs>
    </div>
  );
}