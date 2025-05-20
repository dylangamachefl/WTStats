
"use client";
import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { 
  LeagueData, 
  CareerStat,
  Season as SeasonType,
  ChampionTimelineEntry,
  LeagueRecord,
  PlayoffAppearanceRate,
  FinalStandingsHeatmapEntry,
  GMPlayoffPerformanceStat
} from '@/lib/types';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import Image from 'next/image';
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from '@/lib/utils';
import { ArrowUpDown } from 'lucide-react';
import { Button } from '@/components/ui/button';

// Mock data for SeasonDetail and GMCareer tabs (until they are also updated)
const mockSeasonsForTabs: SeasonType[] = [
  { id: "2023", year: 2023, championId: "gm1", championName: "The Champs", championTeamName: "Victorious Secret", championPhotoUrl: "https://placehold.co/60x60.png" },
  { id: "2022", year: 2022 },
  { id: "2021", year: 2021 },
];

const mockGmsForTabs: { id: string; name: string }[] = [
  { id: "gm1", name: "Alice" },
  { id: "gm2", name: "Bob" },
  { id: "gm3", name: "Charlie" },
];

type SortDirection = 'asc' | 'desc';

interface SortConfig<T> {
  key: keyof T | null;
  direction: SortDirection;
}

const AllSeasonsOverview = ({ leagueData, loading }: { leagueData: LeagueData | null; loading: boolean }) => {
  const [heatmapYears, setHeatmapYears] = useState<string[]>([]);
  const [maxRankPerYear, setMaxRankPerYear] = useState<{ [year: string]: number }>({});

  const [careerSortConfig, setCareerSortConfig] = useState<SortConfig<CareerStat>>({ key: 'name', direction: 'asc' });
  const [recordsSortConfig, setRecordsSortConfig] = useState<SortConfig<LeagueRecord>>({ key: 'record_category', direction: 'asc' });
  const [playoffPerfSortConfig, setPlayoffPerfSortConfig] = useState<SortConfig<GMPlayoffPerformanceStat>>({ key: 'gm_name', direction: 'asc' });
  const [heatmapSortConfig, setHeatmapSortConfig] = useState<SortConfig<FinalStandingsHeatmapEntry>>({ key: 'gm_name', direction: 'asc' });


  useEffect(() => {
    if (leagueData?.finalStandingsHeatmap) {
      const years = new Set<string>();
      const currentMaxRanks: { [year: string]: number } = {};
      leagueData.finalStandingsHeatmap.forEach(gm => {
        Object.keys(gm).forEach(key => {
          if (key !== 'gm_name' && !isNaN(Number(key))) {
            years.add(key);
            const rank = gm[key] as number | null | undefined;
            if (typeof rank === 'number') {
              currentMaxRanks[key] = Math.max(currentMaxRanks[key] || 0, rank);
            }
          }
        });
      });
      setHeatmapYears(Array.from(years).sort((a, b) => parseInt(b) - parseInt(a))); // Sort years descending
      setMaxRankPerYear(currentMaxRanks);
    }
  }, [leagueData]);

  const getRankStyle = (rank: number | null | undefined, maxRankInYear: number): { textClass: string; style: React.CSSProperties } => {
    const defaultStyle = { textClass: 'font-semibold text-foreground', style: {} };
    const coloredRankedStyle = { textClass: 'font-semibold text-neutral-800', style: {} };
  
    if (rank === null || rank === undefined) return { textClass: 'text-muted-foreground', style: {} };
  
    if (rank === 1) {
      return {
        textClass: 'text-primary-foreground font-semibold',
        style: { backgroundColor: 'hsl(var(--primary))' }
      };
    }
    
    // Handle cases where maxRankInYear is too small for a meaningful scale
    if (maxRankInYear <= 1) return defaultStyle;
  
    const SATURATION = 60;
    const MAX_LIGHTNESS = 92; // Very light pastel
    const MIN_LIGHTNESS = 78; // Slightly more saturated pastel
  
    // For leagues with only 2 GMs, rank 2 is the "worst"
    if (maxRankInYear === 2 && rank === 2) {
        return { 
            textClass: coloredRankedStyle.textClass, 
            style: { backgroundColor: `hsl(0, ${SATURATION}%, ${MAX_LIGHTNESS}%)` } // Lightest red
        };
    }
    // If maxRankInYear is 2, but rank is not 2 (e.g. an invalid rank for that year), default styling
    if (maxRankInYear <= 2) return defaultStyle;
    
  
    // Normalize rank (from 2 to maxRankInYear) to a 0-1 scale
    // 0 is best (greenest, rank 2), 1 is worst (reddest, rank maxRankInYear).
    const denominator = maxRankInYear - 2; 
    if (denominator === 0) return defaultStyle; // Should be caught by maxRankInYear <= 2
  
    const normalizedRank = (rank - 2) / denominator;
    const clampedNormalizedRank = Math.min(1, Math.max(0, normalizedRank)); // Clamp between 0 and 1
  
    const NEUTRAL_CENTER = 0.5;
    const NEUTRAL_BANDWIDTH = 0.15; // Ranks from 42.5% to 57.5% of the scale get no specific color
  
    const GREEN_HUE = 120;
    const RED_HUE = 0;
    
    let backgroundColor = '';
  
    if (Math.abs(clampedNormalizedRank - NEUTRAL_CENTER) <= NEUTRAL_BANDWIDTH / 2) {
      // Neutral zone - use default cell styling
      return defaultStyle;
    } else if (clampedNormalizedRank < NEUTRAL_CENTER) {
      // Green spectrum (normalizedRank from 0 up to NEUTRAL_CENTER - BANDWIDTH/2)
      // t_green maps the green portion of the scale [0, green_zone_width) to [0, 1]
      // where 0 is best (rank 2), 1 is closest to neutral from green side
      const green_zone_width = NEUTRAL_CENTER - NEUTRAL_BANDWIDTH / 2;
      // Prevent division by zero if green_zone_width is 0 (e.g. if NEUTRAL_CENTER is too small or BANDWIDTH too large)
      const t_green = green_zone_width > 0 ? clampedNormalizedRank / green_zone_width : 1;
      const lightness = MAX_LIGHTNESS - t_green * (MAX_LIGHTNESS - MIN_LIGHTNESS); // Interpolates from MAX_LIGHTNESS down to MIN_LIGHTNESS
      backgroundColor = `hsl(${GREEN_HUE}, ${SATURATION}%, ${lightness.toFixed(0)}%)`;
    } else { // clampedNormalizedRank > NEUTRAL_CENTER + NEUTRAL_BANDWIDTH / 2
      // Red spectrum (normalizedRank from NEUTRAL_CENTER + BANDWIDTH/2 up to 1)
      // t_red maps the red portion of the scale [red_zone_start, 1] to [0, 1]
      // where 0 is closest to neutral from red side, 1 is worst (maxRankInYear)
      const red_zone_start = NEUTRAL_CENTER + NEUTRAL_BANDWIDTH / 2;
      const red_zone_width = 1 - red_zone_start;
      // Prevent division by zero if red_zone_width is 0 or less
      const t_red = red_zone_width > 0 ? (clampedNormalizedRank - red_zone_start) / red_zone_width : 0;
      const lightness = MIN_LIGHTNESS + t_red * (MAX_LIGHTNESS - MIN_LIGHTNESS); // Interpolates from MIN_LIGHTNESS up to MAX_LIGHTNESS
      backgroundColor = `hsl(${RED_HUE}, ${SATURATION}%, ${lightness.toFixed(0)}%)`;
    }
    
    return {
      textClass: coloredRankedStyle.textClass,
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
  
  const sortData = <T,>(data: T[], config: SortConfig<T>): T[] => {
    if (!config.key || !data) return data;
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
        // Specific handling for string-based numbers like percentages or values with units
        if (config.key === 'winPct') { 
            comparison = parseFloat(valA.replace('%','')) - parseFloat(valB.replace('%',''));
        } else if (config.key === 'value' && !isNaN(parseFloat(valA)) && !isNaN(parseFloat(valB))) { // For LeagueRecord value
            comparison = parseFloat(valA) - parseFloat(valB);
        }
        else {
            comparison = valA.localeCompare(valB);
        }
      } else { 
        // Fallback for other types or mixed types, convert to string for comparison
        comparison = String(valA).localeCompare(String(valB));
      }
      return config.direction === 'asc' ? comparison : -comparison;
    });
    return sortedData;
  };
  
  const sortedCareerLeaderboard = useMemo(() => sortData(leagueData?.careerLeaderboard || [], careerSortConfig), [leagueData?.careerLeaderboard, careerSortConfig]);
  const requestCareerSort = createSortHandler(careerSortConfig, setCareerSortConfig);

  const sortedLeagueRecords = useMemo(() => sortData(leagueData?.leagueRecords || [], recordsSortConfig), [leagueData?.leagueRecords, recordsSortConfig]);
  const requestRecordsSort = createSortHandler(recordsSortConfig, setRecordsSortConfig);
  
  const sortedGmPlayoffPerformance = useMemo(() => sortData(leagueData?.gmPlayoffPerformance || [], playoffPerfSortConfig), [leagueData?.gmPlayoffPerformance, playoffPerfSortConfig]);
  const requestPlayoffPerfSort = createSortHandler(playoffPerfSortConfig, setPlayoffPerfSortConfig);

  const sortedFinalStandingsHeatmap = useMemo(() => sortData(leagueData?.finalStandingsHeatmap || [], heatmapSortConfig), [leagueData?.finalStandingsHeatmap, heatmapSortConfig]);
  const requestHeatmapSort = createSortHandler(heatmapSortConfig, setHeatmapSortConfig);


  if (loading) {
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader><CardTitle>Championship Timeline</CardTitle></CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1,2,3].map(i => <Skeleton key={i} className="h-48" />)}
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
    return <Card><CardContent className="pt-6 text-center">Failed to load league data.</CardContent></Card>;
  }
  
  const sortedPlayoffRates = leagueData.playoffQualificationRate && [...leagueData.playoffQualificationRate].sort((a, b) => b.qualification_rate - a.qualification_rate);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Championship Timeline</CardTitle>
          <CardDescription>A chronological display of league champions.</CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {leagueData.championshipTimeline.map((champion: ChampionTimelineEntry) => (
            <Card key={champion.year} className="flex flex-col items-center p-4 text-center bg-card hover:shadow-lg transition-shadow">
              <Image 
                data-ai-hint="team logo" 
                src={champion.imgUrl || "https://placehold.co/80x80.png"} 
                alt={`${champion.teamName || champion.championName} logo`}
                width={80} height={80} 
                className="rounded-full mb-2 border-2 border-primary object-contain" 
              />
              <p className="font-semibold text-lg">{champion.championName}</p>
              <p className="text-sm text-muted-foreground">{champion.teamName}</p>
              <p className="text-xs text-muted-foreground">Champion of {champion.year}</p>
              <p className="text-xs text-muted-foreground mt-1">Record: {champion.wins}-{champion.losses}</p>
              <p className="text-xs text-muted-foreground">PF: {champion.pointsFor.toFixed(2)} | PA: {champion.pointsAgainst.toFixed(2)}</p>
            </Card>
          ))}
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
              {sortedCareerLeaderboard.map((stat: CareerStat) => (
                <TableRow key={stat.name}>
                  <TableCell className="font-medium">{stat.name}</TableCell>
                  <TableCell>{stat.wins}</TableCell>
                  <TableCell>{stat.losses}</TableCell>
                  <TableCell>{stat.ties}</TableCell>
                  <TableCell>{stat.winPct}</TableCell>
                  <TableCell>{stat.championships}</TableCell>
                  <TableCell>{stat.pointsFor.toFixed(2)}</TableCell>
                  <TableCell>{stat.pointsAgainst.toFixed(2)}</TableCell>
                  <TableCell>{(stat.playoffRate * 100).toFixed(1)}%</TableCell>
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
                {sortedLeagueRecords.map((record: LeagueRecord, index: number) => (
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
        
        {leagueData.playoffQualificationRate && leagueData.playoffQualificationRate.length > 0 && (
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
          <CardDescription>GM finishing positions by year. Primary color (1st), transitioning from light green (better) through neutral to light red (worse) for other ranks.</CardDescription>
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
                {sortedFinalStandingsHeatmap.map((gmEntry: FinalStandingsHeatmapEntry) => (
                  <TableRow key={gmEntry.gm_name}>
                    <TableCell className="font-medium sticky left-0 bg-card z-10 py-2 px-1 text-xs md:text-sm whitespace-nowrap">{gmEntry.gm_name}</TableCell>
                    {heatmapYears.map(year => {
                      const rank = gmEntry[year] as number | null | undefined;
                      const { textClass, style } = getRankStyle(rank, maxRankPerYear[year] || 0);
                      const displayValue = (rank !== undefined && rank !== null) ? rank : '-';
                      
                      return (
                        <TableCell 
                          key={year} 
                          className={cn(
                            "text-center py-2 px-1 text-xs md:text-sm min-w-[40px] md:min-w-[50px]",
                            textClass
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

      {leagueData.gmPlayoffPerformance && leagueData.gmPlayoffPerformance.length > 0 && (
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
                {sortedGmPlayoffPerformance.map((gmPerf: GMPlayoffPerformanceStat) => (
                  <TableRow key={gmPerf.gm_name}>
                    <TableCell className="font-medium">{gmPerf.gm_name}</TableCell>
                    <TableCell className="text-right">{gmPerf.total_matchups}</TableCell>
                    <TableCell className="text-right">{gmPerf.wins}</TableCell>
                    <TableCell className="text-right">{gmPerf.losses}</TableCell>
                    <TableCell className="text-right">{gmPerf.quarterfinal_matchups}</TableCell>
                    <TableCell className="text-right">{gmPerf.semifinal_matchups}</TableCell>
                    <TableCell className="text-right">{gmPerf.championship_matchups}</TableCell>
                    <TableCell className="text-right">{gmPerf.avg_playoff_points_weekly.toFixed(2)}</TableCell>
                    <TableCell className="text-right">{gmPerf.playoff_performance_pct.toFixed(2)}%</TableCell>
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
      {selectedSeason && (
        <Card>
          <CardHeader><CardTitle>{mockSeasonsForTabs.find(s => s.id === selectedSeason)?.year} Season Details</CardTitle></CardHeader>
          <CardContent>
            <Tabs defaultValue="overview">
              <TabsList>
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="weekly_scores">Weekly Scores</TabsTrigger>
                <TabsTrigger value="top_performers">Top Performers</TabsTrigger>
              </TabsList>
              <TabsContent value="overview" className="pt-4">
                <p>Standings and playoff bracket for {selectedSeason}. (Mock Data)</p>
              </TabsContent>
              <TabsContent value="weekly_scores" className="pt-4">
                <p>Weekly scores heatmap for {selectedSeason}. (Mock Data)</p>
              </TabsContent>
              <TabsContent value="top_performers" className="pt-4">
                <p>Top performing players for {selectedSeason}. (Mock Data)</p>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

const GMCareer = () => {
  const [selectedGm, setSelectedGm] = useState<string | undefined>(mockGmsForTabs[0]?.id);

  return (
    <div className="space-y-6">
      <Select value={selectedGm} onValueChange={setSelectedGm}>
        <SelectTrigger className="w-[280px]">
          <SelectValue placeholder="Select a GM" />
        </SelectTrigger>
        <SelectContent>
          {mockGmsForTabs.map(gm => (
            <SelectItem key={gm.id} value={gm.id}>{gm.name}</SelectItem>
          ))}
        </SelectContent>
      </Select>
      {selectedGm && (
        <Card>
          <CardHeader><CardTitle>{mockGmsForTabs.find(g => g.id === selectedGm)?.name}'s Career</CardTitle></CardHeader>
          <CardContent>
            <p>Detailed career statistics, season progression, and more for {selectedGm}. (Mock Data)</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default function LeagueHistoryPage() {
  const [leagueData, setLeagueData] = useState<LeagueData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/data/league-data.json')
      .then(res => {
        if (!res.ok) {
          throw new Error(`HTTP error! status: ${res.status}`);
        }
        return res.json();
      })
      .then((data: any) => {
        // Map 'points' to 'pointsFor' in careerLeaderboard
        const mappedCareerLeaderboard = data.careerLeaderboard.map((stat: any) => ({
          ...stat,
          pointsFor: stat.points, // Assuming 'points' from JSON is total points for
          // pointsAgainst is already in the JSON with the correct name
        }));

        const processedData: LeagueData = {
          ...data,
          careerLeaderboard: mappedCareerLeaderboard,
          championshipTimeline: data.championshipTimeline || [],
          leagueRecords: data.leagueRecords || [],
          finalStandingsHeatmap: data.finalStandingsHeatmap || [],
          playoffQualificationRate: data.playoffQualificationRate || [],
          gmPlayoffPerformance: data.gmPlayoffPerformance || [],
        };
        
        setLeagueData(processedData);
      })
      .catch(error => {
        console.error("Failed to load or process league data:", error);
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

