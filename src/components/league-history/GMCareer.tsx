// src/components/league-history/GMCareer.tsx
"use client";

import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { cn, getPositionBadgeClass, getPositionName, CHART_COLORS } from "@/lib/utils";
import { fetcher } from '@/lib/fetcher';
import type {
    GMCareerData, GMIndividualSeasonDetailData, GMSeasonSummary, GMGameByGame, GMRosterPlayer, GMPlayerSummaryPerformanceEntry, GM as GM_Mock
} from '@/lib/types';
import { ResponsiveContainer, CartesianGrid, XAxis, YAxis, Tooltip as RechartsTooltip, Legend as RechartsLegend, Line, BarChart as RechartsBarChartImport, Bar, Cell as RechartsCell, LineChart as RechartsLineChartImport, Pie, PieChart as RechartsPieChartComponent } from 'recharts';
import { Users, Trophy, TrendingUp, User, TrendingDown, Award, ShieldAlert, ListChecks, ArrowUpDown, ArrowUpCircle, ArrowDownCircle, PieChart as PieChartIconLucide, UsersRound, Target, Shuffle, Waves, Repeat, BarChartHorizontal, Sparkles, LineChart } from 'lucide-react';
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Separator } from '@/components/ui/separator';
import { Label } from "@/components/ui/label";
import { Button } from '@/components/ui/button';

// --- SUB-COMPONENTS DEFINED INTERNALLY ---

const SeasonPerformanceCard = ({ performance, year }: { performance: GMSeasonSummary['seasonPerformance']; year: string }) => {
    if (!performance) return null;
    const winRate = (performance.wins + performance.losses + (performance.ties || 0) > 0) ? (performance.wins / (performance.wins + performance.losses + (performance.ties || 0))) * 100 : 0;
    const sosDifferentialColor = performance.sosDifferential != null ? (performance.sosDifferential < 0 ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400") : "text-foreground";
    return (<Card><CardHeader><CardTitle className="flex items-center text-lg"><Award className="mr-2 h-5 w-5 text-primary" /> {year} Season Performance</CardTitle></CardHeader><CardContent className="grid grid-cols-2 md:grid-cols-5 gap-3"><div className="flex flex-col items-center p-2 rounded-md bg-muted/50"><span className="text-xs uppercase text-muted-foreground">Record</span><span className="text-2xl font-bold">{performance.wins}-{performance.losses}{performance.ties ? `-${performance.ties}` : ''}</span><span className="text-xs text-muted-foreground">{winRate.toFixed(1)}%</span></div><div className="flex flex-col items-center p-2 rounded-md bg-muted/50"><span className="text-xs uppercase text-muted-foreground">Avg PPG</span><span className="text-2xl font-bold">{performance.avgPointsPerGame?.toFixed(1)}</span><span className="text-xs text-muted-foreground">Total: {performance.pointsFor?.toFixed(0)}</span></div><div className="flex flex-col items-center p-2 rounded-md bg-muted/50"><span className="text-xs uppercase text-muted-foreground">Reg. Finish</span><span className="text-2xl font-bold">#{performance.regularSeasonFinish}</span></div><div className="flex flex-col items-center p-2 rounded-md bg-muted/50"><span className="text-xs uppercase text-muted-foreground">Final Standing</span><span className="text-2xl font-bold">#{performance.finalStanding}</span>{performance.finalStanding === 1 && <Badge className="mt-1 bg-primary text-primary-foreground">Champion</Badge>}</div><div className="flex flex-col items-center p-2 rounded-md bg-muted/50"><span className="text-xs uppercase text-muted-foreground">SOS Diff.</span><span className={cn("text-2xl font-bold", sosDifferentialColor)}>{performance.sosDifferential != null && performance.sosDifferential >= 0 ? '+' : ''}{performance.sosDifferential?.toFixed(1) ?? 'N/A'}</span><span className="text-xs text-muted-foreground">{performance.sosRating ?? ''}</span></div></CardContent></Card>);
};

const GameByGameTable = ({ games, gmName }: { games?: GMGameByGame[]; gmName?: string }) => {
    if(!games || games.length === 0) return <p className="text-muted-foreground text-center py-4">No game data available.</p>;
    return (<Card className="mt-6"><CardHeader><CardTitle className="flex items-center text-lg"><ListChecks className="mr-2 h-5 w-5 text-primary" /> Game-by-Game Breakdown</CardTitle></CardHeader><CardContent className="overflow-x-auto"><Table><TableHeader><TableRow><TableHead className="text-center">Wk</TableHead><TableHead>Opponent</TableHead><TableHead className="text-right">Pts</TableHead><TableHead className="text-right">Opp. Pts</TableHead><TableHead className="text-center">Result</TableHead><TableHead className="text-right">Diff</TableHead></TableRow></TableHeader><TableBody>{games.map((game) => (<TableRow key={game.week}><TableCell className="text-center">{game.week}</TableCell><TableCell>{game.opponent}</TableCell><TableCell className="text-right">{game.points?.toFixed(1)}</TableCell><TableCell className="text-right">{game.opponent_points?.toFixed(1)}</TableCell><TableCell className="text-center"><Badge className={cn("font-semibold", game.result === 'W' && "bg-green-100 text-green-700", game.result === 'L' && "bg-red-100 text-red-700", game.result === 'T' && "bg-gray-100 text-gray-700")}>{game.result}</Badge></TableCell><TableCell className={cn("text-right", typeof game.difference === 'number' && game.difference >= 0 ? "text-green-600" : "text-red-600")}>{typeof game.difference === 'number' && game.difference >= 0 ? '+' : ''}{game.difference?.toFixed(1)}</TableCell></TableRow>))}</TableBody></Table></CardContent><CardContent className="pt-4"><h4 className="text-md font-semibold mb-2 text-center">Weekly Scoring Trend</h4><div className="h-[300px]"><ResponsiveContainer width="100%" height="100%"><RechartsLineChartImport data={games} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="week" tickFormatter={(tick) => `Wk ${tick}`} /><YAxis domain={['auto', 'auto']} /><RechartsTooltip /><RechartsLegend verticalAlign="bottom" wrapperStyle={{paddingTop: "10px"}}/><Line type="monotone" dataKey="points" name={`${gmName || 'GM'} Points`} stroke="hsl(var(--primary))" strokeWidth={2} activeDot={{ r: 6 }} /><Line type="monotone" dataKey="opponent_points" name="Opponent Points" stroke="hsl(var(--chart-3))" strokeWidth={2} activeDot={{ r: 6 }} /></RechartsLineChartImport></ResponsiveContainer></div></CardContent></Card>);
};

type SortDirection = 'asc' | 'desc';
interface SortConfig<T> { key: keyof T | null; direction: SortDirection; }
type RosterSortConfig = SortConfig<GMRosterPlayer>;

const RosterPlayersTable = ({ players }: { players: GMRosterPlayer[] }) => {
  const [sortConfig, setSortConfig] = useState<RosterSortConfig>({ key: 'totalPoints', direction: 'desc' });
  const requestSort = (key: keyof GMRosterPlayer) => setSortConfig(prev => ({ key, direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc' }));
  const getSortIconForRoster = (columnKey: keyof GMRosterPlayer) => sortConfig.key === columnKey ? <ArrowUpDown className="ml-1 h-3 w-3 shrink-0 opacity-50" /> : <ArrowUpDown className="ml-1 h-3 w-3 shrink-0 opacity-0 group-hover:opacity-50" />;
  const sortedPlayers = useMemo(() => {
    if (!Array.isArray(players)) return [];
    let sortableItems = [...players];
    if (sortConfig.key) {
      sortableItems.sort((a, b) => {
        const valA = a[sortConfig.key!];
        const valB = b[sortConfig.key!];
        if (valA == null) return 1; if (valB == null) return -1;
        let comparison = 0;
        if (typeof valA === 'number' && typeof valB === 'number') comparison = valA - valB;
        else comparison = String(valA).localeCompare(String(valB));
        return sortConfig.direction === 'asc' ? comparison : -comparison;
      });
    }
    return sortableItems;
  }, [players, sortConfig]);
  return (<Card className="mt-6"><CardHeader><CardTitle className="flex items-center text-lg"><Users className="mr-2 h-5 w-5 text-primary"/>Roster & Player Performance</CardTitle></CardHeader><CardContent className="overflow-x-auto"><Table><TableHeader><TableRow><TableHead><Button variant="ghost" size="sm" onClick={() => requestSort('name')} className="px-1 group text-xs justify-start">Player {getSortIconForRoster('name')}</Button></TableHead><TableHead className="text-center"><Button variant="ghost" size="sm" onClick={() => requestSort('position')} className="px-1 group text-xs justify-center w-full">POS {getSortIconForRoster('position')}</Button></TableHead><TableHead className="text-center"><Button variant="ghost" size="sm" onClick={() => requestSort('finish')} className="px-1 group text-xs justify-center w-full">Finish {getSortIconForRoster('finish')}</Button></TableHead><TableHead className="text-center"><Button variant="ghost" size="sm" onClick={() => requestSort('gamesStarted')} className="px-1 group text-xs justify-center w-full">Starts {getSortIconForRoster('gamesStarted')}</Button></TableHead><TableHead className="text-right"><Button variant="ghost" size="sm" onClick={() => requestSort('totalPoints')} className="px-1 group text-xs justify-end w-full">Total Points {getSortIconForRoster('totalPoints')}</Button></TableHead></TableRow></TableHeader><TableBody>{sortedPlayers.map((player) => (<TableRow key={player.id}><TableCell>{player.name}</TableCell><TableCell className="text-center"><Badge variant="outline" className={getPositionBadgeClass(player.position)}>{player.position}</Badge></TableCell><TableCell className="text-center">{player.finish ?? 'N/A'}</TableCell><TableCell className="text-center">{player.gamesStarted ?? 'N/A'}</TableCell><TableCell className="text-right">{player.totalPoints?.toFixed(1)}</TableCell></TableRow>))}</TableBody></Table></CardContent></Card>);
};

type PlayerPerfSortConfig = SortConfig<GMPlayerSummaryPerformanceEntry>;
const PlayerPerformanceDetailsTable = ({ players }: { players: GMPlayerSummaryPerformanceEntry[] }) => {
  const [sortConfig, setSortConfig] = useState<PlayerPerfSortConfig>({ key: 'avgDifference', direction: 'desc' });
  const requestSort = (key: keyof GMPlayerSummaryPerformanceEntry) => setSortConfig(prev => ({ key, direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc' }));
  const getSortIconForPlayerPerf = (columnKey: keyof GMPlayerSummaryPerformanceEntry) => sortConfig.key === columnKey ? <ArrowUpDown className="ml-1 h-3 w-3 shrink-0 opacity-50"/> : <ArrowUpDown className="ml-1 h-3 w-3 shrink-0 opacity-0 group-hover:opacity-50"/>;
  const sortedPlayerPerfData = useMemo(() => {
    if (!Array.isArray(players)) return [];
    let sortableItems = [...players];
    if (sortConfig.key) {
        sortableItems.sort((a,b) => {
            const valA = a[sortConfig.key!];
            const valB = b[sortConfig.key!];
            if (valA == null) return 1; if (valB == null) return -1;
            let comparison = 0;
            if (typeof valA === 'number' && typeof valB === 'number') comparison = valA - valB;
            else comparison = String(valA).localeCompare(String(valB));
            return sortConfig.direction === 'asc' ? comparison : -comparison;
        });
    }
    return sortableItems;
  }, [players, sortConfig]);
  return (
     <Card><CardHeader><CardTitle className="flex items-center text-lg"><UsersRound className="mr-2 h-5 w-5 text-primary" /> Player Performance Details</CardTitle></CardHeader><CardContent className="overflow-x-auto"><Table><TableHeader><TableRow>
        <TableHead><Button variant="ghost" size="sm" onClick={() => requestSort('name')} className="px-1 group text-xs justify-start">Player {getSortIconForPlayerPerf('name')}</Button></TableHead>
        <TableHead className="text-center"><Button variant="ghost" size="sm" onClick={() => requestSort('position')} className="px-1 group text-xs justify-center w-full">POS {getSortIconForPlayerPerf('position')}</Button></TableHead>
        <TableHead className="text-right"><Button variant="ghost" size="sm" onClick={() => requestSort('avgActual')} className="px-1 group text-xs justify-end w-full">Avg Actual {getSortIconForPlayerPerf('avgActual')}</Button></TableHead>
        <TableHead className="text-right"><Button variant="ghost" size="sm" onClick={() => requestSort('avgProjected')} className="px-1 group text-xs justify-end w-full">Avg Proj {getSortIconForPlayerPerf('avgProjected')}</Button></TableHead>
        <TableHead className="text-right"><Button variant="ghost" size="sm" onClick={() => requestSort('avgDifference')} className="px-1 group text-xs justify-end w-full">Avg Diff {getSortIconForPlayerPerf('avgDifference')}</Button></TableHead>
        <TableHead className="text-right"><Button variant="ghost" size="sm" onClick={() => requestSort('percentBeatProjection')} className="px-1 group text-xs justify-end w-full">% Beat Proj {getSortIconForPlayerPerf('percentBeatProjection')}</Button></TableHead>
        <TableHead className="text-center"><Button variant="ghost" size="sm" onClick={() => requestSort('boomWeeks')} className="px-1 group text-xs justify-center w-full">Boom {getSortIconForPlayerPerf('boomWeeks')}</Button></TableHead>
        <TableHead className="text-center"><Button variant="ghost" size="sm" onClick={() => requestSort('bustWeeks')} className="px-1 group text-xs justify-center w-full">Bust {getSortIconForPlayerPerf('bustWeeks')}</Button></TableHead>
    </TableRow></TableHeader><TableBody>{sortedPlayerPerfData.map((player) => (<TableRow key={player.playerId}>
        <TableCell>{player.name}</TableCell>
        <TableCell className="text-center"><Badge variant="outline" className={cn("text-xs", getPositionBadgeClass(player.position))}>{player.position}</Badge></TableCell>
        <TableCell className="text-right">{player.avgActual?.toFixed(1) ?? 'N/A'}</TableCell>
        <TableCell className="text-right">{player.avgProjected?.toFixed(1) ?? 'N/A'}</TableCell>
        <TableCell className={cn("text-right font-semibold", typeof player.avgDifference === 'number' && player.avgDifference >= 0 ? "text-green-600" : "text-red-600")}>{typeof player.avgDifference === 'number' && player.avgDifference >= 0 ? '+' : ''}{player.avgDifference?.toFixed(1) ?? 'N/A'}</TableCell>
        <TableCell className="text-right">{player.percentBeatProjection?.toFixed(1) ?? 'N/A'}%</TableCell>
        <TableCell className="text-center text-green-600 font-semibold">{player.boomWeeks ?? 'N/A'}</TableCell>
        <TableCell className="text-center text-red-600 font-semibold">{player.bustWeeks ?? 'N/A'}</TableCell>
    </TableRow>))}</TableBody></Table></CardContent></Card>
  );
};
const CustomPieTooltip = ({ active, payload }: any ) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload as { positionName: string; percentage: number; actualPoints: number; };
    const color = CHART_COLORS[data.positionName?.toUpperCase() || 'DEFAULT'] || CHART_COLORS.DEFAULT;
    return (<div className="p-2 bg-background border rounded-md shadow-md"><p className="text-sm" style={{ color }}>{`${data.positionName} ${data.percentage.toFixed(1)}% : ${data.actualPoints.toFixed(1)}`}</p></div>);
  }
  return null;
};
const mockGmsForTabs: GM_Mock[] = [
  { id: "chris", name: "Chris" }, { id: "dan", name: "Dan" }, { id: "dylan", name: "Dylan" }, { id: "fitz", name: "Fitz" }, { id: "jack", name: "Jack" }, { id: "jake", name: "Jake" }, { id: "josh", name: "Josh" }, { id: "lac", name: "Lac" }, { id: "mark", name: "Mark" }, { id: "nick", name: "Nick" }, { id: "sean", name: "Sean" }, { id: "will", name: "Will" }, { id: "zach", name: "Zach" },
];
const GM_CHART_COLORS = { GM_STARTED_PTS: 'hsl(var(--primary))', LEAGUE_AVG_PTS: 'hsl(var(--chart-2))' };

export default function GMCareer() {
  const [selectedGmId, setSelectedGmId] = useState<string | undefined>(mockGmsForTabs[0]?.id);
  const [gmData, setGmData] = useState<GMCareerData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [selectedViewOption, setSelectedViewOption] = useState<string>("all-seasons");
  const [gmIndividualSeasonData, setGmIndividualSeasonData] = useState<GMIndividualSeasonDetailData | null>(null);
  const [loadingGmIndividualSeason, setLoadingGmIndividualSeason] = useState(false);
  const [errorGmIndividualSeason, setErrorGmIndividualSeason] = useState<string | null>(null);
  const [activeGmSeasonTab, setActiveGmSeasonTab] = useState<string>("season-summary");

  useEffect(() => {
    if (selectedGmId) {
      const fetchGmData = async () => {
        setLoading(true); setError(null); setGmData(null); setGmIndividualSeasonData(null); setErrorGmIndividualSeason(null);
        const gmInfoFromMock = mockGmsForTabs.find(g => g.id === selectedGmId);
        const gmSlug = gmInfoFromMock?.name.toLowerCase().replace(/\s+/g, '') || selectedGmId;
        const gmFilePath = `/data/league_data/${gmSlug}/${gmSlug}.json`;
        try {
          const data: GMCareerData = await fetcher(gmFilePath);
          if (!data || !data.gmInfo) throw new Error(`Fetched data for ${gmSlug} is incomplete.`);
          setGmData(data);
          if (selectedViewOption !== "all-seasons" && data.gmInfo.slug && data.gmInfo.id) {
            fetchIndividualSeasonData(data.gmInfo.slug, data.gmInfo.id, selectedViewOption);
          }
        } catch (err) { setError(err instanceof Error ? err.message : `An unknown error occurred.`); setGmData(null);
        } finally { setLoading(false); }
      };
      fetchGmData();
    }
  }, [selectedGmId]);

  const fetchIndividualSeasonData = async (gmSlug: string, gmNumericId: number, year: string) => {
      setLoadingGmIndividualSeason(true); setErrorGmIndividualSeason(null); setGmIndividualSeasonData(null); setActiveGmSeasonTab("season-summary");
      const seasonDetailFilePath = `/data/league_data/${gmSlug}/gm_career_${gmNumericId}_${year}.json`;
      try {
        const data: GMIndividualSeasonDetailData = await fetcher(seasonDetailFilePath);
        if (!data || !data.seasonSummary) throw new Error(`Fetched season data is incomplete.`);
        setGmIndividualSeasonData(data);
      } catch (err) { setErrorGmIndividualSeason(err instanceof Error ? err.message : `An unknown error occurred.`); setGmIndividualSeasonData(null);
      } finally { setLoadingGmIndividualSeason(false); }
  };

  useEffect(() => {
    if (selectedViewOption !== "all-seasons" && gmData?.gmInfo?.slug && gmData?.gmInfo?.id) {
      fetchIndividualSeasonData(gmData.gmInfo.slug, gmData.gmInfo.id, selectedViewOption);
    } else if (selectedViewOption === "all-seasons") {
      setGmIndividualSeasonData(null);
    }
  }, [selectedViewOption, gmData]);

  const CustomizedDot = (props: any) => {
    const { cx, cy, stroke, payload } = props;
    if (payload.isChampion) return <Trophy x={cx - 8} y={cy - 8} width={16} height={16} className="text-yellow-500 fill-current" />;
    if (payload.madePlayoffs) return <circle cx={cx} cy={cy} r={6} stroke="hsl(var(--accent))" fill="hsl(var(--accent))" />;
    return <circle cx={cx} cy={cy} r={3} stroke={stroke} fill="#fff" />;
  };
  
  const availableGmSeasonsForDropdown = useMemo(() => gmData?.seasonProgression?.map(s => String(s.year)).filter(year => parseInt(year) >= 2019).sort((a, b) => Number(b) - Number(a)) || [], [gmData]);
  const pieChartData = useMemo(() => {
    if (!gmIndividualSeasonData?.rosterBreakdown?.positionContributionData) return [];
    const totalPoints = gmIndividualSeasonData.rosterBreakdown.positionContributionData.reduce((sum, p) => sum + (p.startedPoints ?? 0), 0);
    return gmIndividualSeasonData.rosterBreakdown.positionContributionData.map(p => ({ name: p.name, positionName: p.name, value: p.startedPoints ?? 0, percentage: totalPoints > 0 && p.startedPoints ? (p.startedPoints / totalPoints * 100) : 0, actualPoints: p.startedPoints ?? 0 }));
  }, [gmIndividualSeasonData?.rosterBreakdown?.positionContributionData]);
  const pieChartCells = useMemo(() => pieChartData.map((entry) => (<RechartsCell key={`cell-${entry.name}`} fill={CHART_COLORS[entry.name?.toUpperCase() || 'DEFAULT'] || CHART_COLORS.DEFAULT} />)), [pieChartData]);
  const barChartData = useMemo(() => {
    if (!gmIndividualSeasonData?.rosterBreakdown?.positionContributionData || !gmIndividualSeasonData?.rosterBreakdown?.leagueAvgPositionData) return [];
    const gmPointsMap = new Map(gmIndividualSeasonData.rosterBreakdown.positionContributionData.map(p => [p.name, p.startedPoints ?? 0]));
    const mergedData = gmIndividualSeasonData.rosterBreakdown.leagueAvgPositionData.map(lgAvg => ({ position: lgAvg.name, "GM Started Pts": gmPointsMap.get(lgAvg.name) || 0, "League Avg Pts": lgAvg.leagueAvg ?? 0 }));
    return mergedData.sort((a,b) => (b["GM Started Pts"] ?? 0) - (a["GM Started Pts"] ?? 0));
  }, [gmIndividualSeasonData?.rosterBreakdown]);
  const cumulativePositionalAdvantageChartData = useMemo(() => {
    const cumulativeData = gmIndividualSeasonData?.positionalAdvantage?.cumulativeWeeklyPositionalAdvantage;
    if (!cumulativeData || !Array.isArray(cumulativeData)) return [];
    const weeks = new Set<number>();
    cumulativeData.forEach(posData => { if (Array.isArray(posData.data)) { posData.data.forEach(weekEntry => weeks.add(weekEntry.week)); } });
    const sortedWeeks = Array.from(weeks).sort((a, b) => a - b);
    return sortedWeeks.map(weekNum => {
      const weekEntry: { week: number; [key: string]: number | undefined } = { week: weekNum };
      cumulativeData.forEach(posData => {
        if (Array.isArray(posData.data)) {
          const valueForWeek = posData.data.find(d => d.week === weekNum)?.value;
          if (valueForWeek !== undefined) { weekEntry[posData.position.toUpperCase()] = valueForWeek; }
        }
      });
      return weekEntry;
    });
  }, [gmIndividualSeasonData?.positionalAdvantage?.cumulativeWeeklyPositionalAdvantage]);

  const selectedGmName = useMemo(() => gmData?.gmInfo?.name || mockGmsForTabs.find(g => g.id === selectedGmId)?.name || "Selected GM", [gmData, selectedGmId]);

  if (loading) return <Card><CardHeader><Skeleton className="h-8 w-1/2" /></CardHeader><CardContent><Skeleton className="h-64 w-full" /></CardContent></Card>;
  if (error) return <Card><CardContent className="pt-6 text-destructive text-center"><ShieldAlert size={48} className="mx-auto mb-2" /> <p>{error}</p></CardContent></Card>;
  if (!gmData) return <Card><CardContent className="pt-6 text-center text-muted-foreground">Please select a GM.</CardContent></Card>;

  return (
    <div className="space-y-6 w-full">
        <div className="flex flex-col sm:flex-row gap-4 items-start">
            <div className="space-y-1.5"><Label htmlFor="gm-select">Select GM</Label><Select value={selectedGmId} onValueChange={(v) => { setSelectedGmId(v); setSelectedViewOption("all-seasons"); }}><SelectTrigger id="gm-select" className="w-full sm:w-[280px]"><SelectValue placeholder="Select a GM" /></SelectTrigger><SelectContent>{mockGmsForTabs.map(gm => (<SelectItem key={gm.id} value={gm.id}>{gm.name}</SelectItem>))}</SelectContent></Select></div>
            <div className="space-y-1.5"><Label htmlFor="view-select">Select View</Label><Select value={selectedViewOption} onValueChange={setSelectedViewOption}><SelectTrigger id="view-select" className="w-full sm:w-[280px]"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all-seasons">All Seasons</SelectItem>{availableGmSeasonsForDropdown.map(y => (<SelectItem key={y} value={y}>{y} Season Detail</SelectItem>))}</SelectContent></Select></div>
        </div>
      
      {selectedViewOption === "all-seasons" && (
        <>
          <Card>
            <CardHeader className="flex items-start gap-4"><Avatar className="h-16 w-16 border-2 border-primary"><AvatarImage src={gmData.gmInfo.photoUrl || undefined} /><AvatarFallback className="text-2xl bg-muted">{gmData.gmInfo.name?.charAt(0)}</AvatarFallback></Avatar><div><CardTitle className="text-3xl font-bold">{gmData.gmInfo.name}</CardTitle><CardDescription>Years Active: {gmData.gmInfo.yearsActive}</CardDescription>{gmData.gmInfo.championshipYears?.length > 0 && (<div className="mt-2"><Badge variant="outline" className="bg-yellow-100 text-yellow-700 border-yellow-300"><Trophy className="mr-1.5 h-4 w-4" />Champions: {gmData.gmInfo.championshipYears.join(', ')}</Badge></div>)}</div></CardHeader>
            <CardContent className="pt-4 grid grid-cols-1 md:grid-cols-3 gap-6">
              <div><h4 className="text-sm font-medium text-muted-foreground mb-1.5">Overall Record</h4><Separator className="mb-2"/><div className="space-y-0.5 text-sm"><div className="flex justify-between"><span>Wins:</span><span className="font-medium">{gmData.careerStats.wins}</span></div><div className="flex justify-between"><span>Losses:</span><span className="font-medium">{gmData.careerStats.losses}</span></div><div className="flex justify-between"><span>Ties:</span><span className="font-medium">{gmData.careerStats.ties}</span></div><div className="flex justify-between"><span>Win %:</span><span className="font-medium text-primary">{(gmData.careerStats.winPct * 100).toFixed(1)}%</span></div></div></div>
              <div><h4 className="text-sm font-medium text-muted-foreground mb-1.5">Scoring Stats</h4><Separator className="mb-2"/><div className="space-y-0.5 text-sm"><div className="flex justify-between"><span>Total PF:</span><span className="font-medium">{gmData.careerStats.totalPointsFor?.toFixed(1)}</span></div><div className="flex justify-between"><span>Total PA:</span><span className="font-medium">{gmData.careerStats.totalPointsAgainst?.toFixed(1)}</span></div><div className="flex justify-between"><span>Avg PPG:</span><span className="font-medium">{gmData.careerStats.avgPointsPerGame?.toFixed(1)}</span></div></div></div>
              <div><h4 className="text-sm font-medium text-muted-foreground mb-1.5">Milestones</h4><Separator className="mb-2"/><div className="space-y-0.5 text-sm"><div className="flex justify-between"><span>Seasons:</span><span className="font-medium">{gmData.careerStats.totalSeasons}</span></div><div className="flex justify-between"><span>Playoffs:</span><span className="font-medium">{gmData.careerStats.playoffAppearances}</span></div><div className="flex justify-between"><span>Playoff Record:</span><span className="font-medium">{gmData.careerStats.playoffWins}-{gmData.careerStats.playoffLosses}</span></div><div className="flex justify-between"><span>Championships:</span><span className="font-medium text-primary">{gmData.gmInfo.championshipYears?.length || 0}</span></div></div></div>
            </CardContent>
          </Card>
          {gmData.seasonProgression?.length > 0 && (<Card className="mt-8"><CardHeader><CardTitle>Season Progression</CardTitle></CardHeader><CardContent className="h-[350px] pt-6"><ResponsiveContainer width="100%" height="100%"><RechartsLineChartImport data={gmData.seasonProgression}><CartesianGrid /><XAxis dataKey="year" /><YAxis reversed allowDecimals={false} domain={['dataMin - 1', 'dataMax + 1']} tickFormatter={(v) => Math.round(v).toString()} /><RechartsTooltip /><RechartsLegend /><Line type="monotone" dataKey="finalStanding" stroke="hsl(var(--primary))" name="Final Standing" dot={<CustomizedDot />} activeDot={{ r: 6 }} /><Line type="monotone" dataKey="pointsForRank" stroke="hsl(var(--chart-3))" name="PF Rank" activeDot={{ r: 6 }} /></RechartsLineChartImport></ResponsiveContainer></CardContent></Card>)}
          <div className="grid md:grid-cols-3 gap-6 mt-8">
            {gmData.careerExtremes?.highs && (<Card><CardHeader><CardTitle className="text-xl flex items-center"><TrendingUp className="mr-2 h-5 w-5 text-green-500"/>Career Highs</CardTitle></CardHeader><CardContent className="space-y-2 text-sm"><p><strong>Most Points (Game):</strong> {gmData.careerExtremes.highs.mostPointsGame.value.toFixed(1)} ({gmData.careerExtremes.highs.mostPointsGame.season} Wk {gmData.careerExtremes.highs.mostPointsGame.week})</p><p><strong>Biggest Win Margin:</strong> +{gmData.careerExtremes.highs.biggestWinMargin.value.toFixed(1)} (vs {gmData.careerExtremes.highs.biggestWinMargin.opponentName})</p><p><strong>Best Season Record:</strong> {gmData.careerExtremes.highs.bestSeasonRecord.wins}-{gmData.careerExtremes.highs.bestSeasonRecord.losses} ({gmData.careerExtremes.highs.bestSeasonRecord.season}) {gmData.careerExtremes.highs.bestSeasonRecord.isChampion && <Trophy className="inline h-4 w-4 text-yellow-500" />}</p></CardContent></Card>)}
            {gmData.careerExtremes?.lows && (<Card><CardHeader><CardTitle className="text-xl flex items-center"><TrendingDown className="mr-2 h-5 w-5 text-red-500"/>Career Lows</CardTitle></CardHeader><CardContent className="space-y-2 text-sm"><p><strong>Fewest Points (Game):</strong> {gmData.careerExtremes.lows.fewestPointsGame.value.toFixed(1)} ({gmData.careerExtremes.lows.fewestPointsGame.season} Wk {gmData.careerExtremes.lows.fewestPointsGame.week})</p><p><strong>Worst Loss Margin:</strong> -{Math.abs(gmData.careerExtremes.lows.worstLossMargin.value).toFixed(1)} (vs {gmData.careerExtremes.lows.worstLossMargin.opponentName})</p><p><strong>Worst Season Record:</strong> {gmData.careerExtremes.lows.worstSeasonRecord.wins}-{gmData.careerExtremes.lows.worstSeasonRecord.losses} ({gmData.careerExtremes.lows.worstSeasonRecord.season})</p></CardContent></Card>)}
            {gmData.positionStrength?.length > 0 && (<Card><CardHeader><CardTitle className="text-xl">Positional Strength</CardTitle></CardHeader><CardContent><div className="h-[300px] w-full"><ResponsiveContainer width="100%" height="100%"><RechartsBarChartImport data={gmData.positionStrength} layout="vertical" margin={{ left: 30, right: 20 }}><CartesianGrid /><XAxis type="number" /><YAxis dataKey="position" type="category" width={140} tickFormatter={getPositionName} interval={0} /><RechartsTooltip formatter={(v: number) => v.toFixed(1)} /><Bar dataKey="value" name="Strength vs Avg">{gmData.positionStrength.map((e, i) => (<RechartsCell key={`cell-${i}`} fill={e.value >= 0 ? 'hsl(var(--chart-2))' : 'hsl(var(--destructive))'} />))}</Bar></RechartsBarChartImport></ResponsiveContainer></div><p className="text-xs text-muted-foreground mt-2 text-center">Positive values are stronger than league average.</p></CardContent></Card>)}
          </div>
          <div className="grid md:grid-cols-2 gap-6 mt-8">
            {gmData.franchisePlayers?.length > 0 && (<Card><CardHeader><CardTitle className="text-xl">Franchise Players</CardTitle></CardHeader><CardContent className="overflow-x-auto"><Table><TableHeader><TableRow><TableHead>Player</TableHead><TableHead>Pos</TableHead><TableHead>Seasons w/ GM</TableHead><TableHead className="text-right">Total Pts</TableHead><TableHead className="text-right">Games Started</TableHead></TableRow></TableHeader><TableBody>{gmData.franchisePlayers.map(p => (<TableRow key={p.playerId}><TableCell>{p.name}</TableCell><TableCell><Badge variant="outline" className={getPositionBadgeClass(p.position)}>{p.position}</Badge></TableCell><TableCell>{p.seasonsWithGm.join(', ')}</TableCell><TableCell className="text-right">{p.totalPointsForGm?.toFixed(1)}</TableCell><TableCell className="text-right">{p.gamesStartedForGm}</TableCell></TableRow>))}</TableBody></Table></CardContent></Card>)}
            {gmData.rivalryPerformance?.length > 0 && (<Card><CardHeader><CardTitle className="text-xl">Key Rivalries</CardTitle></CardHeader><CardContent className="overflow-x-auto"><Table><TableHeader><TableRow><TableHead>Opponent</TableHead><TableHead>Record (W-L)</TableHead><TableHead className="text-right">Avg. PF</TableHead><TableHead className="text-right">Avg. PA</TableHead></TableRow></TableHeader><TableBody>{gmData.rivalryPerformance.map(r => (<TableRow key={r.opponentId}><TableCell>{r.opponentName}</TableCell><TableCell>{r.wins}-{r.losses}</TableCell><TableCell className="text-right">{r.avgPointsFor?.toFixed(1)}</TableCell><TableCell className="text-right">{r.avgPointsAgainst?.toFixed(1)}</TableCell></TableRow>))}</TableBody></Table></CardContent></Card>)}
          </div>
        </>
      )}

      {selectedViewOption !== "all-seasons" && (
        loadingGmIndividualSeason ? (<Card className="mt-6"><CardHeader><Skeleton className="h-8 w-1/2"/></CardHeader><CardContent><Skeleton className="h-64 w-full" /></CardContent></Card>)
        : errorGmIndividualSeason ? (<Card className="mt-6"><CardContent className="pt-6 text-destructive text-center"><ShieldAlert size={48} className="mx-auto mb-2" /><p>{errorGmIndividualSeason}</p></CardContent></Card>)
        : gmIndividualSeasonData ? (
          <div className="space-y-6 mt-2">
            <Tabs value={activeGmSeasonTab} onValueChange={setActiveGmSeasonTab} className="w-full">
              <TabsList className="grid w-full grid-cols-2 sm:grid-cols-3 md:grid-cols-6 mb-4">
                 <TabsTrigger value="season-summary">Summary</TabsTrigger>
                 <TabsTrigger value="roster-breakdown">Roster</TabsTrigger>
                 <TabsTrigger value="player-performance">Performance</TabsTrigger>
                 <TabsTrigger value="positional-advantage">Pos. Advantage</TabsTrigger>
                 <TabsTrigger value="lineup-optimization">Lineups</TabsTrigger>
                 <TabsTrigger value="streaming-success">Streaming</TabsTrigger>
              </TabsList>

              <TabsContent value="season-summary">
                {gmIndividualSeasonData.seasonSummary?.seasonPerformance && <SeasonPerformanceCard performance={gmIndividualSeasonData.seasonSummary.seasonPerformance} year={selectedViewOption} />}
                {gmIndividualSeasonData.seasonSummary?.gameByGame && <GameByGameTable games={gmIndividualSeasonData.seasonSummary.gameByGame} gmName={gmData.gmInfo.name} />}
              </TabsContent>

              <TabsContent value="roster-breakdown">
                <Card>
                  <CardHeader><CardTitle className="flex items-center text-lg"><PieChartIconLucide className="mr-2 h-5 w-5 text-primary" />Position Contribution</CardTitle><CardDescription className="text-xs">(Based on Started Players)</CardDescription></CardHeader>
                  <CardContent>
                    {pieChartData.length > 0 && barChartData.length > 0 ? (
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
                        <div><h3 className="text-md font-semibold text-center mb-2">Started Points by Position (%)</h3><div className="h-[300px]"><ResponsiveContainer width="100%" height="100%"><RechartsPieChartComponent><Pie data={pieChartData} cx="50%" cy="50%" outerRadius={100} dataKey="value" label={false}>{pieChartCells}</Pie><RechartsTooltip content={<CustomPieTooltip />} /><RechartsLegend payload={pieChartData.map(e => ({ value: e.name, type: 'square', color: CHART_COLORS[e.positionName?.toUpperCase() || 'DEFAULT'] || CHART_COLORS.DEFAULT }))} wrapperStyle={{fontSize: '12px'}} /></RechartsPieChartComponent></ResponsiveContainer></div></div>
                        <div><h3 className="text-md font-semibold text-center mb-2">Started Points vs. League Average</h3><div className="h-[300px]"><ResponsiveContainer width="100%" height="100%"><RechartsBarChartImport layout="vertical" data={barChartData} margin={{ top: 5, right: 30, left: 5, bottom: 20 }}><CartesianGrid strokeDasharray="3 3" horizontal={false} /><XAxis type="number" /><YAxis dataKey="position" type="category" width={50} tick={{fontSize: 11}}/><RechartsTooltip /><RechartsLegend verticalAlign="bottom" /><Bar dataKey="GM Started Pts" fill={GM_CHART_COLORS.GM_STARTED_PTS} barSize={12} /><Bar dataKey="League Avg Pts" fill={GM_CHART_COLORS.LEAGUE_AVG_PTS} barSize={12} /></RechartsBarChartImport></ResponsiveContainer></div></div>
                      </div>
                    ) : <p className="text-muted-foreground text-center py-4">Position contribution data not available.</p>}
                  </CardContent>
                </Card>
                {gmIndividualSeasonData.rosterBreakdown?.rosterPlayerData && <RosterPlayersTable players={gmIndividualSeasonData.rosterBreakdown.rosterPlayerData} />}
              </TabsContent>

              <TabsContent value="player-performance">
                {gmIndividualSeasonData.playerPerformance ? (
                    <div className="space-y-6">
                        <Card><CardHeader><CardTitle className="flex items-center text-lg"><TrendingUp className="mr-2 h-5 w-5 text-primary" />Performance vs. Projection Highlights</CardTitle></CardHeader><CardContent><div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {gmIndividualSeasonData.playerPerformance.overPerformer && (<div className="p-4 rounded-lg bg-green-100 dark:bg-green-900/30 border border-green-200"><div className="flex items-center text-green-700 dark:text-green-300 mb-1"><ArrowUpCircle size={20} className="mr-2" /><h4 className="font-semibold">Most Overperforming Player (Avg)</h4></div><p className="text-xl font-bold">{gmIndividualSeasonData.playerPerformance.overPerformer.name}</p><p className="text-sm font-semibold text-green-600">+{gmIndividualSeasonData.playerPerformance.overPerformer.avgDifference?.toFixed(1) ?? 'N/A'} Points vs Projection / Week</p></div>)}
                            {gmIndividualSeasonData.playerPerformance.underPerformer && (<div className="p-4 rounded-lg bg-red-100 dark:bg-red-900/30 border border-red-200"><div className="flex items-center text-red-700 dark:text-red-300 mb-1"><ArrowDownCircle size={20} className="mr-2" /><h4 className="font-semibold">Most Underperforming Player (Avg)</h4></div><p className="text-xl font-bold">{gmIndividualSeasonData.playerPerformance.underPerformer.name}</p><p className="text-sm font-semibold text-red-600">{gmIndividualSeasonData.playerPerformance.underPerformer.avgDifference?.toFixed(1) ?? 'N/A'} Points vs Projection / Week</p></div>)}
                        </div></CardContent><CardFooter className="text-xs text-muted-foreground pt-4">* Based on average points difference vs weekly projection with a minimum of 3 starts.</CardFooter></Card>
                        {gmIndividualSeasonData.playerPerformance.playerSummaryPerformance?.length > 0 && <PlayerPerformanceDetailsTable players={gmIndividualSeasonData.playerPerformance.playerSummaryPerformance} />}
                    </div>
                ) : <p className="text-muted-foreground text-center py-4">Player performance data not available.</p>}
              </TabsContent>
              
              <TabsContent value="positional-advantage">
                {gmIndividualSeasonData?.positionalAdvantage ? (
                <div className="space-y-6">
                    <Card><CardHeader><CardTitle className="flex items-center text-lg"><BarChartHorizontal className="mr-2 h-5 w-5 text-primary"/>Weekly Positional Advantage vs. Opponent</CardTitle></CardHeader><CardContent className="overflow-x-auto">
                        {gmIndividualSeasonData.positionalAdvantage.weeklyPositionalAdvantage?.length > 0 ? (
                            <Table><TableHeader><TableRow><TableHead className="text-center">WK</TableHead>{['QB', 'RB', 'WR', 'TE', 'FLEX', 'K', 'DST', 'total_diff'].map(pos => <TableHead key={pos} className="text-right">{pos.replace('_diff', ' DIFF')}</TableHead>)}</TableRow></TableHeader><TableBody>
                                {gmIndividualSeasonData.positionalAdvantage.weeklyPositionalAdvantage.filter(item => item.week !== "Total").map((weekData, index) => (<TableRow key={`pos-adv-wk-${index}`}><TableCell className="text-center font-medium">{weekData.week}</TableCell>{(['QB', 'RB', 'WR', 'TE', 'FLEX', 'K', 'DST', 'total_diff'] as const).map(posKey => {const value = weekData[posKey];return (<TableCell key={posKey} className={cn("text-right", typeof value === 'number' && value > 0 ? "text-green-600" : (typeof value === 'number' && value < 0 ? "text-red-600" : ""))}>{typeof value === 'number' ? (value > 0 ? '+' : '') + value.toFixed(1) : (value ?? '-')}</TableCell>);})}</TableRow>))}
                                {gmIndividualSeasonData.positionalAdvantage.weeklyPositionalAdvantage.find(item => item.week === "Total") && (() => { const totalRow = gmIndividualSeasonData.positionalAdvantage.weeklyPositionalAdvantage.find(item => item.week === "Total")!; return (<TableRow className="font-semibold bg-muted/50"><TableCell className="text-center">Total</TableCell>{(['QB', 'RB', 'WR', 'TE', 'FLEX', 'K', 'DST', 'total_diff'] as const).map(posKey => { const value = totalRow[posKey]; return (<TableCell key={`total-${posKey}`} className={cn("text-right", typeof value === 'number' && value > 0 ? "text-green-600" : (typeof value === 'number' && value < 0 ? "text-red-600" : ""))}>{typeof value === 'number' ? (value > 0 ? '+' : '') + value.toFixed(1) : (value ?? '-')}</TableCell>);})}</TableRow>);})()}
                            </TableBody></Table>
                        ) : <p className="text-muted-foreground text-center py-4">Weekly positional advantage data not available.</p>}
                    </CardContent></Card>
                    {cumulativePositionalAdvantageChartData.length > 0 && (
                        <Card className="mt-6">
                            <CardHeader><CardTitle className="flex items-center text-lg"><RechartsLineChartImport className="mr-2 h-5 w-5 text-primary"/>Cumulative Weekly Positional Advantage Trend</CardTitle></CardHeader>
                            <CardContent className="h-[400px] pt-6"><ResponsiveContainer width="100%" height="100%"><RechartsLineChartImport data={cumulativePositionalAdvantageChartData} margin={{ top: 5, right: 20, left: -10, bottom: 40 }}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="week" label={{ value: "Week", position: "insideBottom", dy: 15 }} /><YAxis label={{ value: 'Cumulative Advantage', angle: -90, position: 'insideLeft' }} /><RechartsTooltip /><RechartsLegend verticalAlign="bottom" wrapperStyle={{paddingTop: '20px'}}/>
                                {Object.keys(CHART_COLORS).filter(pos => pos !== 'DEFAULT').map(posKey => (<Line key={posKey} type="monotone" dataKey={posKey.toUpperCase()} stroke={CHART_COLORS[posKey.toUpperCase()]} name={posKey.toUpperCase()} dot={false} activeDot={{ r: 6 }} />))}
                            </RechartsLineChartImport></ResponsiveContainer></CardContent>
                            <CardFooter className="text-xs text-muted-foreground pt-2">* Tracks the running total of positional point differences vs opponents week over week.</CardFooter>
                        </Card>
                    )}
                </div>
                ) : <p className="text-muted-foreground text-center py-4">Positional advantage data not available.</p>}
              </TabsContent>

              <TabsContent value="lineup-optimization">
                {gmIndividualSeasonData?.lineupOptimization ? (
                <div className="space-y-6">
                    <Card><CardHeader><CardTitle className="flex items-center text-lg"><Target className="mr-2 h-5 w-5 text-primary"/>Weekly Lineup Efficiency</CardTitle></CardHeader><CardContent className="overflow-x-auto">
                    {gmIndividualSeasonData.lineupOptimization.weeklyOptimization?.length > 0 ? (
                        <Table><TableHeader><TableRow><TableHead className="text-center">WK</TableHead><TableHead className="text-right">Optimal</TableHead><TableHead className="text-right">Actual</TableHead><TableHead className="text-right">Efficiency</TableHead><TableHead className="text-right">Pts Left</TableHead><TableHead className="text-center">Decisions</TableHead></TableRow></TableHeader><TableBody>{gmIndividualSeasonData.lineupOptimization.weeklyOptimization.map(item => (<TableRow key={`lineup-opt-wk-${item.week}`}><TableCell className="text-center font-medium">{item.week}</TableCell><TableCell className="text-right">{item.optimal?.toFixed(1) ?? '-'}</TableCell><TableCell className="text-right">{item.actual?.toFixed(1) ?? '-'}</TableCell><TableCell className="text-right">{item.efficiency?.toFixed(1) ?? '-'}%</TableCell><TableCell className={cn("text-right", typeof item.pointsLeft === 'number' && item.pointsLeft > 0 ? "text-red-600" : "text-green-600")}>{item.pointsLeft?.toFixed(1) ?? '-'}</TableCell><TableCell className="text-center">{`${item.correctDecisions ?? '-'}/${item.totalDecisions ?? '-'}`}</TableCell></TableRow>))}</TableBody></Table>
                        ) : <p className="text-muted-foreground text-center py-4">Weekly lineup optimization data not available.</p>}
                    </CardContent></Card>
                    {gmIndividualSeasonData.lineupOptimization.feelingItSummary && (
                        <Card className="mt-6"><CardHeader><CardTitle className="flex items-center text-lg"><Sparkles className="mr-2 h-5 w-5 text-primary"/>'Feeling It' Summary</CardTitle><CardDescription className="text-xs mt-1">A "Feeling It" Start is when a player is started with a lower projected point total than a player of the same eligibility on the manager's bench.</CardDescription></CardHeader><CardContent>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6 text-center">
                                <div><p className="text-xs text-muted-foreground">Total Starts</p><p className="text-xl font-semibold">{gmIndividualSeasonData.lineupOptimization.feelingItSummary.totalStarts ?? '-'}</p></div>
                                <div><p className="text-xs text-muted-foreground">Success Rate</p><p className="text-xl font-semibold">{gmIndividualSeasonData.lineupOptimization.feelingItSummary.successRate?.toFixed(1) ?? '-'}%</p></div>
                                <div><p className="text-xs text-muted-foreground">Avg Pts Gained/Lost</p><p className={cn("text-xl font-semibold", typeof gmIndividualSeasonData.lineupOptimization.feelingItSummary.avgPointsGainedLost === 'number' && gmIndividualSeasonData.lineupOptimization.feelingItSummary.avgPointsGainedLost >= 0 ? "text-green-600" : "text-red-600")}>{(typeof gmIndividualSeasonData.lineupOptimization.feelingItSummary.avgPointsGainedLost === 'number' && gmIndividualSeasonData.lineupOptimization.feelingItSummary.avgPointsGainedLost >= 0 ? '+' : '') + (gmIndividualSeasonData.lineupOptimization.feelingItSummary.avgPointsGainedLost?.toFixed(1) ?? '-')}</p></div>
                                <div><p className="text-xs text-muted-foreground">Avg Proj Diff.</p><p className={cn("text-xl font-semibold", typeof gmIndividualSeasonData.lineupOptimization.feelingItSummary.avgProjectionDifference === 'number' && gmIndividualSeasonData.lineupOptimization.feelingItSummary.avgProjectionDifference >= 0 ? "text-green-600" : "text-red-600")}>{(typeof gmIndividualSeasonData.lineupOptimization.feelingItSummary.avgProjectionDifference === 'number' && gmIndividualSeasonData.lineupOptimization.feelingItSummary.avgProjectionDifference >= 0 ? '+' : '') + (gmIndividualSeasonData.lineupOptimization.feelingItSummary.avgProjectionDifference?.toFixed(1) ?? '-')}</p></div>
                            </div>
                            {gmIndividualSeasonData.lineupOptimization.feelingItSummary.details?.length > 0 && (<div className="overflow-x-auto"><Table><TableHeader><TableRow><TableHead className="text-center">WK</TableHead><TableHead>Starter</TableHead><TableHead className="text-right">Actual</TableHead><TableHead className="text-right">Proj.</TableHead><TableHead>Bench</TableHead><TableHead className="text-right">Actual</TableHead><TableHead className="text-right">Proj.</TableHead><TableHead className="text-right">Pts Diff</TableHead><TableHead className="text-right">Proj. Diff</TableHead></TableRow></TableHeader><TableBody>{gmIndividualSeasonData.lineupOptimization.feelingItSummary.details.map((item, idx) => (<TableRow key={`feeling-it-${idx}`}><TableCell className="text-center font-medium">{item.week}</TableCell><TableCell>{item.starterName}</TableCell><TableCell className="text-right">{item.starterActual?.toFixed(1) ?? '-'}</TableCell><TableCell className="text-right">{item.starterProjected?.toFixed(1) ?? '-'}</TableCell><TableCell>{item.benchName}</TableCell><TableCell className="text-right">{item.benchActual?.toFixed(1) ?? '-'}</TableCell><TableCell className="text-right">{item.benchProjected?.toFixed(1) ?? '-'}</TableCell><TableCell className={cn("text-right", typeof item.pointsDifference === 'number' && item.pointsDifference >= 0 ? "text-green-600" : "text-red-600")}>{(typeof item.pointsDifference === 'number' && item.pointsDifference >=0 ? '+':'' )} {item.pointsDifference?.toFixed(1) ?? '-'}</TableCell><TableCell className={cn("text-right", typeof item.projectionDifference === 'number' && item.projectionDifference >= 0 ? "text-green-600" : "text-red-600")}>{(typeof item.projectionDifference === 'number' && item.projectionDifference >=0 ? '+':'' )} {item.projectionDifference?.toFixed(1) ?? '-'}</TableCell></TableRow>))}</TableBody></Table></div>)}
                        </CardContent></Card>
                    )}
                </div>
                ) : <p className="text-muted-foreground text-center py-4">Lineup optimization data not available.</p>}
              </TabsContent>

              <TabsContent value="streaming-success">
                {gmIndividualSeasonData?.streamingSuccess ? (
                <div className="space-y-6">
                    <Card><CardHeader><CardTitle className="flex items-center text-lg"><Repeat className="mr-2 h-5 w-5 text-primary"/>Streaming Summary</CardTitle></CardHeader><CardContent className="overflow-x-auto">
                        {gmIndividualSeasonData.streamingSuccess.streamingSummary?.length > 0 ? (<div className="overflow-x-auto"><Table><TableHeader><TableRow><TableHead>Position</TableHead><TableHead className="text-center">Unique Starters</TableHead><TableHead className="text-center">Streamed Starts</TableHead><TableHead className="text-right">Avg Pts/Gm</TableHead><TableHead className="text-right">League Avg</TableHead><TableHead className="text-right">Net Pts vs Avg</TableHead><TableHead className="text-right">Hit Rate</TableHead></TableRow></TableHeader><TableBody>{gmIndividualSeasonData.streamingSuccess.streamingSummary.map(item => (<TableRow key={`streaming-summary-${item.position}`}><TableCell className="font-medium">{getPositionName(item.position)}</TableCell><TableCell className="text-center">{item.uniqueStarters ?? '-'}</TableCell><TableCell className="text-center">{item.streamedStartsCount ?? '-'}</TableCell><TableCell className="text-right">{item.avgPtsGm?.toFixed(1) ?? '-'}</TableCell><TableCell className="text-right">{item.avgPtsLeague?.toFixed(1) ?? '-'}</TableCell><TableCell className={cn("text-right", typeof item.netPtsVsAvg === 'number' && item.netPtsVsAvg >= 0 ? "text-green-600" : "text-red-600")}>{(typeof item.netPtsVsAvg === 'number' && item.netPtsVsAvg >=0 ? '+':'' )+ (item.netPtsVsAvg?.toFixed(1) ?? '-')}</TableCell><TableCell className="text-right">{item.hitRate?.toFixed(1) ?? '-'}%</TableCell></TableRow>))}</TableBody></Table></div>) : <p className="text-muted-foreground text-center py-4">Streaming summary data not available.</p>}
                    </CardContent></Card>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">{['QB', 'TE', 'K', 'DST'].map(pos => { const weeklyData = gmIndividualSeasonData.streamingSuccess?.streamingWeeklyPerformance?.[pos]; return Array.isArray(weeklyData) && weeklyData.length > 0 && (<Card key={`streaming-weekly-${pos}`}><CardHeader><CardTitle className="flex items-center text-base font-semibold">{`${getPositionName(pos)} Performance`}</CardTitle></CardHeader><CardContent className="overflow-x-auto"><Table><TableHeader><TableRow><TableHead className="text-center">WK</TableHead><TableHead>Player Started</TableHead><TableHead className="text-right">GM Pts</TableHead><TableHead className="text-right">League Avg Pts</TableHead></TableRow></TableHeader><TableBody>{weeklyData.map((item, index) => (<TableRow key={`streaming-wk-detail-${pos}-${index}`}><TableCell className="text-center">{item.week}</TableCell><TableCell>{item.playerName}</TableCell><TableCell className="text-right">{item.gmStarterPts?.toFixed(1) ?? '-'}</TableCell><TableCell className="text-right">{item.leagueAvgPts?.toFixed(1) ?? '-'}</TableCell></TableRow>))}</TableBody></Table></CardContent></Card>)})}</div>
                </div>
                ) : <p className="text-muted-foreground text-center py-4">Streaming success data not available.</p>}
              </TabsContent>
            </Tabs>
          </div>
        ) : (<Card className="mt-6"><CardContent className="pt-6 text-center text-muted-foreground">No detailed data found for this season.</CardContent></Card>)
      )}
    </div>
  );
}