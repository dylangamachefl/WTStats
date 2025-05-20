
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
  SeasonStrengthOfScheduleEntry,
  SeasonWaiverPickupEntry,
  BestOverallGameEntry,
  TopPerformerPlayer,
  // SeasonBaseData,
  // PlayoffData,
  // WeeklyScoresMatrixData,
  StrengthOfScheduleEntry,
  WaiverPickupEntry,
  // PositionalTopPerformersData,
  BestOverallGameEntry as SeasonBestOverallGameEntry,
} from '@/lib/types';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import Image from 'next/image';
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from '@/lib/utils';
import { ArrowUpDown, ListChecks, Users, Trophy, TrendingUp, DollarSign, BarChart2, Users2, ShieldAlert, CalendarDays, LineChart as LineChartIconRecharts, ClipboardList, CheckCircle2, XCircle, HelpCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Carousel, CarouselContent, CarouselItem, CarouselPrevious, CarouselNext } from "@/components/ui/carousel";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { BarChart, Bar, ResponsiveContainer, CartesianGrid, XAxis, YAxis, Tooltip, Legend as RechartsLegend, ScatterChart, Scatter, ZAxis, Cell as RechartsCell } from 'recharts';
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";


// Mock data for SeasonDetail and GMCareer tabs (as types)
import type { Season as SeasonType_Mock, GM as GM_Mock } from '@/lib/types';

// These mocks are used for populating the Select dropdowns.
const mockSeasonsForTabs: SeasonType_Mock[] = [
  { id: "2024", year: 2024 }, { id: "2023", year: 2023 }, { id: "2022", year: 2022 }, { id: "2021", year: 2021 }, { id: "2020", year: 2020 }, { id: "2019", year: 2019 }, { id: "2018", year: 2018 }, { id: "2017", year: 2017 }, { id: "2016", year: 2016 }, { id: "2015", year: 2015 }, { id: "2014", year: 2014 }, { id: "2013", year: 2013 }, { id: "2012", year: 2012 }, { id: "2011", year: 2011 }, { id: "2010", year: 2010 }, { id: "2009", year: 2009 },
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
      return Array.isArray(data) ? data : []; // Ensure it always returns an array
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
    if (!leagueData?.playoffQualificationRate || !Array.isArray(leagueData.playoffQualificationRate)) return [];
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
    return <Card><CardContent className="pt-6 text-center">Failed to load league data. Check console for errors or ensure 'league-data.json' is correctly placed and formatted in 'public/data/league_data/'.</CardContent></Card>;
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
                <CarouselItem key={index} className="basis-full sm:basis-1/2 md:basis-1/3 lg:basis-1/4 xl:basis-1/5">
                  <div className="p-1 h-full">
                    <Card className="flex flex-col items-center p-4 text-center shadow-lg hover:shadow-2xl transition-all duration-300 ease-in-out rounded-xl overflow-hidden h-full transform hover:-translate-y-1">
                      <div className="relative mb-3">
                        <Image
                          data-ai-hint="team logo"
                          src={champion.imgUrl || "https://placehold.co/80x80.png"}
                          alt={`${champion.teamName || champion.championName} logo`}
                          width={72} height={72}
                          className="rounded-full border-2 border-primary object-contain shadow-md"
                        />
                        <span className="absolute -top-1 -right-1 bg-accent text-accent-foreground text-xs font-semibold px-2 py-0.5 rounded-full shadow">
                          {champion.year}
                        </span>
                      </div>

                      <h3 className="text-lg font-bold text-foreground">
                        {champion.championName}
                      </h3>
                      <p className="text-xs text-muted-foreground mb-2">
                        {champion.teamName || "Team Name N/A"}
                      </p>

                      <div className="w-full pt-2 mt-auto border-t border-border/60 text-xs text-muted-foreground space-y-1 text-left px-1">
                        <div className="flex justify-between items-center">
                          <span className="font-medium text-foreground/80">Record:</span>
                          <span className="font-semibold text-foreground/90">{champion.wins}-{champion.losses}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="font-medium text-foreground/80">PF:</span>
                          <span className="font-semibold text-foreground/90">{champion.pointsFor?.toFixed(2) ?? 'N/A'}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="font-medium text-foreground/80">PA:</span>
                          <span className="font-semibold text-foreground/90">{champion.pointsAgainst?.toFixed(2) ?? 'N/A'}</span>
                        </div>
                      </div>

                      {Array.isArray(champion.parsedRoster) && champion.parsedRoster.length > 0 && (
                        <div className="w-full pt-2 mt-2 border-t border-border/60">
                          <h4 className="text-xs font-semibold text-foreground mb-1 flex items-center justify-center">
                            <ListChecks size={14} className="mr-1.5 text-primary"/> Key Players
                          </h4>
                          <ul className="space-y-0.5 text-xs text-muted-foreground">
                            {champion.parsedRoster.slice(0, 3).map((player, idx) => (
                              <li key={idx} className="truncate" title={player}>{player}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </Card>
                  </div>
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

const SeasonDetail = () => {
  const [selectedSeason, setSelectedSeason] = useState<string | undefined>(mockSeasonsForTabs[0]?.id);
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
        <p className="text-xs text-muted-foreground mt-1">
          Winner: {matchup.home.score > matchup.away.score ? matchup.home.owner : matchup.away.owner}
        </p>
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
                            {seasonData.weeklyScoresData && Array.isArray(seasonData.weeklyScoresData.teams) && seasonData.weeklyScoresData.teams.length > 0 && Array.isArray(seasonData.weeklyScoresData.scores) ? (
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
                                                    <TableCell className="sticky left-0 bg-card z-10 font-medium text-left truncate align-middle" title={teamName}>{teamName}</TableCell>
                                                    {seasonData.weeklyScoresData!.scores.map((weekScores, weekIndex) => {
                                                        const score = Array.isArray(weekScores) ? weekScores[teamIndex] : undefined;
                                                        const result = Array.isArray(seasonData.weeklyScoresData!.results) && Array.isArray(seasonData.weeklyScoresData!.results[weekIndex]) ? seasonData.weeklyScoresData!.results[weekIndex][teamIndex] : undefined;
                                                        
                                                        let cellContent;
                                                        let cellClasses = "p-0.5";
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
                                                            <TableCell key={`wk-${weekIndex}-team-${teamIndex}`} className={cn(cellClasses, "align-middle")}>
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
                                  {weeklyScoresDisplayMode === 'scores' ? weeklyScoreLegendItems.map(item => (
                                      <div key={item.label} className="flex items-center gap-1.5">
                                          <span className={cn("h-3 w-5 rounded-sm", item.className.split(' ')[0])}></span>
                                          <span>{item.label}</span>
                                      </div>
                                  )) : weeklyResultLegendItems.map(item => (
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
                        <CardHeader><CardTitle className="flex items-center"><LineChartIconRecharts className="mr-2 h-5 w-5 text-primary"/>Strength of Schedule</CardTitle></CardHeader>
                        <CardContent>
                            {seasonData.strengthOfScheduleData && Array.isArray(seasonData.strengthOfScheduleData) && seasonData.strengthOfScheduleData.length > 0 ? (
                            <Table>
                                <TableHeader>
                                <TableRow>
                                    <TableHead>Rank</TableHead>
                                    <TableHead>Owner</TableHead>
                                    <TableHead>Team</TableHead>
                                    <TableHead className="text-right">Opp. PPG</TableHead>
                                    <TableHead>Rating</TableHead>
                                </TableRow>
                                </TableHeader>
                                <TableBody>
                                {seasonData.strengthOfScheduleData.map((sos: StrengthOfScheduleEntry) => (
                                    <TableRow key={sos.owner}>
                                    <TableCell>{sos.rank}</TableCell>
                                    <TableCell>{sos.owner}</TableCell>
                                    <TableCell>{sos.team}</TableCell>
                                    <TableCell className="text-right">{sos.actualOpponentsPpg?.toFixed(1) ?? 'N/A'}</TableCell>
                                    <TableCell>{sos.rating || '-'}</TableCell>
                                    </TableRow>
                                ))}
                                </TableBody>
                            </Table>
                            ) : (
                            <p className="text-muted-foreground text-center py-4">Strength of Schedule data not available for {seasonData?.seasonData?.year}.</p>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="waiver_pickups" className="pt-4 space-y-6">
                    <Card>
                        <CardHeader><CardTitle className="flex items-center"><ClipboardList className="mr-2 h-5 w-5 text-primary"/>Top Waiver Pickups (League-wide)</CardTitle></CardHeader>
                        <CardContent>
                            {seasonData.waiverPickupsData && Array.isArray(seasonData.waiverPickupsData) && seasonData.waiverPickupsData.length > 0 ? (
                            <Table>
                                <TableHeader>
                                <TableRow>
                                    <TableHead>Rank</TableHead>
                                    <TableHead>Player</TableHead>
                                    <TableHead>Position</TableHead>
                                    <TableHead>NFL Team</TableHead>
                                    <TableHead className="text-right">Total Pts</TableHead>
                                </TableRow>
                                </TableHeader>
                                <TableBody>
                                {seasonData.waiverPickupsData.map((pickup: WaiverPickupEntry) => (
                                    <TableRow key={pickup.player}>
                                    <TableCell>{pickup.rank ?? '-'}</TableCell>
                                    <TableCell>{pickup.player}</TableCell>
                                    <TableCell>{pickup.position}</TableCell>
                                    <TableCell>{pickup.team}</TableCell>
                                    <TableCell className="text-right">{pickup.totalPoints?.toFixed(1) ?? '-'}</TableCell>
                                    </TableRow>
                                ))}
                                </TableBody>
                            </Table>
                            ) : (
                            <p className="text-muted-foreground text-center py-4">Waiver pickup data not available for {seasonData?.seasonData?.year}.</p>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>

                 <TabsContent value="top_performers" className="pt-4 space-y-6">
                    <Card>
                    <CardHeader><CardTitle className="flex items-center"><Trophy className="mr-2 h-5 w-5 text-primary" />Top Seasonal Performers</CardTitle></CardHeader>
                    <CardContent>
                        {seasonData.topPerformersData && typeof seasonData.topPerformersData === 'object' && Object.keys(seasonData.topPerformersData).length > 0 ? (
                        Object.entries(seasonData.topPerformersData).map(([position, players]) => (
                            Array.isArray(players) && players.length > 0 ? (
                            <div key={position} className="mb-6">
                                <h4 className="text-md font-semibold mb-1 capitalize text-foreground/90">{position}</h4>
                                <Table>
                                <TableHeader>
                                    <TableRow>
                                    <TableHead>Player</TableHead>
                                    <TableHead>NFL Team</TableHead>
                                    <TableHead>Managed By</TableHead>
                                    <TableHead className="text-right">Total Points</TableHead>
                                    <TableHead className="text-right">PPG</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {players.map((player : TopPerformerPlayer, idx) => (
                                    <TableRow key={`${position}-${idx}`}>
                                        <TableCell>{player.player}</TableCell>
                                        <TableCell>{player.team}</TableCell>
                                        <TableCell>{player.fantasyTeam || 'Unmanaged'}</TableCell>
                                        <TableCell className="text-right">{player.totalPoints?.toFixed(1) ?? 'N/A'}</TableCell>
                                        <TableCell className="text-right">{player.ppg?.toFixed(1) ?? 'N/A'}</TableCell>
                                    </TableRow>
                                    ))}
                                </TableBody>
                                </Table>
                            </div>
                            ) : null
                        ))
                        ) : (
                        <p className="text-muted-foreground">No top performer data available for {seasonData?.seasonData?.year}.</p>
                        )}

                        {seasonData.bestOverallGamesData && Array.isArray(seasonData.bestOverallGamesData) && seasonData.bestOverallGamesData.length > 0 && (
                        <div>
                            <h4 className="text-md font-semibold my-2 text-foreground/90">Best Overall Games This Season</h4>
                            <Table>
                            <TableHeader>
                                <TableRow>
                                <TableHead>Rank</TableHead>
                                <TableHead>Player</TableHead>
                                <TableHead>Position</TableHead>
                                <TableHead>NFL Team</TableHead>
                                <TableHead>Managed By</TableHead>
                                <TableHead>Week</TableHead>
                                <TableHead className="text-right">Points</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {seasonData.bestOverallGamesData.map((game: SeasonBestOverallGameEntry) => (
                                <TableRow key={game.rank}>
                                    <TableCell>{game.rank}</TableCell>
                                    <TableCell>{game.player}</TableCell>
                                    <TableCell>{game.position}</TableCell>
                                    <TableCell>{game.team}</TableCell>
                                    <TableCell>{game.fantasyTeam || 'Unmanaged'}</TableCell>
                                    <TableCell>{game.week}</TableCell>
                                    <TableCell className="text-right">{game.points?.toFixed(1) ?? 'N/A'}</TableCell>
                                </TableRow>
                                ))}
                            </TableBody>
                            </Table>
                        </div>
                        )}
                    </CardContent>
                    </Card>
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
      const gmFilePath = `/data/league_data/${selectedGmId}/${selectedGmId}.json`;
      console.log(`[GMCareer] Attempting to fetch data for GM: ${selectedGmId} from ${gmFilePath}`);
      fetch(gmFilePath)
        .then(async res => {
          console.log(`[GMCareer] Fetch response status for ${selectedGmId}: ${res.status} ${res.statusText}`);
          if (!res.ok) {
            let errorBody = "No additional error body from server.";
            try {
                errorBody = await res.text();
            } catch (e) { /* ignore */ }
            console.error(`[GMCareer] HTTP error! Status: ${res.status}. Body: ${errorBody}`);
            throw new Error(`Failed to fetch ${gmFilePath}. Status: ${res.status} ${res.statusText}. Server response: ${errorBody.substring(0,100)}...`);
          }
          const data = await res.json();
          console.log(`[GMCareer] Successfully fetched and parsed data for ${selectedGmId}:`, data);
          
          if (!data || !data.gmName || !data.careerSummary || !data.seasonBySeason) {
            console.error("[GMCareer] Fetched data is missing crucial fields (gmName, careerSummary, or seasonBySeason). Full data:", data);
            setGmData(null);
            throw new Error(`Fetched data for ${selectedGmId} is incomplete.`);
          }
          setGmData(data);
        })
        .catch(err => {
          console.error(`[GMCareer] Failed to load or process GM data for ${selectedGmId} from ${gmFilePath}:`, err);
          setError(`Failed to load data for ${selectedGmId}. Details: ${err.message}. Check console and ensure '${gmFilePath}' exists and is correctly formatted.`);
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

  const selectedGmName = gmData?.gmName || mockGmsForTabs.find(g => g.id === selectedGmId)?.name || selectedGmId || "Selected GM";

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
          </CardContent>
        </Card>
      )}
      {error && <Card><CardContent className="pt-6 text-destructive text-center flex flex-col items-center gap-2"><ShieldAlert size={48}/> <p>{error}</p></CardContent></Card>}

      {!loading && !error && gmData && (
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              {gmData.photoUrl ? (
                <Image data-ai-hint="person avatar" src={gmData.photoUrl} alt={`${gmData.gmName} photo`} width={48} height={48} className="rounded-full border"/>
              ) : (
                <Users className="h-10 w-10 text-muted-foreground" />
              )}
              <div>
                <CardTitle>{gmData.gmName}'s Career</CardTitle>
                {gmData.bio && <CardDescription className="mt-1">{gmData.bio}</CardDescription>}
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-6 space-y-6">
            {gmData.careerSummary && (
              <div className="p-4 border rounded-lg bg-muted/30">
                <h3 className="text-lg font-semibold mb-3 text-center">Career Summary</h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-x-4 gap-y-3 text-sm">
                  <div><strong className="block text-foreground/90">Seasons:</strong> {gmData.careerSummary.totalSeasons}</div>
                  <div><strong className="block text-foreground/90">Championships:</strong> {gmData.careerSummary.championships}</div>
                   {gmData.careerSummary.runnerUps !== undefined && <div><strong className="block text-foreground/90">Runner Ups:</strong> {gmData.careerSummary.runnerUps}</div>}
                  <div><strong className="block text-foreground/90">Playoffs:</strong> {gmData.careerSummary.playoffAppearances}</div>
                  <div><strong className="block text-foreground/90">Reg. Wins:</strong> {gmData.careerSummary.regularSeasonWins}</div>
                  <div><strong className="block text-foreground/90">Reg. Losses:</strong> {gmData.careerSummary.regularSeasonLosses}</div>
                  <div><strong className="block text-foreground/90">Reg. Ties:</strong> {gmData.careerSummary.regularSeasonTies}</div>
                  <div><strong className="block text-foreground/90">Reg. Win %:</strong> {gmData.careerSummary.regularSeasonWinPct}</div>
                  {gmData.careerSummary.playoffWins !== undefined && <div><strong className="block text-foreground/90">Playoff Wins:</strong> {gmData.careerSummary.playoffWins}</div>}
                  {gmData.careerSummary.playoffLosses !== undefined && <div><strong className="block text-foreground/90">Playoff Losses:</strong> {gmData.careerSummary.playoffLosses}</div>}
                   {gmData.careerSummary.playoffWinPct !== undefined && <div><strong className="block text-foreground/90">Playoff Win %:</strong> {gmData.careerSummary.playoffWinPct}</div>}
                  <div><strong className="block text-foreground/90">Total PF:</strong> {gmData.careerSummary.totalPointsFor?.toFixed(2) ?? 'N/A'}</div>
                  <div><strong className="block text-foreground/90">Total PA:</strong> {gmData.careerSummary.totalPointsAgainst?.toFixed(2) ?? 'N/A'}</div>
                  <div><strong className="block text-foreground/90">Avg Finish:</strong> {gmData.careerSummary.avgFinalStanding?.toFixed(1) ?? 'N/A'}</div>
                </div>
              </div>
            )}

            {Array.isArray(gmData.seasonBySeason) && gmData.seasonBySeason.length > 0 ? (
              <div>
                <h3 className="text-lg font-semibold mb-2">Season-by-Season Performance</h3>
                <div className="overflow-x-auto">
                    <Table>
                    <TableHeader>
                        <TableRow>
                        <TableHead>Year</TableHead>
                        <TableHead>Team Name</TableHead>
                        <TableHead className="text-center">Rank</TableHead>
                        <TableHead>Record (W-L-T)</TableHead>
                        <TableHead className="text-right">PF</TableHead>
                        <TableHead className="text-right">PA</TableHead>
                        <TableHead className="text-center">Playoffs?</TableHead>
                        <TableHead>Outcome</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {gmData.seasonBySeason.map((s) => ( 
                        <TableRow key={s.year}>
                            <TableCell>{s.year}</TableCell>
                            <TableCell>{s.teamName}</TableCell>
                            <TableCell className="text-center">{s.rank}</TableCell>
                            <TableCell>{s.wins}-{s.losses}-{s.ties}</TableCell>
                            <TableCell className="text-right">{s.pointsFor?.toFixed(2) ?? 'N/A'}</TableCell>
                            <TableCell className="text-right">{s.pointsAgainst?.toFixed(2) ?? 'N/A'}</TableCell>
                            <TableCell className="text-center">{s.madePlayoffs ? 'Yes' : 'No'}</TableCell>
                            <TableCell>{s.championshipResult || (s.madePlayoffs ? 'Playoffs' : '-')}</TableCell>
                        </TableRow>
                        ))}
                    </TableBody>
                    </Table>
                </div>
              </div>
            ) : (
                 <p className="text-muted-foreground">No season-by-season data available for this GM.</p>
            )}
            {gmData.awards && Array.isArray(gmData.awards) && gmData.awards.length > 0 && (
                <div>
                    <h3 className="text-lg font-semibold my-2">Awards & Honors</h3>
                    <ul className="list-disc pl-5 text-sm space-y-1">
                        {gmData.awards.map((award, idx) => <li key={idx}>{award.year} - {award.awardName}{award.description ? ` (${award.description})` : ''}</li>)}
                    </ul>
                </div>
            )}
            {gmData.rivalries && Array.isArray(gmData.rivalries) && gmData.rivalries.length > 0 && (
                 <div>
                    <h3 className="text-lg font-semibold my-2">Key Rivalries</h3>
                     <div className="grid md:grid-cols-2 gap-4">
                        {gmData.rivalries.slice(0,4).map((rivalry, idx) => ( 
                            <Card key={idx}>
                                <CardHeader className="p-3"><CardTitle className="text-base">vs. {rivalry.opponentGmName}</CardTitle></CardHeader>
                                <CardContent className="p-3 text-xs">
                                    <p>Record: {rivalry.wins}W - {rivalry.losses}L - {rivalry.ties}T</p>
                                    <p>PF: {rivalry.totalPointsFor?.toFixed(1) ?? 'N/A'} | PA: {rivalry.totalPointsAgainst?.toFixed(1) ?? 'N/A'}</p>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </div>
            )}
            {gmData.draftHistorySummary && (
                 <div>
                    <h3 className="text-lg font-semibold my-2">Draft Summary</h3>
                    <div className="text-sm space-y-1">
                        <p>Total Picks: {gmData.draftHistorySummary.totalPicks}</p>
                        <p>Avg. Pick Position: {gmData.draftHistorySummary.avgPickPosition?.toFixed(1) ?? 'N/A'}</p>
                    </div>
                </div>
            )}
          </CardContent>
        </Card>
      )}
      {!loading && !error && !gmData && selectedGmId && (
         <Card><CardContent className="pt-6 text-center text-muted-foreground">No data found for {selectedGmName}. Ensure the file 'public/data/league_data/{selectedGmId}/{selectedGmId}.json' exists and is correctly formatted.</CardContent></Card>
      )}
       {!loading && !error && !gmData && !selectedGmId && (
         <Card><CardContent className="pt-6 text-center text-muted-foreground">Please select a GM to view career details.</CardContent></Card>
       )}
    </div>
  );
};


export default function LeagueHistoryPage() {
  const searchParams = useSearchParams();
  const section = searchParams.get('section') || 'all-seasons'; // Default to 'all-seasons'

  const [leagueData, setLeagueData] = useState<LeagueData | null>(null);
  const [loadingLeagueData, setLoadingLeagueData] = useState(true);

  useEffect(() => {
    setLoadingLeagueData(true);
    fetch('/data/league_data/league-data.json')
      .then(res => {
        if (!res.ok) {
          console.error("Failed to fetch league-data.json, status:", res.status);
          throw new Error(`HTTP error! status: ${res.status}`);
        }
        return res.json();
      })
      .then((data: any) => {
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
  }, []);

  if (section === 'all-seasons') {
    return <AllSeasonsOverview leagueData={leagueData} loading={loadingLeagueData} />;
  }
  if (section === 'season-detail') {
    return <SeasonDetail />;
  }
  if (section === 'gm-career') {
    return <GMCareer />;
  }

  // Fallback or not found content if section is invalid
  return <AllSeasonsOverview leagueData={leagueData} loading={loadingLeagueData} />;
}

