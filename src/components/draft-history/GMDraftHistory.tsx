// src/components/draft-history/GMDraftHistory.tsx
"use client";

import { useState, useEffect, useMemo } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import type { GM, GMDraftHistoryDetailData, DraftPickDetail } from '@/lib/types';
import { UserCircle2, ArrowUpCircle, ArrowDownCircle, TrendingUp, TrendingDown } from 'lucide-react';
import { cn, getPositionBadgeClass, getPositionIcon } from "@/lib/utils";
import { Badge } from '@/components/ui/badge';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend as RechartsLegend, Cell as RechartsCell } from 'recharts';
import { fetcher } from '@/lib/fetcher';

// --- MOCK DATA ---
const mockGms: GM[] = [
  { id: "1", name: "Jack" }, { id: "2", name: "Josh" }, { id: "3", name: "Jake" }, { id: "4", name: "Mark" }, { id: "5", name: "Sean" }, { id: "6", name: "Nick" }, { id: "7", name: "Will" }, { id: "8", name: "Zach" }, { id: "9", name: "Lac" }, { id: "11", name: "Chris" }, { id: "12", name: "Dylan" }, { id: "13", name: "Dan" }, { id: "14", name: "Fitz" }
];

const formatPositionalRank = (position?: string, rank?: number | null) => {
  if (!position || rank == null) return '-';
  return `${position}${rank}`;
};


const PicksTable = ({ picks, title, icon }: { picks: DraftPickDetail[], title: string, icon: React.ReactNode }) => {
    if (!picks || picks.length === 0) {
        return <Card><CardHeader><CardTitle className="text-lg flex items-center">{icon} {title}</CardTitle></CardHeader><CardContent><p>No data.</p></CardContent></Card>;
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle className="text-lg flex items-center">{icon} {title}</CardTitle>
            </CardHeader>
            <CardContent className="overflow-x-auto">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Player (Team)</TableHead>
                            <TableHead className="text-center">Season</TableHead>
                            <TableHead className="text-center">Pick (Overall)</TableHead>
                            <TableHead className="text-center">Drafted (Pos)</TableHead>
                            <TableHead className="text-center">Finished (Pos)</TableHead>
                            <TableHead className="text-right">POE</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {picks.slice(0, 5).map(p => (
                            <TableRow key={p.player_id}>
                                <TableCell>
                                    <p className="font-medium">{p.player_name}</p>
                                    <p className="text-xs text-muted-foreground">({p.nfl_team_id})</p>
                                </TableCell>
                                <TableCell className="text-center">{p.season_id}</TableCell>
                                <TableCell className="text-center">{p.pick_overall}</TableCell>
                                <TableCell className="text-center">
                                    <Badge variant="outline" className={cn(getPositionBadgeClass(p.player_position))}>
                                        {formatPositionalRank(p.player_position, p.league_positional_draft_rank)}
                                    </Badge>
                                </TableCell>
                                <TableCell className="text-center">
                                    <Badge variant="outline" className={cn(getPositionBadgeClass(p.player_position))}>
                                        {formatPositionalRank(p.player_position, p.actual_positional_finish_rank)}
                                    </Badge>
                                </TableCell>
                                <TableCell className={cn("text-right font-semibold", (p.pvdre_points_vs_league_draft_rank_exp ?? 0) >= 0 ? 'text-green-600' : 'text-red-600')}>
                                    {p.pvdre_points_vs_league_draft_rank_exp?.toFixed(1)}
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    );
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
                    <div className="flex flex-col items-center text-center p-3 rounded-md bg-muted/50 shadow-sm"><p className="text-xs uppercase text-muted-foreground font-medium">Total Picks Made</p><p className="text-2xl font-bold">{gmDraftData.career_summary.total_picks_made}</p></div>
                    <div className="flex flex-col items-center text-center p-3 rounded-md bg-muted/50 shadow-sm"><p className="text-xs uppercase text-muted-foreground font-medium">Total Hits</p><p className="text-2xl font-bold">{gmDraftData.career_summary.total_hits}</p></div>
                    <div className="flex flex-col items-center text-center p-3 rounded-md bg-muted/50 shadow-sm"><p className="text-xs uppercase text-muted-foreground font-medium">Total Misses</p><p className="text-2xl font-bold">{gmDraftData.career_summary.total_misses}</p></div>
                    <div className="flex flex-col items-center text-center p-3 rounded-md bg-muted/50 shadow-sm"><p className="text-xs uppercase text-muted-foreground font-medium">Career Hit Rate</p><p className="text-2xl font-bold">{(gmDraftData.career_summary.career_hit_rate_percentage).toFixed(1)}%</p></div>
                    <div className="flex flex-col items-center text-center p-3 rounded-md bg-muted/50 shadow-sm"><p className="text-xs uppercase text-muted-foreground font-medium">Sum Total POE</p><p className="text-2xl font-bold">{gmDraftData.career_summary.sum_total_pvdre.toFixed(2)}</p></div>
                    <div className="flex flex-col items-center text-center p-3 rounded-md bg-muted/50 shadow-sm"><p className="text-xs uppercase text-muted-foreground font-medium">Avg. POE / Pick</p><p className="text-2xl font-bold">{gmDraftData.career_summary.average_pvdre_per_pick.toFixed(2)}</p></div>
                </div>
              <Card><CardHeader><CardTitle className="text-lg">Round Efficiency (Avg. POE)</CardTitle></CardHeader><CardContent className="h-[300px]"><ResponsiveContainer width="100%" height="100%">
                <BarChart data={roundEfficiencyChartData}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="name" /><YAxis /><RechartsTooltip formatter={(v: number) => v.toFixed(1)}/><Bar dataKey="Avg POE">{roundEfficiencyChartData.map((e, i) => (<RechartsCell key={`cell-${i}`} fill={e['Avg POE'] >= 0 ? 'hsl(var(--chart-2))' : 'hsl(var(--destructive))'} />))}</Bar></BarChart>
              </ResponsiveContainer></CardContent></Card>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <PicksTable picks={gmDraftData.best_picks} title="Best Picks (by POE)" icon={<ArrowUpCircle className="text-green-500 mr-2" />} />
                <PicksTable picks={gmDraftData.worst_picks} title="Worst Picks (by POE)" icon={<ArrowDownCircle className="text-red-500 mr-2" />} />
              </div>
              <Card>
                <CardHeader>
                    <CardTitle className="text-lg">Positional Performance Analysis</CardTitle>
                    <CardDescription>Comparing GM draft value vs. league averages by position.</CardDescription>
                </CardHeader>
                <CardContent>
                    {gmDraftData.positional_profile?.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {gmDraftData.positional_profile.map((profile) => {
                                const isOutperforming = typeof profile.gm_average_pvdre === 'number' && typeof profile.league_average_pvdre === 'number' && profile.gm_average_pvdre > profile.league_average_pvdre;
                                const isUnderperforming = typeof profile.gm_average_pvdre === 'number' && typeof profile.league_average_pvdre === 'number' && profile.gm_average_pvdre < profile.league_average_pvdre;
                                const borderColor = isOutperforming ? 'border-green-500' : isUnderperforming ? 'border-red-500' : 'border-border';
                                return (
                                    <Card key={profile.position} className={cn("shadow-sm border-2", borderColor)}>
                                        <CardHeader className="flex flex-row items-center justify-between p-4 pb-2">
                                            <div className="flex items-center gap-2">
                                                {getPositionIcon(profile.position)}
                                                <CardTitle className="text-base font-medium">{profile.position}</CardTitle>
                                            </div>
                                            <p className="text-xs text-muted-foreground">Picks: {profile.picks_count}</p>
                                        </CardHeader>
                                        <CardContent className="p-4 pt-0 space-y-1">
                                            <div className="flex justify-between text-sm"><span className="text-muted-foreground">GM Avg POE:</span><span className={cn("font-semibold", profile.gm_average_pvdre < 0 ? 'text-red-600' : 'text-green-600')}>{profile.gm_average_pvdre?.toFixed(1)}</span></div>
                                            <div className="flex justify-between text-sm"><span className="text-muted-foreground">League Avg POE:</span><span className={cn("font-semibold", (profile.league_average_pvdre ?? 0) < 0 ? 'text-red-600' : 'text-green-600')}>{profile.league_average_pvdre?.toFixed(1)}</span></div>
                                            {profile.gm_total_pvdre != null && <div className="flex justify-between text-sm"><span className="text-muted-foreground">GM Total POE:</span><span className={cn("font-semibold", profile.gm_total_pvdre < 0 ? 'text-red-600' : 'text-green-600')}>{profile.gm_total_pvdre?.toFixed(1)}</span></div>}
                                        </CardContent>
                                        <CardFooter className="p-4 pt-0">
                                            {isOutperforming && <p className="text-xs text-green-600 flex items-center gap-1"><TrendingUp size={14} /> Outperforming League Avg</p>}
                                            {isUnderperforming && <p className="text-xs text-red-600 flex items-center gap-1"><TrendingDown size={14} /> Underperforming League Avg</p>}
                                        </CardFooter>
                                    </Card>
                                );
                            })}
                        </div>
                    ) : (<p className="text-muted-foreground text-center py-4">Positional performance data not available.</p>)}
                </CardContent>
              </Card>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
