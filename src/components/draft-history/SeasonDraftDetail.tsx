// src/components/draft-history/SeasonDraftDetail.tsx
"use client";

import { useState, useEffect, useMemo } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import type { Season, DraftPickDetail, SeasonDraftDetailJson, TeamDraftPerformanceEntry } from '@/lib/types';
import { ArrowUpCircle, ArrowDownCircle } from 'lucide-react';
import { cn, getPositionBadgeClass } from "@/lib/utils";
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { fetcher } from '@/lib/fetcher';

// --- MOCK DATA & HELPERS ---
const mockSeasons: Season[] = [
  { id: "2024", year: 2024 },{ id: "2023", year: 2023 }, { id: "2022", year: 2022 }, { id: "2021", year: 2021 }, { id: "2020", year: 2020 }, { id: "2019", year: 2019 }, { id: "2018", year: 2018 }, { id: "2017", year: 2017 }, { id: "2016", year: 2016 }, { id: "2015", year: 2015 }, { id: "2014", year: 2014 }, { id: "2013", year: 2013 }, { id: "2012", year: 2012 }, { id: "2011", year: 2011 }, { id: "2009", year: 2009 }
].sort((a, b) => b.year - a.year);

const getPVDRECellStyle = (pvdre: number | null | undefined, minPvdre: number, maxPvdre: number): string => {
    if (pvdre == null) return 'bg-muted/30 text-muted-foreground';
    const base = "font-semibold ";
    const range = maxPvdre - minPvdre;
    if (range === 0) return base + 'bg-neutral-100 text-neutral-700';
    const normalized = (pvdre - minPvdre) / range;
    if (normalized >= 0.45 && normalized <= 0.55) return base + 'bg-neutral-100 text-neutral-700';
    if (normalized < 0.45) {
        const intensity = Math.min(1, (0.45 - normalized) / 0.45);
        if (intensity > 0.66) return base + 'bg-red-300 text-red-800';
        if (intensity > 0.33) return base + 'bg-red-200 text-red-800';
        return base + 'bg-red-100 text-red-700';
    } else {
        const intensity = Math.min(1, (normalized - 0.55) / (1 - 0.55));
        if (intensity > 0.66) return base + 'bg-green-300 text-green-800';
        if (intensity > 0.33) return base + 'bg-green-200 text-green-800';
        return base + 'bg-green-100 text-green-700';
    }
};

const getReachStealCellStyle = (reachStealValue: number | null | undefined): string => {
    if (reachStealValue == null) return 'bg-muted/30 text-muted-foreground';
    const base = "font-semibold ";
    const threshold = 0.1;
    if (reachStealValue > threshold) {
        if (reachStealValue > 10) return base + 'bg-green-300 text-green-800';
        if (reachStealValue > 5) return base + 'bg-green-200 text-green-800';
        return base + 'bg-green-100 text-green-700';
    } else if (reachStealValue < -threshold) {
        if (reachStealValue < -10) return base + 'bg-red-300 text-red-800';
        if (reachStealValue < -5) return base + 'bg-red-200 text-red-800';
        return base + 'bg-red-100 text-red-700';
    }
    return base + 'bg-neutral-100 text-neutral-700';
};

// --- MAIN COMPONENT ---
export default function SeasonDraftDetail() {
  const [selectedSeason, setSelectedSeason] = useState<string | undefined>(mockSeasons[0]?.id);
  const [draftData, setDraftData] = useState<DraftPickDetail[] | null>(null);
  const [teamDraftPerformance, setTeamDraftPerformance] = useState<TeamDraftPerformanceEntry[] | null>(null);
  const [topSteals, setTopSteals] = useState<DraftPickDetail[] | null>(null);
  const [topBusts, setTopBusts] = useState<DraftPickDetail[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [analysisMode, setAnalysisMode] = useState<'none' | 'value' | 'reachSteal'>('none');

  useEffect(() => {
    if (selectedSeason) {
      const fetchData = async () => {
        setLoading(true);
        setError(null);
        setDraftData(null); setTeamDraftPerformance(null); setTopSteals(null); setTopBusts(null);
        try {
          const filePath = `/data/draft_data/seasons/season_${selectedSeason}_draft_detail.json`;
          const jsonData: SeasonDraftDetailJson = await fetcher(filePath);
          if (typeof jsonData === 'object' && jsonData !== null && Array.isArray(jsonData.draft_board)) {
            setDraftData(jsonData.draft_board);
            setTeamDraftPerformance(jsonData.team_draft_performance_ranking || null);
            setTopSteals(jsonData.season_highlights?.top_steals_by_pvdre || null);
            setTopBusts(jsonData.season_highlights?.top_busts_by_pvdre || null);
          } else {
            throw new Error(`Data for season ${selectedSeason} is not in the expected format.`);
          }
        } catch (err) {
          setError(err instanceof Error ? `Error loading draft data: ${err.message}` : "An unknown error occurred.");
          setDraftData(null);
        } finally {
          setLoading(false);
        }
      };
      fetchData();
    }
  }, [selectedSeason]);

  const { draftBoardPicks, gmNamesForColumns, maxRound, numGms, minPVDRE, maxPVDRE } = useMemo(() => {
    if (!draftData) return { draftBoardPicks: {}, gmNamesForColumns: [], maxRound: 0, numGms: 0, minPVDRE: 0, maxPVDRE: 0 };
    const sortedPicks = [...draftData].sort((a, b) => a.pick_overall - b.pick_overall);
    const picksByOverall: { [overallPick: number]: DraftPickDetail } = {};
    let currentMinPVDRE = Infinity, currentMaxPVDRE = -Infinity;
    sortedPicks.forEach(pick => {
      picksByOverall[pick.pick_overall] = pick;
      if (pick.pvdre_points_vs_league_draft_rank_exp != null) {
        currentMinPVDRE = Math.min(currentMinPVDRE, pick.pvdre_points_vs_league_draft_rank_exp);
        currentMaxPVDRE = Math.max(currentMaxPVDRE, pick.pvdre_points_vs_league_draft_rank_exp);
      }
    });
    const gmMinOverallPick = new Map<string, number>();
    const gmNames = new Set<string>();
    let currentMaxRound = 0;
    sortedPicks.forEach(pick => {
      if (typeof pick.gm_name === 'string') {
        gmNames.add(pick.gm_name);
        if (pick.round > currentMaxRound) currentMaxRound = pick.round;
        if (!gmMinOverallPick.has(pick.gm_name) || pick.pick_overall < gmMinOverallPick.get(pick.gm_name)!) gmMinOverallPick.set(pick.gm_name, pick.pick_overall);
      }
    });
    const sortedGmNamesByDraftOrder = Array.from(gmNames).sort((a, b) => (gmMinOverallPick.get(a) ?? Infinity) - (gmMinOverallPick.get(b) ?? Infinity));
    return { draftBoardPicks: picksByOverall, gmNamesForColumns: sortedGmNamesByDraftOrder, maxRound: currentMaxRound, numGms: sortedGmNamesByDraftOrder.length, minPVDRE: currentMinPVDRE, maxPVDRE: currentMaxPVDRE };
  }, [draftData]);

  const renderDraftBoard = () => {
    if (loading) return <Skeleton className="h-[400px] w-full" />;
    if (error) return <p className="text-destructive text-center py-4">{error}</p>;
    if (!draftData || gmNamesForColumns.length === 0 || maxRound === 0) return <p className="text-muted-foreground text-center py-4">No draft data available for this season.</p>;
    return (
      <TooltipProvider>
        <div className="overflow-x-auto">
          <Table className="min-w-full border-separate border-spacing-0">
            <TableHeader><TableRow><TableHead className="sticky left-0 bg-card z-20 p-1.5 border text-xs text-center font-semibold rounded-tl-sm">Round</TableHead>{gmNamesForColumns.map((gmName, index) => (<TableHead key={gmName} className={cn("p-1.5 border text-xs text-center font-semibold whitespace-nowrap min-w-[120px]", index === gmNamesForColumns.length -1 && "rounded-tr-sm")}>{gmName}</TableHead>))}</TableRow></TableHeader>
            <TableBody>{Array.from({ length: maxRound }, (_, i) => i + 1).map(roundNum => (<TableRow key={roundNum}><TableCell className="sticky left-0 bg-card z-20 p-1.5 border text-xs text-center font-semibold rounded-l-sm">{roundNum}</TableCell>{gmNamesForColumns.map((_, gmIndex) => {
                const targetPickInRound = roundNum % 2 !== 0 ? gmIndex + 1 : numGms - gmIndex;
                const pick = draftBoardPicks[(roundNum - 1) * numGms + targetPickInRound];
                if (!pick) return <TableCell key={`${roundNum}-${gmIndex}-empty`} className="p-1.5 border bg-muted/20" style={{minWidth: '120px', height: '60px' }} />;
                let cellContent, cellClasses = `p-1.5 border text-xs align-middle h-[60px]`;
                if (analysisMode === 'none') {
                    cellContent = <><p className="font-semibold truncate w-full" title={pick.player_name}>{pick.player_name}</p><p className="text-muted-foreground text-xs">{pick.player_position} - {pick.nfl_team_id}</p></>;
                    cellClasses = cn(cellClasses, getPositionBadgeClass(pick.player_position));
                } else if (analysisMode === 'value') {
                    cellContent = <p className="font-semibold">{pick.pvdre_points_vs_league_draft_rank_exp?.toFixed(1) ?? 'N/A'}</p>;
                    cellClasses = cn(cellClasses, getPVDRECellStyle(pick.pvdre_points_vs_league_draft_rank_exp, minPVDRE, maxPVDRE));
                } else {
                    cellContent = <p className="font-semibold">{pick.overall_reach_steal_value?.toFixed(1) ?? 'N/A'}</p>;
                    cellClasses = cn(cellClasses, getReachStealCellStyle(pick.overall_reach_steal_value));
                }
                return (<TableCell key={pick.player_id || `${roundNum}-${gmIndex}`} className={cellClasses} style={{minWidth: '120px', height: '60px'}}><Tooltip delayDuration={100}><TooltipTrigger asChild><div className="flex flex-col items-center justify-center h-full w-full">{cellContent}</div></TooltipTrigger><TooltipContent><div className="space-y-1.5 text-left text-xs"><p className="font-bold text-sm">{pick.player_name}</p><p>Picked By: {pick.gm_name}</p><p>Pick: {pick.pick_overall}</p>{/* ...more details... */}</div></TooltipContent></Tooltip></TableCell>);
            })}</TableRow>))}</TableBody>
          </Table>
        </div>
      </TooltipProvider>
    );
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader><CardTitle>Season Draft View</CardTitle><CardDescription>Select a season to view its draft board and analysis.</CardDescription></CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
            <Select value={selectedSeason} onValueChange={setSelectedSeason}><SelectTrigger className="w-full sm:w-[280px]"><SelectValue placeholder="Select a season's draft" /></SelectTrigger><SelectContent>{mockSeasons.map(season => (<SelectItem key={season.id} value={season.id}>{season.year} Draft</SelectItem>))}</SelectContent></Select>
            <div className="flex items-center space-x-4 mt-4 sm:mt-0"><div className="flex items-center space-x-2"><Switch id="value-analysis" checked={analysisMode === 'value'} onCheckedChange={(c) => setAnalysisMode(c ? 'value' : 'none')} /><Label htmlFor="value-analysis">Value Analysis</Label></div><div className="flex items-center space-x-2"><Switch id="reach-steal" checked={analysisMode === 'reachSteal'} onCheckedChange={(c) => setAnalysisMode(c ? 'reachSteal' : 'none')}/><Label htmlFor="reach-steal">Reach/Steal</Label></div></div>
          </div>
          {selectedSeason && (<Card><CardHeader><CardTitle>{selectedSeason} Draft Board</CardTitle><CardDescription>Interactive draft board. Hover for details.</CardDescription></CardHeader><CardContent>{renderDraftBoard()}</CardContent></Card>)}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
              <Card><CardHeader><CardTitle>Team Draft Performance</CardTitle></CardHeader><CardContent>
                {loading ? <Skeleton className="h-24 w-full" /> : error ? <p>Error</p> : teamDraftPerformance?.length > 0 ? (<Table><TableHeader><TableRow><TableHead>GM</TableHead><TableHead className="text-right">Avg POE</TableHead><TableHead className="text-right">Hit Rate</TableHead></TableRow></TableHeader><TableBody>{teamDraftPerformance.sort((a,b) => (b.avg_pvdre_per_pick ?? -Infinity) - (a.avg_pvdre_per_pick ?? -Infinity)).map((perf, index) => (<TableRow key={index}><TableCell><p>{perf.gm_name}</p></TableCell><TableCell className="text-right font-semibold">{perf.avg_pvdre_per_pick?.toFixed(2) ?? 'N/A'}</TableCell><TableCell className="text-right">{perf.hit_rate_percentage?.toFixed(1) ?? 'N/A'}%</TableCell></TableRow>))}</TableBody></Table>) : (<p>No performance data.</p>)}
              </CardContent></Card>
              <Card><CardHeader><CardTitle>Season's Top Steals & Busts</CardTitle></CardHeader><CardContent>
                {loading ? <Skeleton className="h-48 w-full" /> : error ? <p>Error</p> : (topSteals || topBusts) ? (<div className="space-y-6"><div><h4 className="font-semibold mb-2 flex items-center"><ArrowUpCircle className="text-green-500 mr-2" /> Top Steals</h4>{topSteals?.length > 0 ? (<Table><TableHeader><TableRow><TableHead>Player</TableHead><TableHead className="text-right">POE</TableHead></TableRow></TableHeader><TableBody>{topSteals.slice(0, 5).map((p, i) => (<TableRow key={`steal-${i}`}><TableCell><p>{p.player_name}</p><p className="text-xs text-muted-foreground">by {p.gm_name} (Pick {p.pick_overall})</p></TableCell><TableCell className="text-right text-green-600 font-semibold">{p.pvdre_points_vs_league_draft_rank_exp?.toFixed(1)}</TableCell></TableRow>))}</TableBody></Table>) : <p>No data.</p>}</div><div><h4 className="font-semibold mb-2 flex items-center"><ArrowDownCircle className="text-red-500 mr-2" /> Top Busts</h4>{topBusts?.length > 0 ? (<Table><TableHeader><TableRow><TableHead>Player</TableHead><TableHead className="text-right">POE</TableHead></TableRow></TableHeader><TableBody>{topBusts.slice(0, 5).map((p, i) => (<TableRow key={`bust-${i}`}><TableCell><p>{p.player_name}</p><p className="text-xs text-muted-foreground">by {p.gm_name} (Pick {p.pick_overall})</p></TableCell><TableCell className="text-right text-red-600 font-semibold">{p.pvdre_points_vs_league_draft_rank_exp?.toFixed(1)}</TableCell></TableRow>))}</TableBody></Table>) : <p>No data.</p>}</div></div>) : <p>No data.</p>}
              </CardContent></Card>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};