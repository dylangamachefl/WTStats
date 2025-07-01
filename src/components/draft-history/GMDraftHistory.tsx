// src/components/draft-history/GMDraftHistory.tsx
"use client";

import { useState, useEffect, useMemo } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import type { GM, GMDraftHistoryDetailData, GMDraftHistoryRoundEfficiencyEntry } from '@/lib/types';
import { UserCircle2, ArrowUpCircle, ArrowDownCircle } from 'lucide-react';
import { cn, getPositionBadgeClass, getPositionIcon } from "@/lib/utils";
import { Badge } from '@/components/ui/badge';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend as RechartsLegend, Cell as RechartsCell } from 'recharts';
import { fetcher } from '@/lib/fetcher';

// --- MOCK DATA ---
const mockGms: GM[] = [
  { id: "1", name: "Jack" }, { id: "2", name: "Josh" }, { id: "3", name: "Jake" }, { id: "4", name: "Mark" }, { id: "5", name: "Sean" }, { id: "6", name: "Nick" }, { id: "7", name: "Will" }, { id: "8", name: "Zach" }, { id: "9", name: "Lac" }, { id: "11", name: "Chris" }, { id: "12", name: "Dylan" }, { id: "13", name: "Dan" }, { id: "14", name: "Fitz" }
];

// Helper to format PVDRE values
const formatPvdreValue = (value: number | null | undefined): string => {
  if (value == null) return 'N/A';
  return (value >= 0 ? '+' : '') + value.toFixed(1);
};

// --- MAIN COMPONENT ---
export default function GMDraftHistory() {
  const [selectedGmId, setSelectedGmId] = useState<string | undefined>(mockGms[0]?.id);
  const [gmDraftData, setGmDraftData] = useState<GMDraftHistoryDetailData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (selectedGmId) {
      const fetchData = async () => {
        setLoading(true);
        setError(null);
        setGmDraftData(null);
        try {
          const gmInfo = mockGms.find(g => g.id === selectedGmId);
          if (!gmInfo) throw new Error("Selected GM not found in mock data.");
          
          const filePath = `/data/draft_data/gm/gm_${selectedGmId}_draft_history.json`;
          const data: GMDraftHistoryDetailData = await fetcher(filePath);
          
          if (data.gm_name !== gmInfo.name && data.gm_id?.toString() !== selectedGmId) {
            console.warn(`[GMDraftHistory] Mismatch between selected GM (${gmInfo.name}) and fetched data (${data.gm_name}).`);
          }
          setGmDraftData(data);
        } catch (err) {
          setError(err instanceof Error ? err.message : "An unknown error occurred");
          setGmDraftData(null);
        } finally {
          setLoading(false);
        }
      };
      fetchData();
    }
  }, [selectedGmId]);

  const roundEfficiencyChartData = useMemo(() => {
    return gmDraftData?.round_efficiency.map(r => ({
      name: `R${r.round.toFixed(0)}`,
      'Avg POE': r.average_pvdre,
    })) || [];
  }, [gmDraftData?.round_efficiency]);

  if (loading) {
    return <div className="space-y-4"><Skeleton className="h-24 w-full" /><div className="grid grid-cols-1 md:grid-cols-2 gap-4"><Skeleton className="h-64 w-full" /><Skeleton className="h-64 w-full" /></div><Skeleton className="h-48 w-full" /></div>;
  }
  if (error) {
    return <Card><CardContent className="text-destructive text-center py-4">Error loading draft history data: {error}</CardContent></Card>;
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
          <div><CardTitle className="flex items-center gap-2"><UserCircle2 /> {gmDraftData?.gm_name || mockGms.find(g=>g.id===selectedGmId)?.name || 'GM'}'s Draft History</CardTitle></div>
          <Select value={selectedGmId} onValueChange={setSelectedGmId}><SelectTrigger className="w-full sm:w-[280px] mt-2 sm:mt-0"><SelectValue placeholder="Select a GM" /></SelectTrigger><SelectContent>{mockGms.map(gm => (<SelectItem key={gm.id} value={gm.id}>{gm.name}</SelectItem>))}</SelectContent></Select>
        </CardHeader>
        <CardContent>
          {!gmDraftData ? (<p className="text-muted-foreground text-center py-4">No draft history data found for this GM.</p>) : (
            <div className="space-y-6">
               <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 pt-6">
                    <div className="flex flex-col items-center text-center p-3 rounded-md bg-muted/50 shadow-sm"><p className="text-xs uppercase text-muted-foreground font-medium">Total Picks</p><p className="text-2xl font-bold">{gmDraftData.career_summary.total_picks_made}</p></div>
                    <div className="flex flex-col items-center text-center p-3 rounded-md bg-muted/50 shadow-sm"><p className="text-xs uppercase text-muted-foreground font-medium">Total Hits</p><p className="text-2xl font-bold">{gmDraftData.career_summary.total_hits}</p></div>
                    <div className="flex flex-col items-center text-center p-3 rounded-md bg-muted/50 shadow-sm"><p className="text-xs uppercase text-muted-foreground font-medium">Total Misses</p><p className="text-2xl font-bold">{gmDraftData.career_summary.total_misses}</p></div>
                    <div className="flex flex-col items-center text-center p-3 rounded-md bg-muted/50 shadow-sm"><p className="text-xs uppercase text-muted-foreground font-medium">Hit Rate</p><p className="text-2xl font-bold">{(gmDraftData.career_summary.career_hit_rate_percentage).toFixed(1)}%</p></div>
                    <div className="flex flex-col items-center text-center p-3 rounded-md bg-muted/50 shadow-sm"><p className="text-xs uppercase text-muted-foreground font-medium">Total POE</p><p className="text-2xl font-bold">{gmDraftData.career_summary.sum_total_pvdre.toFixed(2)}</p></div>
                    <div className="flex flex-col items-center text-center p-3 rounded-md bg-muted/50 shadow-sm"><p className="text-xs uppercase text-muted-foreground font-medium">Avg POE/Pick</p><p className="text-2xl font-bold">{gmDraftData.career_summary.average_pvdre_per_pick.toFixed(2)}</p></div>
                </div>
              <Card><CardHeader><CardTitle className="text-lg">Round Efficiency (Avg. POE)</CardTitle></CardHeader><CardContent className="h-[300px]"><ResponsiveContainer width="100%" height="100%">
                <BarChart data={roundEfficiencyChartData}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="name" /><YAxis /><RechartsTooltip formatter={(v: number) => v.toFixed(1)}/><Bar dataKey="Avg POE">{roundEfficiencyChartData.map((e, i) => (<RechartsCell key={`cell-${i}`} fill={e['Avg POE'] >= 0 ? 'hsl(var(--chart-2))' : 'hsl(var(--destructive))'} />))}</Bar></BarChart>
              </ResponsiveContainer></CardContent></Card>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card><CardHeader><CardTitle className="text-lg flex items-center"><ArrowUpCircle className="text-green-500 mr-2" />Best Picks</CardTitle></CardHeader><CardContent>
                  {gmDraftData.best_picks?.length > 0 ? <Table><TableHeader><TableRow><TableHead>Player</TableHead><TableHead className="text-center">Season</TableHead><TableHead className="text-right">POE</TableHead></TableRow></TableHeader><TableBody>{gmDraftData.best_picks.slice(0,5).map(p => (<TableRow key={p.player_id}><TableCell>{p.player_name}</TableCell><TableCell className="text-center">{p.season_id}</TableCell><TableCell className="text-right text-green-600 font-semibold">{p.pvdre_points_vs_league_draft_rank_exp?.toFixed(1)}</TableCell></TableRow>))}</TableBody></Table> : <p>No data.</p>}
                </CardContent></Card>
                <Card><CardHeader><CardTitle className="text-lg flex items-center"><ArrowDownCircle className="text-red-500 mr-2" />Worst Picks</CardTitle></CardHeader><CardContent>
                  {gmDraftData.worst_picks?.length > 0 ? <Table><TableHeader><TableRow><TableHead>Player</TableHead><TableHead className="text-center">Season</TableHead><TableHead className="text-right">POE</TableHead></TableRow></TableHeader><TableBody>{gmDraftData.worst_picks.slice(0,5).map(p => (<TableRow key={p.player_id}><TableCell>{p.player_name}</TableCell><TableCell className="text-center">{p.season_id}</TableCell><TableCell className="text-right text-red-600 font-semibold">{p.pvdre_points_vs_league_draft_rank_exp?.toFixed(1)}</TableCell></TableRow>))}</TableBody></Table> : <p>No data.</p>}
                </CardContent></Card>
              </div>
              <Card><CardHeader><CardTitle className="text-lg">Positional Performance</CardTitle><CardDescription>Comparing draft value vs. league averages.</CardDescription></CardHeader><CardContent>
                {gmDraftData.positional_profile?.length > 0 ? (<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">{gmDraftData.positional_profile.map((profile) => {
                    const isOutperforming = typeof profile.gm_average_pvdre === 'number' && typeof profile.league_average_pvdre === 'number' && profile.gm_average_pvdre > profile.league_average_pvdre;
                    const isUnderperforming = typeof profile.gm_average_pvdre === 'number' && typeof profile.league_average_pvdre === 'number' && profile.gm_average_pvdre < profile.league_average_pvdre;
                    const borderColor = isOutperforming ? 'border-green-500' : isUnderperforming ? 'border-red-500' : 'border-border';
                    return (<Card key={profile.position} className={cn("shadow-md border-2", borderColor)}><CardHeader className="flex-row items-center justify-between p-4 pb-2"><div className="flex items-center gap-2"><CardTitle className="text-base font-medium">{profile.position}</CardTitle></div><p className="text-xs text-muted-foreground">Picks: {profile.picks_count}</p></CardHeader><CardContent className="p-4 pt-0 space-y-1"><div className="flex justify-between text-sm"><span className="text-muted-foreground">GM Avg POE:</span><span className={cn("font-semibold", profile.gm_average_pvdre < 0 ? 'text-red-600' : 'text-green-600')}>{formatPvdreValue(profile.gm_average_pvdre)}</span></div><div className="flex justify-between text-sm"><span className="text-muted-foreground">League Avg POE:</span><span className={cn("font-semibold", profile.league_average_pvdre < 0 ? 'text-red-600' : 'text-green-600')}>{formatPvdreValue(profile.league_average_pvdre)}</span></div></CardContent></Card>);
                })}</div>) : (<p>No data.</p>)}
              </CardContent></Card>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};