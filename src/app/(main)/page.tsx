// src/app/(main)/page.tsx
"use client";

import { Suspense, useEffect, useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import dynamic from 'next/dynamic';

const ComponentLoader = () => <div className="mt-6"><Skeleton className="h-96 w-full" /></div>;

const AllSeasonsOverview = dynamic(() => import('@/components/league-history/AllSeasonsOverview'), { loading: () => <ComponentLoader />, ssr: false });
const SeasonDetail = dynamic(() => import('@/components/league-history/SeasonDetail'), { loading: () => <ComponentLoader />, ssr: false });
const GMCareer = dynamic(() => import('@/components/league-history/GMCareer'), { loading: () => <ComponentLoader />, ssr: false });

function LeagueHistoryContent({ activeTab }: { activeTab: string }) {
  return (
    <Suspense fallback={<ComponentLoader />}>
      <TabsContent value="all-seasons" className="mt-6">{activeTab === 'all-seasons' && <AllSeasonsOverview />}</TabsContent>
      <TabsContent value="season-detail" className="mt-6">{activeTab === 'season-detail' && <SeasonDetail />}</TabsContent>
      <TabsContent value="gm-career" className="mt-6">{activeTab === 'gm-career' && <GMCareer />}</TabsContent>
    </Suspense>
  );
}

export default function LeagueHistoryPage() {
  const getInitialTab = () => {
    if (typeof window !== 'undefined') {
      const hash = window.location.hash.substring(1);
      return hash || 'all-seasons';
    }
    return 'all-seasons';
  };

  const [activeTab, setActiveTab] = useState(getInitialTab);

  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.substring(1);
      setActiveTab(hash || 'all-seasons');
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('hashchange', handleHashChange);
    }

    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('hashchange', handleHashChange);
      }
    };
  }, []);

  const handleTabChange = (value: string) => {
    setActiveTab(value);
    if (typeof window !== 'undefined') {
      window.location.hash = value;
    }
  };

  return (
    <div className="space-y-6">
      <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="all-seasons">Overview</TabsTrigger>
          <TabsTrigger value="season-detail">Season View</TabsTrigger>
          <TabsTrigger value="gm-career">GM View</TabsTrigger>
        </TabsList>
        <LeagueHistoryContent activeTab={activeTab} />
      </Tabs>
    </div>
  );
}