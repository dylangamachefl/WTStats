
"use client";
import { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
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
  GMCareerData,
  SeasonStandingEntry,
  PlayoffMatchup,
  StrengthOfScheduleEntry,
  WaiverPickupEntry,
  TopPerformerPlayer,
  SeasonBestOverallGameEntry,
  WeeklyScoresMatrixData,
  PositionalTopPerformersData,
  GMInfo as GMInfoType, 
  CareerStats as CareerStatsType, 
  CareerExtremes as CareerExtremesType, 
  SeasonProgressionEntry as SeasonProgressionEntryType,
  PositionStrengthEntry as PositionStrengthEntryType, 
  FranchisePlayerEntry as FranchisePlayerEntryType, 
  RivalryPerformanceEntry as RivalryPerformanceEntryType,
} from '@/lib/types';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import Image from 'next/image';
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from '@/lib/utils';
import { ArrowUpDown, ListChecks, Users, Trophy, BarChart2, CalendarDays, LineChart as LineChartIconRecharts, ClipboardList, CheckCircle2, XCircle, ShieldAlert, Zap, ArrowUp, ArrowDown, UserRound, DownloadCloud, TrendingUp, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Carousel, CarouselContent, CarouselItem, CarouselPrevious, CarouselNext } from "@/components/ui/carousel";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { LineChart, Line, ResponsiveContainer, CartesianGrid, XAxis, YAxis, Tooltip, Legend as RechartsLegend, Scatter, ZAxis, Cell as RechartsCell, PieChart, Pie, Cell as PieCell, Legend, BarChart, Bar } from 'recharts';
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Separator } from '@/components/ui/separator';


// Mock data for SeasonDetail and GMCareer tabs (as types)
import type { Season as SeasonType_Mock, GM as GM_Mock } from '@/lib/types';

// These mocks are used for populating the Select dropdowns.
const mockSeasonsForTabs: SeasonType_Mock[] = [
  { id: "2009", year: 2009 }, { id: "2010", year: 2010 }, { id: "2011", year: 2011 }, { id: "2012", year: 2012 }, { id: "2013", year: 2013 }, { id: "2014", year: 2014 }, { id: "2015", year: 2015 }, { id: "2016", year: 2016 }, { id: "2017", year: 2017 }, { id: "2018", year: 2018 }, { id: "2019", year: 2019 }, { id: "2020", year: 2020 }, { id: "2021", year: 2021 }, { id: "2022", year: 2022 }, { id: "2023", year: 2023 }, { id: "2024", year: 2024 },
];

const mockGmsForTabs: GM_Mock[] = [
  { id: "chris", name: "Chris" }, { id: "dan", name: "Dan" }, { id: "dylan", name: "Dylan" }, { id: "fitz", name: "Fitz" }, { id: "jack", name: "Jack" }, { id: "jake", name: "Jake" }, { id: "josh", name: "Josh" }, { id: "lac", name: "Lac" }, { id: "mark", name: "Mark" }, { id: "nick", name: "Nick" }, { id: "sean", name: "Sean" }, { id: "will", name: "Will" }, { id: "zach", name: "Zach" },
];


type SortDirection = 'asc' | 'desc';

interface SortConfig<T> {
  key: keyof T | null;
  direction: SortDirection;
}

const AllSeasonsOverview = ({ leagueData, loading }: { leagueData: LeagueData | null; loading: boolean; }) => {
  const [heatmapYears, setHeatmapYears] = useState<string[]>([]);
  const [maxRankPerYear, setMaxRankPerYear] = useState<{ [year: string]: number }>({});

  const [careerSortConfig, setCareerSortConfig] = useState<SortConfig<CareerStat>>({ key: 'name', direction: 'asc' });
  const [recordsSortConfig, setRecordsSortConfig] = useState<SortConfig<LeagueRecord>>({ key: 'record_category', direction: 'asc' });
  const [playoffPerfSortConfig, setPlayoffPerfSortConfig] = useState<SortConfig<GMPlayoffPerformanceStat>>({ key: 'gm_name', direction: 'asc' });
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

  const getRankStyle = (rank: number | null | undefined, maxRankInYear: number): { textClass: string; borderClass: string; style: React.CSSProperties } => {
    const defaultStyle = { textClass: 'font-semibold text-foreground', borderClass: '', style: {} };
    const coloredRankedStyle = { textClass: 'font-semibold text-neutral-800', borderClass: '', style: {} };

    if (rank === null || rank === undefined) return { textClass: 'text-muted-foreground', borderClass: '', style: {} };
    
    if (rank === 1) {
      return { 
        textClass: 'text-neutral-800 font-semibold', 
        borderClass: 'border-2 border-foreground', 
        style: { backgroundColor: 'hsl(50, 95%, 60%)' } 
      };
    }

    if (maxRankInYear <= 1) return defaultStyle;

    const SATURATION = 60;
    const MAX_LIGHTNESS = 92; 
    const MIN_LIGHTNESS = 78; 
    const NEUTRAL_BANDWIDTH_PERCENT = 0.25; 

    const numRanksToScale = maxRankInYear - 1; 
    if (numRanksToScale <= 0) return defaultStyle; 

    const rankPositionInScale = rank - 2; 
    const normalizedRank = numRanksToScale > 1 ? rankPositionInScale / (numRanksToScale -1) : 0.5; 
    const clampedNormalizedRank = Math.min(1, Math.max(0, normalizedRank));

    const neutralZoneStart = 0.5 - NEUTRAL_BANDWIDTH_PERCENT / 2;
    const neutralZoneEnd = 0.5 + NEUTRAL_BANDWIDTH_PERCENT / 2;

    const GREEN_HUE = 120;
    const RED_HUE = 0;

    let backgroundColor = '';

    if (clampedNormalizedRank >= neutralZoneStart && clampedNormalizedRank <= neutralZoneEnd) {
      return defaultStyle;
    } else if (clampedNormalizedRank < neutralZoneStart) {
      const greenZoneWidth = neutralZoneStart; 
      const t_green = greenZoneWidth > 0 ? (neutralZoneStart - clampedNormalizedRank) / greenZoneWidth : 1; 
      const lightness = MAX_LIGHTNESS - t_green * (MAX_LIGHTNESS - MIN_LIGHTNESS);
      backgroundColor = `hsl(${GREEN_HUE}, ${SATURATION}%, ${lightness.toFixed(0)}%)`;
    } else { 
      const redZoneEffectiveStart = neutralZoneEnd;
      const redZoneWidth = 1 - redZoneEffectiveStart; 
      const t_red = redZoneWidth > 0 ? (clampedNormalizedRank - redZoneEffectiveStart) / redZoneWidth : 0; 
      const lightness = MAX_LIGHTNESS - t_red * (MAX_LIGHTNESS - MIN_LIGHTNESS);
      backgroundColor = `hsl(${RED_HUE}, ${SATURATION}%, ${lightness.toFixed(0)}%)`;
    }
    
    return { 
      textClass: coloredRankedStyle.textClass, 
      borderClass: '', 
      style: { backgroundColor } 
    };
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
      return <ArrowUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50 group-hover:opacity-100 transition-opacity" />;
    }
    return <ArrowUpDown className="ml-2 h-4 w-4 shrink-0 opacity-0 group-hover:opacity-50 transition-opacity" />;
  };

 const sortData = <T,>(data: T[] | undefined | null, config: SortConfig<T>): T[] => {
    if (!config || !config.key || !data) {
      return Array.isArray(data) ? data : [];
    }
    if (!Array.isArray(data)) {
      console.warn("sortData received non-array data:", data);
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
          if (config.key === 'winPct' || config.key === 'playoffRate' || (config.key as string) === 'qualification_rate') {
            const numA = parseFloat(String(valA).replace('%', ''));
            const numB = parseFloat(String(valB).replace('%', ''));
            if (!isNaN(numA) && !isNaN(numB)) {
              comparison = numA - numB;
            } else {
              comparison = String(valA).localeCompare(String(valB));
            }
          } else if (config.key === 'value' && typeof valA === 'string' && /^-?\d+(\.\d+)?$/.test(valA) && typeof valB === 'string' && /^-?\d+(\.\d+)?$/.test(valB)) {
            const numA = parseFloat(valA);
            const numB = parseFloat(valB);
            comparison = numA - numB;
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
      console.error("Error in sortData:", e, { data, config });
      return Array.isArray(data) ? data : []; 
    }
  };

  const sortedCareerLeaderboard = useMemo(() => {
    if (!leagueData?.careerLeaderboard || !Array.isArray(leagueData.careerLeaderboard)) return [];
    return sortData([...leagueData.careerLeaderboard], careerSortConfig);
  }, [leagueData?.careerLeaderboard, careerSortConfig]);
  const requestCareerSort = createSortHandler(careerSortConfig, setCareerSortConfig);

  const sortedLeagueRecords = useMemo(() => {
    if (!leagueData?.leagueRecords || !Array.isArray(leagueData.leagueRecords)) return [];
    return sortData([...leagueData.leagueRecords], recordsSortConfig);
  }, [leagueData?.leagueRecords, recordsSortConfig]);
  const requestRecordsSort = createSortHandler(recordsSortConfig, setRecordsSortConfig);

  const sortedGmPlayoffPerformance = useMemo(() => {
    if (!leagueData?.gmPlayoffPerformance || !Array.isArray(leagueData.gmPlayoffPerformance)) return [];
    return sortData([...leagueData.gmPlayoffPerformance], playoffPerfSortConfig);
  }, [leagueData?.gmPlayoffPerformance, playoffPerfSortConfig]);
  const requestPlayoffPerfSort = createSortHandler(playoffPerfSortConfig, setPlayoffPerfSortConfig);

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
      <div className="space-y-8">
        <Card>
          <CardHeader><CardTitle>Championship Timeline</CardTitle></CardHeader>
          <CardContent className="px-0 sm:px-6 flex items-center justify-center">
            <Skeleton className="w-full h-60 mx-auto" />
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Career Leaderboard</CardTitle></CardHeader>
          <CardContent><Skeleton className="h-64" /></CardContent>
        </Card>
        <div className="grid md:grid-cols-2 gap-6">
          <Card>
            <CardHeader><CardTitle>League Records</CardTitle></CardHeader>
            <CardContent><Skeleton className="h-40" /></CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle>Playoff Qualification Rate</CardTitle></CardHeader>
            <CardContent className="h-[300px]"><Skeleton className="h-full w-full" /></CardContent>
          </Card>
        </div>
        <Card>
          <CardHeader><CardTitle>Final Standings Heatmap</CardTitle></CardHeader>
          <CardContent><Skeleton className="h-64" /></CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>GM Playoff Performance</CardTitle></CardHeader>
          <CardContent><Skeleton className="h-64" /></CardContent>
        </Card>
      </div>
    );
  }

  if (!leagueData) {
    return <Card><CardContent className="pt-6 text-center">Failed to load league data. Check console for errors or ensure 'public/data/league_data/league-data.json' is correctly placed and formatted.</CardContent></Card>;
  }

  return (
    <div className="space-y-8">
      <Card>
        <CardHeader>
          <CardTitle>Championship Timeline</CardTitle>
          <CardDescription>A chronological display of league champions and their key players.</CardDescription>
        </CardHeader>
        <CardContent className="px-0 sm:px-6">
          <Carousel
            opts={{
              align: "start",
              loop: Array.isArray(leagueData.championshipTimeline) && leagueData.championshipTimeline.length > 1,
            }}
            className="w-full"
          >
            <CarouselContent>
              {Array.isArray(leagueData.championshipTimeline) && leagueData.championshipTimeline.map((champion: ChampionTimelineEntry, index: number) => (
                <CarouselItem key={index} className="basis-full sm:basis-1/2 md:basis-1/3 lg:basis-1/4 xl:basis-1/5 p-1">
                   <Card className="flex flex-col p-4 h-full gap-3 rounded-lg shadow-md hover:shadow-lg transition-shadow transform hover:-translate-y-1">
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
                        <AvatarFallback className="text-3xl">
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
                            <div key={idx} className="flex items-center gap-2 bg-muted/50 p-1.5 rounded-md text-xs">
                              <UserRound size={14} className="text-muted-foreground" />
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
            <CarouselPrevious />
            <CarouselNext />
          </Carousel>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Career Leaderboard</CardTitle></CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>
                  <Button variant="ghost" onClick={() => requestCareerSort('name')} className="px-1 group">
                    GM {getSortIcon(careerSortConfig, 'name')}
                  </Button>
                </TableHead>
                <TableHead>
                  <Button variant="ghost" onClick={() => requestCareerSort('wins')} className="px-1 group">
                    W {getSortIcon(careerSortConfig, 'wins')}
                  </Button>
                </TableHead>
                <TableHead>
                  <Button variant="ghost" onClick={() => requestCareerSort('losses')} className="px-1 group">
                    L {getSortIcon(careerSortConfig, 'losses')}
                  </Button>
                </TableHead>
                <TableHead>
                  <Button variant="ghost" onClick={() => requestCareerSort('ties')} className="px-1 group">
                    T {getSortIcon(careerSortConfig, 'ties')}
                  </Button>
                </TableHead>
                <TableHead>
                  <Button variant="ghost" onClick={() => requestCareerSort('winPct')} className="px-1 group">
                    Win% {getSortIcon(careerSortConfig, 'winPct')}
                  </Button>
                </TableHead>
                <TableHead>
                  <Button variant="ghost" onClick={() => requestCareerSort('championships')} className="px-1 group">
                    Champs {getSortIcon(careerSortConfig, 'championships')}
                  </Button>
                </TableHead>
                <TableHead>
                  <Button variant="ghost" onClick={() => requestCareerSort('pointsFor')} className="px-1 group">
                    PF {getSortIcon(careerSortConfig, 'pointsFor')}
                  </Button>
                </TableHead>
                <TableHead>
                  <Button variant="ghost" onClick={() => requestCareerSort('pointsAgainst')} className="px-1 group">
                    PA {getSortIcon(careerSortConfig, 'pointsAgainst')}
                  </Button>
                </TableHead>
                <TableHead>
                  <Button variant="ghost" onClick={() => requestCareerSort('playoffRate')} className="px-1 group">
                    Playoff Rate {getSortIcon(careerSortConfig, 'playoffRate')}
                  </Button>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {Array.isArray(sortedCareerLeaderboard) && sortedCareerLeaderboard.map((stat: CareerStat) => (
                <TableRow key={stat.name}>
                  <TableCell className="font-medium">{stat.name}</TableCell>
                  <TableCell>{stat.wins}</TableCell>
                  <TableCell>{stat.losses}</TableCell>
                  <TableCell>{stat.ties}</TableCell>
                  <TableCell>{stat.winPct}</TableCell>
                  <TableCell>{stat.championships}</TableCell>
                  <TableCell>{stat.pointsFor?.toFixed(2) ?? 'N/A'}</TableCell>
                  <TableCell>{stat.pointsAgainst?.toFixed(2) ?? 'N/A'}</TableCell>
                  <TableCell>{stat.playoffRate !== undefined && stat.playoffRate !== null ? (stat.playoffRate * 100).toFixed(1) + '%' : 'N/A'}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader><CardTitle>League Records</CardTitle></CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>
                    <Button variant="ghost" onClick={() => requestRecordsSort('record_category')} className="px-1 group">
                      Category {getSortIcon(recordsSortConfig, 'record_category')}
                    </Button>
                  </TableHead>
                  <TableHead>
                    <Button variant="ghost" onClick={() => requestRecordsSort('gm_name')} className="px-1 group">
                      GM {getSortIcon(recordsSortConfig, 'gm_name')}
                    </Button>
                  </TableHead>
                  <TableHead>
                    <Button variant="ghost" onClick={() => requestRecordsSort('value')} className="px-1 group">
                      Value {getSortIcon(recordsSortConfig, 'value')}
                    </Button>
                  </TableHead>
                  <TableHead>
                    <Button variant="ghost" onClick={() => requestRecordsSort('seasons')} className="px-1 group">
                      Season(s) {getSortIcon(recordsSortConfig, 'seasons')}
                    </Button>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {Array.isArray(sortedLeagueRecords) && sortedLeagueRecords.map((record: LeagueRecord, index: number) => (
                  <TableRow key={index}>
                    <TableCell className="font-medium">{record.record_category}</TableCell>
                    <TableCell>{record.gm_name}</TableCell>
                    <TableCell>{record.value}{record.record_category === "Lowest Score" || record.record_category === "Highest Score" ? " pts" : ""}</TableCell>
                    <TableCell>{record.seasons}{record.week ? ` (Wk ${record.week})` : ""}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {Array.isArray(leagueData.playoffQualificationRate) && leagueData.playoffQualificationRate.length > 0 && (
          <Card>
            <CardHeader><CardTitle>Playoff Qualification Rate</CardTitle></CardHeader>
            <CardContent className="h-[300px] pt-6">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={sortedPlayoffRates}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="gm_name" />
                  <YAxis tickFormatter={(value) => `${(value * 100).toFixed(0)}%`} />
                  <Tooltip formatter={(value: number) => `${(value * 100).toFixed(1)}%`} />
                  <RechartsLegend />
                  <Bar dataKey="qualification_rate" fill="hsl(var(--chart-1))" name="Playoff Rate" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Final Standings Heatmap</CardTitle>
          <CardDescription>GM finishing positions by year. 1st place is yellow with a dark border. Other ranks transition from light green (better) through neutral to light red (worse).</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="sticky left-0 bg-card z-10 py-2 px-1 text-xs md:text-sm">
                    <Button variant="ghost" onClick={() => requestHeatmapSort('gm_name')} className="px-1 group">
                      GM {getSortIcon(heatmapSortConfig, 'gm_name')}
                    </Button>
                  </TableHead>
                  {heatmapYears.map(year => (
                    <TableHead key={year} className="text-center py-2 px-1 text-xs md:text-sm whitespace-nowrap">{year}</TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {Array.isArray(sortedFinalStandingsHeatmap) && sortedFinalStandingsHeatmap.map((gmEntry: FinalStandingsHeatmapEntry) => (
                  <TableRow key={gmEntry.gm_name}>
                    <TableCell className="font-medium sticky left-0 bg-card z-10 py-2 px-1 text-xs md:text-sm whitespace-nowrap">{gmEntry.gm_name}</TableCell>
                    {heatmapYears.map(year => {
                      const rank = gmEntry[year] as number | null | undefined;
                      const { textClass, borderClass, style } = getRankStyle(rank, maxRankPerYear[year] || 0);
                      const displayValue = (rank !== undefined && rank !== null) ? rank : '-';

                      return (
                        <TableCell
                          key={year}
                          className={cn(
                            "text-center py-2 px-1 text-xs md:text-sm min-w-[40px] md:min-w-[50px]",
                            textClass,
                            borderClass
                          )}
                          style={style}
                        >
                          {displayValue}
                        </TableCell>
                      );
                    })}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {Array.isArray(leagueData.gmPlayoffPerformance) && leagueData.gmPlayoffPerformance.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>GM Playoff Performance</CardTitle>
            <CardDescription>Statistics from playoff appearances.</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead><Button variant="ghost" onClick={() => requestPlayoffPerfSort('gm_name')} className="px-1 group">GM {getSortIcon(playoffPerfSortConfig, 'gm_name')}</Button></TableHead>
                  <TableHead className="text-right"><Button variant="ghost" onClick={() => requestPlayoffPerfSort('total_matchups')} className="px-1 group justify-end w-full">Total Matchups {getSortIcon(playoffPerfSortConfig, 'total_matchups')}</Button></TableHead>
                  <TableHead className="text-right"><Button variant="ghost" onClick={() => requestPlayoffPerfSort('wins')} className="px-1 group justify-end w-full">Wins {getSortIcon(playoffPerfSortConfig, 'wins')}</Button></TableHead>
                  <TableHead className="text-right"><Button variant="ghost" onClick={() => requestPlayoffPerfSort('losses')} className="px-1 group justify-end w-full">Losses {getSortIcon(playoffPerfSortConfig, 'losses')}</Button></TableHead>
                  <TableHead className="text-right"><Button variant="ghost" onClick={() => requestPlayoffPerfSort('quarterfinal_matchups')} className="px-1 group justify-end w-full">Quarterfinals {getSortIcon(playoffPerfSortConfig, 'quarterfinal_matchups')}</Button></TableHead>
                  <TableHead className="text-right"><Button variant="ghost" onClick={() => requestPlayoffPerfSort('semifinal_matchups')} className="px-1 group justify-end w-full">Semifinals {getSortIcon(playoffPerfSortConfig, 'semifinal_matchups')}</Button></TableHead>
                  <TableHead className="text-right"><Button variant="ghost" onClick={() => requestPlayoffPerfSort('championship_matchups')} className="px-1 group justify-end w-full">Championships {getSortIcon(playoffPerfSortConfig, 'championship_matchups')}</Button></TableHead>
                  <TableHead className="text-right"><Button variant="ghost" onClick={() => requestPlayoffPerfSort('avg_playoff_points_weekly')} className="px-1 group justify-end w-full">Avg Pts {getSortIcon(playoffPerfSortConfig, 'avg_playoff_points_weekly')}</Button></TableHead>
                  <TableHead className="text-right"><Button variant="ghost" onClick={() => requestPlayoffPerfSort('playoff_performance_pct')} className="px-1 group justify-end w-full">Perf % {getSortIcon(playoffPerfSortConfig, 'playoff_performance_pct')}</Button></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {Array.isArray(sortedGmPlayoffPerformance) && sortedGmPlayoffPerformance.map((gmPerf: GMPlayoffPerformanceStat) => (
                  <TableRow key={gmPerf.gm_name}>
                    <TableCell className="font-medium">{gmPerf.gm_name}</TableCell>
                    <TableCell className="text-right">{gmPerf.total_matchups}</TableCell>
                    <TableCell className="text-right">{gmPerf.wins}</TableCell>
                    <TableCell className="text-right">{gmPerf.losses}</TableCell>
                    <TableCell className="text-right">{gmPerf.quarterfinal_matchups}</TableCell>
                    <TableCell className="text-right">{gmPerf.semifinal_matchups}</TableCell>
                    <TableCell className="text-right">{gmPerf.championship_matchups}</TableCell>
                    <TableCell className="text-right">{gmPerf.avg_playoff_points_weekly?.toFixed(2) ?? 'N/A'}</TableCell>
                    <TableCell className="text-right">{gmPerf.playoff_performance_pct?.toFixed(2) ?? 'N/A'}%</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

const getRatingBadgeClass = (rating?: string): string => {
  if (!rating) return "bg-gray-200 text-gray-800";
  switch (rating.toLowerCase()) {
    case 'very hard':
      return 'bg-red-600 text-red-50';
    case 'hard':
      return 'bg-orange-500 text-orange-50';
    case 'above avg':
      return 'bg-yellow-400 text-yellow-800';
    case 'below avg':
      return 'bg-lime-400 text-lime-800';
    case 'easy':
      return 'bg-green-500 text-green-50';
    default:
      return 'bg-gray-200 text-gray-800';
  }
};

const getPositionBadgeClass = (position?: string): string => {
  if (!position) return "bg-muted text-muted-foreground"; // Default
  switch (position?.toUpperCase()) {
    case 'QB':
      return 'bg-red-100 text-red-700'; 
    case 'RB':
      return 'bg-blue-100 text-blue-700';
    case 'WR':
      return 'bg-green-100 text-green-700';
    case 'TE':
      return 'bg-yellow-100 text-yellow-700'; 
    case 'K':
      return 'bg-purple-100 text-purple-700';
    case 'DST':
    case 'DEF':
      return 'bg-indigo-100 text-indigo-700';
    default:
      return "bg-muted text-muted-foreground";
  }
};

const getPositionName = (positionKey: string): string => {
    const names: { [key: string]: string } = {
      QB: "Quarterbacks",
      RB: "Running Backs",
      WR: "Wide Receivers",
      TE: "Tight Ends",
      K: "Kickers",
      DST: "Defense/ST",
      DEF: "Defense/ST",
    };
    return names[positionKey.toUpperCase()] || positionKey;
  };

const SeasonDetail = () => {
  const [selectedSeason, setSelectedSeason] = useState<string | undefined>(mockSeasonsForTabs[mockSeasonsForTabs.length-1]?.id);
  const [seasonData, setSeasonData] = useState<SeasonDetailData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [weeklyScoresDisplayMode, setWeeklyScoresDisplayMode] = useState<'scores' | 'results'>('scores');

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
            } catch (e) { /* ignore if body can't be read */ }
            console.error(`[SeasonDetail] HTTP error! Status: ${res.status}. Body: ${errorBody}`);
            throw new Error(`Failed to fetch ${seasonFilePath}. Status: ${res.status} ${res.statusText}. Server response: ${errorBody.substring(0,100)}...`);
          }
          const data = await res.json();
          console.log(`[SeasonDetail] Successfully fetched and parsed data for ${selectedSeason}:`, data);
          
          if (!data || !data.seasonData || !data.standingsData) {
            console.error("[SeasonDetail] Fetched data is missing crucial fields (e.g. seasonData or standingsData). Full data:", data);
            setSeasonData(null); 
            throw new Error(`Fetched data for ${selectedSeason} is incomplete. Essential fields like 'seasonData' or 'standingsData' are missing.`);
          }
          setSeasonData(data);
        })
        .catch(err => {
          console.error(`[SeasonDetail] Failed to load or process season data for ${selectedSeason}:`, err);
          setError(`Failed to load data for ${selectedSeason}. Details: ${err.message}. Check browser console and ensure '${selectedSeason}.json' exists at '${seasonFilePath}' and is correctly formatted.`);
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

  const renderPlayoffMatchup = (matchup: PlayoffMatchup, roundName: string, isChampionship: boolean = false) => (
    <div className={cn("p-3 border rounded-md shadow-sm", isChampionship ? "bg-yellow-100 dark:bg-yellow-800/30" : "bg-card")}>
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
        {matchup.home.score !== undefined && matchup.away.score !== undefined && (
          <p className="text-xs text-muted-foreground mt-1">
            Winner: {matchup.home.score > matchup.away.score ? matchup.home.owner : matchup.away.owner}
          </p>
        )}
      </div>
    </div>
  );
  
  const getScoreCellClass = (score: number | undefined | null): string => {
    if (score === undefined || score === null) return 'bg-muted/30 text-muted-foreground';
    if (score >= 140) return 'bg-green-200 text-green-800';
    if (score >= 125) return 'bg-green-100 text-green-700';
    if (score >= 110) return 'bg-lime-100 text-lime-700';
    if (score >= 100) return 'bg-yellow-100 text-yellow-700';
    if (score >= 90) return 'bg-orange-100 text-orange-700';
    return 'bg-red-100 text-red-700';
  };
  
  const averageScores = useMemo(() => {
    if (!seasonData?.weeklyScoresData?.teams || !Array.isArray(seasonData.weeklyScoresData.teams) || !seasonData.weeklyScoresData.scores || !Array.isArray(seasonData.weeklyScoresData.scores)) return {};
    const averages: { [teamName: string]: number | null } = {};
    seasonData.weeklyScoresData.teams.forEach((teamName, teamIndex) => {
      let totalScore = 0;
      let gameCount = 0;
      seasonData.weeklyScoresData!.scores.forEach(weekScores => {
        if(Array.isArray(weekScores)){
          const score = weekScores[teamIndex];
          if (score !== null && score !== undefined) {
            totalScore += score;
            gameCount++;
          }
        }
      });
      averages[teamName] = gameCount > 0 ? totalScore / gameCount : null;
    });
    return averages;
  }, [seasonData?.weeklyScoresData]);

  const weeklyScoreLegendItems = [
    { label: '140+ pts', className: 'bg-green-200 text-green-800' },
    { label: '125-139', className: 'bg-green-100 text-green-700' },
    { label: '110-124', className: 'bg-lime-100 text-lime-700' },
    { label: '100-109', className: 'bg-yellow-100 text-yellow-700' },
    { label: '90-99', className: 'bg-orange-100 text-orange-700' },
    { label: '<90 pts', className: 'bg-red-100 text-red-700' },
  ];

  const weeklyResultLegendItems = [
    { label: 'W - Win', className: 'bg-green-100 text-green-700 font-semibold' },
    { label: 'L - Loss', className: 'bg-red-100 text-red-700 font-semibold' },
    { label: 'T - Tie', className: 'bg-gray-100 text-gray-700 font-semibold' },
  ];

  const isModernWaiverSeason = useMemo(() => {
    const year = parseInt(selectedSeason || "0");
    return year >= 2019;
  }, [selectedSeason]);

  return (
    <div className="space-y-6">
        <Card className="overflow-visible">
          <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
                <CardTitle className="flex items-center gap-2">
                <CalendarDays className="text-primary h-6 w-6" /> 
                {seasonData?.seasonData?.year || selectedSeason || ""} Season Detail
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
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-2 mb-4">
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
                <Tabs defaultValue="overview" className="w-full">
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
                        <CardContent>
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
                                    {s.regular_season_finish === 1 ? <Trophy className="h-5 w-5 text-yellow-500 inline-block" /> : s.regular_season_finish}
                                    </TableCell>
                                    <TableCell>{s.wt_team_name}</TableCell>
                                    <TableCell>{s.owner_name}</TableCell>
                                    <TableCell className="text-center">{s.regular_season_wins}</TableCell>
                                    <TableCell className="text-center">{s.regular_season_losses}</TableCell>
                                    <TableCell className="text-right">{s.regular_season_points_for?.toFixed(1)}</TableCell>
                                    <TableCell className="text-right">{s.regular_season_points_against?.toFixed(1)}</TableCell>
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
                            <p className="text-muted-foreground text-center py-4">No standings data available for {seasonData.seasonData.year}.</p>
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
                                    {seasonData.playoffData.quarterFinals.map((matchup, idx) => renderPlayoffMatchup(matchup, `Quarterfinal ${idx + 1}`))}
                                </div>
                                </div>
                            )}
                            {seasonData.playoffData.semiFinals && Array.isArray(seasonData.playoffData.semiFinals) && seasonData.playoffData.semiFinals.length > 0 && (
                                <div>
                                <h4 className="text-lg font-semibold mb-2 mt-4 text-center text-foreground/80">Semifinals</h4>
                                <div className="grid md:grid-cols-2 gap-4">
                                    {seasonData.playoffData.semiFinals.map((matchup, idx) => renderPlayoffMatchup(matchup, `Semifinal ${idx + 1}`))}
                                </div>
                                </div>
                            )}
                            {seasonData.playoffData.championship && Array.isArray(seasonData.playoffData.championship) && seasonData.playoffData.championship.length > 0 && (
                                <div className="mt-4">
                                <h4 className="text-lg font-semibold mb-2 text-center text-foreground/80">Championship</h4>
                                <div className="max-w-md mx-auto">
                                    {seasonData.playoffData.championship.map((matchup) => renderPlayoffMatchup(matchup, "Championship Game", true))}
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
                            <p className="text-muted-foreground text-center py-4">No playoff matchup data available for {seasonData.seasonData.year}.</p>
                        )}
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="weekly_performance" className="pt-4 space-y-4">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between">
                            <div className="flex items-center">
                                <BarChart2 className="mr-2 h-5 w-5 text-primary" />
                                <CardTitle>Weekly Performance</CardTitle>
                            </div>
                            <RadioGroup
                                value={weeklyScoresDisplayMode}
                                onValueChange={(value) => setWeeklyScoresDisplayMode(value as 'scores' | 'results')}
                                className="flex items-center space-x-2"
                            >
                                <div className="flex items-center space-x-1">
                                    <RadioGroupItem value="scores" id="scores-mode" />
                                    <Label htmlFor="scores-mode" className="text-sm cursor-pointer">Scores</Label>
                                </div>
                                <div className="flex items-center space-x-1">
                                    <RadioGroupItem value="results" id="results-mode" />
                                    <Label htmlFor="results-mode" className="text-sm cursor-pointer">W/L</Label>
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
                                                <TableHead className="sticky left-0 bg-card z-10 w-1/6 min-w-[150px] text-left align-middle">TEAM</TableHead>
                                                {seasonData.weeklyScoresData.scores.map((_, weekIndex) => (
                                                    <TableHead key={`wk-header-${weekIndex}`} className="text-center min-w-[60px] align-middle">{`W${weekIndex + 1}`}</TableHead>
                                                ))}
                                                <TableHead className="text-center min-w-[70px] align-middle">AVG</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {seasonData.weeklyScoresData.teams.map((teamName, teamIndex) => (
                                                <TableRow key={teamName}>
                                                    <TableCell className="sticky left-0 bg-card z-10 font-medium text-left truncate align-middle p-0.5" title={teamName}>
                                                        <div className="p-1.5 text-xs rounded-md w-full h-full flex items-center justify-start">
                                                           {teamName}
                                                        </div>
                                                    </TableCell>
                                                    {seasonData.weeklyScoresData!.scores.map((weekScores, weekIndex) => {
                                                        const score = Array.isArray(weekScores) ? weekScores[teamIndex] : undefined;
                                                        const result = Array.isArray(seasonData.weeklyScoresData!.results) && Array.isArray(seasonData.weeklyScoresData!.results[weekIndex]) ? seasonData.weeklyScoresData!.results[weekIndex][teamIndex] : undefined;
                                                        
                                                        let cellContent;
                                                        let innerDivClasses = "p-1.5 text-center text-xs rounded-md w-full h-full flex items-center justify-center";

                                                        if (weeklyScoresDisplayMode === 'scores') {
                                                            cellContent = score?.toFixed(1) ?? '-';
                                                            innerDivClasses = cn(innerDivClasses, getScoreCellClass(score));
                                                        } else { 
                                                            if (result === 'W') {
                                                                cellContent = 'W';
                                                                innerDivClasses = cn(innerDivClasses, "bg-green-100 text-green-700 font-semibold");
                                                            } else if (result === 'L') {
                                                                cellContent = 'L';
                                                                innerDivClasses = cn(innerDivClasses, "bg-red-100 text-red-700 font-semibold");
                                                            } else if (result === 'T') {
                                                                cellContent = 'T';
                                                                innerDivClasses = cn(innerDivClasses, "bg-gray-100 text-gray-700 font-semibold");
                                                            } else {
                                                                cellContent = '-';
                                                                innerDivClasses = cn(innerDivClasses, "bg-muted/30 text-muted-foreground");
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
                                  {(weeklyScoresDisplayMode === 'scores' ? weeklyScoreLegendItems : weeklyResultLegendItems).map(item => (
                                      <div key={item.label} className="flex items-center gap-1.5">
                                          <span className={cn("h-3 w-5 rounded-sm", item.className.split(' ')[0])}></span>
                                          <span>{item.label}</span>
                                      </div>
                                  ))}
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
                        <CardContent>
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
                                        <TableCell className={cn("text-right font-semibold", sos.differential && sos.differential > 0 ? 'text-red-600' : 'text-green-600')}>
                                            {sos.differential && sos.differential > 0 ? '+' : ''}{sos.differential?.toFixed(1) ?? 'N/A'}
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
                        <CardContent>
                            {seasonData.waiverPickupsData && Array.isArray(seasonData.waiverPickupsData) && seasonData.waiverPickupsData.length > 0 ? (
                            <>
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>#</TableHead>
                                            <TableHead>Player</TableHead>
                                            <TableHead>POS</TableHead>
                                            <TableHead>Team</TableHead>
                                            {isModernWaiverSeason && <TableHead>Picked Up By</TableHead>}
                                            {isModernWaiverSeason && <TableHead>Week</TableHead>}
                                            <TableHead className="text-right">Total Pts</TableHead>
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
                                                {isModernWaiverSeason && <TableCell>{pickup.pickedUpBy ?? '-'}</TableCell>}
                                                {isModernWaiverSeason && <TableCell>{pickup.week ?? '-'}</TableCell>}
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
                                    {Object.entries(seasonData.topPerformersData).map(([position, players]) => (
                                        Array.isArray(players) && players.length > 0 ? (
                                            <div key={position} className="rounded-lg border bg-card text-card-foreground shadow-sm p-4">
                                                <div className="flex items-center gap-2 mb-3">
                                                    <span className={cn("h-3 w-3 rounded-sm", getPositionBadgeClass(position).split(' ')[0])} style={{ backgroundColor: getPositionBadgeClass(position).split(' ')[0].startsWith('bg-') ? '' : `var(--color-${position.toLowerCase()})` }}></span>
                                                    <h4 className="text-md font-semibold text-foreground">{getPositionName(position)}</h4>
                                                </div>
                                                <div className="space-y-1 text-sm">
                                                    {players.slice(0, 5).map((player: TopPerformerPlayer, idx: number) => (
                                                        <div key={`${position}-${idx}-${player.player}`} className="flex justify-between items-center py-1.5 border-b last:border-b-0">
                                                            <div className="flex items-center gap-1.5">
                                                                <TrendingUp size={14} className="text-muted-foreground" />
                                                                <span>{player.player} ({player.team})</span>
                                                            </div>
                                                            <span className="font-medium">{player.totalPoints?.toFixed(1) ?? 'N/A'}</span>
                                                        </div>
                                                    ))}
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
                            <CardContent>
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>RANK</TableHead>
                                            <TableHead>PLAYER</TableHead>
                                            <TableHead>POS</TableHead>
                                            <TableHead>FANTASY TEAM</TableHead>
                                            <TableHead className="text-center">WEEK</TableHead>
                                            <TableHead className="text-right">POINTS</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {seasonData.bestOverallGamesData.map((game: SeasonBestOverallGameEntry) => (
                                            <TableRow key={game.rank}>
                                                <TableCell>{game.rank}</TableCell>
                                                <TableCell>{game.player} ({game.team})</TableCell>
                                                <TableCell>
                                                    <Badge variant="outline" className={cn("text-xs font-semibold", getPositionBadgeClass(game.position))}>
                                                        {game.position}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell>{game.fantasyTeam || 'Unmanaged'}</TableCell>
                                                <TableCell className="text-center">{game.week}</TableCell>
                                                <TableCell className="text-right">{game.points?.toFixed(1) ?? 'N/A'}</TableCell>
                                            </TableRow>
                                        ))}
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
            <CardContent className="pt-6 text-center text-muted-foreground">No data found for the {selectedSeason} season. Please ensure the file '{selectedSeason}.json' exists in 'public/data/league_data/seasons/' and is correctly formatted according to the expected structure. Also check browser console for fetch errors.</CardContent>
          )}
          {!loading && !error && !seasonData && !selectedSeason && (
            <CardContent className="pt-6 text-center text-muted-foreground">Please select a season to view details.</CardContent>
          )}
        </Card>
    </div>
  );
};

const GMCareer = () => {
  const [selectedGmId, setSelectedGmId] = useState<string | undefined>(mockGmsForTabs[0]?.id);
  const [gmData, setGmData] = useState<GMCareerData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (selectedGmId) {
      setLoading(true);
      setError(null);
      setGmData(null); 
      const gmSlug = mockGmsForTabs.find(g => g.id === selectedGmId)?.name.toLowerCase() || selectedGmId; // Using name as slug
      const gmFilePath = `/data/league_data/${gmSlug}/${gmSlug}.json`;
      
      console.log(`[GMCareer] Attempting to fetch data for GM: ${selectedGmId} (slug: ${gmSlug}) from ${gmFilePath}`);
      fetch(gmFilePath)
        .then(async res => {
          console.log(`[GMCareer] Fetch response status for ${gmSlug}: ${res.status} ${res.statusText}`);
          if (!res.ok) {
            let errorBody = "No additional error body from server.";
            try {
                errorBody = await res.text();
            } catch (e) { /* ignore */ }
            console.error(`[GMCareer] HTTP error! Status: ${res.status}. Body: ${errorBody}`);
            throw new Error(`Failed to fetch ${gmFilePath}. Status: ${res.status} ${res.statusText}. Server response: ${errorBody.substring(0,100)}...`);
          }
          const data = await res.json();
          console.log(`[GMCareer] Successfully fetched and parsed data for ${gmSlug}:`, data);
          
          if (!data || !data.gmInfo || !data.careerStats || !data.seasonProgression) {
            console.error("[GMCareer] Fetched data is missing crucial fields (gmInfo, careerStats, or seasonProgression). Full data:", data);
            setGmData(null);
            throw new Error(`Fetched data for ${gmSlug} is incomplete.`);
          }
          setGmData(data);
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
    }
  }, [selectedGmId]);

  const selectedGmName = gmData?.gmInfo?.name || mockGmsForTabs.find(g => g.id === selectedGmId)?.name || selectedGmId || "Selected GM";

  const CustomizedDot = (props: any) => {
    const { cx, cy, stroke, payload } = props;
    // payload refers to the data point for this dot
    if (payload.isChampion) {
      // Gold star for champions
      return (
        <svg x={cx - 10} y={cy - 10} width="20" height="20" fill="gold" viewBox="0 0 24 24" stroke="black" strokeWidth="0.5">
          <path d="M12 .587l3.668 7.568 8.332 1.151-6.064 5.828 1.48 8.279-7.416-3.967-7.417 3.967 1.481-8.279-6.064-5.828 8.332-1.151z"/>
        </svg>
      );
    }
    if (payload.madePlayoffs) {
      // Green circle for playoff appearances
      return <circle cx={cx} cy={cy} r={6} stroke={stroke} fill="hsl(var(--accent))" strokeWidth={1} />;
    }
    // Standard dot for other points
    return <circle cx={cx} cy={cy} r={3} stroke={stroke} fill="#fff" />;
  };

  return (
    <div className="space-y-6">
      <Select value={selectedGmId} onValueChange={setSelectedGmId}>
        <SelectTrigger className="w-[280px]">
          <SelectValue placeholder="Select a GM" />
        </SelectTrigger>
        <SelectContent>
          {mockGmsForTabs.map(gm => (
            <SelectItem key={gm.id} value={gm.id}>{gm.name}</SelectItem>
          ))}
        </SelectContent>
      </Select>

      {loading && (
         <Card>
          <CardHeader className="flex-row items-center gap-4">
            <Skeleton className="h-12 w-12 rounded-full" />
            <div className="space-y-1">
                <Skeleton className="h-7 w-48" />
                <Skeleton className="h-4 w-64" />
            </div>
            </CardHeader>
          <CardContent className="pt-6 space-y-6">
            <div className="p-4 border rounded-lg">
                <Skeleton className="h-6 w-1/3 mb-4" />
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                    {[...Array(8)].map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}
                </div>
            </div>
            <div>
                <Skeleton className="h-6 w-1/2 mb-3" />
                <Skeleton className="h-48 w-full" />
            </div>
             <div>
                <Skeleton className="h-6 w-1/3 mb-3" />
                <Skeleton className="h-32 w-full" />
            </div>
             <div>
                <Skeleton className="h-6 w-1/3 mb-3" />
                <Skeleton className="h-32 w-full" />
            </div>
          </CardContent>
        </Card>
      )}
      {error && <Card><CardContent className="pt-6 text-destructive text-center flex flex-col items-center gap-2"><ShieldAlert size={48}/> <p>{error}</p></CardContent></Card>}

      {!loading && !error && gmData && (
        <Card>
          <CardHeader>
            <div className="flex items-center gap-4">
              {gmData.gmInfo.photoUrl ? (
                <Image data-ai-hint="person avatar" src={gmData.gmInfo.photoUrl} alt={`${gmData.gmInfo.name} photo`} width={64} height={64} className="rounded-full border-2 border-primary"/>
              ) : (
                <Avatar className="h-16 w-16 border-2 border-primary">
                  <AvatarFallback className="text-2xl bg-muted text-muted-foreground">
                    {gmData.gmInfo.name ? gmData.gmInfo.name.charAt(0).toUpperCase() : <User size={32}/>}
                  </AvatarFallback>
                </Avatar>
              )}
              <div>
                <CardTitle className="text-3xl">{gmData.gmInfo.name}</CardTitle>
                <CardDescription className="text-md">
                  Years Active: {gmData.gmInfo.yearsActive}
                  {gmData.gmInfo.championshipYears && gmData.gmInfo.championshipYears.length > 0 && (
                    <span className="block mt-1">
                      <Trophy className="inline-block mr-1.5 h-4 w-4 text-yellow-500" />
                      Champions: {gmData.gmInfo.championshipYears.join(', ')}
                    </span>
                  )}
                </CardDescription>
                 {gmData.gmInfo.bio && <p className="text-sm text-muted-foreground mt-2">{gmData.gmInfo.bio}</p>}
              </div>
            </div>
          </CardHeader>
           <CardContent className="pt-2 md:pt-4 grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
            <div>
              <h4 className="text-sm font-medium text-muted-foreground mb-1.5">Overall Record</h4>
              <div className="space-y-0.5 text-sm max-w-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Wins:</span>
                  <span className="font-medium text-foreground">{gmData.careerStats.wins}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Losses:</span>
                  <span className="font-medium text-foreground">{gmData.careerStats.losses}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Ties:</span>
                  <span className="font-medium text-foreground">{gmData.careerStats.ties}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Win Pct:</span>
                  <span className="font-medium text-foreground">{(gmData.careerStats.winPct * 100).toFixed(1)}%</span>
                </div>
              </div>
            </div>
            
            <div>
              <h4 className="text-sm font-medium text-muted-foreground mb-1.5">Scoring Stats</h4>
              <div className="space-y-0.5 text-sm max-w-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Total Points For:</span>
                  <span className="font-medium text-foreground">{gmData.careerStats.totalPointsFor?.toFixed(1)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Total Points Against:</span>
                  <span className="font-medium text-foreground">{gmData.careerStats.totalPointsAgainst?.toFixed(1)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Avg Points/Game:</span>
                  <span className="font-medium text-foreground">{gmData.careerStats.avgPointsPerGame?.toFixed(1)}</span>
                </div>
              </div>
            </div>
            
            <div>
              <h4 className="text-sm font-medium text-muted-foreground mb-1.5">Career Milestones</h4>
              <div className="space-y-0.5 text-sm max-w-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Total Seasons:</span>
                  <span className="font-medium text-foreground">{gmData.careerStats.totalSeasons}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Playoff Appearances:</span>
                  <span className="font-medium text-foreground">{gmData.careerStats.playoffAppearances}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Playoff Record:</span>
                  <span className="font-medium text-foreground">{gmData.careerStats.playoffWins}-{gmData.careerStats.playoffLosses}</span>
                </div>
                 <div className="flex justify-between">
                    <span className="text-muted-foreground">Championships:</span>
                    <span className="font-medium text-foreground">{gmData.gmInfo.championshipYears?.length || 0}</span>
                </div>
              </div>
            </div>
          </CardContent>

           {gmData.seasonProgression && Array.isArray(gmData.seasonProgression) && gmData.seasonProgression.length > 0 && (
              <Card className="mt-8">
                <CardHeader><CardTitle className="text-xl">Season Progression</CardTitle></CardHeader>
                <CardContent className="h-[350px] pt-6">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={gmData.seasonProgression}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="year" />
                      <YAxis reversed={true} allowDecimals={false} domain={['dataMin -1', 'dataMax + 1']} tickFormatter={(value) => Math.round(value).toString()} />
                      <Tooltip />
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
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            )}

            {gmData.careerExtremes && (
              <Card className="mt-8">
                <CardHeader><CardTitle className="text-xl">Career Highs & Lows</CardTitle></CardHeader>
                <CardContent className="grid md:grid-cols-2 gap-6 text-sm">
                  <div>
                    <h4 className="font-semibold text-lg mb-2 text-green-600">Highs</h4>
                    <ul className="space-y-1.5">
                      <li><strong>Most Points (Game):</strong> {gmData.careerExtremes.highs.mostPointsGame.value.toFixed(1)} ({gmData.careerExtremes.highs.mostPointsGame.season} Wk {gmData.careerExtremes.highs.mostPointsGame.week})</li>
                      <li><strong>Biggest Win Margin:</strong> +{gmData.careerExtremes.highs.biggestWinMargin.value.toFixed(1)} (vs {gmData.careerExtremes.highs.biggestWinMargin.opponentName}, {gmData.careerExtremes.highs.biggestWinMargin.season} Wk {gmData.careerExtremes.highs.biggestWinMargin.week})</li>
                      <li><strong>Best Season Record:</strong> {gmData.careerExtremes.highs.bestSeasonRecord.wins}-{gmData.careerExtremes.highs.bestSeasonRecord.losses} ({gmData.careerExtremes.highs.bestSeasonRecord.season}) {gmData.careerExtremes.highs.bestSeasonRecord.isChampion ? <Trophy className="inline h-4 w-4 text-yellow-500" /> : ""}</li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-semibold text-lg mb-2 text-red-600">Lows</h4>
                    <ul className="space-y-1.5">
                      <li><strong>Fewest Points (Game):</strong> {gmData.careerExtremes.lows.fewestPointsGame.value.toFixed(1)} ({gmData.careerExtremes.lows.fewestPointsGame.season} Wk {gmData.careerExtremes.lows.fewestPointsGame.week})</li>
                      <li><strong>Worst Loss Margin:</strong> -{gmData.careerExtremes.lows.worstLossMargin.value.toFixed(1)} (vs {gmData.careerExtremes.lows.worstLossMargin.opponentName}, {gmData.careerExtremes.lows.worstLossMargin.season} Wk {gmData.careerExtremes.lows.worstLossMargin.week})</li>
                      <li><strong>Worst Season Record:</strong> {gmData.careerExtremes.lows.worstSeasonRecord.wins}-{gmData.careerExtremes.lows.worstSeasonRecord.losses} ({gmData.careerExtremes.lows.worstSeasonRecord.season})</li>
                    </ul>
                  </div>
                </CardContent>
              </Card>
            )}
            
            {gmData.franchisePlayers && Array.isArray(gmData.franchisePlayers) && gmData.franchisePlayers.length > 0 && (
              <Card className="mt-8">
                <CardHeader><CardTitle className="text-xl">Franchise Players</CardTitle></CardHeader>
                <CardContent>
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
                                    <TableCell className="text-right">{player.totalPointsForGm.toFixed(1)}</TableCell>
                                    <TableCell className="text-right">{player.gamesStartedForGm}</TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
              </Card>
            )}

            {gmData.rivalryPerformance && Array.isArray(gmData.rivalryPerformance) && gmData.rivalryPerformance.length > 0 && (
              <Card className="mt-8">
                <CardHeader><CardTitle className="text-xl">Key Rivalries</CardTitle></CardHeader>
                <CardContent>
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
                                    <TableCell className="text-right">{rival.avgPointsFor.toFixed(1)}</TableCell>
                                    <TableCell className="text-right">{rival.avgPointsAgainst.toFixed(1)}</TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
              </Card>
            )}
             {gmData.positionStrength && Array.isArray(gmData.positionStrength) && gmData.positionStrength.length > 0 && (
              <Card className="mt-8">
                <CardHeader><CardTitle className="text-xl">Positional Strength vs League Avg.</CardTitle></CardHeader>
                <CardContent>
                    <div className="h-[250px] w-full max-w-lg mx-auto">
                         <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={gmData.positionStrength} layout="vertical" margin={{ right: 20 }}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis type="number" />
                                <YAxis dataKey="position" type="category" width={80} />
                                <Tooltip formatter={(value: number) => value.toFixed(1)} />
                                <RechartsLegend />
                                <Bar dataKey="value" name="Strength vs Avg">
                                    {gmData.positionStrength.map((entry, index) => (
                                        <RechartsCell key={`cell-${index}`} fill={entry.value >= 0 ? 'hsl(var(--chart-2))' : 'hsl(var(--destructive))'} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                    <p className="text-xs text-muted-foreground mt-2 text-center">Positive values indicate stronger than league average at that position, negative values indicate weaker.</p>
                </CardContent>
              </Card>
            )}
          
        </Card>
      )}
      {!loading && !error && !gmData && selectedGmId && (
         <Card><CardContent className="pt-6 text-center text-muted-foreground">No data found for {selectedGmName}. Ensure the file 'public/data/league_data/{selectedGmId.toLowerCase()}/{selectedGmId.toLowerCase()}.json' exists and is correctly formatted as per the expected structure (e.g. chris/chris.json).</CardContent></Card>
       )}
       {!loading && !error && !gmData && !selectedGmId && (
         <Card><CardContent className="pt-6 text-center text-muted-foreground">Please select a GM to view career details.</CardContent></Card>
       )}
    </div>
  );
};


export default function LeagueHistoryPage() {
  const searchParams = useSearchParams();
  const section = searchParams.get('section') || 'all-seasons'; 

  const [leagueData, setLeagueData] = useState<LeagueData | null>(null);
  const [loadingLeagueData, setLoadingLeagueData] = useState(true);

  useEffect(() => {
    if (section === 'all-seasons' && !leagueData) { // Only fetch if all-seasons is active and data isn't loaded
        setLoadingLeagueData(true);
        console.log("[LeagueHistoryPage] Attempting to fetch league-data.json");
        fetch('/data/league_data/league-data.json')
          .then(res => {
            console.log("[LeagueHistoryPage] Fetch response status for league-data.json:", res.status, res.statusText);
            if (!res.ok) {
              console.error("Failed to fetch league-data.json, status:", res.status);
              throw new Error(`HTTP error! status: ${res.status}`);
            }
            return res.json();
          })
          .then((data: any) => {
            console.log("[LeagueHistoryPage] Successfully fetched and parsed league-data.json:", data);
            const mappedCareerLeaderboard = (Array.isArray(data.careerLeaderboard) ? data.careerLeaderboard : []).map((stat: any) => ({
              ...stat,
              pointsFor: stat.pointsFor ?? stat.points, 
              pointsAgainst: stat.pointsAgainst,
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
    } else if (section !== 'all-seasons') {
        setLoadingLeagueData(false); // Not loading league-wide data if not on all-seasons tab
    }
  }, [section, leagueData]); // Added leagueData to dependencies

  if (section === 'all-seasons') {
    return <AllSeasonsOverview leagueData={leagueData} loading={loadingLeagueData} />;
  }
  if (section === 'season-detail') {
    return <SeasonDetail />;
  }
  if (section === 'gm-career') {
    return <GMCareer />;
  }

  return <AllSeasonsOverview leagueData={leagueData} loading={loadingLeagueData} />;
}

