
"use client";
import { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type {
  LeagueData,
  CareerStat,
  ChampionTimelineEntry,
  LeagueRecord,
  PlayoffAppearanceRate,
  FinalStandingsHeatmapEntry,
  GMPlayoffPerformanceStat,
  SeasonDetailData,
  SeasonStandingEntry,
  PlayoffMatchup,
  StrengthOfScheduleEntry,
  WaiverPickupEntry,
  TopPerformerPlayer,
  PositionalTopPerformersData,
  SeasonBestOverallGameEntry,
  GMCareerData,
  GMInfo,
  CareerExtremes,
  SeasonProgressionEntry,
  PositionStrengthEntry,
  FranchisePlayerEntry,
  RivalryPerformanceEntry,
  GMIndividualSeasonDetailData,
  GMSeasonSummary,
  GMGameByGame,
  GMRosterBreakdown,
  GMRosterPlayer,
  GMPositionContribution,
  GMPlayerPerformanceHighlight,
  GMPlayerSummaryPerformanceEntry,
  GMLineupOptimizationData,
  GMLineupOptimizationFeelingItDetail,
  GMLineupOptimizationWeekly,
  GMPositionalAdvantageData,
  GMPositionalAdvantageWeeklyEntry,
  GMPositionalAdvantageCumulative,
  GMStreamingSuccessData,
  GMStreamingSummaryEntry,
  GMStreamingWeeklyPerformanceEntry
} from '@/lib/types';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { cn, getPositionBadgeClass, getPositionIcon, getPositionName, CHART_COLORS } from "@/lib/utils.tsx";
import {
  ResponsiveContainer, CartesianGrid, XAxis, YAxis, Tooltip as RechartsTooltip, Legend as RechartsLegend, Line, PieChart as RechartsPieChartComponent, Pie, Cell as RechartsCell, BarChart as RechartsBarChartImport, Bar, LineChart as RechartsLineChartImport, LabelList, ScatterChart, Scatter, ZAxis
} from 'recharts';
import { ArrowUpDown, ListChecks, Users, Trophy, BarChart3 as BarChartRechartsIcon, CalendarDays, LineChart as LineChartIconRecharts, ClipboardList, CheckCircle2, XCircle, ShieldAlert, Zap, ArrowUp, ArrowDown, UserRound, TrendingUp, User, Eye, Info, UsersRound, PieChartIcon as PieChartIconLucide, Shuffle, Waves, Award, Star, ArrowUpCircle, ArrowDownCircle, Target, Sparkles, Repeat, BarChartHorizontal, PersonStanding, UserCircle2, Users as UsersIcon, BarChart2, MoreHorizontal, GripVertical, Crown, PackageSearch, Flame, Bomb, Scaling, ShieldCheck, ShieldX, TrendingDown } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Carousel, CarouselContent, CarouselItem, CarouselPrevious, CarouselNext } from "@/components/ui/carousel";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Separator } from '@/components/ui/separator';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";


// Mock data for SeasonDetail and GMCareer tabs (as types)
import type { Season as SeasonType_Mock, GM as GM_Mock } from '@/lib/types';

// These mocks are used for populating the Select dropdowns.
const mockSeasonsForTabs: SeasonType_Mock[] = [
  { id: "2009", year: 2009 }, { id: "2010", year: 2010 }, { id: "2011", year: 2011 }, { id: "2012", year: 2012 }, { id: "2013", year: 2013 }, { id: "2014", year: 2014 }, { id: "2015", year: 2015 }, { id: "2016", year: 2016 }, { id: "2017", year: 2017 }, { id: "2018", year: 2018 }, { id: "2019", year: 2019 }, { id: "2020", year: 2020 }, { id: "2021", year: 2021 }, { id: "2022", year: 2022 }, { id: "2023", year: 2023 }, { id: "2024", year: 2024 },
].sort((a,b) => b.year - a.year);


const mockGmsForTabs: GM_Mock[] = [
  { id: "chris", name: "Chris" }, { id: "dan", name: "Dan" }, { id: "dylan", name: "Dylan" }, { id: "fitz", name: "Fitz" }, { id: "jack", name: "Jack" }, { id: "jake", name: "Jake" }, { id: "josh", name: "Josh" }, { id: "lac", name: "Lac" }, { id: "mark", name: "Mark" }, { id: "nick", name: "Nick" }, { id: "sean", name: "Sean" }, { id: "will", name: "Will" }, { id: "zach", name: "Zach" },
];


type SortDirection = 'asc' | 'desc';

interface SortConfig<T> {
  key: keyof T | null;
  direction: SortDirection;
}

const recordDisplayOrder = [
  "Highest Score", "Lowest Score",
  "Most Points (Season)", "Fewest Points Against (Season)", "Most Points Against (Season)",
  "Longest Win Streak", "Longest Losing Streak",
  "Biggest Blowout", "Closest Win", "Worst Beat",
  "Highest Scoring Player (Week)",
  "Most Transactions (Season)"
];

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


const AllSeasonsOverview = ({ leagueData, loading }: { leagueData: LeagueData | null; loading: boolean; }) => {
  const [heatmapYears, setHeatmapYears] = useState<string[]>([]);
  const [maxRankPerYear, setMaxRankPerYear] = useState<{ [year: string]: number }>({});

  const [careerSortConfig, setCareerSortConfig] = useState<SortConfig<CareerStat>>({ key: 'name', direction: 'asc' });
  const [playoffPerfSortConfig, setPlayoffPerfSortConfig] = useState<SortConfig<GMPlayoffPerformanceStat>>({ key: 'wins', direction: 'desc' });
  const [heatmapSortConfig, setHeatmapSortConfig] = useState<SortConfig<FinalStandingsHeatmapEntry>>({ key: 'gm_name', direction: 'asc' });

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


  const createSortHandler = <T,>(
    config: SortConfig<T>,
    setConfig: React.Dispatch<React.SetStateAction<SortConfig<T>>>
  ) => (key: keyof T) => {
    let direction: SortDirection = 'asc';
    if (config.key === key && config.direction === 'asc') {
      direction = 'desc';
    }
    setConfig({ key, direction });
  };

  const getSortIcon = <T,>(config: SortConfig<T>, columnKey: keyof T) => {
    if (config.key === columnKey) {
      return <ArrowUpDown className="ml-1 h-3 w-3 shrink-0 opacity-50 group-hover:opacity-100 transition-opacity" />;
    }
    return <ArrowUpDown className="ml-1 h-3 w-3 shrink-0 opacity-0 group-hover:opacity-50 transition-opacity" />;
  };

  const sortData = <T,>(data: T[] | undefined | null, config: SortConfig<T>): T[] => {
    if (!config || !config.key || !data) {
      return Array.isArray(data) ? data : [];
    }
    if (!Array.isArray(data)) {
      console.warn("[AllSeasonsOverview:sortData] Received non-array data:", data);
      return [];
    }
    try {
      const sortedData = [...data];
      sortedData.sort((a, b) => {
        const valA = a[config.key!];
        const valB = b[config.key!];
        let comparison = 0;

        if (valA === null || valA === undefined) comparison = 1;
        else if (valB === null || valB === undefined) comparison = -1;
        else if (typeof valA === 'number' && typeof valB === 'number') {
          comparison = valA - valB;
        } else if (typeof valA === 'string' && typeof valB === 'string') {
          if (config.key === 'winPct' || config.key === 'playoffRate' || (config.key as string) === 'qualification_rate' || (config.key as string) === 'playoff_performance_pct') {
            const numA = parseFloat(String(valA).replace('%', ''));
            const numB = parseFloat(String(valB).replace('%', ''));
            if (!isNaN(numA) && !isNaN(numB)) {
              comparison = numA - numB;
            } else {
              comparison = String(valA).localeCompare(String(valB));
            }
          } else if (config.key === 'value' && typeof valA === 'string' && /^-?\d+(\.\d+)?$/.test(String(valA)) && typeof valB === 'string' && /^-?\d+(\.\d+)?$/.test(String(valB))) {
              const numA = parseFloat(valA);
              const numB = parseFloat(String(valB)); 
              if (!isNaN(numA) && !isNaN(numB)) {
                  comparison = numA - numB;
              } else {
                  comparison = String(valA).localeCompare(String(valB));
              }
          } else {
            comparison = String(valA).localeCompare(String(valB));
          }
        } else if (config.key === 'value' && (typeof valA === 'number' || typeof valB === 'number' || (typeof valA === 'string' && /^-?\d+(\.\d+)?$/.test(String(valA))) || (typeof valB === 'string' && /^-?\d+(\.\d+)?$/.test(String(valB))))) {
            const numA = parseFloat(String(valA));
            const numB = parseFloat(String(valB));
            if (!isNaN(numA) && !isNaN(numB)) {
                comparison = numA - numB;
            } else {
                comparison = String(valA).localeCompare(String(valB));
            }
        } else {
          comparison = String(valA).localeCompare(String(valB));
        }
        return config.direction === 'asc' ? comparison : -comparison;
      });
      return sortedData;
    } catch (e) {
      console.error("[AllSeasonsOverview:sortData] Error in sortData:", e, { data, config });
      return Array.isArray(data) ? data : [];
    }
  };

  const sortedCareerLeaderboard = useMemo(() => {
    if (!leagueData?.careerLeaderboard || !Array.isArray(leagueData.careerLeaderboard)) return [];
    return sortData([...leagueData.careerLeaderboard], careerSortConfig);
  }, [leagueData?.careerLeaderboard, careerSortConfig]);
  const requestCareerSort = createSortHandler(careerSortConfig, setCareerSortConfig);

  const sortedGmPlayoffPerformance = useMemo(() => {
    if (!leagueData?.gmPlayoffPerformance || !Array.isArray(leagueData.gmPlayoffPerformance)) return [];
    
    const dataWithFormattedPct = leagueData.gmPlayoffPerformance.map(item => ({
      ...item,
      playoff_performance_pct_display: item.playoff_performance_pct != null ? `${item.playoff_performance_pct.toFixed(1)}%` : 'N/A'
    }));
    return sortData([...dataWithFormattedPct], playoffPerfSortConfig as SortConfig<typeof dataWithFormattedPct[0]>);

  }, [leagueData?.gmPlayoffPerformance, playoffPerfSortConfig]);
  const requestPlayoffPerfSort = createSortHandler(playoffPerfSortConfig as SortConfig<any>, setPlayoffPerfSortConfig as React.Dispatch<React.SetStateAction<SortConfig<any>>>);


  const sortedFinalStandingsHeatmap = useMemo(() => {
    if (!leagueData?.finalStandingsHeatmap || !Array.isArray(leagueData.finalStandingsHeatmap)) return [];
    return sortData([...leagueData.finalStandingsHeatmap], heatmapSortConfig);
  }, [leagueData?.finalStandingsHeatmap, heatmapSortConfig]);
  const requestHeatmapSort = createSortHandler(heatmapSortConfig, setHeatmapSortConfig);

  const sortedPlayoffRates = useMemo(() => {
    if (!leagueData?.playoffQualificationRate || !Array.isArray(leagueData.playoffQualificationRate)) {
        return [];
    }
    const dataWithNumericRate = leagueData.playoffQualificationRate.map(item => ({
      ...item,
      qualification_rate: Number(item.qualification_rate) || 0
    }));
    return sortData([...dataWithNumericRate], { key: 'qualification_rate', direction: 'desc' });
  }, [leagueData?.playoffQualificationRate]);

  if (loading) {
    return (
      <div className="space-y-8 w-full">
        <Card className="overflow-hidden">
          <CardHeader><CardTitle>Championship Timeline</CardTitle></CardHeader>
          <CardContent className="px-0 sm:px-6 w-full">
            <Skeleton className="w-full h-[260px] mx-auto" />
          </CardContent>
        </Card>
        <div className="grid md:grid-cols-2 gap-6">
            <Card className="overflow-hidden">
                <CardHeader><CardTitle>Career Leaderboard</CardTitle></CardHeader>
                <CardContent className="overflow-x-auto"><Skeleton className="h-64" /></CardContent>
            </Card>
             <Card className="overflow-hidden">
                <CardHeader><CardTitle>League Records</CardTitle></CardHeader>
                <CardContent><Skeleton className="h-64" /></CardContent>
            </Card>
        </div>
        <Card className="overflow-hidden">
          <CardHeader>
            <CardTitle>Final Standings Heatmap</CardTitle>
            <CardDescription>Finishing positions. 1st place is yellow. Others on a green (better) to red (worse) scale, with neutral ranks having default background.</CardDescription>
          </CardHeader>
          <CardContent className="p-0 overflow-x-auto"><Skeleton className="h-64" /></CardContent>
        </Card>
        <div className="grid md:grid-cols-2 gap-6">
            <Card className="overflow-hidden">
                 <CardHeader>
                  <CardTitle>GM Playoff Performance</CardTitle>
                  <CardDescription className="text-xs mt-1">Perf % is the manager's average playoff score divided by their average regular season score during playoff seasons.</CardDescription>
                </CardHeader>
                <CardContent className="overflow-x-auto"><Skeleton className="h-64" /></CardContent>
            </Card>
            <Card className="overflow-hidden">
                <CardHeader><CardTitle>Playoff Qualification Rate</CardTitle></CardHeader>
                <CardContent className="h-[300px]"><Skeleton className="h-full w-full" /></CardContent>
            </Card>
        </div>
      </div>
    );
  }

  if (!leagueData) {
    return <Card><CardContent className="pt-6 text-center">Failed to load league data. Check console for errors or ensure '/data/league_data/league-data.json' is correctly placed and formatted.</CardContent></Card>;
  }

  return (
    <div className="space-y-8">
      <Card className="overflow-hidden">
        <CardHeader>
          <CardTitle>Championship Timeline</CardTitle>
          <CardDescription>A chronological display of league champions and their key players.</CardDescription>
        </CardHeader>
        <CardContent className="px-0 sm:px-6 w-full">
          <Carousel
            opts={{
              align: "start",
              loop: Array.isArray(leagueData.championshipTimeline) && leagueData.championshipTimeline.length > 1,
            }}
            className="w-full"
          >
            <CarouselContent className="-ml-1">
              {Array.isArray(leagueData.championshipTimeline) && leagueData.championshipTimeline.map((champion: ChampionTimelineEntry, index: number) => (
                <CarouselItem key={index} className="p-1 basis-full sm:basis-1/2 md:basis-1/3 lg:basis-1/4 xl:basis-1/5">
                   <Card className="card-iridescent flex flex-col p-4 h-full gap-3 rounded-xl shadow-lg hover:shadow-2xl transition-all transform hover:-translate-y-1">
                    <div className="flex flex-col items-center text-center pt-3 relative">
                      <Badge
                        variant="default"
                        className="absolute top-0 right-0 transform translate-x-1/3 -translate-y-1/3 bg-accent text-accent-foreground px-2 py-0.5 text-xs rounded-full shadow-sm z-10"
                      >
                        {champion.year}
                      </Badge>
                      <Avatar className="h-20 w-20 border-2 border-primary mt-1 mb-2 shadow-md">
                        <AvatarImage
                          src={champion.imgUrl || undefined}
                          alt={champion.teamName ? `${champion.teamName} logo` : 'Champion logo'}
                          data-ai-hint="team logo"
                        />
                        <AvatarFallback className="text-3xl bg-muted text-muted-foreground">
                          {champion.championName ? champion.championName.charAt(0).toUpperCase() : '?'}
                        </AvatarFallback>
                      </Avatar>
                      <h3 className="text-xl font-bold text-foreground">{champion.championName}</h3>
                      <p className="text-sm text-muted-foreground max-w-full truncate px-2">
                        {champion.teamName || "Team Name N/A"}
                      </p>
                    </div>

                    <div className="grid grid-cols-3 gap-2 text-center border-t border-b py-3">
                      <div>
                        <Zap size={18} className="mx-auto mb-0.5 text-primary" />
                        <p className="text-xs uppercase text-muted-foreground font-medium">RECORD</p>
                        <p className="text-sm font-semibold">{champion.wins}-{champion.losses}</p>
                      </div>
                      <div>
                        <ArrowUp size={18} className="mx-auto mb-0.5 text-green-500" />
                        <p className="text-xs uppercase text-muted-foreground font-medium">PF</p>
                        <p className="text-sm font-semibold">{champion.pointsFor?.toFixed(2) ?? 'N/A'}</p>
                      </div>
                      <div>
                        <ArrowDown size={18} className="mx-auto mb-0.5 text-red-500" />
                        <p className="text-xs uppercase text-muted-foreground font-medium">PA</p>
                        <p className="text-sm font-semibold">{champion.pointsAgainst?.toFixed(2) ?? 'N/A'}</p>
                      </div>
                    </div>
                    
                    {Array.isArray(champion.parsedRoster) && champion.parsedRoster.length > 0 && (
                      <div className="space-y-1.5">
                        <h4 className="text-sm font-medium text-foreground">Key Players</h4>
                        <div className="flex flex-col gap-1.5">
                          {champion.parsedRoster.slice(0, 4).map((player, idx) => (
                            <div key={idx} className="flex items-center gap-2 bg-background p-2 rounded-lg text-sm border shadow-sm">
                              <UserRound size={16} className="text-muted-foreground" />
                              <span className="text-foreground truncate" title={player}>{player}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </Card>
                </CarouselItem>
              ))}
            </CarouselContent>
            {Array.isArray(leagueData.championshipTimeline) && leagueData.championshipTimeline.length > 1 && (
                <>
                    <CarouselPrevious />
                    <CarouselNext />
                </>
            )}
          </Carousel>
        </CardContent>
      </Card>
      
      <div className="grid md:grid-cols-2 gap-6">
        <Card className="overflow-hidden">
          <CardHeader><CardTitle>Career Leaderboard</CardTitle></CardHeader>
          <CardContent className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="px-2 py-2 text-left align-middle font-medium text-muted-foreground">
                    <Button variant="ghost" onClick={() => requestCareerSort('name')}  className="w-full justify-start px-0 group text-xs md:text-sm py-2">
                      GM {getSortIcon(careerSortConfig, 'name')}
                    </Button>
                  </TableHead>
                  <TableHead className="px-2 py-2 text-left align-middle font-medium text-muted-foreground">
                    <Button variant="ghost" onClick={() => requestCareerSort('wins')}  className="w-full justify-start px-0 group text-xs md:text-sm py-2">
                      W {getSortIcon(careerSortConfig, 'wins')}
                    </Button>
                  </TableHead>
                  <TableHead className="px-2 py-2 text-left align-middle font-medium text-muted-foreground">
                    <Button variant="ghost" onClick={() => requestCareerSort('losses')}  className="w-full justify-start px-0 group text-xs md:text-sm py-2">
                      L {getSortIcon(careerSortConfig, 'losses')}
                    </Button>
                  </TableHead>
                  <TableHead className="px-2 py-2 text-left align-middle font-medium text-muted-foreground">
                    <Button variant="ghost" onClick={() => requestCareerSort('ties')}  className="w-full justify-start px-0 group text-xs md:text-sm py-2">
                      T {getSortIcon(careerSortConfig, 'ties')}
                    </Button>
                  </TableHead>
                  <TableHead className="px-2 py-2 text-left align-middle font-medium text-muted-foreground">
                    <Button variant="ghost" onClick={() => requestCareerSort('winPct')}  className="w-full justify-start px-0 group text-xs md:text-sm py-2">
                      Win% {getSortIcon(careerSortConfig, 'winPct')}
                    </Button>
                  </TableHead>
                  <TableHead className="px-2 py-2 text-left align-middle font-medium text-muted-foreground">
                    <Button variant="ghost" onClick={() => requestCareerSort('championships')}  className="w-full justify-start px-0 group text-xs md:text-sm py-2">
                      Champs {getSortIcon(careerSortConfig, 'championships')}
                    </Button>
                  </TableHead>
                  <TableHead className="px-2 py-2 text-left align-middle font-medium text-muted-foreground">
                    <Button variant="ghost" onClick={() => requestCareerSort('pointsFor')}  className="w-full justify-start px-0 group text-xs md:text-sm py-2">
                      PF {getSortIcon(careerSortConfig, 'pointsFor')}
                    </Button>
                  </TableHead>
                  <TableHead className="px-2 py-2 text-left align-middle font-medium text-muted-foreground">
                    <Button variant="ghost" onClick={() => requestCareerSort('pointsAgainst')}  className="w-full justify-start px-0 group text-xs md:text-sm py-2">
                      PA {getSortIcon(careerSortConfig, 'pointsAgainst')}
                    </Button>
                  </TableHead>
                  <TableHead className="px-2 py-2 text-left align-middle font-medium text-muted-foreground">
                    <Button variant="ghost" onClick={() => requestCareerSort('playoffRate')}  className="w-full justify-start px-0 group text-xs md:text-sm py-2">
                      Playoff Rate {getSortIcon(careerSortConfig, 'playoffRate')}
                    </Button>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {Array.isArray(sortedCareerLeaderboard) && sortedCareerLeaderboard.map((stat: CareerStat) => (
                <TableRow key={stat.name}>
                  <TableCell className="font-medium px-2 py-2 text-sm text-left">{stat.name}</TableCell>
                  <TableCell className="px-2 py-2 text-sm text-left">{stat.wins}</TableCell>
                  <TableCell className="px-2 py-2 text-sm text-left">{stat.losses}</TableCell>
                  <TableCell className="px-2 py-2 text-sm text-left">{stat.ties}</TableCell>
                  <TableCell className="px-2 py-2 text-sm text-left">{stat.winPct}</TableCell>
                  <TableCell className="px-2 py-2 text-sm text-left">{stat.championships}</TableCell>
                  <TableCell className="px-2 py-2 text-sm text-left">{stat.pointsFor?.toFixed(1) ?? 'N/A'}</TableCell>
                  <TableCell className="px-2 py-2 text-sm text-left">{stat.pointsAgainst?.toFixed(1) ?? 'N/A'}</TableCell>
                  <TableCell className="px-2 py-2 text-sm text-left">{stat.playoffRate !== undefined && stat.playoffRate !== null ? (stat.playoffRate * 100).toFixed(1) + '%' : 'N/A'}</TableCell>
                </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card className="overflow-hidden">
          <CardHeader><CardTitle>League Records</CardTitle></CardHeader>
          <CardContent className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {Array.isArray(leagueData.leagueRecords) && leagueData.leagueRecords.length > 0 ? (
                recordDisplayOrder.map(category => {
                  const record = leagueData.leagueRecords.find(r => r.record_category === category);
                  if (!record) return null;
                  return (
                    <Card key={record.record_category} className="flex flex-col p-4 gap-2 rounded-lg shadow-sm border transition-all duration-200 ease-in-out hover:scale-105 hover:shadow-lg">
                      <div className="flex items-center text-sm font-semibold text-primary">
                        {getRecordIcon(record.record_category)}
                        <span>{record.record_category}</span>
                      </div>
                      <p className="text-2xl font-bold text-foreground">
                        {record.value}
                        {(record.record_category.toLowerCase().includes("score") || record.record_category.toLowerCase().includes("points")) && typeof record.value === 'number' && " pts"}
                      </p>
                      <div className="text-xs text-muted-foreground mt-auto space-y-0.5">
                        <p>GM: {record.gm_name}</p>
                        <p>Season(s): {record.seasons}{record.week ? ` (Wk ${record.week})` : ""}</p>
                      </div>
                    </Card>
                  );
                }).filter(Boolean)
              ) : (
              <p className="text-muted-foreground">No league records available.</p>
              )}
          </CardContent>
        </Card>
      </div>
        

      <Card className="overflow-hidden">
        <CardHeader>
          <CardTitle>Final Standings Heatmap</CardTitle>
          <CardDescription>Finishing positions. 1st place is yellow. Others on a green (better) to red (worse) scale, with neutral ranks having default background.</CardDescription>
        </CardHeader>
        <CardContent className="p-0 overflow-x-auto">
          <Table className="table-auto">
            <TableHeader>
              <TableRow>
                <TableHead className="sticky left-0 bg-card z-10 p-1 text-xs md:text-sm">
                  <Button variant="ghost" onClick={() => requestHeatmapSort('gm_name')} className="px-1 group text-xs py-1">
                    GM {getSortIcon(heatmapSortConfig, 'gm_name')}
                  </Button>
                </TableHead>
                {heatmapYears.map(year => (
                  <TableHead key={year} className="p-1 border text-center text-xs whitespace-nowrap">{year}</TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {Array.isArray(sortedFinalStandingsHeatmap) && sortedFinalStandingsHeatmap.map((gmEntry: FinalStandingsHeatmapEntry) => (
                <TableRow key={gmEntry.gm_name}>
                  <TableCell className="font-medium sticky left-0 bg-card z-10 p-1 border text-xs md:text-sm whitespace-nowrap">{gmEntry.gm_name}</TableCell>
                  {heatmapYears.map(year => {
                    const rank = gmEntry[year] as number | null | undefined;
                    const { cellClasses, textClass, borderClass } = getRankStyle(rank, maxRankPerYear[year] || 0);
                    const displayValue = (rank !== undefined && rank !== null) ? rank : '-';

                    return (
                      <TableCell
                        key={year}
                        className="p-0 border text-center text-xs"
                      >
                        <div 
                          className={cn("p-0.5 h-full w-full flex items-center justify-center", cellClasses, textClass, borderClass)}
                        >
                          {displayValue}
                        </div>
                      </TableCell>
                    );
                  })}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

    <div className="grid md:grid-cols-2 gap-6">
      <Card className="overflow-hidden">
          <CardHeader>
            <CardTitle>GM Playoff Performance</CardTitle>
            <CardDescription className="text-xs mt-1">Perf % is the manager's average playoff score divided by their average regular season score during playoff seasons.</CardDescription>
          </CardHeader>
          <CardContent className="overflow-x-auto">
              <Table>
              <TableHeader>
                  <TableRow>
                  <TableHead className="px-2 py-2 text-left align-middle font-medium text-muted-foreground"><Button variant="ghost" onClick={() => requestPlayoffPerfSort('gm_name')} className="w-full justify-start px-0 group text-xs md:text-sm py-2">GM {getSortIcon(playoffPerfSortConfig, 'gm_name')}</Button></TableHead>
                  <TableHead className="px-2 py-2 text-left align-middle font-medium text-muted-foreground"><Button variant="ghost" onClick={() => requestPlayoffPerfSort('total_matchups')} className="w-full justify-start px-0 group text-xs md:text-sm py-2">Total Matchups {getSortIcon(playoffPerfSortConfig, 'total_matchups')}</Button></TableHead>
                  <TableHead className="px-2 py-2 text-left align-middle font-medium text-muted-foreground"><Button variant="ghost" onClick={() => requestPlayoffPerfSort('wins')} className="w-full justify-start px-0 group text-xs md:text-sm py-2">Wins {getSortIcon(playoffPerfSortConfig, 'wins')}</Button></TableHead>
                  <TableHead className="px-2 py-2 text-left align-middle font-medium text-muted-foreground"><Button variant="ghost" onClick={() => requestPlayoffPerfSort('losses')} className="w-full justify-start px-0 group text-xs md:text-sm py-2">Losses {getSortIcon(playoffPerfSortConfig, 'losses')}</Button></TableHead>
                  <TableHead className="px-2 py-2 text-left align-middle font-medium text-muted-foreground"><Button variant="ghost" onClick={() => requestPlayoffPerfSort('quarterfinal_matchups')} className="w-full justify-start px-0 group text-xs md:text-sm py-2">Quarterfinals {getSortIcon(playoffPerfSortConfig, 'quarterfinal_matchups')}</Button></TableHead>
                  <TableHead className="px-2 py-2 text-left align-middle font-medium text-muted-foreground"><Button variant="ghost" onClick={() => requestPlayoffPerfSort('semifinal_matchups')} className="w-full justify-start px-0 group text-xs md:text-sm py-2">Semifinals {getSortIcon(playoffPerfSortConfig, 'semifinal_matchups')}</Button></TableHead>
                  <TableHead className="px-2 py-2 text-left align-middle font-medium text-muted-foreground"><Button variant="ghost" onClick={() => requestPlayoffPerfSort('championship_matchups')} className="w-full justify-start px-0 group text-xs md:text-sm py-2">Championships {getSortIcon(playoffPerfSortConfig, 'championship_matchups')}</Button></TableHead>
                  <TableHead className="px-2 py-2 text-left align-middle font-medium text-muted-foreground"><Button variant="ghost" onClick={() => requestPlayoffPerfSort('avg_playoff_points_weekly')} className="w-full justify-start px-0 group text-xs md:text-sm py-2">Avg Pts {getSortIcon(playoffPerfSortConfig, 'avg_playoff_points_weekly')}</Button></TableHead>
                  <TableHead className="px-2 py-2 text-left align-middle font-medium text-muted-foreground">
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                           <Button variant="ghost" onClick={() => requestPlayoffPerfSort('playoff_performance_pct')} className="w-full justify-start px-0 group text-xs md:text-sm py-2">
                            Perf % {getSortIcon(playoffPerfSortConfig, 'playoff_performance_pct')}
                           </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Perf % is the manager's average playoff score divided by their average regular season score during playoff seasons.</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </TableHead>
                  </TableRow>
              </TableHeader>
              <TableBody>
                  {Array.isArray(sortedGmPlayoffPerformance) && sortedGmPlayoffPerformance.map((gmPerf: any) => (
                  <TableRow key={gmPerf.gm_name}>
                      <TableCell className="font-medium px-2 py-2 text-sm text-left">{gmPerf.gm_name}</TableCell>
                      <TableCell className="px-2 py-2 text-sm text-left">{gmPerf.total_matchups}</TableCell>
                      <TableCell className="px-2 py-2 text-sm text-left">{gmPerf.wins}</TableCell>
                      <TableCell className="px-2 py-2 text-sm text-left">{gmPerf.losses}</TableCell>
                      <TableCell className="px-2 py-2 text-sm text-left">{gmPerf.quarterfinal_matchups}</TableCell>
                      <TableCell className="px-2 py-2 text-sm text-left">{gmPerf.semifinal_matchups}</TableCell>
                      <TableCell className="px-2 py-2 text-sm text-left">{gmPerf.championship_matchups}</TableCell>
                      <TableCell className="px-2 py-2 text-sm text-left">{gmPerf.avg_playoff_points_weekly?.toFixed(1) ?? 'N/A'}</TableCell>
                      <TableCell className="px-2 py-2 text-sm text-left">{gmPerf.playoff_performance_pct_display}</TableCell>
                  </TableRow>
                  ))}
              </TableBody>
              </Table>
          </CardContent>
        </Card>
      <Card className="overflow-hidden">
        <CardHeader><CardTitle>Playoff Qualification Rate</CardTitle></CardHeader>
        <CardContent className="h-[300px] pt-6">
          <ResponsiveContainer width="100%" height="100%">
            <RechartsBarChartImport data={sortedPlayoffRates}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="gm_name" />
              <YAxis tickFormatter={(value) => `${(value * 100).toFixed(0)}%`} />
              <RechartsTooltip formatter={(value: number) => `${(value * 100).toFixed(1)}%`} />
              <RechartsLegend />
              <Bar dataKey="qualification_rate" fill="hsl(var(--chart-1))" name="Playoff Rate" />
            </RechartsBarChartImport>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
    </div>
  );
};


const getRatingBadgeClass = (rating?: string): string => {
  if (!rating) return "bg-gray-200 text-gray-800 dark:bg-gray-700 dark:text-gray-300";
  switch (rating.toLowerCase()) {
    case 'very hard':
      return 'bg-red-600 text-red-50 dark:bg-red-800 dark:text-red-100';
    case 'hard':
      return 'bg-orange-500 text-orange-50 dark:bg-orange-700 dark:text-orange-100';
    case 'above avg':
      return 'bg-yellow-400 text-yellow-800 dark:bg-yellow-600 dark:text-yellow-100';
    case 'below avg':
      return 'bg-lime-400 text-lime-800 dark:bg-lime-600 dark:text-lime-100';
    case 'easy':
      return 'bg-green-500 text-green-50 dark:bg-green-700 dark:text-green-100';
    default: 
      return 'bg-gray-200 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
  }
};

const PlayoffMatchupCard = ({
  matchup,
  roundName,
  isChampionship = false,
}: {
  matchup: PlayoffMatchup;
  roundName: string;
  isChampionship?: boolean;
}) => {
    return (
    <div className={cn("p-3 border rounded-md shadow-sm", isChampionship ? "bg-yellow-100/50 dark:bg-yellow-800/30" : "bg-card")}>
      <p className="text-sm font-semibold text-center mb-1">{roundName}</p>
      <div className="text-xs space-y-1">
        <div className="flex justify-between">
          <span>{matchup.home.seed}. {matchup.home.name} ({matchup.home.owner})</span>
          <span className="font-medium">{matchup.home.score?.toFixed(1) ?? 'N/A'}</span>
        </div>
        <div className="flex justify-between">
          <span>{matchup.away.seed}. {matchup.away.name} ({matchup.away.owner})</span>
          <span className="font-medium">{matchup.away.score?.toFixed(1) ?? 'N/A'}</span>
        </div>
        {matchup.home.score !== undefined && matchup.home.score !== null && matchup.away.score !== undefined && matchup.away.score !== null && (
          <p className="text-xs text-muted-foreground mt-1">
            Winner: {matchup.home.score > matchup.away.score ? matchup.home.owner : matchup.away.owner}
          </p>
        )}
      </div>
    </div>
)};


const SeasonDetail = () => {
  const [selectedSeason, setSelectedSeason] = useState<string | undefined>(mockSeasonsForTabs[0]?.id);
  const [seasonData, setSeasonData] = useState<SeasonDetailData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [weeklyScoresDisplayMode, setWeeklyScoresDisplayMode] = useState<'scores' | 'results'>('scores');
  const [activeSubTab, setActiveSubTab] = useState<string>("overview");


 useEffect(() => {
    if (selectedSeason) {
      setLoading(true);
      setError(null);
      setSeasonData(null); 
      const seasonFilePath = `/data/league_data/seasons/${selectedSeason}.json`;
      console.log(`[SeasonDetail] Attempting to fetch data for season: ${selectedSeason} from ${seasonFilePath}`);
      fetch(seasonFilePath)
        .then(async res => {
          console.log(`[SeasonDetail] Fetch response status for ${selectedSeason}: ${res.status} ${res.statusText}`);
          if (!res.ok) {
            let errorBody = "No additional error body from server.";
            try {
                errorBody = await res.text();
            } catch (e) { console.error("Error parsing error response body:", e); }
            const shortErrorBody = errorBody.substring(0,200);
            console.error(`[SeasonDetail] HTTP error! Status: ${res.status}. Body: ${shortErrorBody}`);
            throw new Error(`Failed to fetch ${seasonFilePath}. Status: ${res.status} ${res.statusText}. Server response: ${shortErrorBody}...`);
          }
          const jsonData: SeasonDetailData = await res.json(); 
          console.log(`[SeasonDetail] Successfully fetched and parsed data for ${selectedSeason}:`, jsonData);
          
          if (!jsonData || typeof jsonData !== 'object' || !jsonData.seasonData || !jsonData.standingsData) {
            console.error("[SeasonDetail] Fetched data is missing crucial fields (e.g. seasonData or standingsData) or is not an object. Full data:", jsonData);
            setSeasonData(null); 
            throw new Error(`Fetched data for ${selectedSeason} is incomplete or not in the expected object format. Essential fields like 'seasonData' or 'standingsData' are missing.`);
          }
          setSeasonData(jsonData);
        })
        .catch(err => {
          console.error(`[SeasonDetail] Failed to load or process season data for ${selectedSeason}:`, err);
          setError(`Failed to load data for ${selectedSeason}. Details: ${err.message}. Check browser console and ensure '${selectedSeason}.json' exists at '${seasonFilePath}' and is correctly formatted according to the SeasonDetailData interface in types.ts.`);
          setSeasonData(null);
        })
        .finally(() => {
          setLoading(false);
        });
    } else {
      setSeasonData(null);
      setLoading(false);
      setError(null);
    }
  }, [selectedSeason]);

  const getScoreCellClass = (score?: number | null): string => {
    if (score === undefined || score === null) return 'bg-muted/30 text-muted-foreground dark:bg-muted/50';
    if (score >= 140) return 'bg-green-200 text-green-800 dark:bg-green-700/50 dark:text-green-200';
    if (score >= 125) return 'bg-green-100 text-green-700 dark:bg-green-600/40 dark:text-green-300';
    if (score >= 110) return 'bg-lime-100 text-lime-700 dark:bg-lime-600/40 dark:text-lime-300';
    if (score >= 100) return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-600/40 dark:text-yellow-300';
    if (score >= 90) return 'bg-orange-100 text-orange-700 dark:bg-orange-600/40 dark:text-orange-300';
    return 'bg-red-100 text-red-700 dark:bg-red-600/40 dark:text-red-300';
  };
  
  const averageScores = useMemo(() => {
    if (!seasonData?.weeklyScoresData?.teams || !Array.isArray(seasonData.weeklyScoresData.teams) || !seasonData.weeklyScoresData.scores || !Array.isArray(seasonData.weeklyScoresData.scores)) return {};
    const averages: { [teamName: string]: number | null } = {};
    seasonData.weeklyScoresData.teams.forEach((teamName, teamIndex) => {
      let totalScore = 0;
      let gameCount = 0;
      if(seasonData.weeklyScoresData?.scores && Array.isArray(seasonData.weeklyScoresData.scores)){
        seasonData.weeklyScoresData.scores.forEach(weekScores => {
          if(Array.isArray(weekScores)){
            const score = weekScores[teamIndex];
            if (score !== null && score !== undefined) {
              totalScore += score;
              gameCount++;
            }
          }
        });
      }
      averages[teamName] = gameCount > 0 ? totalScore / gameCount : null;
    });
    return averages;
  }, [seasonData?.weeklyScoresData]);

  const weeklyScoreLegendItems = [
    { label: '140+ pts', className: 'bg-green-200 text-green-800 dark:bg-green-700/50 dark:text-green-200' },
    { label: '125-139 pts', className: 'bg-green-100 text-green-700 dark:bg-green-600/40 dark:text-green-300' },
    { label: '110-124 pts', className: 'bg-lime-100 text-lime-700 dark:bg-lime-600/40 dark:text-lime-300' },
    { label: '100-109 pts', className: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-600/40 dark:text-yellow-300' },
    { label: '90-99 pts', className: 'bg-orange-100 text-orange-700 dark:bg-orange-600/40 dark:text-orange-300' },
    { label: '<90 pts', className: 'bg-red-100 text-red-700 dark:bg-red-600/40 dark:text-red-300' },
  ];

  const weeklyResultLegendItems = [
    { label: 'Win', className: 'bg-green-100 text-green-700 dark:bg-green-800/30 dark:text-green-300 font-semibold', symbol: 'W' },
    { label: 'Loss', className: 'bg-red-100 text-red-700 dark:bg-red-800/30 dark:text-red-300 font-semibold', symbol: 'L' },
    { label: 'Tie', className: 'bg-gray-100 text-gray-700 dark:bg-gray-700/30 dark:text-gray-300 font-semibold', symbol: 'T' },
  ];


  return (
    <div className="space-y-6 w-full">
        <Card className="overflow-visible">
        <CardHeader className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex-1">
                <CardTitle className="flex items-center gap-2">
                <CalendarDays className="text-primary h-6 w-6" /> 
                 {seasonData?.seasonData?.year || selectedSeason} Season Detail
                </CardTitle>
                {seasonData?.seasonData && (
                <CardDescription className="mt-1.5">
                    Champion: {seasonData.seasonData.championName}
                    {seasonData.seasonData.runnerUp && `, Runner-up: ${seasonData.seasonData.runnerUp}`}
                    {seasonData.seasonData.teams && `. Teams: ${seasonData.seasonData.teams}`}
                </CardDescription>
                )}
            </div>
            <Select value={selectedSeason} onValueChange={setSelectedSeason}>
                <SelectTrigger className="w-full sm:w-[220px] shrink-0">
                <SelectValue placeholder="Select a season" />
                </SelectTrigger>
                <SelectContent>
                {mockSeasonsForTabs.map(season => (
                    <SelectItem key={season.id} value={season.id}>{season.year} Season</SelectItem>
                ))}
                </SelectContent>
            </Select>
          </CardHeader>
          
          {loading && (
            <CardContent className="pt-6 space-y-4">
                <Skeleton className="h-8 w-1/2 mb-2" /> 
                <Skeleton className="h-6 w-3/4 mb-4" /> 
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-2 mb-4">
                    {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}
                </div>
                {[...Array(3)].map((_, i) => (
                    <div key={i} className="space-y-2 mt-6">
                        <Skeleton className="h-6 w-1/3 mb-2" />
                        <Skeleton className="h-40 w-full" />
                    </div>
                ))}
            </CardContent>
          )}
          {error && <CardContent className="pt-6 text-destructive text-center flex flex-col items-center gap-2"><ShieldAlert size={48}/> <p>{error}</p></CardContent>}

          {!loading && !error && seasonData && (
              <CardContent className="pt-0">
                <Tabs value={activeSubTab} onValueChange={setActiveSubTab} className="w-full">
                 <TabsList className="grid w-full grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 mb-4">
                    <TabsTrigger value="overview">Overview</TabsTrigger>
                    <TabsTrigger value="weekly_performance">Weekly Performance</TabsTrigger>
                    <TabsTrigger value="strength_of_schedule">Strength of Schedule</TabsTrigger>
                    <TabsTrigger value="waiver_pickups">Waiver Pickups</TabsTrigger>
                    <TabsTrigger value="top_performers">Top Performers</TabsTrigger>
                </TabsList>

                <TabsContent value="overview" className="pt-4 space-y-6">
                    <Card>
                        <CardHeader><CardTitle className="flex items-center text-xl"><Trophy className="mr-2 h-5 w-5 text-primary"/>Season Standings</CardTitle></CardHeader>
                        <CardContent className="overflow-x-auto">
                        {seasonData.standingsData && Array.isArray(seasonData.standingsData) && seasonData.standingsData.length > 0 ? (
                            <Table>
                            <TableHeader>
                                <TableRow>
                                <TableHead className="w-[60px] text-center">POS</TableHead>
                                <TableHead>TEAM</TableHead>
                                <TableHead>OWNER</TableHead>
                                <TableHead className="text-center">W</TableHead>
                                <TableHead className="text-center">L</TableHead>
                                <TableHead className="text-right">PF</TableHead>
                                <TableHead className="text-right">PA</TableHead>
                                <TableHead className="text-center">LAST 5</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {seasonData.standingsData.map((s: SeasonStandingEntry) => (
                                <TableRow key={s.owner_name}>
                                    <TableCell className="font-medium text-center">
                                        {s.regular_season_finish}
                                    </TableCell>
                                    <TableCell>{s.wt_team_name}</TableCell>
                                    <TableCell>{s.owner_name}</TableCell>
                                    <TableCell className="text-center">{s.regular_season_wins}</TableCell>
                                    <TableCell className="text-center">{s.regular_season_losses}</TableCell>
                                    <TableCell className="text-right">{s.regular_season_points_for?.toFixed(1) ?? 'N/A'}</TableCell>
                                    <TableCell className="text-right">{s.regular_season_points_against?.toFixed(1) ?? 'N/A'}</TableCell>
                                    <TableCell className="text-center">
                                    <div className="flex justify-center space-x-1">
                                        {Array.isArray(s.lastFive) && s.lastFive.map((gameResult, index) => (
                                        <span key={index} className={cn("h-3 w-3 rounded-full inline-block", gameResult === 1 ? "bg-green-500" : gameResult === 0 ? "bg-red-500" : "bg-gray-300")} title={gameResult === 1 ? 'Win' : gameResult === 0 ? 'Loss' : 'Tie'}></span>
                                        ))}
                                    </div>
                                    </TableCell>
                                </TableRow>
                                ))}
                            </TableBody>
                            </Table>
                        ) : (
                            <p className="text-muted-foreground text-center py-4">No standings data available for {seasonData?.seasonData?.year}.</p>
                        )}
                        </CardContent>
                    </Card>
                    
                    <Card>
                        <CardHeader><CardTitle className="flex items-center text-xl"><Trophy className="mr-2 h-5 w-5 text-primary"/>Playoff Bracket</CardTitle></CardHeader>
                        <CardContent>
                        {(seasonData.playoffData && (Array.isArray(seasonData.playoffData.semiFinals) && seasonData.playoffData.semiFinals.length > 0 || Array.isArray(seasonData.playoffData.championship) && seasonData.playoffData.championship.length > 0)) ? (
                            <div className="space-y-6">
                            {seasonData.playoffData.quarterFinals && Array.isArray(seasonData.playoffData.quarterFinals) && seasonData.playoffData.quarterFinals.length > 0 && (
                                <div>
                                <h4 className="text-lg font-semibold mb-2 text-center text-foreground/80">Quarterfinals</h4>
                                <div className="grid md:grid-cols-2 gap-4">
                                    {seasonData.playoffData.quarterFinals.map((matchup, idx) => (
                                        <PlayoffMatchupCard key={`qf-${idx}`} matchup={matchup} roundName={`Quarterfinal ${idx + 1}`} />
                                    ))}
                                </div>
                                </div>
                            )}
                            {seasonData.playoffData.semiFinals && Array.isArray(seasonData.playoffData.semiFinals) && seasonData.playoffData.semiFinals.length > 0 && (
                                <div>
                                <h4 className="text-lg font-semibold mb-2 mt-4 text-center text-foreground/80">Semifinals</h4>
                                <div className="grid md:grid-cols-2 gap-4">
                                    {seasonData.playoffData.semiFinals.map((matchup, idx) => (
                                    <PlayoffMatchupCard key={`sf-${idx}`} matchup={matchup} roundName={`Semifinal ${idx + 1}`} />
                                    ))}
                                </div>
                                </div>
                            )}
                            {seasonData.playoffData.championship && Array.isArray(seasonData.playoffData.championship) && seasonData.playoffData.championship.length > 0 && (
                                <div className="mt-4">
                                <h4 className="text-lg font-semibold mb-2 text-center text-foreground/80">Championship</h4>
                                <div className="max-w-md mx-auto">
                                    {seasonData.playoffData.championship.map((matchup, idx) => (
                                    <PlayoffMatchupCard key={`champ-${idx}`} matchup={matchup} roundName="Championship Game" isChampionship />
                                    ))}
                                </div>
                                <div className="text-center mt-4">
                                    <p className="text-lg font-semibold">League Champion:</p>
                                    <p className="text-xl text-primary font-bold flex items-center justify-center">
                                    <Trophy className="mr-2 h-6 w-6 text-yellow-500" />
                                    {seasonData.seasonData.championName}
                                    </p>
                                </div>
                                </div>
                            )}
                            </div>
                        ) : (
                            <p className="text-muted-foreground text-center py-4">No playoff matchup data available for {seasonData?.seasonData?.year}.</p>
                        )}
                        </CardContent>
                    </Card>
                </TabsContent>

               <TabsContent value="weekly_performance" className="pt-4 space-y-4">
                    <Card>
                        <CardHeader className="flex flex-col sm:flex-row items-center justify-between">
                            <CardTitle className="flex items-center text-xl">
                                <BarChart2 className="mr-2 h-5 w-5 text-primary" />
                                Weekly Performance
                            </CardTitle>
                             <RadioGroup
                                value={weeklyScoresDisplayMode}
                                onValueChange={(value) => setWeeklyScoresDisplayMode(value as 'scores' | 'results')}
                                className="flex items-center space-x-2 mt-3 sm:mt-0"
                            >
                                <div className="flex items-center space-x-1">
                                    <RadioGroupItem value="scores" id="scores-mode-radio" />
                                    <Label htmlFor="scores-mode-radio" className="text-sm cursor-pointer">Scores</Label>
                                </div>
                                <div className="flex items-center space-x-1">
                                    <RadioGroupItem value="results" id="results-mode-radio" />
                                    <Label htmlFor="results-mode-radio" className="text-sm cursor-pointer">W/L</Label>
                                </div>
                            </RadioGroup>
                        </CardHeader>
                        <CardContent>
                            {seasonData.weeklyScoresData && Array.isArray(seasonData.weeklyScoresData.teams) && seasonData.weeklyScoresData.teams.length > 0 && Array.isArray(seasonData.weeklyScoresData.scores) && Array.isArray(seasonData.weeklyScoresData.results) ? (
                                <>
                                <div className="overflow-x-auto">
                                    <Table className="min-w-full table-fixed">
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead className="sticky left-0 bg-card dark:bg-background z-10 w-1/6 min-w-[150px] text-left align-middle p-0.5">
                                                    <div className="p-1.5 text-xs rounded-md w-full h-full flex items-center justify-start font-semibold truncate" title="Team">TEAM</div>
                                                </TableHead>
                                                {seasonData.weeklyScoresData.scores.map((_, weekIndex) => (
                                                    <TableHead key={`wk-header-${weekIndex}`} className="text-center min-w-[60px] align-middle p-1.5 font-semibold">{`W${weekIndex + 1}`}</TableHead>
                                                ))}
                                                <TableHead className="text-center min-w-[70px] align-middle p-1.5 font-semibold">AVG</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {seasonData.weeklyScoresData.teams.map((teamName, teamIndex) => (
                                                <TableRow key={teamName}>
                                                    <TableCell className="sticky left-0 bg-card dark:bg-background z-10 font-medium text-left truncate align-middle p-0.5" title={teamName}>
                                                        <div className="p-1.5 text-xs rounded-md w-full h-full flex items-center justify-start truncate">
                                                            {teamName}
                                                        </div>
                                                    </TableCell>
                                                    {seasonData.weeklyScoresData!.scores.map((weekScores, weekIndex) => {
                                                        const score = Array.isArray(weekScores) ? weekScores[teamIndex] : undefined;
                                                        const result = Array.isArray(seasonData.weeklyScoresData!.results) && Array.isArray(seasonData.weeklyScoresData!.results[weekIndex]) ? seasonData.weeklyScoresData!.results[weekIndex][teamIndex] : undefined;
                                                        
                                                        let cellContent;
                                                        let innerDivClasses = "p-1.5 text-xs rounded-md w-full h-full flex items-center justify-center";

                                                        if (weeklyScoresDisplayMode === 'scores') {
                                                            cellContent = score?.toFixed(1) ?? '-';
                                                            innerDivClasses = cn(innerDivClasses, getScoreCellClass(score));
                                                        } else { 
                                                            if (result === 'W') {
                                                                cellContent = <span className="font-semibold">W</span>;
                                                                innerDivClasses = cn(innerDivClasses, "bg-green-100 text-green-700 dark:bg-green-800/30 dark:text-green-300 font-semibold");
                                                            } else if (result === 'L') {
                                                                cellContent = <span className="font-semibold">L</span>;
                                                                innerDivClasses = cn(innerDivClasses, "bg-red-100 text-red-700 dark:bg-red-800/30 dark:text-red-300 font-semibold");
                                                            } else if (result === 'T') {
                                                                cellContent = <span className="font-semibold">T</span>;
                                                                innerDivClasses = cn(innerDivClasses, "bg-gray-100 text-gray-700 dark:bg-gray-700/30 dark:text-gray-300 font-semibold");
                                                            } else {
                                                                cellContent = '-';
                                                                innerDivClasses = cn(innerDivClasses, "bg-muted/30 text-muted-foreground dark:bg-muted/50");
                                                            }
                                                        }
                                                        return (
                                                            <TableCell key={`wk-${weekIndex}-team-${teamIndex}`} className="p-0.5 align-middle">
                                                              <div className={innerDivClasses}>{cellContent}</div>
                                                            </TableCell>
                                                        );
                                                    })}
                                                    <TableCell className="p-0.5 align-middle">
                                                      <div className={cn("p-1.5 text-center text-xs rounded-md font-semibold w-full h-full flex items-center justify-center", getScoreCellClass(averageScores[teamName]))}>
                                                          {averageScores[teamName]?.toFixed(1) ?? 'N/A'}
                                                      </div>
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </div>
                                <div className="mt-4 flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-xs">
                                    {weeklyScoresDisplayMode === 'scores' ? 
                                        weeklyScoreLegendItems.map(item => (
                                            <div key={item.label} className="flex items-center gap-1.5">
                                                <span className={cn("h-3 w-5 rounded-sm", item.className.split(' ').find(cls => cls.startsWith('bg-')))}></span>
                                                <span>{item.label}</span>
                                            </div>
                                        )) :
                                        weeklyResultLegendItems.map(item => (
                                            <div key={item.label} className="flex items-center gap-1.5">
                                                <span className={cn("h-3 w-5 rounded-sm flex items-center justify-center font-semibold text-xs", item.className.split(' ').filter(cls => !cls.startsWith('dark:')))}>
                                                    {item.symbol}
                                                </span>
                                                <span>{item.label}</span>
                                            </div>
                                        ))
                                    }
                                </div>
                                </>
                            ) : (
                                <p className="text-muted-foreground text-center py-4">No weekly scores data available for {seasonData?.seasonData?.year}.</p>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>
                
                <TabsContent value="strength_of_schedule" className="pt-4 space-y-6">
                    <Card>
                          <CardHeader>
                              <CardTitle className="flex items-center"><LineChartIconRecharts className="mr-2 h-5 w-5 text-primary"/>Strength of Schedule</CardTitle>
                              <CardDescription>This analysis shows which teams faced the toughest or easiest schedules based on their opponents' average points per game compared to the league average.</CardDescription>
                          </CardHeader>
                          <CardContent className="overflow-x-auto">
                              {seasonData.strengthOfScheduleData && Array.isArray(seasonData.strengthOfScheduleData) && seasonData.strengthOfScheduleData.length > 0 ? (
                              <>
                                  <Table>
                                      <TableHeader>
                                      <TableRow>
                                          <TableHead className="text-left">RANK</TableHead>
                                          <TableHead className="text-left">TEAM</TableHead>
                                          <TableHead className="text-left">OWNER</TableHead>
                                          <TableHead className="text-right">OPP PPG</TableHead>
                                          <TableHead className="text-right">LG AVG</TableHead>
                                          <TableHead className="text-right">DIFF</TableHead>
                                          <TableHead className="text-center">RATING</TableHead>
                                      </TableRow>
                                      </TableHeader>
                                      <TableBody>
                                      {seasonData.strengthOfScheduleData.map((sos: StrengthOfScheduleEntry) => (
                                          <TableRow key={sos.owner}>
                                          <TableCell className="text-left">{sos.rank}</TableCell>
                                          <TableCell className="text-left">{sos.team}</TableCell>
                                          <TableCell className="text-left">{sos.owner}</TableCell>
                                          <TableCell className="text-right">{sos.actualOpponentsPpg?.toFixed(1) ?? 'N/A'}</TableCell>
                                          <TableCell className="text-right">{sos.leagueAvgPpg?.toFixed(1) ?? 'N/A'}</TableCell>
                                          <TableCell className={cn("text-right font-semibold", sos.differential != null && sos.differential > 0 ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400')}>
                                              {sos.differential != null && sos.differential > 0 ? '+' : ''}{sos.differential?.toFixed(1) ?? 'N/A'}
                                          </TableCell>
                                          <TableCell className="text-center">
                                              <Badge variant="outline" className={cn("text-xs", getRatingBadgeClass(sos.rating))}>
                                                  {sos.rating || '-'}
                                              </Badge>
                                          </TableCell>
                                          </TableRow>
                                      ))}
                                      </TableBody>
                                  </Table>
                                  <p className="text-xs text-muted-foreground mt-4">
                                      Diff: Positive numbers indicate a tougher schedule (opponents scored more than league average). Ranked hardest to easiest.
                                  </p>
                              </>
                              ) : (
                              <p className="text-muted-foreground text-center py-4">Strength of Schedule data not available for {seasonData?.seasonData?.year}.</p>
                              )}
                          </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="waiver_pickups" className="pt-4 space-y-6">
                    <Card>
                          <CardHeader>
                              <CardTitle className="flex items-center">
                                  <ClipboardList className="mr-2 h-5 w-5 text-primary"/>Best Waiver Wire Pickups
                              </CardTitle>
                          </CardHeader>
                          <CardContent className="overflow-x-auto">
                              {seasonData.waiverPickupsData && Array.isArray(seasonData.waiverPickupsData) && seasonData.waiverPickupsData.length > 0 ? (
                              <>
                                  <Table>
                                      <TableHeader>
                                          <TableRow>
                                              <TableHead>#</TableHead>
                                              <TableHead>Player</TableHead>
                                              <TableHead>POS</TableHead>
                                              <TableHead>Team</TableHead>
                                              {selectedSeason && parseInt(selectedSeason) >= 2019 && <TableHead>Picked Up By</TableHead>}
                                              {selectedSeason && parseInt(selectedSeason) >= 2019 && <TableHead>Week</TableHead>}
                                              <TableHead className="text-right">Total Points</TableHead>
                                          </TableRow>
                                      </TableHeader>
                                      <TableBody>
                                          {seasonData.waiverPickupsData.map((pickup: WaiverPickupEntry, index) => (
                                              <TableRow key={pickup.player + index}>
                                                  <TableCell>{pickup.rank ?? index + 1}</TableCell>
                                                  <TableCell>{pickup.player}</TableCell>
                                                  <TableCell>
                                                      <Badge variant="outline" className={cn("text-xs font-semibold", getPositionBadgeClass(pickup.position))}>
                                                          {pickup.position}
                                                      </Badge>
                                                  </TableCell>
                                                  <TableCell>{pickup.team}</TableCell>
                                                  {selectedSeason && parseInt(selectedSeason) >= 2019 && <TableCell>{pickup.pickedUpBy ?? '-'}</TableCell>}
                                                  {selectedSeason && parseInt(selectedSeason) >= 2019 && <TableCell>{pickup.week ?? '-'}</TableCell>}
                                                  <TableCell className="text-right">{pickup.totalPoints?.toFixed(1) ?? '-'}</TableCell>
                                              </TableRow>
                                          ))}
                                      </TableBody>
                                  </Table>
                                  <p className="text-xs text-muted-foreground mt-4">
                                      Top valuable pickups based on total points scored after acquisition week. Assumes standard scoring.
                                  </p>
                              </>
                              ) : (
                              <p className="text-muted-foreground text-center py-4">Waiver pickup data not available for {seasonData?.seasonData?.year}.</p>
                              )}
                          </CardContent>
                    </Card>
                </TabsContent>
                <TabsContent value="top_performers" className="pt-4 space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center text-lg">
                                <BarChart2 className="mr-2 h-5 w-5 text-primary" />
                                Top Performers by Position
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            {seasonData.topPerformersData && typeof seasonData.topPerformersData === 'object' && Object.keys(seasonData.topPerformersData).length > 0 ? (
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                    {Object.entries(seasonData.topPerformersData).map(([position, players], posIndex) => (
                                        Array.isArray(players) && players.length > 0 ? (
                                            <div key={position} className="rounded-lg border bg-card text-card-foreground shadow-sm p-4">
                                                <div className="flex items-center gap-2 mb-3">
                                                    <span className={cn("h-3 w-3 rounded-sm", getPositionBadgeClass(position).split(' ').find(cls => cls.startsWith('bg-')))} ></span>
                                                    <h4 className="text-md font-semibold text-foreground">{getPositionName(position)}</h4>
                                                </div>
                                                <div className="space-y-1 text-sm">
                                                    {players.slice(0, 5).map((player: TopPerformerPlayer, idx: number) => {
                                                      const currentSeasonYear = seasonData.seasonData?.year;
                                                      let teamDisplay: string;
                                                      if (currentSeasonYear && currentSeasonYear <= 2018) {
                                                          teamDisplay = `(${player.team})`;
                                                      } else {
                                                          teamDisplay = `(${player.fantasyTeam || 'Unmanaged'})`;
                                                      }
                                                      return (
                                                        <div key={`${position}-${idx}-${player.player}`} className="flex justify-between items-center py-1.5 border-b last:border-b-0 dark:border-border/50">
                                                            <div className="flex items-center gap-1.5">
                                                                <span className="mr-1.5 font-medium">{idx + 1}.</span>
                                                                <span>{player.player} {teamDisplay}</span>
                                                            </div>
                                                            <span className="font-medium">{player.totalPoints?.toFixed(1) ?? 'N/A'}</span>
                                                        </div>
                                                      );
                                                    })}
                                                </div>
                                            </div>
                                        ) : null
                                    ))}
                                </div>
                            ) : (
                                <p className="text-muted-foreground text-center py-4">No top performer data available for {seasonData?.seasonData?.year}.</p>
                            )}
                        </CardContent>
                    </Card>

                    {seasonData.bestOverallGamesData && Array.isArray(seasonData.bestOverallGamesData) && seasonData.bestOverallGamesData.length > 0 && (
                        <Card className="mt-6">
                            <CardHeader>
                                <CardTitle className="flex items-center text-lg">
                                    <Zap className="mr-2 h-5 w-5 text-primary" />
                                    Best Single-Game Performances
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="overflow-x-auto">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>RANK</TableHead>
                                            <TableHead>PLAYER</TableHead>
                                            <TableHead>POS</TableHead>
                                            <TableHead>TEAM</TableHead>
                                            <TableHead>FANTASY TEAM</TableHead>
                                            <TableHead className="text-center">WEEK</TableHead>
                                            <TableHead className="text-right">POINTS</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {seasonData.bestOverallGamesData.map((game: SeasonBestOverallGameEntry) => {
                                          const currentSeasonYear = seasonData.seasonData?.year;
                                          let fantasyTeamDisplay: string;
                                          if (currentSeasonYear && currentSeasonYear <= 2018) {
                                            fantasyTeamDisplay = "-";
                                          } else {
                                            fantasyTeamDisplay = game.fantasyTeam || 'Unmanaged';
                                          }
                                          return (
                                            <TableRow key={game.rank}>
                                                <TableCell>{game.rank}</TableCell>
                                                <TableCell>{game.player}</TableCell>
                                                <TableCell>
                                                    <Badge variant="outline" className={cn("text-xs font-semibold", getPositionBadgeClass(game.position))}>
                                                        {game.position}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell>{game.team}</TableCell>
                                                <TableCell>{fantasyTeamDisplay}</TableCell>
                                                <TableCell className="text-center">{game.week}</TableCell>
                                                <TableCell className="text-right">{game.points?.toFixed(1) ?? 'N/A'}</TableCell>
                                            </TableRow>
                                          );
                                        })}
                                    </TableBody>
                                </Table>
                            </CardContent>
                        </Card>
                    )}
                </TabsContent>

                </Tabs>
            </CardContent>
          )}
          {!loading && !error && !seasonData && selectedSeason && (
            <CardContent className="pt-6 text-center text-muted-foreground">No data found for the {selectedSeason} season. Please ensure the file '{selectedSeason}.json' exists in '/data/league_data/seasons/' and is correctly formatted according to the expected structure. Also check browser console for fetch errors.</CardContent>
          )}
          {!loading && !error && !seasonData && !selectedSeason && (
            <CardContent className="pt-6 text-center text-muted-foreground">Please select a season to view details.</CardContent>
          )}
        </Card>
    </div>
  );
};

const GM_CHART_COLORS = {
  GM_STARTED_PTS: 'hsl(var(--primary))', 
  LEAGUE_AVG_PTS: 'hsl(var(--chart-2))',  
};

const CustomPieTooltip = ({ active, payload }: any ) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload as { positionName: string; percentage: number; actualPoints: number; }; 
    const color = CHART_COLORS[data.positionName?.toUpperCase() || 'DEFAULT'] || CHART_COLORS.DEFAULT;
    return (
      <div className="p-2 bg-background border rounded-md shadow-md">
        <p className="text-sm" style={{ color }}>
          {`${data.positionName} ${data.percentage.toFixed(1)}% : ${data.actualPoints.toFixed(1)}`}
        </p>
      </div>
    );
  }
  return null;
};


const SeasonPerformanceCard = ({ performance, year, gmName }: { performance: GMSeasonSummary['seasonPerformance']; year: string, gmName?: string }) => {
    const winRate = (performance.wins + performance.losses + (performance.ties || 0) > 0) 
      ? (performance.wins / (performance.wins + performance.losses + (performance.ties || 0))) * 100 
      : 0;
      
    let sosDifferentialColor = "text-foreground";
    if (performance.sosDifferential != null) {
        sosDifferentialColor = performance.sosDifferential < 0 ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"; 
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center text-lg">
                    <Award className="mr-2 h-5 w-5 text-primary" /> {year} Season Performance
                </CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
                <div className="flex flex-col items-center text-center p-2 rounded-md bg-muted/50 dark:bg-muted/30">
                    <span className="text-xs uppercase text-muted-foreground font-medium">Record</span>
                    <span className="text-2xl font-bold">{performance.wins}-{performance.losses}{performance.ties && performance.ties > 0 ? `-${performance.ties}` : ''}</span>
                    <span className="text-xs text-muted-foreground">{winRate.toFixed(1)}% Win Rate</span>
                </div>
                <div className="flex flex-col items-center text-center p-2 rounded-md bg-muted/50 dark:bg-muted/30">
                    <span className="text-xs uppercase text-muted-foreground font-medium">Avg PPG</span>
                    <span className="text-2xl font-bold">{performance.avgPointsPerGame?.toFixed(1)}</span>
                    <span className="text-xs text-muted-foreground">Total: {performance.pointsFor?.toFixed(0)}</span>
                </div>
                <div className="flex flex-col items-center text-center p-2 rounded-md bg-muted/50 dark:bg-muted/30">
                    <span className="text-xs uppercase text-muted-foreground font-medium">Reg. Season Finish</span>
                    <span className="text-2xl font-bold">#{performance.regularSeasonFinish}</span>
                </div>
                <div className="flex flex-col items-center text-center p-2 rounded-md bg-muted/50 dark:bg-muted/30">
                    <span className="text-xs uppercase text-muted-foreground font-medium">Final Standing</span>
                    <span className="text-2xl font-bold">#{performance.finalStanding}</span>
                    {performance.finalStanding === 1 && <Badge className="mt-1 bg-primary text-primary-foreground">Champion</Badge>}
                </div>
                 <div className="flex flex-col items-center text-center p-2 rounded-md bg-muted/50 dark:bg-muted/30">
                    <span className="text-xs uppercase text-muted-foreground font-medium">Strength of Schedule</span>
                    <span className={cn("text-2xl font-bold", sosDifferentialColor)}>
                        {performance.sosDifferential != null && performance.sosDifferential >= 0 ? '+' : ''}{performance.sosDifferential?.toFixed(1) ?? 'N/A'}
                    </span>
                    <span className="text-xs text-muted-foreground">{performance.sosRating ?? 'N/A'}</span>
                </div>
            </CardContent>
        </Card>
    );
};


const GameByGameTable = ({ games, gmName }: { games: GMGameByGame[]; gmName?: string }) => (
    <Card className="mt-6">
      <CardHeader>
        <CardTitle className="flex items-center text-lg">
            <ListChecks className="mr-2 h-5 w-5 text-primary" /> Game-by-Game Breakdown
        </CardTitle>
      </CardHeader>
      <CardContent className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="text-center">Week</TableHead>
              <TableHead>Opponent</TableHead>
              <TableHead className="text-right">Points</TableHead>
              <TableHead className="text-right">Opp. Pts</TableHead>
              <TableHead className="text-center">Result</TableHead>
              <TableHead className="text-right">Diff</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {Array.isArray(games) && games.map((game) => (
              <TableRow key={game.week}>
                <TableCell className="text-center">{game.week}</TableCell>
                <TableCell>{game.opponent}</TableCell>
                <TableCell className="text-right">{game.points?.toFixed(1)}</TableCell>
                <TableCell className="text-right">{game.opponent_points?.toFixed(1)}</TableCell>
                <TableCell className="text-center">
                  <Badge 
                    className={cn(
                        "font-semibold",
                        game.result === 'W' && "bg-green-100 text-green-700 dark:bg-green-800/30 dark:text-green-300",
                        game.result === 'L' && "bg-red-100 text-red-700 dark:bg-red-800/30 dark:text-red-300",
                        game.result === 'T' && "bg-gray-100 text-gray-700 dark:bg-gray-700/30 dark:text-gray-300"
                    )}
                  >
                    {game.result}
                  </Badge>
                </TableCell>
                <TableCell className={cn("text-right", typeof game.difference === 'number' && game.difference >= 0 ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400")}>
                  {typeof game.difference === 'number' && game.difference >= 0 ? '+' : ''}{game.difference?.toFixed(1)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
        <CardContent className="pt-4">
        <h4 className="text-md font-semibold mb-2 text-center">Weekly Scoring Trend</h4>
        <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
                <RechartsLineChartImport data={games} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="week" tickFormatter={(tick) => `Wk ${tick}`} />
                    <YAxis domain={['auto', 'auto']} />
                    <RechartsTooltip />
                    <RechartsLegend verticalAlign="bottom" wrapperStyle={{paddingTop: "10px"}}/>
                    <Line type="monotone" dataKey="points" name={`${gmName || 'GM'} Points`} stroke="hsl(var(--primary))" strokeWidth={2} activeDot={{ r: 6 }} />
                    <Line type="monotone" dataKey="opponent_points" name="Opponent Points" stroke="hsl(var(--chart-3))" strokeWidth={2} activeDot={{ r: 6 }} />
                </RechartsLineChartImport>
            </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
);

type RosterSortConfig = SortConfig<GMRosterPlayer>;

const RosterPlayersTable = ({ players }: { players: GMRosterPlayer[] }) => {
  const [sortConfig, setSortConfig] = useState<RosterSortConfig>({ key: 'totalPoints', direction: 'desc' });

  const requestSort = (key: keyof GMRosterPlayer) => {
    let direction: SortDirection = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const getSortIconForRoster = (columnKey: keyof GMRosterPlayer) => {
    if (sortConfig.key === columnKey) {
      return <ArrowUpDown className="ml-1 h-3 w-3 shrink-0 opacity-50 group-hover:opacity-100 transition-opacity" />;
    }
    return <ArrowUpDown className="ml-1 h-3 w-3 shrink-0 opacity-0 group-hover:opacity-50 transition-opacity" />;
  };

  const sortedPlayers = useMemo(() => {
    if (!Array.isArray(players)) return [];
    let sortableItems = [...players];
    if (sortConfig.key) {
      sortableItems.sort((a, b) => {
        const valA = a[sortConfig.key as keyof GMRosterPlayer];
        const valB = b[sortConfig.key as keyof GMRosterPlayer];
        let comparison = 0;

        if (valA === null || valA === undefined) comparison = 1;
        else if (valB === null || valB === undefined) comparison = -1;
        else if (typeof valA === 'number' && typeof valB === 'number') {
          comparison = valA - valB;
        } else {
          comparison = String(valA).localeCompare(String(valB));
        }
        return sortConfig.direction === 'asc' ? comparison : -comparison;
      });
    }
    return sortableItems;
  }, [players, sortConfig]);


  return (
    <Card className="mt-6">
      <CardHeader><CardTitle className="flex items-center text-lg"><Users className="mr-2 h-5 w-5 text-primary"/>Roster &amp; Player Performance</CardTitle></CardHeader>
      <CardContent className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Player</TableHead>
              <TableHead className="text-center">Position</TableHead>
              <TableHead className="text-center">Finish</TableHead>
              <TableHead className="text-center">
                <Button variant="ghost" size="sm" onClick={() => requestSort('gamesStarted')} className="px-1 group text-xs justify-center w-full">
                    Games Started {getSortIconForRoster('gamesStarted')}
                </Button>
              </TableHead>
              <TableHead className="text-right">
                <Button variant="ghost" size="sm" onClick={() => requestSort('totalPoints')} className="px-1 group text-xs justify-end w-full">
                    Total Points {getSortIconForRoster('totalPoints')}
                </Button>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedPlayers.map((player) => (
              <TableRow key={player.id}>
                <TableCell>{player.name}</TableCell>
                <TableCell className="text-center"><Badge variant="outline" className={getPositionBadgeClass(player.position)}>{player.position}</Badge></TableCell>
                <TableCell className="text-center">{player.finish ?? 'N/A'}</TableCell>
                <TableCell className="text-center">{player.gamesStarted ?? 'N/A'}</TableCell>
                <TableCell className="text-right">{player.totalPoints?.toFixed(1)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};

type PlayerPerfSortConfig = SortConfig<GMPlayerSummaryPerformanceEntry>;

const PlayerPerformanceDetailsTable = ({ players }: { players: GMPlayerSummaryPerformanceEntry[] }) => {
  const [sortConfig, setSortConfig] = useState<PlayerPerfSortConfig>({ key: 'avgDifference', direction: 'desc' });

  const requestSort = (key: keyof GMPlayerSummaryPerformanceEntry) => {
    let direction: SortDirection = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const getSortIconForPlayerPerf = (columnKey: keyof GMPlayerSummaryPerformanceEntry) => {
    if (sortConfig.key === columnKey) {
      return <ArrowUpDown className="ml-1 h-3 w-3 shrink-0 opacity-50 group-hover:opacity-100 transition-opacity" />;
    }
    return <ArrowUpDown className="ml-1 h-3 w-3 shrink-0 opacity-0 group-hover:opacity-50 transition-opacity" />;
  };
  
  const sortedPlayerPerfData = useMemo(() => {
    if (!Array.isArray(players)) return [];
    let sortableItems = [...players];
    if (sortConfig.key) {
        sortableItems.sort((a,b) => {
            const valA = a[sortConfig.key!];
            const valB = b[sortConfig.key!];
            let comparison = 0;
            if (valA === null || valA === undefined) comparison = 1;
            else if (valB === null || valB === undefined) comparison = -1;
            else if (typeof valA === 'number' && typeof valB === 'number') {
              comparison = valA - valB;
            } else {
              comparison = String(valA).localeCompare(String(valB));
            }
            return sortConfig.direction === 'asc' ? comparison : -comparison;
        });
    }
    return sortableItems;
  }, [players, sortConfig]);

  return (
     <Card>
        <CardHeader>
            <CardTitle className="flex items-center text-lg">
                <Users className="mr-2 h-5 w-5 text-primary" /> Player Performance Details
            </CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead><Button variant="ghost" size="sm" onClick={() => requestSort('name')} className="px-1 group text-xs justify-start">Player {getSortIconForPlayerPerf('name')}</Button></TableHead>
                        <TableHead className="text-center"><Button variant="ghost" size="sm" onClick={() => requestSort('position')} className="px-1 group text-xs justify-center w-full">POS {getSortIconForPlayerPerf('position')}</Button></TableHead>
                        <TableHead className="text-right"><Button variant="ghost" size="sm" onClick={() => requestSort('avgActual')} className="px-1 group text-xs justify-end w-full">Avg Actual {getSortIconForPlayerPerf('avgActual')}</Button></TableHead>
                        <TableHead className="text-right"><Button variant="ghost" size="sm" onClick={() => requestSort('avgProjected')} className="px-1 group text-xs justify-end w-full">Avg Proj {getSortIconForPlayerPerf('avgProjected')}</Button></TableHead>
                        <TableHead className="text-right"><Button variant="ghost" size="sm" onClick={() => requestSort('avgDifference')} className="px-1 group text-xs justify-end w-full">Avg Diff {getSortIconForPlayerPerf('avgDifference')}</Button></TableHead>
                        <TableHead className="text-right"><Button variant="ghost" size="sm" onClick={() => requestSort('percentBeatProjection')} className="px-1 group text-xs justify-end w-full">% Beat Proj {getSortIconForPlayerPerf('percentBeatProjection')}</Button></TableHead>
                        <TableHead className="text-center"><Button variant="ghost" size="sm" onClick={() => requestSort('boomWeeks')} className="px-1 group text-xs justify-center w-full">Boom {getSortIconForPlayerPerf('boomWeeks')}</Button></TableHead>
                        <TableHead className="text-center"><Button variant="ghost" size="sm" onClick={() => requestSort('bustWeeks')} className="px-1 group text-xs justify-center w-full">Bust {getSortIconForPlayerPerf('bustWeeks')}</Button></TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {sortedPlayerPerfData.map((player) => (
                        <TableRow key={player.playerId}>
                            <TableCell>{player.name}</TableCell>
                            <TableCell className="text-center">
                                <Badge variant="outline" className={cn("text-xs", getPositionBadgeClass(player.position))}>
                                    {player.position}
                                </Badge>
                            </TableCell>
                            <TableCell className="text-right">{player.avgActual?.toFixed(1) ?? 'N/A'}</TableCell>
                            <TableCell className="text-right">{player.avgProjected?.toFixed(1) ?? 'N/A'}</TableCell>
                            <TableCell className={cn("text-right font-semibold", typeof player.avgDifference === 'number' && player.avgDifference >= 0 ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400")}>
                                {typeof player.avgDifference === 'number' && player.avgDifference >= 0 ? '+' : ''}{player.avgDifference?.toFixed(1) ?? 'N/A'}
                            </TableCell>
                            <TableCell className="text-right">{player.percentBeatProjection?.toFixed(1) ?? 'N/A'}%</TableCell>
                            <TableCell className="text-center text-green-600 dark:text-green-400 font-semibold">{player.boomWeeks ?? 'N/A'}</TableCell>
                            <TableCell className="text-center text-red-600 dark:text-red-400 font-semibold">{player.bustWeeks ?? 'N/A'}</TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </CardContent>
    </Card>
  );
};


const GMCareer = () => {
  const [selectedGmId, setSelectedGmId] = useState<string | undefined>(mockGmsForTabs[0]?.id);
  const [gmData, setGmData] = useState<GMCareerData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [selectedViewOption, setSelectedViewOption] = useState<string>("all-seasons"); 
  const [gmIndividualSeasonData, setGmIndividualSeasonData] = useState<GMIndividualSeasonDetailData | null>(null);
  const [loadingGmIndividualSeason, setLoadingGmIndividualSeason] = useState(false);
  const [errorGmIndividualSeason, setErrorGmIndividualSeason] = useState<string | null>(null);
  const [activeGmSeasonTab, setActiveGmSeasonTab] = useState<string>("season-summary");
  
  useEffect(() => {
    if (selectedGmId) {
      setLoading(true);
      setError(null);
      setGmData(null);
      setGmIndividualSeasonData(null); 
      setErrorGmIndividualSeason(null);

      const gmInfoFromMock = mockGmsForTabs.find(g => g.id === selectedGmId);
      const gmSlug = gmInfoFromMock?.name.toLowerCase().replace(/\s+/g, '') || selectedGmId; 
      const gmFilePath = `/data/league_data/${gmSlug}/${gmSlug}.json`;
      
      console.log(`[GMCareer] Attempting to fetch data for GM: ${selectedGmId} (slug: ${gmSlug}) from ${gmFilePath}`);
      fetch(gmFilePath)
        .then(async res => {
          console.log(`[GMCareer] Fetch response status for ${gmSlug}: ${res.status} ${res.statusText}`);
          if (!res.ok) {
            let errorBody = "No additional error body from server.";
            try { errorBody = await res.text(); } catch (e) { console.error("Error parsing error response body:", e); }
            const shortErrorBody = errorBody.substring(0,200);
            console.error(`[GMCareer] HTTP error! Status: ${res.status}. Body: ${shortErrorBody}`);
            throw new Error(`Failed to fetch ${gmFilePath}. Status: ${res.status} ${res.statusText}. Server response: ${shortErrorBody}...`);
          }
          const data: GMCareerData = await res.json();
          console.log(`[GMCareer] Successfully fetched and parsed data for ${gmSlug}:`, data);
          
          if (!data || !data.gmInfo || !data.careerStats || !data.seasonProgression) {
            console.error("[GMCareer] Fetched data is missing crucial fields (gmInfo, careerStats, or seasonProgression). Full data:", data);
            setGmData(null);
            throw new Error(`Fetched data for ${gmSlug} is incomplete.`);
          }
          setGmData(data);
           if (selectedViewOption !== "all-seasons" && data.gmInfo && data.gmInfo.id && data.gmInfo.slug) {
             fetchIndividualSeasonData(data.gmInfo.slug, data.gmInfo.id, selectedViewOption);
           } else if (selectedViewOption === "all-seasons") {
             setGmIndividualSeasonData(null); 
           }
        })
        .catch(err => {
          console.error(`[GMCareer] Failed to load or process GM data for ${gmSlug} from ${gmFilePath}:`, err);
          setError(`Failed to load data for GM '${mockGmsForTabs.find(g => g.id === selectedGmId)?.name || gmSlug}'. Details: ${err.message}. Check console and ensure '${gmFilePath}' exists and is correctly formatted.`);
          setGmData(null); 
        })
        .finally(() => {
          setLoading(false);
        });
    } else {
        setGmData(null);
        setLoading(false);
        setError(null);
        setGmIndividualSeasonData(null);
    }
  }, [selectedGmId]); 


  const fetchIndividualSeasonData = (gmSlug: string, gmNumericId: number, year: string) => {
      setLoadingGmIndividualSeason(true);
      setErrorGmIndividualSeason(null);
      setGmIndividualSeasonData(null); 
      setActiveGmSeasonTab("season-summary"); 

      const seasonDetailFilePath = `/data/league_data/${gmSlug}/gm_career_${gmNumericId}_${year}.json`;

      console.log(`[GMCareer-IndividualSeason] Attempting to fetch: ${seasonDetailFilePath}`);
      fetch(seasonDetailFilePath)
        .then(async res => {
          console.log(`[GMCareer-IndividualSeason] Fetch response for ${seasonDetailFilePath}: ${res.status} ${res.statusText}`);
          if (!res.ok) {
            let errorBody = "No additional error body from server.";
            try { errorBody = await res.text(); } catch (e) { console.error("Error parsing error response body:", e); }
            const shortErrorBody = errorBody.substring(0,200);
            console.error(`[GMCareer-IndividualSeason] HTTP error! Status: ${res.status}. Body: ${shortErrorBody}`);
            throw new Error(`Failed to fetch ${seasonDetailFilePath}. Status: ${res.status} ${res.statusText}. Server: ${shortErrorBody}...`);
          }
          const data: GMIndividualSeasonDetailData = await res.json();
          console.log(`[GMCareer-IndividualSeason] Successfully fetched and parsed data for ${seasonDetailFilePath}:`, data);
          if (!data || !data.seasonSummary || !data.rosterBreakdown) { 
              console.error("[GMCareer-IndividualSeason] Fetched GM individual season data is missing crucial fields. Full data:", data);
              throw new Error(`Fetched GM season data for ${gmSlug} ${year} is incomplete.`);
          }
          setGmIndividualSeasonData(data);
        })
        .catch(err => {
          console.error(`[GMCareer-IndividualSeason] Failed to load or process GM season data:`, err);
          setErrorGmIndividualSeason(`Failed to load season details for ${year}. Details: ${err.message}. Ensure '${seasonDetailFilePath}' exists and is correctly formatted.`);
          setGmIndividualSeasonData(null);
        })
        .finally(() => {
          setLoadingGmIndividualSeason(false);
        });
  };


  useEffect(() => {
    if (selectedViewOption !== "all-seasons" && gmData && gmData.gmInfo && gmData.gmInfo.id && gmData.gmInfo.slug) {
      fetchIndividualSeasonData(gmData.gmInfo.slug, gmData.gmInfo.id, selectedViewOption);
    } else if (selectedViewOption === "all-seasons") {
        setGmIndividualSeasonData(null); 
    }
  }, [selectedViewOption, gmData]);

  const selectedGmName = useMemo(() => {
    return gmData?.gmInfo?.name || mockGmsForTabs.find(g => g.id === selectedGmId)?.name || selectedGmId || "Selected GM";
  }, [gmData?.gmInfo?.name, selectedGmId]);

  const CustomizedDot = (props: any) => {
    const { cx, cy, stroke, payload } = props;
    if (payload.isChampion) {
      return (
        <Trophy x={(cx ?? 0) - 8} y={(cy ?? 0) - 8} width={16} height={16} className="text-yellow-500 fill-current" />
      );
    }
    if (payload.madePlayoffs) {
      return <circle cx={cx} cy={cy} r={6} stroke="hsl(var(--accent))" fill="hsl(var(--accent))" strokeWidth={1} />;
    }
    return <circle cx={cx} cy={cy} r={3} stroke={stroke} fill="#fff" />;
  };

  const availableGmSeasonsForDropdown = useMemo(() => {
    if (gmData?.seasonProgression && Array.isArray(gmData.seasonProgression)) {
      return gmData.seasonProgression
        .map(s => String(s.year)) 
        .filter(year => parseInt(year) >= 2019) 
        .sort((a, b) => Number(b) - Number(a)); 
    }
    return [];
  }, [gmData?.seasonProgression]);

 const pieChartData = useMemo(() => {
    if (!gmIndividualSeasonData?.rosterBreakdown?.positionContributionData || !Array.isArray(gmIndividualSeasonData.rosterBreakdown.positionContributionData)) return [];
    const totalPoints = gmIndividualSeasonData.rosterBreakdown.positionContributionData.reduce((sum, p) => sum + (p.startedPoints ?? 0), 0);
    return gmIndividualSeasonData.rosterBreakdown.positionContributionData.map(p => ({
      name: p.name,
      positionName: p.name, 
      value: p.startedPoints ?? 0,
      percentage: totalPoints > 0 && p.startedPoints ? ((p.startedPoints / totalPoints) * 100) : 0,
      actualPoints: p.startedPoints ?? 0,
    }));
  }, [gmIndividualSeasonData?.rosterBreakdown?.positionContributionData]);

  const pieChartCells = useMemo(() => {
    if (!gmIndividualSeasonData?.rosterBreakdown?.positionContributionData || !Array.isArray(gmIndividualSeasonData.rosterBreakdown.positionContributionData)) return [];
    return gmIndividualSeasonData.rosterBreakdown.positionContributionData.map((entry) => (
        <RechartsCell key={`cell-${entry.name}`} fill={CHART_COLORS[entry.name?.toUpperCase() || 'DEFAULT'] || CHART_COLORS.DEFAULT} />
    ));
  }, [gmIndividualSeasonData?.rosterBreakdown?.positionContributionData]);

  const barChartData = useMemo(() => {
    if (!gmIndividualSeasonData?.rosterBreakdown?.positionContributionData || !Array.isArray(gmIndividualSeasonData.rosterBreakdown.positionContributionData) || !gmIndividualSeasonData?.rosterBreakdown?.leagueAvgPositionData || !Array.isArray(gmIndividualSeasonData.rosterBreakdown.leagueAvgPositionData)) return [];
    
    const mergedData: any[] = [];
    const gmPointsMap = new Map(gmIndividualSeasonData.rosterBreakdown.positionContributionData.map(p => [p.name, p.startedPoints ?? 0]));
    
    gmIndividualSeasonData.rosterBreakdown.leagueAvgPositionData.forEach(lgAvg => {
        mergedData.push({
            position: lgAvg.name,
            "GM Started Pts": gmPointsMap.get(lgAvg.name) || 0,
            "League Avg Pts": lgAvg.leagueAvg ?? 0,
        });
    });
    gmIndividualSeasonData.rosterBreakdown.positionContributionData.forEach(gmPos => {
        if (!mergedData.find(d => d.position === gmPos.name)) {
            mergedData.push({
                position: gmPos.name,
                "GM Started Pts": gmPos.startedPoints ?? 0, 
                "League Avg Pts": 0, 
            });
        }
    });
    return mergedData.sort((a,b) => (b["GM Started Pts"] ?? 0) - (a["GM Started Pts"] ?? 0));
  }, [gmIndividualSeasonData?.rosterBreakdown?.positionContributionData, gmIndividualSeasonData?.rosterBreakdown?.leagueAvgPositionData]);
  
 const positionalAdvantageBarData = useMemo(() => {
    if (!gmIndividualSeasonData?.positionalAdvantage?.weeklyPositionalAdvantage || !Array.isArray(gmIndividualSeasonData.positionalAdvantage.weeklyPositionalAdvantage)) {
      return [];
    }
    const totalRow = gmIndividualSeasonData.positionalAdvantage.weeklyPositionalAdvantage.find(row => row.week === "Total");
    if (!totalRow) return [];

    return Object.entries(totalRow)
      .filter(([key]) => key !== 'week' && key !== 'total_diff')
      .map(([key, value]) => ({
        position: key.toUpperCase(),
        value: Number(value) || 0,
      }));
  }, [gmIndividualSeasonData?.positionalAdvantage?.weeklyPositionalAdvantage]);

 const cumulativePositionalAdvantageChartData = useMemo(() => {
    if (!gmIndividualSeasonData?.positionalAdvantage?.cumulativeWeeklyPositionalAdvantage || !Array.isArray(gmIndividualSeasonData.positionalAdvantage.cumulativeWeeklyPositionalAdvantage)) {
      return [];
    }
    const cumulativeData = gmIndividualSeasonData.positionalAdvantage.cumulativeWeeklyPositionalAdvantage;
    const weeks = new Set<number>();
    cumulativeData.forEach(posData => {
      if(Array.isArray(posData.data)) { 
        posData.data.forEach(weekEntry => weeks.add(weekEntry.week));
      }
    });

    const sortedWeeks = Array.from(weeks).sort((a, b) => a - b);

    return sortedWeeks.map(weekNum => {
      const weekEntry: { week: number; [key: string]: number | undefined } = { week: weekNum }; 
      cumulativeData.forEach(posData => {
        if(Array.isArray(posData.data)) { 
          const valueForWeek = posData.data.find(d => d.week === weekNum)?.value;
          if (valueForWeek !== undefined) {
            weekEntry[posData.position.toUpperCase()] = valueForWeek;
          }
        }
      });
      return weekEntry;
    });
  }, [gmIndividualSeasonData?.positionalAdvantage?.cumulativeWeeklyPositionalAdvantage]);

  return (
    <div className="space-y-6 w-full">
      <div className="flex flex-col sm:flex-row gap-4 items-start">
          <div className="space-y-1.5">
              <Label htmlFor="gm-select">Select GM</Label>
              <Select value={selectedGmId} onValueChange={(value) => {setSelectedGmId(value); setSelectedViewOption("all-seasons");}}>
                  <SelectTrigger id="gm-select" className="w-full sm:w-[280px]">
                  <SelectValue placeholder="Select a GM" />
                  </SelectTrigger>
                  <SelectContent>
                  {mockGmsForTabs.map(gm => (
                      <SelectItem key={gm.id} value={gm.id}>{gm.name}</SelectItem>
                  ))}
                  </SelectContent>
              </Select>
          </div>
          {gmData && ( 
              <div className="space-y-1.5">
                  <Label htmlFor="view-select">Select View</Label>
                  <Select value={selectedViewOption} onValueChange={setSelectedViewOption}>
                      <SelectTrigger id="view-select" className="w-full sm:w-[280px]">
                          <SelectValue placeholder="Select view type" />
                      </SelectTrigger>
                      <SelectContent>
                          <SelectItem value="all-seasons">All Seasons</SelectItem>
                          {availableGmSeasonsForDropdown.map(year => (
                              <SelectItem key={year} value={year}>{year} Season Detail</SelectItem>
                          ))}
                      </SelectContent>
                  </Select>
              </div>
          )}
      </div>

      {loading && (
        <Card>
            <CardHeader className="flex items-start gap-4">
            <Skeleton className="h-16 w-16 rounded-full" />
            <div className="space-y-1.5">
                <Skeleton className="h-7 w-48" />
                <Skeleton className="h-4 w-64" />
            </div>
            </CardHeader>
          <CardContent className="pt-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
                {[...Array(3)].map((_, i) => 
                    <Card key={i}>
                        <CardHeader><Skeleton className="h-6 w-2/3" /></CardHeader>
                        <CardContent className="space-y-2">
                            {[...Array(4)].map((_, j) => <Skeleton key={j} className="h-4 w-full" />)}
                        </CardContent>
                    </Card>
                )}
            </div>
            {[...Array(4)].map((_,i)=>(
                <div key={i} className="mt-8">
                    <Skeleton className="h-8 w-1/3 mb-3" />
                    <Skeleton className="h-48 w-full" />
                </div>
            ))}
          </CardContent>
        </Card>
      )}
      {error && <Card><CardContent className="pt-6 text-destructive text-center flex flex-col items-center gap-2"><ShieldAlert size={48}/> <p>{error}</p></CardContent></Card>}

      {!loading && !error && gmData && selectedViewOption === "all-seasons" && (
        <>
        <Card>
            <CardHeader className="flex items-start gap-4">
                <Avatar className="h-16 w-16 rounded-full border-2 border-primary">
                    <AvatarImage src={gmData.gmInfo.photoUrl || undefined} alt={gmData.gmInfo.name || ""} data-ai-hint="person avatar"/>
                    <AvatarFallback className="text-2xl bg-muted text-muted-foreground">
                        {gmData.gmInfo.name ? gmData.gmInfo.name.charAt(0).toUpperCase() : <User size={32}/>}
                    </AvatarFallback>
                </Avatar>
                <div>
                    <CardTitle className="text-3xl font-bold">{gmData.gmInfo.name}</CardTitle>
                    <CardDescription className="text-md text-muted-foreground">
                    Years Active: {gmData.gmInfo.yearsActive}
                    </CardDescription>
                    {gmData.gmInfo.championshipYears && gmData.gmInfo.championshipYears.length > 0 && (
                    <div className="mt-2">
                        <Badge variant="outline" className="bg-yellow-100 text-yellow-700 border-yellow-300 dark:bg-yellow-700/30 dark:text-yellow-300 dark:border-yellow-500">
                            <Trophy className="mr-1.5 h-4 w-4 text-yellow-600 dark:text-yellow-400" />
                            Champions: {gmData.gmInfo.championshipYears.join(', ')}
                        </Badge>
                    </div>
                    )}
                    {gmData.gmInfo.bio && <p className="text-sm text-muted-foreground mt-2 max-w-prose">{gmData.gmInfo.bio}</p>}
                </div>
            </CardHeader>
            <CardContent className="pt-2 md:pt-4 grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
                <div>
                    <h4 className="text-sm font-medium text-muted-foreground mb-1.5">Overall Record</h4>
                    <Separator className="mb-2"/>
                    <div className="space-y-0.5 text-sm max-w-sm">
                        <div className="flex justify-between"><span className="text-muted-foreground">Wins:</span><span className="font-medium text-foreground">{gmData.careerStats.wins}</span></div>
                        <div className="flex justify-between"><span className="text-muted-foreground">Losses:</span><span className="font-medium text-foreground">{gmData.careerStats.losses}</span></div>
                        <div className="flex justify-between"><span className="text-muted-foreground">Ties:</span><span className="font-medium text-foreground">{gmData.careerStats.ties}</span></div>
                        <div className="flex justify-between"><span className="text-muted-foreground">Win %:</span><span className="font-medium text-primary">{(gmData.careerStats.winPct * 100).toFixed(1)}%</span></div>
                    </div>
                </div>
                
                <div>
                    <h4 className="text-sm font-medium text-muted-foreground mb-1.5">Scoring Stats</h4>
                     <Separator className="mb-2"/>
                    <div className="space-y-0.5 text-sm max-w-sm">
                        <div className="flex justify-between"><span className="text-muted-foreground">Total Points For:</span><span className="font-medium text-foreground">{gmData.careerStats.totalPointsFor?.toFixed(1)}</span></div>
                        <div className="flex justify-between"><span className="text-muted-foreground">Total Points Against:</span><span className="font-medium text-foreground">{gmData.careerStats.totalPointsAgainst?.toFixed(1)}</span></div>
                        <div className="flex justify-between"><span className="text-muted-foreground">Avg Points/Game:</span><span className="font-medium text-foreground">{gmData.careerStats.avgPointsPerGame?.toFixed(1)}</span></div>
                    </div>
                </div>
                
                <div>
                    <h4 className="text-sm font-medium text-muted-foreground mb-1.5">Career Milestones</h4>
                    <Separator className="mb-2"/>
                    <div className="space-y-0.5 text-sm max-w-sm">
                        <div className="flex justify-between"><span className="text-muted-foreground">Total Seasons:</span><span className="font-medium text-foreground">{gmData.careerStats.totalSeasons}</span></div>
                        <div className="flex justify-between"><span className="text-muted-foreground">Playoff Appearances:</span><span className="font-medium text-foreground">{gmData.careerStats.playoffAppearances}</span></div>
                        <div className="flex justify-between"><span className="text-muted-foreground">Playoff Record:</span><span className="font-medium text-foreground">{gmData.careerStats.playoffWins}-{gmData.careerStats.playoffLosses}</span></div>
                        <div className="flex justify-between"><span className="text-muted-foreground">Championships:</span><span className="font-medium text-primary">{gmData.gmInfo.championshipYears?.length || 0}</span></div>
                    </div>
                </div>
            </CardContent>
        </Card>

          {gmData.seasonProgression && Array.isArray(gmData.seasonProgression) && gmData.seasonProgression.length > 0 && (
              <Card className="mt-8">
                <CardHeader><CardTitle className="text-xl">Season Progression</CardTitle></CardHeader>
                <CardContent className="h-[350px] pt-6">
                  <ResponsiveContainer width="100%" height="100%">
                    <RechartsLineChartImport data={gmData.seasonProgression}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="year" />
                      <YAxis reversed={true} allowDecimals={false} domain={['dataMin -1', 'dataMax + 1']} tickFormatter={(value) => Math.round(value).toString()} />
                      <RechartsTooltip />
                      <RechartsLegend />
                      <Line 
                        type="monotone" 
                        dataKey="finalStanding" 
                        stroke="hsl(var(--primary))" 
                        strokeWidth={2} 
                        name="Final Standing"
                        dot={<CustomizedDot />}
                        activeDot={{ r: 6 }}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="pointsForRank" 
                        stroke="hsl(var(--chart-3))" 
                        strokeWidth={2} 
                        name="PF Rank" 
                        activeDot={{ r: 6 }}
                      />
                    </RechartsLineChartImport>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            )}
            <div className="grid md:grid-cols-2 gap-6 mt-8">
                {gmData.careerExtremes?.highs && (
                    <Card>
                        <CardHeader><CardTitle className="text-xl flex items-center"><TrendingUp className="mr-2 h-5 w-5 text-green-500 dark:text-green-400"/>Career Highs</CardTitle></CardHeader>
                        <CardContent className="space-y-2 text-sm">
                            <p><strong>Most Points (Game):</strong> {gmData.careerExtremes.highs.mostPointsGame.value.toFixed(1)} ({gmData.careerExtremes.highs.mostPointsGame.season} Wk {gmData.careerExtremes.highs.mostPointsGame.week})</p>
                            <p><strong>Biggest Win Margin:</strong> +{gmData.careerExtremes.highs.biggestWinMargin.value.toFixed(1)} (vs {gmData.careerExtremes.highs.biggestWinMargin.opponentName}, {gmData.careerExtremes.highs.biggestWinMargin.season} Wk {gmData.careerExtremes.highs.biggestWinMargin.week})</p>
                            <p><strong>Best Season Record:</strong> {gmData.careerExtremes.highs.bestSeasonRecord.wins}-{gmData.careerExtremes.highs.bestSeasonRecord.losses} ({gmData.careerExtremes.highs.bestSeasonRecord.season}) {gmData.careerExtremes.highs.bestSeasonRecord.isChampion ? <Trophy className="inline h-4 w-4 text-yellow-500 dark:text-yellow-400" /> : ""}</p>
                        </CardContent>
                    </Card>
                )}
                {gmData.careerExtremes?.lows && (
                    <Card>
                        <CardHeader><CardTitle className="text-xl flex items-center"><TrendingDown className="mr-2 h-5 w-5 text-red-500 dark:text-red-400"/>Career Lows</CardTitle></CardHeader>
                        <CardContent className="space-y-2 text-sm">
                            <p><strong>Fewest Points (Game):</strong> {gmData.careerExtremes.lows.fewestPointsGame.value.toFixed(1)} ({gmData.careerExtremes.lows.fewestPointsGame.season} Wk {gmData.careerExtremes.lows.fewestPointsGame.week})</p>
                            <p><strong>Worst Loss Margin:</strong> -{Math.abs(gmData.careerExtremes.lows.worstLossMargin.value).toFixed(1)} (vs {gmData.careerExtremes.lows.worstLossMargin.opponentName}, {gmData.careerExtremes.lows.worstLossMargin.season} Wk {gmData.careerExtremes.lows.worstLossMargin.week})</p>
                            <p><strong>Worst Season Record:</strong> {gmData.careerExtremes.lows.worstSeasonRecord.wins}-{gmData.careerExtremes.lows.worstSeasonRecord.losses} ({gmData.careerExtremes.lows.worstSeasonRecord.season})</p>
                        </CardContent>
                    </Card>
                )}
            </div>
            
            <div className="grid md:grid-cols-2 gap-6 mt-8">
                {gmData.positionStrength && Array.isArray(gmData.positionStrength) && gmData.positionStrength.length > 0 && (
                <Card>
                    <CardHeader><CardTitle className="text-xl">Positional Strength vs League Avg.</CardTitle></CardHeader>
                    <CardContent>
                        <div className="h-[300px] w-full max-w-lg mx-auto">
                            <ResponsiveContainer width="100%" height="100%">
                                <RechartsBarChartImport data={gmData.positionStrength} layout="vertical" margin={{ left: 30, right: 20, bottom: 5 }}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis type="number" />
                                    <YAxis dataKey="position" type="category" width={140} tickFormatter={(value) => getPositionName(value)} interval={0} />
                                    <RechartsTooltip formatter={(value: number) => value.toFixed(1)} />
                                    <RechartsLegend />
                                    <Bar dataKey="value" name="Strength vs Avg">
                                        {gmData.positionStrength.map((entry, index) => (
                                            <RechartsCell key={`cell-${index}`} fill={entry.value >= 0 ? 'hsl(var(--chart-2))' : 'hsl(var(--destructive))'} />
                                        ))}
                                    </Bar>
                                </RechartsBarChartImport>
                            </ResponsiveContainer>
                        </div>
                        <p className="text-xs text-muted-foreground mt-2 text-center">Positive values indicate stronger than league average at that position, negative values indicate weaker.</p>
                    </CardContent>
                </Card>
                )}
           
                {gmData.franchisePlayers && Array.isArray(gmData.franchisePlayers) && gmData.franchisePlayers.length > 0 && (
                <Card>
                    <CardHeader><CardTitle className="text-xl">Franchise Players</CardTitle></CardHeader>
                    <CardContent className="overflow-x-auto">
                    <Table>
                        <TableHeader>
                        <TableRow>
                            <TableHead>Player</TableHead>
                            <TableHead>Position</TableHead>
                            <TableHead>Seasons w/ GM</TableHead>
                            <TableHead className="text-right">Total Points</TableHead>
                            <TableHead className="text-right">Games Started</TableHead>
                        </TableRow>
                        </TableHeader>
                        <TableBody>
                        {gmData.franchisePlayers.map(player => (
                            <TableRow key={player.playerId}>
                            <TableCell>{player.name}</TableCell>
                            <TableCell><Badge variant="outline" className={getPositionBadgeClass(player.position)}>{player.position}</Badge></TableCell>
                            <TableCell>{player.seasonsWithGm.join(', ')}</TableCell>
                            <TableCell className="text-right">{player.totalPointsForGm?.toFixed(1)}</TableCell>
                            <TableCell className="text-right">{player.gamesStartedForGm}</TableCell>
                            </TableRow>
                        ))}
                        </TableBody>
                    </Table>
                    </CardContent>
                </Card>
                )}

                {gmData.rivalryPerformance && Array.isArray(gmData.rivalryPerformance) && gmData.rivalryPerformance.length > 0 && (
                <Card>
                    <CardHeader><CardTitle className="text-xl">Key Rivalries</CardTitle></CardHeader>
                    <CardContent className="overflow-x-auto">
                    <Table>
                        <TableHeader>
                        <TableRow>
                            <TableHead>Opponent</TableHead>
                            <TableHead>Record (W-L)</TableHead>
                            <TableHead className="text-right">Avg. PF</TableHead>
                            <TableHead className="text-right">Avg. PA</TableHead>
                        </TableRow>
                        </TableHeader>
                        <TableBody>
                        {gmData.rivalryPerformance.map(rival => (
                            <TableRow key={rival.opponentId}>
                            <TableCell>{rival.opponentName}</TableCell>
                            <TableCell>{rival.wins}-{rival.losses}</TableCell>
                            <TableCell className="text-right">{rival.avgPointsFor?.toFixed(1)}</TableCell>
                            <TableCell className="text-right">{rival.avgPointsAgainst?.toFixed(1)}</TableCell>
                            </TableRow>
                        ))}
                        </TableBody>
                    </Table>
                    </CardContent>
                </Card>
                )}
            </div>
          </>
      )}

      {!loading && !error && selectedViewOption !== "all-seasons" && (
        loadingGmIndividualSeason ? (
            <Card className="mt-6">
                <CardHeader><CardTitle className="flex items-center gap-2"><User className="text-primary" /> Loading {selectedGmName} - {selectedViewOption} Season Details...</CardTitle></CardHeader>
                <CardContent>
                    <Skeleton className="h-8 w-3/4 mb-4" />
                    <Skeleton className="h-40 w-full mb-4" />
                    <Skeleton className="h-6 w-1/2 mb-2" />
                    <Skeleton className="h-32 w-full" />
                </CardContent>
            </Card>
        ) : errorGmIndividualSeason ? (
            <Card className="mt-6">
                <CardHeader><CardTitle className="flex items-center gap-2"><User className="text-primary"/>{selectedGmName} - {selectedViewOption} Season</CardTitle></CardHeader>
                <CardContent className="pt-6 text-destructive text-center flex flex-col items-center gap-2">
                    <ShieldAlert size={48}/> 
                    <p>{errorGmIndividualSeason}</p>
                </CardContent>
            </Card>
        ) : gmIndividualSeasonData ? (
            <div className="space-y-6 mt-2">
                <Tabs value={activeGmSeasonTab} onValueChange={setActiveGmSeasonTab} className="w-full">
                    <TabsList className="grid w-full grid-cols-2 sm:grid-cols-3 md:grid-cols-6 mb-4">
                        <TabsTrigger value="season-summary"><ClipboardList className="mr-1 h-4 w-4 hidden sm:inline-block" />Season Summary</TabsTrigger>
                        <TabsTrigger value="roster-breakdown"><UsersRound className="mr-1 h-4 w-4 hidden sm:inline-block" />Roster Breakdown</TabsTrigger>
                        <TabsTrigger value="player-performance"><TrendingUp className="mr-1 h-4 w-4 hidden sm:inline-block" />Player Performance</TabsTrigger>
                        <TabsTrigger value="positional-advantage"><PieChartIconLucide className="mr-1 h-4 w-4 hidden sm:inline-block" />Positional Advantage</TabsTrigger>
                        <TabsTrigger value="lineup-optimization"><Shuffle className="mr-1 h-4 w-4 hidden sm:inline-block" />Lineup Optimization</TabsTrigger>
                        <TabsTrigger value="streaming-success"><Waves className="mr-1 h-4 w-4 hidden sm:inline-block" />Streaming Success</TabsTrigger>
                    </TabsList>
                    <TabsContent value="season-summary">
                       {gmIndividualSeasonData.seasonSummary?.seasonPerformance && selectedViewOption && (
                         <SeasonPerformanceCard performance={gmIndividualSeasonData.seasonSummary.seasonPerformance} year={selectedViewOption} gmName={gmIndividualSeasonData.gmInfo?.name}/>
                       )}
                       {gmIndividualSeasonData.seasonSummary?.gameByGame && (
                         <GameByGameTable games={gmIndividualSeasonData.seasonSummary.gameByGame} gmName={gmIndividualSeasonData.gmInfo?.name}/>
                       )}
                    </TabsContent>
                    <TabsContent value="roster-breakdown">
                        <Card>
                            <CardHeader className="pb-2">
                                <CardTitle className="flex items-center text-lg">
                                    <PieChartIconLucide className="mr-2 h-5 w-5 text-primary" />
                                    Position Contribution
                                </CardTitle>
                                <CardDescription className="text-xs">(Based on Started Players)</CardDescription>
                            </CardHeader>
                            <CardContent>
                                {gmIndividualSeasonData.rosterBreakdown?.positionContributionData && gmIndividualSeasonData.rosterBreakdown?.leagueAvgPositionData && barChartData.length > 0 ? (
                                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
                                        <div>
                                            <h3 className="text-md font-semibold text-center mb-2">Started Points by Position (%)</h3>
                                            <div className="h-[300px]">
                                                <ResponsiveContainer width="100%" height="100%">
                                                    <RechartsPieChartComponent>
                                                        <Pie
                                                            data={pieChartData}
                                                            cx="50%"
                                                            cy="50%"
                                                            outerRadius={100}
                                                            fill="#8884d8"
                                                            dataKey="value"
                                                            label={false}
                                                        >
                                                            {pieChartCells}
                                                        </Pie>
                                                        <RechartsTooltip content={<CustomPieTooltip />} />
                                                        <RechartsLegend 
                                                            payload={
                                                                (pieChartData || []).map(entry => ({
                                                                    value: entry.name, 
                                                                    type: 'square',
                                                                    id: entry.name,
                                                                    color: CHART_COLORS[entry.positionName?.toUpperCase() || 'DEFAULT'] || CHART_COLORS.DEFAULT,
                                                                }))
                                                            }
                                                            wrapperStyle={{fontSize: '12px', paddingTop: '10px'}}
                                                        />
                                                    </RechartsPieChartComponent>
                                                </ResponsiveContainer>
                                            </div>
                                        </div>
                                        <div>
                                            <h3 className="text-md font-semibold text-center mb-2">Started Points vs. League Average</h3>
                                            <div className="h-[300px]">
                                                <ResponsiveContainer width="100%" height="100%">
                                                    <RechartsBarChartImport 
                                                        layout="vertical" 
                                                        data={barChartData}
                                                        margin={{ top: 5, right: 30, left: 5, bottom: 20 }}
                                                    >
                                                        <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                                                        <XAxis type="number" />
                                                        <YAxis dataKey="position" type="category" width={50} tick={{fontSize: 11}}/>
                                                        <RechartsTooltip />
                                                        <RechartsLegend verticalAlign="bottom" wrapperStyle={{fontSize: '12px', paddingTop: '10px'}}/>
                                                        <Bar dataKey="GM Started Pts" fill={GM_CHART_COLORS.GM_STARTED_PTS} barSize={12} />
                                                        <Bar dataKey="League Avg Pts" fill={GM_CHART_COLORS.LEAGUE_AVG_PTS} barSize={12} />
                                                    </RechartsBarChartImport>
                                                </ResponsiveContainer>
                                            </div>
                                        </div>
                                    </div>
                                ) : <p className="text-muted-foreground text-center py-4">Position contribution data not available.</p>}
                            </CardContent>
                        </Card>

                        {gmIndividualSeasonData.rosterBreakdown?.rosterPlayerData && (
                           <RosterPlayersTable players={gmIndividualSeasonData.rosterBreakdown.rosterPlayerData} />
                        )}
                        {(!gmIndividualSeasonData.rosterBreakdown?.rosterPlayerData) && <p className="text-muted-foreground">No roster breakdown data available.</p>}
                    </TabsContent>
                     <TabsContent value="player-performance">
                        {gmIndividualSeasonData?.playerPerformance ? (
                            <div className="space-y-6">
                                <Card>
                                    <CardHeader>
                                        <CardTitle className="flex items-center text-lg">
                                            <TrendingUp className="mr-2 h-5 w-5 text-primary" />
                                            Performance vs. Projection Highlights
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            {gmIndividualSeasonData.playerPerformance.overPerformer && (
                                                <div className="p-4 rounded-lg bg-green-100 dark:bg-green-900/30 border border-green-200 dark:border-green-700">
                                                    <div className="flex items-center text-green-700 dark:text-green-300 mb-1">
                                                        <ArrowUpCircle size={20} className="mr-2" />
                                                        <h4 className="font-semibold">Most Overperforming Player (Avg)</h4>
                                                    </div>
                                                    <p className="text-xl font-bold text-foreground">{gmIndividualSeasonData.playerPerformance.overPerformer.name}</p>
                                                    <p className="text-sm font-semibold text-green-600 dark:text-green-400">
                                                        {gmIndividualSeasonData.playerPerformance.overPerformer.avgDifference != null && gmIndividualSeasonData.playerPerformance.overPerformer.avgDifference >= 0 ? '+' : ''}
                                                        {gmIndividualSeasonData.playerPerformance.overPerformer.avgDifference?.toFixed(1) ?? 'N/A'} Points vs Projection / Week
                                                    </p>
                                                </div>
                                            )}
                                            {gmIndividualSeasonData.playerPerformance.underPerformer && (
                                                 <div className="p-4 rounded-lg bg-red-100 dark:bg-red-900/30 border border-red-200 dark:border-red-700">
                                                    <div className="flex items-center text-red-700 dark:text-red-300 mb-1">
                                                        <ArrowDownCircle size={20} className="mr-2" />
                                                        <h4 className="font-semibold">Most Underperforming Player (Avg)</h4>
                                                    </div>
                                                    <p className="text-xl font-bold text-foreground">{gmIndividualSeasonData.playerPerformance.underPerformer.name}</p>
                                                    <p className="text-sm font-semibold text-red-600 dark:text-red-400">
                                                        {gmIndividualSeasonData.playerPerformance.underPerformer.avgDifference?.toFixed(1) ?? 'N/A'} Points vs Projection / Week
                                                    </p>
                                                </div>
                                            )}
                                        </div>
                                    </CardContent>
                                    <CardFooter className="text-xs text-muted-foreground pt-4">
                                       * Based on average points difference vs weekly projection with a minimum of 3 starts.
                                    </CardFooter>
                                </Card>

                                {gmIndividualSeasonData.playerPerformance.playerSummaryPerformance && Array.isArray(gmIndividualSeasonData.playerPerformance.playerSummaryPerformance) && gmIndividualSeasonData.playerPerformance.playerSummaryPerformance.length > 0 && (
                                  <PlayerPerformanceDetailsTable players={gmIndividualSeasonData.playerPerformance.playerSummaryPerformance} />
                                )}
                            </div>
                        ) : <p className="text-muted-foreground text-center py-4">Player performance data not available for this season.</p>}
                    </TabsContent>
                     <TabsContent value="positional-advantage">
                         {gmIndividualSeasonData?.positionalAdvantage ? (
                            <div className="space-y-6">
                                <Card>
                                    <CardHeader><CardTitle className="flex items-center text-lg"><BarChartHorizontal className="mr-2 h-5 w-5 text-primary"/>Weekly Positional Advantage vs. Opponent</CardTitle></CardHeader>
                                    <CardContent className="overflow-x-auto">
                                        {gmIndividualSeasonData.positionalAdvantage.weeklyPositionalAdvantage && Array.isArray(gmIndividualSeasonData.positionalAdvantage.weeklyPositionalAdvantage) && gmIndividualSeasonData.positionalAdvantage.weeklyPositionalAdvantage.length > 0 ? (
                                            <>
                                            <Table>
                                                <TableHeader>
                                                    <TableRow>
                                                        <TableHead className="text-center">WK</TableHead>
                                                        {['QB', 'RB', 'WR', 'TE', 'FLEX', 'K', 'DST', 'total_diff'].map(pos => <TableHead key={pos} className="text-right">{pos.replace('_diff', ' DIFF')}</TableHead>)}
                                                    </TableRow>
                                                </TableHeader>
                                                <TableBody>
                                                    {gmIndividualSeasonData.positionalAdvantage.weeklyPositionalAdvantage.filter(item => item.week !== "Total").map((weekData, index) => (
                                                        <TableRow key={`pos-adv-wk-${index}`}>
                                                            <TableCell className="text-center font-medium">{weekData.week}</TableCell>
                                                            {(['QB', 'RB', 'WR', 'TE', 'FLEX', 'K', 'DST', 'total_diff'] as const).map(posKey => {
                                                                const value = weekData[posKey];
                                                                return (
                                                                    <TableCell key={posKey} className={cn("text-right", typeof value === 'number' && value > 0 ? "text-green-600 dark:text-green-400" : (typeof value === 'number' && value < 0 ? "text-red-600 dark:text-red-400" : ""))}>
                                                                        {typeof value === 'number' ? (value > 0 ? '+' : '') + value.toFixed(1) : (value ?? '-')}
                                                                    </TableCell>
                                                                );
                                                            })}
                                                        </TableRow>
                                                    ))}
                                                    {(gmIndividualSeasonData.positionalAdvantage.weeklyPositionalAdvantage.find(item => item.week === "Total")) && (() => {
                                                        const totalRow = gmIndividualSeasonData.positionalAdvantage.weeklyPositionalAdvantage.find(item => item.week === "Total")!;
                                                        return (
                                                            <TableRow className="font-semibold bg-muted/50 dark:bg-muted/30">
                                                                <TableCell className="text-center">Total</TableCell>
                                                                {(['QB', 'RB', 'WR', 'TE', 'FLEX', 'K', 'DST', 'total_diff'] as const).map(posKey => {
                                                                    const value = totalRow[posKey];
                                                                    return (
                                                                        <TableCell key={`total-${posKey}`} className={cn("text-right", typeof value === 'number' && value > 0 ? "text-green-600 dark:text-green-400" : (typeof value === 'number' && value < 0 ? "text-red-600 dark:text-red-400" : ""))}>
                                                                            {typeof value === 'number' ? (value > 0 ? '+' : '') + value.toFixed(1) : (value ?? '-')}
                                                                        </TableCell>
                                                                    );
                                                                })}
                                                            </TableRow>
                                                        );
                                                    })()}
                                                </TableBody>
                                            </Table>
                                            </>
                                        ) : <p className="text-muted-foreground text-center py-4">Weekly positional advantage data not available.</p>}
                                    </CardContent>
                                </Card>
                                
                                {gmIndividualSeasonData.positionalAdvantage.cumulativeWeeklyPositionalAdvantage && Array.isArray(gmIndividualSeasonData.positionalAdvantage.cumulativeWeeklyPositionalAdvantage) && cumulativePositionalAdvantageChartData.length > 0 && (
                                    <Card className="mt-6">
                                        <CardHeader><CardTitle className="flex items-center text-lg"><LineChartIconRecharts className="mr-2 h-5 w-5 text-primary"/>Cumulative Weekly Positional Advantage Trend</CardTitle></CardHeader>
                                        <CardContent className="h-[400px] pt-6">
                                            <ResponsiveContainer width="100%" height="100%">
                                                <RechartsLineChartImport data={cumulativePositionalAdvantageChartData} margin={{ top: 5, right: 20, left: -10, bottom: 40 }}>
                                                    <CartesianGrid strokeDasharray="3 3" />
                                                    <XAxis dataKey="week" label={{ value: "Week", position: "insideBottom", dy: 15 }} />
                                                    <YAxis label={{ value: 'Cumulative Advantage', angle: -90, position: 'insideLeft' }} />
                                                    <RechartsTooltip />
                                                    <RechartsLegend verticalAlign="bottom" wrapperStyle={{paddingTop: '20px'}}/>
                                                    {Object.keys(CHART_COLORS).filter(pos => pos !== 'DEFAULT' && cumulativePositionalAdvantageChartData[0] && cumulativePositionalAdvantageChartData[0].hasOwnProperty(pos.toUpperCase())).map(posKey => (
                                                        <Line 
                                                            key={posKey}
                                                            type="monotone" 
                                                            dataKey={posKey.toUpperCase()} 
                                                            stroke={CHART_COLORS[posKey.toUpperCase()]} 
                                                            name={posKey.toUpperCase()}
                                                            dot={false}
                                                            activeDot={{ r: 6 }} 
                                                        />
                                                    ))}
                                                </RechartsLineChartImport>
                                            </ResponsiveContainer>
                                        </CardContent>
                                        <CardFooter className="text-xs text-muted-foreground pt-2">
                                        * Tracks the running total of positional point differences vs opponents week over week.
                                        </CardFooter>
                                    </Card>
                                )}
                            </div>
                         ) : <p className="text-muted-foreground text-center py-4">Positional advantage data not available.</p>}
                    </TabsContent>
                    <TabsContent value="lineup-optimization">
                        {gmIndividualSeasonData?.lineupOptimization ? (
                            <div className="space-y-6">
                                <Card>
                                    <CardHeader><CardTitle className="flex items-center text-lg"><Target className="mr-2 h-5 w-5 text-primary"/>Weekly Lineup Efficiency</CardTitle></CardHeader>
                                    <CardContent className="overflow-x-auto">
                                    {gmIndividualSeasonData.lineupOptimization.weeklyOptimization && Array.isArray(gmIndividualSeasonData.lineupOptimization.weeklyOptimization) && gmIndividualSeasonData.lineupOptimization.weeklyOptimization.length > 0 ? (
                                        <Table>
                                            <TableHeader>
                                                <TableRow>
                                                    <TableHead className="text-center">WK</TableHead>
                                                    <TableHead className="text-right">Optimal</TableHead>
                                                    <TableHead className="text-right">Actual</TableHead>
                                                    <TableHead className="text-right">Efficiency</TableHead>
                                                    <TableHead className="text-right">Pts Left</TableHead>
                                                    <TableHead className="text-center">Decisions</TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {gmIndividualSeasonData.lineupOptimization.weeklyOptimization.map(item => (
                                                    <TableRow key={`lineup-opt-wk-${item.week}`}>
                                                        <TableCell className="text-center font-medium">{item.week}</TableCell>
                                                        <TableCell className="text-right">{item.optimal?.toFixed(1) ?? '-'}</TableCell>
                                                        <TableCell className="text-right">{item.actual?.toFixed(1) ?? '-'}</TableCell>
                                                        <TableCell className="text-right">{item.efficiency?.toFixed(1) ?? '-'}%</TableCell>
                                                        <TableCell className={cn("text-right", typeof item.pointsLeft === 'number' && item.pointsLeft != null && item.pointsLeft > 0 ? "text-red-600 dark:text-red-400" : "text-green-600 dark:text-green-400")}>{item.pointsLeft?.toFixed(1) ?? '-'}</TableCell>
                                                         <TableCell className="text-center">{`${item.correctDecisions ?? '-'}/${item.totalDecisions ?? '-'}`}</TableCell>
                                                    </TableRow>
                                                ))}
                                            </TableBody>
                                        </Table>
                                        ) : <p className="text-muted-foreground text-center py-4">Weekly lineup optimization data not available.</p>}
                                    </CardContent>
                                </Card>
                                {gmIndividualSeasonData.lineupOptimization.feelingItSummary && (
                                    <Card className="mt-6">
                                        <CardHeader>
                                            <CardTitle className="flex items-center text-lg"><Sparkles className="mr-2 h-5 w-5 text-primary"/>'Feeling It' Summary</CardTitle>
                                            <CardDescription className="text-xs mt-1">A "Feeling It" Start is when a player is started with a lower projected point total than a player of the same eligibility on the manager's bench.</CardDescription>
                                        </CardHeader>
                                        <CardContent>
                                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6 text-center">
                                                <div><p className="text-xs text-muted-foreground">Total Starts</p><p className="text-xl font-semibold">{gmIndividualSeasonData.lineupOptimization.feelingItSummary.totalStarts ?? '-'}</p></div>
                                                <div><p className="text-xs text-muted-foreground">Success Rate</p><p className="text-xl font-semibold">{gmIndividualSeasonData.lineupOptimization.feelingItSummary.successRate?.toFixed(1) ?? '-'}%</p></div>
                                                <div>
                                                  <p className="text-xs text-muted-foreground">Avg Pts Gained/Lost</p>
                                                  <p className={cn("text-xl font-semibold", typeof gmIndividualSeasonData.lineupOptimization.feelingItSummary.avgPointsGainedLost === 'number' && gmIndividualSeasonData.lineupOptimization.feelingItSummary.avgPointsGainedLost != null && gmIndividualSeasonData.lineupOptimization.feelingItSummary.avgPointsGainedLost >= 0 ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400")}>
                                                      {(typeof gmIndividualSeasonData.lineupOptimization.feelingItSummary.avgPointsGainedLost === 'number' && gmIndividualSeasonData.lineupOptimization.feelingItSummary.avgPointsGainedLost != null && gmIndividualSeasonData.lineupOptimization.feelingItSummary.avgPointsGainedLost >=0 ? '+':'' )+ (gmIndividualSeasonData.lineupOptimization.feelingItSummary.avgPointsGainedLost?.toFixed(1) ?? '-')}
                                                  </p>
                                                </div>
                                                <div>
                                                  <p className="text-xs text-muted-foreground">Avg Proj Diff.</p>
                                                  <p className={cn("text-xl font-semibold", typeof gmIndividualSeasonData.lineupOptimization.feelingItSummary.avgProjectionDifference === 'number' && gmIndividualSeasonData.lineupOptimization.feelingItSummary.avgProjectionDifference != null && gmIndividualSeasonData.lineupOptimization.feelingItSummary.avgProjectionDifference >= 0 ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400")}>
                                                    {(typeof gmIndividualSeasonData.lineupOptimization.feelingItSummary.avgProjectionDifference === 'number' && gmIndividualSeasonData.lineupOptimization.feelingItSummary.avgProjectionDifference != null && gmIndividualSeasonData.lineupOptimization.feelingItSummary.avgProjectionDifference >=0 ? '+':'' )+ (gmIndividualSeasonData.lineupOptimization.feelingItSummary.avgProjectionDifference?.toFixed(1) ?? '-')}
                                                  </p>
                                                </div>
                                            </div>
                                            {gmIndividualSeasonData.lineupOptimization.feelingItSummary.details && Array.isArray(gmIndividualSeasonData.lineupOptimization.feelingItSummary.details) && gmIndividualSeasonData.lineupOptimization.feelingItSummary.details.length > 0 && (
                                                <div className="overflow-x-auto">
                                                <Table>
                                                    <TableHeader>
                                                        <TableRow>
                                                            <TableHead className="text-center">WK</TableHead>
                                                            <TableHead>Starter</TableHead>
                                                            <TableHead className="text-right">Actual</TableHead>
                                                            <TableHead className="text-right">Proj.</TableHead>
                                                            <TableHead>Bench</TableHead>
                                                            <TableHead className="text-right">Actual</TableHead>
                                                            <TableHead className="text-right">Proj.</TableHead>
                                                            <TableHead className="text-right">Pts Diff</TableHead>
                                                            <TableHead className="text-right">Proj. Diff</TableHead>
                                                        </TableRow>
                                                    </TableHeader>
                                                    <TableBody>
                                                        {gmIndividualSeasonData.lineupOptimization.feelingItSummary.details.map((item, idx) => (
                                                            <TableRow key={`feeling-it-${idx}`}>
                                                                <TableCell className="text-center font-medium">{item.week}</TableCell>
                                                                <TableCell>{item.starterName}</TableCell>
                                                                <TableCell className="text-right">{item.starterActual?.toFixed(1) ?? '-'}</TableCell>
                                                                <TableCell className="text-right">{item.starterProjected?.toFixed(1) ?? '-'}</TableCell>
                                                                <TableCell>{item.benchName}</TableCell>
                                                                <TableCell className="text-right">{item.benchActual?.toFixed(1) ?? '-'}</TableCell>
                                                                <TableCell className="text-right">{item.benchProjected?.toFixed(1) ?? '-'}</TableCell>
                                                                <TableCell className={cn("text-right", typeof item.pointsDifference === 'number' && item.pointsDifference != null && item.pointsDifference >= 0 ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400")}>{(typeof item.pointsDifference === 'number' && item.pointsDifference != null && item.pointsDifference >=0 ? '+':'' )} {item.pointsDifference?.toFixed(1) ?? '-'}</TableCell>
                                                                <TableCell className={cn("text-right", typeof item.projectionDifference === 'number' && item.projectionDifference != null && item.projectionDifference >= 0 ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400")}>{(typeof item.projectionDifference === 'number' && item.projectionDifference != null && item.projectionDifference >=0 ? '+':'' )} {item.projectionDifference?.toFixed(1) ?? '-'}</TableCell>
                                                            </TableRow>
                                                        ))}
                                                    </TableBody>
                                                </Table>
                                                </div>
                                            )}
                                        </CardContent>
                                    </Card>
                                )}
                            </div>
                        ) : <p className="text-muted-foreground text-center py-4">Lineup optimization data not available.</p>}
                    </TabsContent>
                    <TabsContent value="streaming-success">
                          {gmIndividualSeasonData?.streamingSuccess ? (
                            <div className="space-y-6">
                                <Card>
                                    <CardHeader><CardTitle className="flex items-center text-lg"><Repeat className="mr-2 h-5 w-5 text-primary"/>Streaming Summary</CardTitle></CardHeader>
                                    <CardContent className="overflow-x-auto">
                                        {gmIndividualSeasonData.streamingSuccess.streamingSummary && Array.isArray(gmIndividualSeasonData.streamingSuccess.streamingSummary) && gmIndividualSeasonData.streamingSuccess.streamingSummary.length > 0 ? (
                                        <div className="overflow-x-auto">
                                            <Table>
                                                <TableHeader>
                                                    <TableRow>
                                                        <TableHead>Position</TableHead>
                                                        <TableHead className="text-center">Unique Starters</TableHead>
                                                        <TableHead className="text-center">Streamed Starts</TableHead>
                                                        <TableHead className="text-right">Avg Pts/Gm</TableHead>
                                                        <TableHead className="text-right">League Avg</TableHead>
                                                        <TableHead className="text-right">Net Pts vs Avg</TableHead>
                                                        <TableHead className="text-right">Hit Rate</TableHead>
                                                    </TableRow>
                                                </TableHeader>
                                                <TableBody>
                                                    {gmIndividualSeasonData.streamingSuccess.streamingSummary.map(item => (
                                                        <TableRow key={`streaming-summary-${item.position}`}>
                                                            <TableCell className="font-medium">{getPositionName(item.position)}</TableCell>
                                                            <TableCell className="text-center">{item.uniqueStarters ?? '-'}</TableCell>
                                                            <TableCell className="text-center">{item.streamedStartsCount ?? '-'}</TableCell>
                                                             <TableCell className="text-right">{item.avgPtsGm?.toFixed(1) ?? '-'}</TableCell>
                                                            <TableCell className="text-right">{item.avgPtsLeague?.toFixed(1) ?? '-'}</TableCell>
                                                            <TableCell className={cn("text-right", typeof item.netPtsVsAvg === 'number' && item.netPtsVsAvg != null && item.netPtsVsAvg >= 0 ? "text-green-600 dark:text-green-400" : (typeof item.netPtsVsAvg === 'number' && item.netPtsVsAvg != null && item.netPtsVsAvg < 0 ? "text-red-600 dark:text-red-400" : ""))}>
                                                                {(typeof item.netPtsVsAvg === 'number' && item.netPtsVsAvg != null && item.netPtsVsAvg >=0 ? '+':'' )+ (item.netPtsVsAvg?.toFixed(1) ?? '-')}
                                                            </TableCell>
                                                            <TableCell className="text-right">{item.hitRate?.toFixed(1) ?? '-'}%</TableCell>
                                                        </TableRow>
                                                    ))}
                                                </TableBody>
                                            </Table>
                                        </div>
                                        ) : <p className="text-muted-foreground text-center py-4">Streaming summary data not available.</p>}
                                    </CardContent>
                                </Card>

                                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {['QB', 'TE'].map(pos => {
                                        const weeklyData = gmIndividualSeasonData.streamingSuccess?.streamingWeeklyPerformance?.[pos];
                                        return Array.isArray(weeklyData) && weeklyData.length > 0 && (
                                            <Card key={`streaming-weekly-${pos}`}>
                                                <CardHeader><CardTitle className="flex items-center text-lg">{getPositionName(pos)} Streaming Performance</CardTitle></CardHeader>
                                                <CardContent className="overflow-x-auto">
                                                    <Table>
                                                        <TableHeader>
                                                            <TableRow>
                                                                <TableHead className="text-center">WK</TableHead>
                                                                <TableHead>Player Started</TableHead>
                                                                <TableHead className="text-right">GM Pts</TableHead>
                                                                <TableHead className="text-right">League Avg Pts</TableHead>
                                                            </TableRow>
                                                        </TableHeader>
                                                        <TableBody>
                                                            {weeklyData.map((item, index) => (
                                                                <TableRow key={`streaming-wk-detail-${pos}-${index}`}>
                                                                    <TableCell className="text-center">{item.week}</TableCell>
                                                                    <TableCell>{item.playerName}</TableCell>
                                                                    <TableCell className="text-right">{item.gmStarterPts?.toFixed(1) ?? '-'}</TableCell>
                                                                    <TableCell className="text-right">{item.leagueAvgPts?.toFixed(1) ?? '-'}</TableCell>
                                                                </TableRow>
                                                            ))}
                                                        </TableBody>
                                                    </Table>
                                                </CardContent>
                                            </Card>
                                        )
                                    })}
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                     {['K', 'DST'].map(pos => {
                                        const weeklyData = gmIndividualSeasonData.streamingSuccess?.streamingWeeklyPerformance?.[pos];
                                        return Array.isArray(weeklyData) && weeklyData.length > 0 && (
                                            <Card key={`streaming-weekly-${pos}`}>
                                                <CardHeader><CardTitle className="flex items-center text-lg">{getPositionName(pos)} Streaming Performance</CardTitle></CardHeader>
                                                <CardContent className="overflow-x-auto">
                                                    <Table>
                                                        <TableHeader>
                                                            <TableRow>
                                                                <TableHead className="text-center">WK</TableHead>
                                                                <TableHead>Player Started</TableHead>
                                                                <TableHead className="text-right">GM Pts</TableHead>
                                                                <TableHead className="text-right">League Avg Pts</TableHead>
                                                            </TableRow>
                                                        </TableHeader>
                                                        <TableBody>
                                                            {weeklyData.map((item, index) => (
                                                                <TableRow key={`streaming-wk-detail-${pos}-${index}`}>
                                                                    <TableCell className="text-center">{item.week}</TableCell>
                                                                    <TableCell>{item.playerName}</TableCell>
                                                                    <TableCell className="text-right">{item.gmStarterPts?.toFixed(1) ?? '-'}</TableCell>
                                                                    <TableCell className="text-right">{item.leagueAvgPts?.toFixed(1) ?? '-'}</TableCell>
                                                                </TableRow>
                                                            ))}
                                                        </TableBody>
                                                    </Table>
                                                </CardContent>
                                            </Card>
                                        )
                                    })}
                                </div>
                            </div>
                        ) : <p className="text-muted-foreground text-center py-4">Streaming success data not available.</p>}
                    </TabsContent>
                </Tabs>
            </div>
        ) : (
            <Card className="mt-6">
                <CardHeader><CardTitle className="flex items-center gap-2"><User className="text-primary"/>{selectedGmName} - {selectedViewOption} Season</CardTitle></CardHeader>
                <CardContent className="pt-6 text-center text-muted-foreground">
                    No detailed data found for {selectedGmName} for the {selectedViewOption} season.
                </CardContent>
            </Card>
        )
      )}

      {!loading && !error && !gmData && selectedGmId && (
         <Card><CardContent className="pt-6 text-center text-muted-foreground">No data found for {selectedGmName}. Ensure the file '/data/league_data/{selectedGmId.toLowerCase().replace(/\s+/g, '')}/{selectedGmId.toLowerCase().replace(/\s+/g, '')}.json' exists and is correctly formatted as per the expected structure.</CardContent></Card>
       )}
       {!loading && !error && !gmData && !selectedGmId && (
         <Card><CardContent className="pt-6 text-center text-muted-foreground">Please select a GM to view career details.</CardContent></Card>
       )}
    </div>
  );
};


export default function LeagueHistoryPage() {
  const searchParams = useSearchParams();
  const sectionFromQuery = searchParams.get('section'); 
  const [activeMainTab, setActiveMainTab] = useState<string>(sectionFromQuery || 'all-seasons');

  const [leagueData, setLeagueData] = useState<LeagueData | null>(null);
  const [loadingLeagueData, setLoadingLeagueData] = useState(true);


  useEffect(() => {
    const newSection = sectionFromQuery || 'all-seasons';
    if (newSection !== activeMainTab) {
        setActiveMainTab(newSection);
    }
  }, [sectionFromQuery, activeMainTab]);


  useEffect(() => {
    if (activeMainTab === 'all-seasons' && !leagueData) { 
        setLoadingLeagueData(true);
        console.log("[LeagueHistoryPage] Attempting to fetch league-data.json");
        fetch('/data/league_data/league-data.json')
          .then(async res => {
            console.log("[LeagueHistoryPage] Fetch response status for league-data.json:", res.status, res.statusText);
            if (!res.ok) {
              let errorBody = "Failed to parse error response body";
              try {
                  errorBody = await res.text();
              } catch(e) { console.error("Error parsing error response body:", e); }
              const shortErrorBody = errorBody.substring(0,200);
              console.error("Failed to fetch league-data.json, status:", res.status, "Body:", shortErrorBody);
              setLeagueData(null);
              throw new Error(`HTTP error! status: ${res.status}. Body: ${shortErrorBody}`);
            }
            return res.json();
          })
          .then((data: any) => {
            console.log("[LeagueHistoryPage] Successfully fetched and parsed league-data.json:", data);
            const mappedCareerLeaderboard = (Array.isArray(data.careerLeaderboard) ? data.careerLeaderboard : []).map((stat: any) => ({
              ...stat,
              pointsFor: stat.pointsFor ?? stat.points ?? 0, 
              pointsAgainst: stat.pointsAgainst ?? 0,
            }));

            const processedData: LeagueData = {
              championshipTimeline: Array.isArray(data.championshipTimeline) ? data.championshipTimeline : [],
              careerLeaderboard: mappedCareerLeaderboard,
              leagueRecords: Array.isArray(data.leagueRecords) ? data.leagueRecords : [],
              finalStandingsHeatmap: Array.isArray(data.finalStandingsHeatmap) ? data.finalStandingsHeatmap : [],
              playoffQualificationRate: Array.isArray(data.playoffQualificationRate) ? data.playoffQualificationRate : [],
              gmPlayoffPerformance: Array.isArray(data.gmPlayoffPerformance) ? data.gmPlayoffPerformance : [],
            };
            setLeagueData(processedData);
          })
          .catch(error => {
            console.error("Failed to load or process league-data.json:", error);
            setLeagueData(null); 
          })
          .finally(() => {
            setLoadingLeagueData(false);
          });
    } else if (activeMainTab !== 'all-seasons' && leagueData) {
        
    } else if (activeMainTab !== 'all-seasons' && !leagueData) {
      setLoadingLeagueData(false);
    }

  }, [activeMainTab, leagueData]); 

  if (activeMainTab === 'all-seasons') {
    return <AllSeasonsOverview leagueData={leagueData} loading={loadingLeagueData} />;
  }
  if (activeMainTab === 'season-detail') {
    return <SeasonDetail />;
  }
  if (activeMainTab === 'gm-career') {
    return <GMCareer />;
  }

  return <AllSeasonsOverview leagueData={leagueData} loading={loadingLeagueData} />;
}

