
"use client";
import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
  GMCareerSeasonSummary
} from '@/lib/types';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import Image from 'next/image';
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from '@/lib/utils';
import { ArrowUpDown, ListChecks, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Carousel, CarouselContent, CarouselItem, CarouselPrevious, CarouselNext } from "@/components/ui/carousel";

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
        if (typeof gm === 'object' && gm !== null) {
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

    if (maxRankInYear === 2 && rank === 2) { 
      return {
        textClass: coloredRankedStyle.textClass,
        borderClass: '',
        style: { backgroundColor: `hsl(0, ${SATURATION}%, ${MAX_LIGHTNESS}%)` } 
      };
    }
    if (maxRankInYear <= 2) return defaultStyle;

    const denominator = maxRankInYear - 2; 
    
    if (denominator === 0) { 
        return defaultStyle;
    }

    const normalizedRank = (rank - 2) / denominator; 
    const clampedNormalizedRank = Math.min(1, Math.max(0, normalizedRank));

    const NEUTRAL_CENTER = 0.5;
    const NEUTRAL_BANDWIDTH = 0.25; 

    const GREEN_HUE = 120;
    const RED_HUE = 0;

    let backgroundColor = '';

    if (Math.abs(clampedNormalizedRank - NEUTRAL_CENTER) <= NEUTRAL_BANDWIDTH / 2) {
      return defaultStyle;
    } else if (clampedNormalizedRank < NEUTRAL_CENTER) {
      const green_zone_width = NEUTRAL_CENTER - NEUTRAL_BANDWIDTH / 2;
      const t_green = green_zone_width > 0 ? (NEUTRAL_CENTER - NEUTRAL_BANDWIDTH / 2 - clampedNormalizedRank) / green_zone_width : 1;
      const lightness = MAX_LIGHTNESS - t_green * (MAX_LIGHTNESS - MIN_LIGHTNESS); 
      backgroundColor = `hsl(${GREEN_HUE}, ${SATURATION}%, ${lightness.toFixed(0)}%)`;
    } else {
      const red_zone_start = NEUTRAL_CENTER + NEUTRAL_BANDWIDTH / 2;
      const red_zone_width = 1 - red_zone_start;
      const t_red = red_zone_width > 0 ? (clampedNormalizedRank - red_zone_start) / red_zone_width : 0;
      const lightness_pastel_red = MAX_LIGHTNESS - t_red * (MAX_LIGHTNESS - MIN_LIGHTNESS); 
      backgroundColor = `hsl(${RED_HUE}, ${SATURATION}%, ${lightness_pastel_red.toFixed(0)}%)`;
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
    if (!config || !config.key || !data || !Array.isArray(data)) {
        return Array.isArray(data) ? data : [];
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
            if (config.key === 'winPct' && typeof config.key === 'string' && 'winPct' in a && 'winPct' in b) {
                comparison = parseFloat(String(valA).replace('%', '')) - parseFloat(String(valB).replace('%', ''));
            } else if (config.key === 'value' && typeof config.key === 'string' && 'value' in a && 'value' in b) {
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
        } else if (config.key === 'value' && (typeof valA === 'number' || typeof valB === 'number' || typeof valA === 'string' || typeof valB === 'string')) {
            const numA = parseFloat(String(valA));
            const numB = parseFloat(String(valB));
            if (!isNaN(numA) && !isNaN(numB)) {
                comparison = numA - numB;
            } else {
                comparison = String(valA).localeCompare(String(valB));
            }
        }
        else {
            comparison = String(valA).localeCompare(String(valB));
        }
        return config.direction === 'asc' ? comparison : -comparison;
        });
        return sortedData;
    } catch (e) {
        console.error("Error in sortData:", e, {data, config});
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
    if (!leagueData?.playoffQualificationRate || !Array.isArray(leagueData.playoffQualificationRate)) return [];
    return [...leagueData.playoffQualificationRate].sort((a, b) => b.qualification_rate - a.qualification_rate);
  }, [leagueData?.playoffQualificationRate]);


  if (loading) {
    return (
      <div className="space-y-8">
        <Card>
          <CardHeader><CardTitle>Championship Timeline</CardTitle></CardHeader>
          <CardContent className="px-0 sm:px-6 flex items-center justify-center">
            <Skeleton className="w-full max-w-sm sm:max-w-md md:max-w-lg lg:max-w-xl xl:max-w-3xl h-[14rem] mx-auto" />
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
    return <Card><CardContent className="pt-6 text-center">Failed to load league data. Check console for errors.</CardContent></Card>;
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
            className="w-full max-w-sm sm:max-w-md md:max-w-lg lg:max-w-xl xl:max-w-3xl mx-auto"
          >
            <CarouselContent>
              {Array.isArray(leagueData.championshipTimeline) && leagueData.championshipTimeline.map((champion: ChampionTimelineEntry, index: number) => (
                <CarouselItem key={index} className="sm:basis-1/2 md:basis-1/2 lg:basis-1/3">
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
                  <Legend />
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

  useEffect(() => {
    if (selectedSeason) {
      setLoading(true);
      setError(null);
      setSeasonData(null);
      fetch(`/data/league_data/seasons/${selectedSeason}.json`)
        .then(res => {
          if (!res.ok) {
            throw new Error(`HTTP error! status: ${res.status} for season ${selectedSeason}`);
          }
          return res.json();
        })
        .then((data: SeasonDetailData) => {
          setSeasonData(data);
        })
        .catch(err => {
          console.error(`Failed to load season data for ${selectedSeason}:`, err);
          setError(`Failed to load data for ${selectedSeason} season. Please ensure '${selectedSeason}.json' exists in 'public/data/league_data/seasons/'.`);
        })
        .finally(() => {
          setLoading(false);
        });
    }
  }, [selectedSeason]);

  return (
    <div className="space-y-6">
      <Select value={selectedSeason} onValueChange={setSelectedSeason}>
        <SelectTrigger className="w-[280px]">
          <SelectValue placeholder="Select a season" />
        </SelectTrigger>
        <SelectContent>
          {mockSeasonsForTabs.map(season => (
            <SelectItem key={season.id} value={season.id}>{season.year} Season</SelectItem>
          ))}
        </SelectContent>
      </Select>

      {loading && (
        <Card>
          <CardHeader><Skeleton className="h-8 w-1/2" /></CardHeader>
          <CardContent className="space-y-4">
            <Skeleton className="h-6 w-3/4" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-40 w-full" />
          </CardContent>
        </Card>
      )}
      {error && <Card><CardContent className="pt-6 text-destructive">{error}</CardContent></Card>}
      
      {!loading && !error && seasonData && (
        <Card>
          <CardHeader>
            <CardTitle>{seasonData.year} Season Details</CardTitle>
            {seasonData.champion && <CardDescription>Champion: {seasonData.champion.gmName} ({seasonData.champion.teamName})</CardDescription>}
          </CardHeader>
          <CardContent>
            {seasonData.summary && <p className="mb-4 text-muted-foreground">{seasonData.summary}</p>}
            
            <Tabs defaultValue="overview" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="overview">Overview & Standings</TabsTrigger>
                <TabsTrigger value="weekly_scores">Weekly Scores</TabsTrigger>
                <TabsTrigger value="top_performers">Top Performers</TabsTrigger>
              </TabsList>
              <TabsContent value="overview" className="pt-4">
                {Array.isArray(seasonData.standings) && (
                  <>
                    <h3 className="text-lg font-semibold mb-2">Final Standings</h3>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Rank</TableHead>
                          <TableHead>GM</TableHead>
                          <TableHead>Team Name</TableHead>
                          <TableHead>W-L-T</TableHead>
                          <TableHead>PF</TableHead>
                          <TableHead>PA</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {seasonData.standings.map((s: SeasonStandingEntry) => (
                          <TableRow key={s.gmId}>
                            <TableCell>{s.rank}</TableCell>
                            <TableCell>{s.gmName}</TableCell>
                            <TableCell>{s.teamName}</TableCell>
                            <TableCell>{s.wins}-{s.losses}-{s.ties}</TableCell>
                            <TableCell>{s.pointsFor.toFixed(2)}</TableCell>
                            <TableCell>{s.pointsAgainst.toFixed(2)}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </>
                )}
                 {seasonData.playoffBracket && <p className="mt-4 text-muted-foreground">Playoff bracket visualization coming soon.</p>}
              </TabsContent>
              <TabsContent value="weekly_scores" className="pt-4">
                <p className="text-muted-foreground">Weekly scores visualization coming soon for {seasonData.year}.</p>
              </TabsContent>
              <TabsContent value="top_performers" className="pt-4">
                <p className="text-muted-foreground">Top performers display coming soon for {seasonData.year}.</p>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      )}
       {!loading && !error && !seasonData && selectedSeason && (
         <Card><CardContent className="pt-6 text-center text-muted-foreground">No data found for {selectedSeason} season. Ensure the file exists and is correctly formatted.</CardContent></Card>
       )}
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
      fetch(gmFilePath)
        .then(res => {
          if (!res.ok) {
            throw new Error(`HTTP error! status: ${res.status} for GM ${selectedGmId} at ${gmFilePath}`);
          }
          return res.json();
        })
        .then((data: GMCareerData) => {
          setGmData(data);
        })
        .catch(err => {
          console.error(`Failed to load GM data for ${selectedGmId} from ${gmFilePath}:`, err);
          setError(`Failed to load data for ${selectedGmId}. Please ensure '${selectedGmId}/${selectedGmId}.json' exists in 'public/data/league_data/'.`);
        })
        .finally(() => {
          setLoading(false);
        });
    }
  }, [selectedGmId]);
  
  const selectedGmName = mockGmsForTabs.find(g => g.id === selectedGmId)?.name;

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
          <CardHeader><Skeleton className="h-8 w-1/2" /></CardHeader>
          <CardContent className="space-y-4">
            <Skeleton className="h-6 w-3/4" />
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Skeleton className="h-16 w-full" />
                <Skeleton className="h-16 w-full" />
                <Skeleton className="h-16 w-full" />
                <Skeleton className="h-16 w-full" />
            </div>
            <Skeleton className="h-40 w-full" />
          </CardContent>
        </Card>
      )}
      {error && <Card><CardContent className="pt-6 text-destructive">{error}</CardContent></Card>}

      {!loading && !error && gmData && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {gmData.photoUrl ? (
                <Image src={gmData.photoUrl} alt={`${gmData.gmName} photo`} width={40} height={40} className="rounded-full" data-ai-hint="person avatar"/>
              ) : (
                <Users className="h-8 w-8 text-muted-foreground" />
              )}
              {gmData.gmName}'s Career
            </CardTitle>
            {gmData.bio && <CardDescription>{gmData.bio}</CardDescription>}
          </CardHeader>
          <CardContent>
            {gmData.careerSummary && (
              <div className="mb-6 p-4 border rounded-lg bg-muted/50">
                <h3 className="text-lg font-semibold mb-3 text-center">Career Summary</h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 text-sm">
                  <div><strong className="block text-foreground">Seasons:</strong> {gmData.careerSummary.totalSeasons}</div>
                  <div><strong className="block text-foreground">Champs:</strong> {gmData.careerSummary.championships}</div>
                   {gmData.careerSummary.runnerUps !== undefined && <div><strong className="block text-foreground">Runner Ups:</strong> {gmData.careerSummary.runnerUps}</div>}
                  <div><strong className="block text-foreground">Playoffs:</strong> {gmData.careerSummary.playoffAppearances}</div>
                  <div><strong className="block text-foreground">Reg. Wins:</strong> {gmData.careerSummary.regularSeasonWins}</div>
                  <div><strong className="block text-foreground">Reg. Losses:</strong> {gmData.careerSummary.regularSeasonLosses}</div>
                  <div><strong className="block text-foreground">Reg. Ties:</strong> {gmData.careerSummary.regularSeasonTies}</div>
                  <div><strong className="block text-foreground">Reg. Win %:</strong> {gmData.careerSummary.regularSeasonWinPct}</div>
                  {gmData.careerSummary.playoffWins !== undefined && <div><strong className="block text-foreground">Playoff Wins:</strong> {gmData.careerSummary.playoffWins}</div>}
                  {gmData.careerSummary.playoffLosses !== undefined && <div><strong className="block text-foreground">Playoff Losses:</strong> {gmData.careerSummary.playoffLosses}</div>}
                   {gmData.careerSummary.playoffWinPct !== undefined && <div><strong className="block text-foreground">Playoff Win %:</strong> {gmData.careerSummary.playoffWinPct}</div>}
                  <div><strong className="block text-foreground">Total PF:</strong> {gmData.careerSummary.totalPointsFor.toFixed(2)}</div>
                  <div><strong className="block text-foreground">Total PA:</strong> {gmData.careerSummary.totalPointsAgainst.toFixed(2)}</div>
                  <div><strong className="block text-foreground">Avg Finish:</strong> {gmData.careerSummary.avgFinalStanding.toFixed(1)}</div>
                </div>
              </div>
            )}

            {Array.isArray(gmData.seasonBySeason) && gmData.seasonBySeason.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold mb-2">Season-by-Season</h3>
                <div className="overflow-x-auto">
                    <Table>
                    <TableHeader>
                        <TableRow>
                        <TableHead>Year</TableHead>
                        <TableHead>Team Name</TableHead>
                        <TableHead>Rank</TableHead>
                        <TableHead>Record</TableHead>
                        <TableHead>PF</TableHead>
                        <TableHead>PA</TableHead>
                        <TableHead>Playoffs?</TableHead>
                        <TableHead>Outcome</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {gmData.seasonBySeason.map((s: GMCareerSeasonSummary) => (
                        <TableRow key={s.year}>
                            <TableCell>{s.year}</TableCell>
                            <TableCell>{s.teamName}</TableCell>
                            <TableCell>{s.rank}</TableCell>
                            <TableCell>{s.wins}-{s.losses}-{s.ties}</TableCell>
                            <TableCell>{s.pointsFor.toFixed(2)}</TableCell>
                            <TableCell>{s.pointsAgainst.toFixed(2)}</TableCell>
                            <TableCell>{s.madePlayoffs ? 'Yes' : 'No'}</TableCell>
                            <TableCell>{s.championshipResult || '-'}</TableCell>
                        </TableRow>
                        ))}
                    </TableBody>
                    </Table>
                </div>
              </div>
            )}
            {gmData.awards && <p className="mt-4 text-muted-foreground">Awards display coming soon.</p>}
            {gmData.rivalries && <p className="mt-4 text-muted-foreground">Rivalries display coming soon.</p>}
            {gmData.draftHistorySummary && <p className="mt-4 text-muted-foreground">Draft History Summary coming soon.</p>}
          </CardContent>
        </Card>
      )}
      {!loading && !error && !gmData && selectedGmId && (
         <Card><CardContent className="pt-6 text-center text-muted-foreground">No data found for {selectedGmName}. Ensure the file exists and is correctly formatted.</CardContent></Card>
      )}
    </div>
  );
};

export default function LeagueHistoryPage() {
  const [leagueData, setLeagueData] = useState<LeagueData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/data/league_data/league-data.json')
      .then(res => {
        if (!res.ok) {
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
        setLoading(false);
      });
  }, []);

  return (
    <Tabs defaultValue="all-seasons" className="w-full">
      <TabsList className="grid w-full grid-cols-3 mb-6">
        <TabsTrigger value="all-seasons">All Seasons Overview</TabsTrigger>
        <TabsTrigger value="season-detail">Season Detail</TabsTrigger>
        <TabsTrigger value="gm-career">GM Career</TabsTrigger>
      </TabsList>
      <TabsContent value="all-seasons">
        <AllSeasonsOverview leagueData={leagueData} loading={loading} />
      </TabsContent>
      <TabsContent value="season-detail">
        <SeasonDetail />
      </TabsContent>
      <TabsContent value="gm-career">
        <GMCareer />
      </TabsContent>
    </Tabs>
  );
}

