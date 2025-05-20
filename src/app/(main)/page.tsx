
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
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts';
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

  const getRankStyle = (rank: number | null | undefined, maxRankInYear: number): { textClass: string; borderClass: string; style: React.CSSProperties } => {
    const defaultStyle = { textClass: 'font-semibold text-foreground', borderClass: '', style: {} };
    const coloredRankedStyle = { textClass: 'font-semibold text-neutral-800', borderClass: '', style: {} };
  
    if (rank === null || rank === undefined) return { textClass: 'text-muted-foreground', borderClass: '', style: {} };
  
    if (rank === 1) {
      return {
        textClass: 'text-neutral-800 font-semibold',
        borderClass: 'border-2 border-foreground', 
        style: { backgroundColor: 'hsl(50, 95%, 60%)' } // Bright yellow
      };
    }
    
    if (maxRankInYear <= 1) return defaultStyle;
  
    const SATURATION = 60;
    const MAX_LIGHTNESS = 92; 
    const MIN_LIGHTNESS = 78; 
  
    if (maxRankInYear === 2 && rank === 2) { // Only one other rank, make it red
        return { 
            textClass: coloredRankedStyle.textClass, 
            borderClass: '',
            style: { backgroundColor: `hsl(0, ${SATURATION}%, ${MAX_LIGHTNESS}%)` } 
        };
    }
    if (maxRankInYear <= 2) return defaultStyle; 
    
    const denominator = maxRankInYear - 2; 
    if (denominator === 0) return defaultStyle; 
  
    const normalizedRank = (rank - 2) / denominator;
    const clampedNormalizedRank = Math.min(1, Math.max(0, normalizedRank)); 
  
    const NEUTRAL_CENTER = 0.5; 
    const NEUTRAL_BANDWIDTH = 0.15; 
    
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
      const lightness = MIN_LIGHTNESS + t_red * (MAX_LIGHTNESS - MIN_LIGHTNESS); 
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
        if (config.key === 'winPct') { 
            comparison = parseFloat(valA.replace('%','')) - parseFloat(valB.replace('%',''));
        } else if (config.key === 'value' && !isNaN(parseFloat(valA)) && !isNaN(parseFloat(valB))) { 
            comparison = parseFloat(valA) - parseFloat(valB);
        }
        else {
            comparison = valA.localeCompare(valB);
        }
      } else { 
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
            {[1,2,3].map(i => <Skeleton key={i} className="h-60" />)}
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
        <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {leagueData.championshipTimeline.map((champion: ChampionTimelineEntry) => (
            <Card 
              key={champion.year} 
              className="flex flex-col items-center p-4 text-center shadow-lg hover:shadow-2xl transition-all duration-300 ease-in-out transform hover:-translate-y-1 rounded-xl overflow-hidden"
            >
              <div className="relative mb-4">
                <Image
                  data-ai-hint="team logo"
                  src={champion.imgUrl || "https://placehold.co/80x80.png"}
                  alt={`${champion.teamName || champion.championName} logo`}
                  width={80} height={80}
                  className="rounded-full border-2 border-primary object-contain shadow-sm"
                />
                <span className="absolute -top-1 -right-1 bg-accent text-accent-foreground text-xs font-semibold px-2 py-0.5 rounded-full shadow">
                  {champion.year}
                </span>
              </div>
              
              <h3 className="text-xl font-bold text-foreground">
                {champion.championName}
              </h3>
              <p className="text-sm text-muted-foreground mb-3">
                {champion.teamName || "Team Name N/A"}
              </p>

              <div className="w-full pt-3 mt-auto border-t border-border/60 text-xs text-muted-foreground space-y-1.5 text-left px-2">
                <div className="flex justify-between items-center">
                  <span className="font-medium text-foreground/80">Record:</span> 
                  <span className="font-semibold text-foreground/90">{champion.wins}-{champion.losses}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="font-medium text-foreground/80">Points For:</span>
                  <span className="font-semibold text-foreground/90">{champion.pointsFor.toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="font-medium text-foreground/80">Points Against:</span>
                  <span className="font-semibold text-foreground/90">{champion.pointsAgainst.toFixed(2)}</span>
                </div>
              </div>
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
                {sortedFinalStandingsHeatmap.map((gmEntry: FinalStandingsHeatmapEntry) => (
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
        const mappedCareerLeaderboard = data.careerLeaderboard.map((stat: any) => ({
          ...stat,
          pointsFor: stat.points, 
          pointsAgainst: stat.pointsAgainst,
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

