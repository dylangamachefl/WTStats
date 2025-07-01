// src/components/league-history/AllSeasonsOverview.tsx
"use client";

import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { fetcher } from '@/lib/fetcher';
import type { LeagueData, CareerStat, ChampionTimelineEntry, LeagueRecord, FinalStandingsHeatmapEntry, GMPlayoffPerformanceStat } from '@/lib/types';
import { ArrowUpDown, Zap, ArrowUp, ArrowDown, UserRound, TrendingUp, ShieldCheck, ShieldX, Flame, TrendingDown, Bomb, Scaling, ShieldAlert, Star, Repeat, Award, ArrowUpCircle, ArrowDownCircle } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Carousel, CarouselContent, CarouselItem, CarouselPrevious, CarouselNext } from "@/components/ui/carousel";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from '@/components/ui/badge';
import { ResponsiveContainer, BarChart as RechartsBarChartImport, Bar, CartesianGrid, XAxis, YAxis, Tooltip as RechartsTooltip, Legend as RechartsLegend } from 'recharts';

// --- Helper Functions and Constants ---
type SortDirection = 'asc' | 'desc';
interface SortConfig<T> { key: keyof T | null; direction: SortDirection; }
const recordDisplayOrder = ["Highest Score", "Lowest Score", "Most Points (Season)", "Fewest Points Against (Season)", "Most Points Against (Season)", "Longest Win Streak", "Longest Losing Streak", "Biggest Blowout", "Closest Win", "Worst Beat", "Highest Scoring Player (Week)", "Most Transactions (Season)"];

const getRecordIcon = (category: string): React.ReactNode => {
    const lowerCategory = category.toLowerCase();
    if (lowerCategory.includes("highest score")) return <ArrowUpCircle className="mr-2 h-5 w-5 text-primary" />;
    if (lowerCategory.includes("lowest score")) return <ArrowDownCircle className="mr-2 h-5 w-5 text-destructive" />;
    if (lowerCategory.includes("most points (season)")) return <TrendingUp className="mr-2 h-5 w-5 text-green-500" />;
    if (lowerCategory.includes("fewest points against (season)")) return <ShieldCheck className="mr-2 h-5 w-5 text-blue-500" />;
    if (lowerCategory.includes("most points against (season)")) return <ShieldX className="mr-2 h-5 w-5 text-orange-500" />;
    if (lowerCategory.includes("longest win streak")) return <Flame className="mr-2 h-5 w-5 text-yellow-500" />;
    if (lowerCategory.includes("longest losing streak")) return <TrendingDown className="mr-2 h-5 w-5 text-purple-500" />;
    if (lowerCategory.includes("biggest blowout")) return <Bomb className="mr-2 h-5 w-5 text-red-700" />;
    if (lowerCategory.includes("closest win")) return <Scaling className="mr-2 h-5 w-5 text-indigo-500" />;
    if (lowerCategory.includes("worst beat")) return <ShieldAlert className="mr-2 h-5 w-5 text-orange-600" />;
    if (lowerCategory.includes("highest scoring player (week)")) return <Star className="mr-2 h-5 w-5 text-yellow-400" />;
    if (lowerCategory.includes("most transactions (season)")) return <Repeat className="mr-2 h-5 w-5 text-teal-500" />;
    return <Award className="mr-2 h-5 w-5 text-muted-foreground" />;
};


export default function AllSeasonsOverview() {
  const [leagueData, setLeagueData] = useState<LeagueData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [heatmapYears, setHeatmapYears] = useState<string[]>([]);
  const [maxRankPerYear, setMaxRankPerYear] = useState<{ [year: string]: number }>({});

  const [careerSortConfig, setCareerSortConfig] = useState<SortConfig<CareerStat>>({ key: 'name', direction: 'asc' });
  const [playoffPerfSortConfig, setPlayoffPerfSortConfig] = useState<SortConfig<GMPlayoffPerformanceStat>>({ key: 'wins', direction: 'desc' });
  const [heatmapSortConfig, setHeatmapSortConfig] = useState<SortConfig<FinalStandingsHeatmapEntry>>({ key: 'gm_name', direction: 'asc' });

  useEffect(() => {
    const fetchLeagueData = async () => {
        setLoading(true);
        setError(null);
        try {
            const data: LeagueData = await fetcher('/data/league_data/league-data.json');
            const mappedCareerLeaderboard = (Array.isArray(data.careerLeaderboard) ? data.careerLeaderboard : []).map((stat: any) => ({
                ...stat,
                pointsFor: stat.pointsFor ?? stat.points ?? 0,
                pointsAgainst: stat.pointsAgainst ?? 0,
            }));
            const processedData: LeagueData = {
                ...data,
                careerLeaderboard: mappedCareerLeaderboard,
                championshipTimeline: Array.isArray(data.championshipTimeline) ? data.championshipTimeline : [],
                leagueRecords: Array.isArray(data.leagueRecords) ? data.leagueRecords : [],
                finalStandingsHeatmap: Array.isArray(data.finalStandingsHeatmap) ? data.finalStandingsHeatmap : [],
                playoffQualificationRate: Array.isArray(data.playoffQualificationRate) ? data.playoffQualificationRate : [],
                gmPlayoffPerformance: Array.isArray(data.gmPlayoffPerformance) ? data.gmPlayoffPerformance : [],
            };
            setLeagueData(processedData);
        } catch (err) {
            console.error("Failed to load or process league-data.json:", err);
            setError(err instanceof Error ? err.message : "An unknown error occurred.");
            setLeagueData(null);
        } finally {
            setLoading(false);
        }
    };
    fetchLeagueData();
  }, []);

  useEffect(() => {
    if (leagueData?.finalStandingsHeatmap && Array.isArray(leagueData.finalStandingsHeatmap)) {
      const years = new Set<string>();
      const currentMaxRanks: { [year: string]: number } = {};
      leagueData.finalStandingsHeatmap.forEach(gm => {
        if (typeof gm === 'object' && gm !== null && Object.keys(gm).length > 0) {
          Object.keys(gm).forEach(key => {
            if (key !== 'gm_name' && !isNaN(Number(key))) {
              years.add(key);
              const rank = gm[key] as number | null | undefined;
              if (typeof rank === 'number') {
                currentMaxRanks[key] = Math.max(currentMaxRanks[key] || 0, rank);
              }
            }
          });
        }
      });
      setHeatmapYears(Array.from(years).sort((a, b) => parseInt(b) - parseInt(a)));
      setMaxRankPerYear(currentMaxRanks);
    } else {
      setHeatmapYears([]);
      setMaxRankPerYear({});
    }
  }, [leagueData?.finalStandingsHeatmap]);

  const getRankStyle = (rank: number | null | undefined, maxRankInYear: number): { cellClasses: string; textClass: string, borderClass: string } => {
    let cellClasses = 'font-semibold';
    let textClass = 'text-neutral-800 dark:text-neutral-200';
    let borderClass = '';

    if (rank === null || rank === undefined || maxRankInYear <= 0) {
        return { cellClasses: 'bg-muted/30 dark:bg-muted/50', textClass: 'text-muted-foreground', borderClass: '' };
    }
    if (rank === 1) {
        cellClasses = 'bg-yellow-400 dark:bg-yellow-600';
        textClass = 'text-neutral-800 dark:text-yellow-50 font-semibold';
        return { cellClasses, textClass, borderClass };
    }
    if (maxRankInYear <= 1) return { cellClasses: 'font-semibold', textClass: 'text-foreground', borderClass: '' };
    const rankPositionInScale = rank - 2;
    const numRanksToScale = Math.max(1, maxRankInYear - 2);
    const normalizedRank = numRanksToScale > 0 ? rankPositionInScale / numRanksToScale : 0.5;
    const NEUTRAL_BAND_START_PERCENT = 0.425;
    const NEUTRAL_BAND_END_PERCENT = 0.575;
    if (normalizedRank >= NEUTRAL_BAND_START_PERCENT && normalizedRank <= NEUTRAL_BAND_END_PERCENT) {
        cellClasses = 'bg-muted/30 dark:bg-muted/50';
        textClass = 'text-muted-foreground font-semibold';
    } else if (normalizedRank < NEUTRAL_BAND_START_PERCENT) {
        const intensity = Math.min(1, (NEUTRAL_BAND_START_PERCENT - normalizedRank) / NEUTRAL_BAND_START_PERCENT);
        if (intensity > 0.66) cellClasses = 'bg-green-200 dark:bg-green-700/50';
        else if (intensity > 0.33) cellClasses = 'bg-green-100 dark:bg-green-600/40';
        else cellClasses = 'bg-green-50 dark:bg-green-500/30';
        textClass = 'text-neutral-800 dark:text-green-200 font-semibold';
    } else {
        const intensity = Math.min(1, (normalizedRank - NEUTRAL_BAND_END_PERCENT) / (1 - NEUTRAL_BAND_END_PERCENT));
        if (intensity > 0.66) cellClasses = 'bg-red-200 dark:bg-red-700/50';
        else if (intensity > 0.33) cellClasses = 'bg-red-100 dark:bg-red-600/40';
        else cellClasses = 'bg-red-50 dark:bg-red-500/30';
        textClass = 'text-neutral-800 dark:text-red-200 font-semibold';
    }
    return { cellClasses, textClass, borderClass };
  };

  const createSortHandler = <T,>(config: SortConfig<T>, setConfig: React.Dispatch<React.SetStateAction<SortConfig<T>>>) => (key: keyof T) => {
    let direction: SortDirection = 'asc';
    if (config.key === key && config.direction === 'asc') direction = 'desc';
    setConfig({ key, direction });
  };
  const getSortIcon = <T,>(config: SortConfig<T>, columnKey: keyof T) => {
    if (config.key === columnKey) return <ArrowUpDown className="ml-1 h-3 w-3 shrink-0 opacity-50 group-hover:opacity-100 transition-opacity" />;
    return <ArrowUpDown className="ml-1 h-3 w-3 shrink-0 opacity-0 group-hover:opacity-50 transition-opacity" />;
  };
  const sortData = <T,>(data: T[] | undefined | null, config: SortConfig<T>): T[] => {
    if (!config || !config.key || !data || !Array.isArray(data)) return Array.isArray(data) ? data : [];
    try {
      const sortedData = [...data];
      sortedData.sort((a, b) => {
        const valA = a[config.key!];
        const valB = b[config.key!];
        let comparison = 0;
        if (valA === null || valA === undefined) comparison = 1;
        else if (valB === null || valB === undefined) comparison = -1;
        else if (typeof valA === 'number' && typeof valB === 'number') comparison = valA - valB;
        else if (typeof valA === 'string' && typeof valB === 'string') {
          if (['winPct', 'playoffRate', 'qualification_rate', 'playoff_performance_pct'].includes(config.key as string)) {
            const numA = parseFloat(valA.replace('%', ''));
            const numB = parseFloat(valB.replace('%', ''));
            if (!isNaN(numA) && !isNaN(numB)) comparison = numA - numB;
            else comparison = valA.localeCompare(valB);
          } else if (config.key === 'value' && /^-?\d+(\.\d+)?$/.test(valA) && /^-?\d+(\.\d+)?$/.test(valB)) {
            const numA = parseFloat(valA);
            const numB = parseFloat(valB);
            if (!isNaN(numA) && !isNaN(numB)) comparison = numA - numB;
            else comparison = valA.localeCompare(valB);
          } else comparison = valA.localeCompare(valB);
        } else if (config.key === 'value' && (typeof valA === 'number' || typeof valB === 'number' || (typeof valA === 'string' && /^-?\d+(\.\d+)?$/.test(valA)) || (typeof valB === 'string' && /^-?\d+(\.\d+)?$/.test(valB)))) {
            const numA = parseFloat(String(valA));
            const numB = parseFloat(String(valB));
            if (!isNaN(numA) && !isNaN(numB)) comparison = numA - numB;
            else comparison = String(valA).localeCompare(String(valB));
        } else comparison = String(valA).localeCompare(String(valB));
        return config.direction === 'asc' ? comparison : -comparison;
      });
      return sortedData;
    } catch (e) {
      console.error("[sortData] Error:", e, { data, config });
      return Array.isArray(data) ? data : [];
    }
  };

  const sortedCareerLeaderboard = useMemo(() => sortData(leagueData?.careerLeaderboard, careerSortConfig), [leagueData?.careerLeaderboard, careerSortConfig]);
  const requestCareerSort = createSortHandler(careerSortConfig, setCareerSortConfig);
  const sortedGmPlayoffPerformance = useMemo(() => {
    if (!leagueData?.gmPlayoffPerformance) return [];
    const dataWithFormattedPct = leagueData.gmPlayoffPerformance.map(item => ({...item, playoff_performance_pct_display: item.playoff_performance_pct != null ? `${item.playoff_performance_pct.toFixed(1)}%` : 'N/A'}));
    return sortData(dataWithFormattedPct, playoffPerfSortConfig as SortConfig<typeof dataWithFormattedPct[0]>);
  }, [leagueData?.gmPlayoffPerformance, playoffPerfSortConfig]);
  const requestPlayoffPerfSort = createSortHandler(playoffPerfSortConfig as SortConfig<any>, setPlayoffPerfSortConfig as React.Dispatch<React.SetStateAction<SortConfig<any>>>);
  const sortedFinalStandingsHeatmap = useMemo(() => sortData(leagueData?.finalStandingsHeatmap, heatmapSortConfig), [leagueData?.finalStandingsHeatmap, heatmapSortConfig]);
  const requestHeatmapSort = createSortHandler(heatmapSortConfig, setHeatmapSortConfig);
  const sortedPlayoffRates = useMemo(() => {
    if (!leagueData?.playoffQualificationRate) return [];
    return sortData(leagueData.playoffQualificationRate.map(item => ({...item, qualification_rate: Number(item.qualification_rate) || 0})), { key: 'qualification_rate', direction: 'desc' });
  }, [leagueData?.playoffQualificationRate]);

  if (loading) {
    return (
      <div className="space-y-8 w-full">
        <Card className="overflow-hidden"><CardHeader><CardTitle>Championship Timeline</CardTitle></CardHeader><CardContent className="px-0 sm:px-6 w-full"><Skeleton className="w-full h-[260px] mx-auto" /></CardContent></Card>
        <div className="grid md:grid-cols-2 gap-6"><Card className="overflow-hidden"><CardHeader><CardTitle>Career Leaderboard</CardTitle></CardHeader><CardContent className="overflow-x-auto"><Skeleton className="h-64" /></CardContent></Card><Card className="overflow-hidden"><CardHeader><CardTitle>League Records</CardTitle></CardHeader><CardContent><Skeleton className="h-64" /></CardContent></Card></div>
        <Card className="overflow-hidden"><CardHeader><CardTitle>Final Standings Heatmap</CardTitle><CardDescription>Finishing positions. 1st place is yellow. Others on a green (better) to red (worse) scale.</CardDescription></CardHeader><CardContent className="p-0 overflow-x-auto"><Skeleton className="h-64" /></CardContent></Card>
        <div className="grid md:grid-cols-2 gap-6"><Card className="overflow-hidden"><CardHeader><CardTitle>GM Playoff Performance</CardTitle><CardDescription className="text-xs mt-1">Perf % is the manager's average playoff score divided by their average regular season score during playoff seasons.</CardDescription></CardHeader><CardContent className="overflow-x-auto"><Skeleton className="h-64" /></CardContent></Card><Card className="overflow-hidden"><CardHeader><CardTitle>Playoff Qualification Rate</CardTitle></CardHeader><CardContent className="h-[300px]"><Skeleton className="h-full w-full" /></CardContent></Card></div>
      </div>
    );
  }

  if (error || !leagueData) {
    return <Card><CardContent className="pt-6 text-center text-destructive">Failed to load league data. {error}</CardContent></Card>;
  }

  return (
    <div className="space-y-8">
      <Card className="overflow-hidden">
        <CardHeader>
          <CardTitle>Championship Timeline</CardTitle>
          <CardDescription>A chronological display of league champions and their key players.</CardDescription>
        </CardHeader>
        <CardContent className="px-0 sm:px-6 w-full">
          <Carousel opts={{ align: "start", loop: leagueData.championshipTimeline.length > 1 }} className="w-full">
            <CarouselContent className="-ml-1">
              {leagueData.championshipTimeline.map((champion, index) => (
                <CarouselItem key={index} className="p-1 basis-full sm:basis-1/2 md:basis-1/3 lg:basis-1/4 xl:basis-1/5">
                   <Card className="card-iridescent flex flex-col p-4 h-full gap-3 rounded-xl shadow-lg hover:shadow-2xl transition-all transform hover:-translate-y-1">
                    <div className="flex flex-col items-center text-center pt-3 relative">
                      <Badge variant="default" className="absolute top-0 right-0 transform translate-x-1/3 -translate-y-1/3 bg-accent text-accent-foreground px-2 py-0.5 text-xs rounded-full shadow-sm z-10">{champion.year}</Badge>
                      <Avatar className="h-20 w-20 border-2 border-primary mt-1 mb-2 shadow-md"><AvatarImage src={champion.imgUrl || undefined} alt={`${champion.teamName} logo`} /><AvatarFallback className="text-3xl bg-muted text-muted-foreground">{champion.championName?.charAt(0).toUpperCase() || '?'}</AvatarFallback></Avatar>
                      <h3 className="text-xl font-bold text-foreground">{champion.championName}</h3>
                      <p className="text-sm text-muted-foreground max-w-full truncate px-2">{champion.teamName || "Team Name N/A"}</p>
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-center border-t border-b py-3">
                      <div><Zap size={18} className="mx-auto mb-0.5 text-primary" /><p className="text-xs uppercase text-muted-foreground font-medium">RECORD</p><p className="text-sm font-semibold">{champion.wins}-{champion.losses}</p></div>
                      <div><ArrowUp size={18} className="mx-auto mb-0.5 text-green-500" /><p className="text-xs uppercase text-muted-foreground font-medium">PF</p><p className="text-sm font-semibold">{champion.pointsFor?.toFixed(2) ?? 'N/A'}</p></div>
                      <div><ArrowDown size={18} className="mx-auto mb-0.5 text-red-500" /><p className="text-xs uppercase text-muted-foreground font-medium">PA</p><p className="text-sm font-semibold">{champion.pointsAgainst?.toFixed(2) ?? 'N/A'}</p></div>
                    </div>
                    {Array.isArray(champion.parsedRoster) && champion.parsedRoster.length > 0 && (
                      <div className="space-y-1.5"><h4 className="text-sm font-medium text-foreground">Key Players</h4><div className="flex flex-col gap-1.5">{champion.parsedRoster.slice(0, 4).map((player, idx) => (<div key={idx} className="flex items-center gap-2 p-2 rounded-lg text-sm text-foreground bg-white/40 shadow-sm"><UserRound size={16} className="text-muted-foreground" /><span className="truncate" title={player}>{player}</span></div>))}</div></div>
                    )}
                  </Card>
                </CarouselItem>
              ))}
            </CarouselContent>
            {leagueData.championshipTimeline.length > 1 && (<><CarouselPrevious /><CarouselNext /></>)}
          </Carousel>
        </CardContent>
      </Card>
      <div className="grid md:grid-cols-2 gap-6">
        <Card className="overflow-hidden">
          <CardHeader><CardTitle>Career Leaderboard</CardTitle></CardHeader>
          <CardContent className="overflow-x-auto">
            <Table><TableHeader><TableRow>
                <TableHead><Button variant="ghost" onClick={() => requestCareerSort('name')} className="w-full justify-start px-0 group text-xs md:text-sm py-2">GM {getSortIcon(careerSortConfig, 'name')}</Button></TableHead>
                <TableHead><Button variant="ghost" onClick={() => requestCareerSort('wins')} className="w-full justify-start px-0 group text-xs md:text-sm py-2">W {getSortIcon(careerSortConfig, 'wins')}</Button></TableHead>
                <TableHead><Button variant="ghost" onClick={() => requestCareerSort('losses')} className="w-full justify-start px-0 group text-xs md:text-sm py-2">L {getSortIcon(careerSortConfig, 'losses')}</Button></TableHead>
                <TableHead><Button variant="ghost" onClick={() => requestCareerSort('ties')} className="w-full justify-start px-0 group text-xs md:text-sm py-2">T {getSortIcon(careerSortConfig, 'ties')}</Button></TableHead>
                <TableHead><Button variant="ghost" onClick={() => requestCareerSort('winPct')} className="w-full justify-start px-0 group text-xs md:text-sm py-2">Win% {getSortIcon(careerSortConfig, 'winPct')}</Button></TableHead>
                <TableHead><Button variant="ghost" onClick={() => requestCareerSort('championships')} className="w-full justify-start px-0 group text-xs md:text-sm py-2">Rings {getSortIcon(careerSortConfig, 'championships')}</Button></TableHead>
                <TableHead><Button variant="ghost" onClick={() => requestCareerSort('pointsFor')} className="w-full justify-start px-0 group text-xs md:text-sm py-2">PF {getSortIcon(careerSortConfig, 'pointsFor')}</Button></TableHead>
                <TableHead><Button variant="ghost" onClick={() => requestCareerSort('pointsAgainst')} className="w-full justify-start px-0 group text-xs md:text-sm py-2">PA {getSortIcon(careerSortConfig, 'pointsAgainst')}</Button></TableHead>
                <TableHead><Button variant="ghost" onClick={() => requestCareerSort('playoffRate')} className="w-full justify-start px-0 group text-xs md:text-sm py-2">Playoff Rate {getSortIcon(careerSortConfig, 'playoffRate')}</Button></TableHead>
            </TableRow></TableHeader><TableBody>
                {sortedCareerLeaderboard.map((stat) => (
                <TableRow key={stat.name}>
                  <TableCell className="font-medium px-2 py-2 text-sm text-left">{stat.name}</TableCell><TableCell className="px-2 py-2 text-sm text-left">{stat.wins}</TableCell><TableCell className="px-2 py-2 text-sm text-left">{stat.losses}</TableCell><TableCell className="px-2 py-2 text-sm text-left">{stat.ties}</TableCell><TableCell className="px-2 py-2 text-sm text-left">{stat.winPct}</TableCell><TableCell className="px-2 py-2 text-sm text-left">{stat.championships}</TableCell><TableCell className="px-2 py-2 text-sm text-left">{stat.pointsFor?.toFixed(1) ?? 'N/A'}</TableCell><TableCell className="px-2 py-2 text-sm text-left">{stat.pointsAgainst?.toFixed(1) ?? 'N/A'}</TableCell><TableCell className="px-2 py-2 text-sm text-left">{stat.playoffRate != null ? (stat.playoffRate * 100).toFixed(1) + '%' : 'N/A'}</TableCell>
                </TableRow>
                ))}
            </TableBody></Table>
          </CardContent>
        </Card>
        <Card className="overflow-hidden">
          <CardHeader><CardTitle>League Records</CardTitle></CardHeader>
          <CardContent className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {leagueData.leagueRecords.length > 0 ? (
                recordDisplayOrder.map(category => {
                  const record = leagueData.leagueRecords.find(r => r.record_category === category);
                  if (!record) return null;
                  return (<Card key={record.record_category} className="flex flex-col p-4 gap-2 rounded-lg shadow-sm border transition-all duration-200 ease-in-out hover:scale-105 hover:shadow-lg"><div className="flex items-center text-sm font-semibold text-primary">{getRecordIcon(record.record_category)}<span>{record.record_category}</span></div><p className="text-2xl font-bold text-foreground">{record.value}{typeof record.value === 'number' && " pts"}</p><div className="text-xs text-muted-foreground mt-auto space-y-0.5"><p>GM: {record.gm_name}</p><p>Season(s): {record.seasons}{record.week ? ` (Wk ${record.week})` : ""}</p></div></Card>);
                }).filter(Boolean)
              ) : (<p className="text-muted-foreground">No league records available.</p>)}
          </CardContent>
        </Card>
      </div>
      <Card className="overflow-hidden">
        <CardHeader><CardTitle>Final Standings Heatmap</CardTitle><CardDescription>Finishing positions. 1st place is yellow. Others on a green (better) to red (worse) scale.</CardDescription></CardHeader>
        <CardContent className="p-0 overflow-x-auto"><Table className="table-auto"><TableHeader><TableRow>
            <TableHead className="sticky left-0 bg-card z-10 p-1 text-xs md:text-sm"><Button variant="ghost" onClick={() => requestHeatmapSort('gm_name')} className="px-1 group text-xs py-1">GM {getSortIcon(heatmapSortConfig, 'gm_name')}</Button></TableHead>
            {heatmapYears.map(year => (<TableHead key={year} className="p-1 border text-center text-xs whitespace-nowrap">{year}</TableHead>))}
        </TableRow></TableHeader><TableBody>
            {sortedFinalStandingsHeatmap.map((gmEntry) => (
                <TableRow key={gmEntry.gm_name}><TableCell className="font-medium sticky left-0 bg-card z-10 p-1 border text-xs md:text-sm whitespace-nowrap">{gmEntry.gm_name}</TableCell>
                {heatmapYears.map(year => {
                    const rank = gmEntry[year] as number | null | undefined;
                    const { cellClasses, textClass } = getRankStyle(rank, maxRankPerYear[year] || 0);
                    return (<TableCell key={year} className="p-0 border text-center text-xs"><div className={cn("p-0.5 h-full w-full flex items-center justify-center", cellClasses, textClass)}>{rank ?? '-'}</div></TableCell>);
                })}
                </TableRow>
            ))}
        </TableBody></Table></CardContent>
      </Card>
      <div className="grid md:grid-cols-2 gap-6">
        <Card className="overflow-hidden">
          <CardHeader><CardTitle>GM Playoff Performance</CardTitle><CardDescription className="text-xs mt-1">Perf % is manager's avg playoff score / avg regular season score.</CardDescription></CardHeader>
          <CardContent className="overflow-x-auto"><Table><TableHeader><TableRow>
                <TableHead><Button variant="ghost" onClick={() => requestPlayoffPerfSort('gm_name')} className="w-full justify-start px-0 group text-xs md:text-sm py-2">GM {getSortIcon(playoffPerfSortConfig, 'gm_name')}</Button></TableHead>
                <TableHead><Button variant="ghost" onClick={() => requestPlayoffPerfSort('total_matchups')} className="w-full justify-start px-0 group text-xs md:text-sm py-2">Total Matchups {getSortIcon(playoffPerfSortConfig, 'total_matchups')}</Button></TableHead>
                <TableHead><Button variant="ghost" onClick={() => requestPlayoffPerfSort('wins')} className="w-full justify-start px-0 group text-xs md:text-sm py-2">Wins {getSortIcon(playoffPerfSortConfig, 'wins')}</Button></TableHead>
                <TableHead><Button variant="ghost" onClick={() => requestPlayoffPerfSort('losses')} className="w-full justify-start px-0 group text-xs md:text-sm py-2">Losses {getSortIcon(playoffPerfSortConfig, 'losses')}</Button></TableHead>
                <TableHead><Button variant="ghost" onClick={() => requestPlayoffPerfSort('championship_matchups')} className="w-full justify-start px-0 group text-xs md:text-sm py-2">Championships {getSortIcon(playoffPerfSortConfig, 'championship_matchups')}</Button></TableHead>
                <TableHead><Button variant="ghost" onClick={() => requestPlayoffPerfSort('avg_playoff_points_weekly')} className="w-full justify-start px-0 group text-xs md:text-sm py-2">Avg Pts {getSortIcon(playoffPerfSortConfig, 'avg_playoff_points_weekly')}</Button></TableHead>
                <TableHead><Button variant="ghost" onClick={() => requestPlayoffPerfSort('playoff_performance_pct')} className="w-full justify-start px-0 group text-xs md:text-sm py-2">Perf % {getSortIcon(playoffPerfSortConfig, 'playoff_performance_pct')}</Button></TableHead>
          </TableRow></TableHeader><TableBody>
            {sortedGmPlayoffPerformance.map((gmPerf: any) => (
                <TableRow key={gmPerf.gm_name}>
                    <TableCell className="font-medium px-2 py-2 text-sm text-left">{gmPerf.gm_name}</TableCell>
                    <TableCell className="px-2 py-2 text-sm text-left">{gmPerf.total_matchups}</TableCell>
                    <TableCell className="px-2 py-2 text-sm text-left">{gmPerf.wins}</TableCell>
                    <TableCell className="px-2 py-2 text-sm text-left">{gmPerf.losses}</TableCell>
                    <TableCell className="px-2 py-2 text-sm text-left">{gmPerf.championship_matchups}</TableCell>
                    <TableCell className="px-2 py-2 text-sm text-left">{gmPerf.avg_playoff_points_weekly?.toFixed(1) ?? 'N/A'}</TableCell>
                    <TableCell className="px-2 py-2 text-sm text-left">{gmPerf.playoff_performance_pct_display}</TableCell>
                </TableRow>
            ))}
          </TableBody></Table></CardContent>
        </Card>
        <Card className="overflow-hidden">
          <CardHeader><CardTitle>Playoff Qualification Rate</CardTitle></CardHeader>
          <CardContent className="h-[300px] pt-6">
            <ResponsiveContainer width="100%" height="100%">
              <RechartsBarChartImport data={sortedPlayoffRates}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="gm_name" /><YAxis tickFormatter={(v) => `${(v * 100).toFixed(0)}%`} /><RechartsTooltip formatter={(v: number) => `${(v * 100).toFixed(1)}%`} /><RechartsLegend /><Bar dataKey="qualification_rate" fill="#4299E1" name="Playoff Rate" /></RechartsBarChartImport>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
