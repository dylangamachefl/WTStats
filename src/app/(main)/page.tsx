
"use client";
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { 
  LeagueData, 
  CareerStat,
  // FinalStandingsHeatmapEntry, // No longer directly used as type for leagueData.finalStandingsHeatmap in component
  // GMPlayoffPerformanceStat, // No longer directly used as type for leagueData.gmPlayoffPerformance in component
  Season as SeasonType, // Renamed to avoid conflict with React's Season
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

const AllSeasonsOverview = ({ leagueData, loading }: { leagueData: LeagueData | null; loading: boolean }) => {
  const [heatmapYears, setHeatmapYears] = useState<string[]>([]);

  useEffect(() => {
    if (leagueData?.finalStandingsHeatmap) {
      const years = new Set<string>();
      leagueData.finalStandingsHeatmap.forEach(gm => {
        Object.keys(gm).forEach(key => {
          if (key !== 'gm_name' && !isNaN(Number(key))) {
            years.add(key);
          }
        });
      });
      setHeatmapYears(Array.from(years).sort((a, b) => parseInt(b) - parseInt(a))); // Sort descending
    }
  }, [leagueData]);

  const getRankClass = (rank: number | null | undefined): string => {
    if (rank === null || rank === undefined) return ''; // Handled by isRanked check for text color
    switch (rank) {
      case 1:
        return 'bg-yellow-400 text-yellow-900 dark:bg-yellow-500 dark:text-yellow-950'; // Gold
      case 2:
        return 'bg-gray-300 text-gray-800 dark:bg-gray-500 dark:text-gray-200';    // Silver
      case 3:
        return 'bg-amber-500 text-amber-950 dark:bg-amber-600 dark:text-amber-100';   // Bronze
      default:
        return ''; // Default styling
    }
  };

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
  
  const sortedPlayoffRates = leagueData.playoffQualificationRate.slice().sort((a, b) => b.qualification_rate - a.qualification_rate);

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
                <TableHead>GM</TableHead>
                <TableHead>W</TableHead>
                <TableHead>L</TableHead>
                <TableHead>T</TableHead>
                <TableHead>Win%</TableHead>
                <TableHead>Champs</TableHead>
                <TableHead>PF</TableHead>
                <TableHead>PA</TableHead>
                <TableHead>Playoff Rate</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {leagueData.careerLeaderboard.map((stat: CareerStat) => (
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
                  <TableHead>Category</TableHead>
                  <TableHead>GM</TableHead>
                  <TableHead>Value</TableHead>
                  <TableHead>Season(s)</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {leagueData.leagueRecords.map((record: LeagueRecord, index: number) => (
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
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Final Standings Heatmap</CardTitle>
          <CardDescription>GM finishing positions by year. Gold (1st), Silver (2nd), Bronze (3rd).</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="sticky left-0 bg-card z-10 py-2 px-1 text-xs md:text-sm">GM</TableHead>
                  {heatmapYears.map(year => (
                    <TableHead key={year} className="text-center py-2 px-1 text-xs md:text-sm">{year}</TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {leagueData.finalStandingsHeatmap.map((gmEntry: FinalStandingsHeatmapEntry) => (
                  <TableRow key={gmEntry.gm_name}>
                    <TableCell className="font-medium sticky left-0 bg-card z-10 py-2 px-1 text-xs md:text-sm">{gmEntry.gm_name}</TableCell>
                    {heatmapYears.map(year => {
                      const rank = gmEntry[year] as number | null | undefined;
                      const rankClass = getRankClass(rank);
                      const displayValue = (rank !== undefined && rank !== null) ? rank : '-';
                      const isRanked = (rank !== undefined && rank !== null);

                      return (
                        <TableCell 
                          key={year} 
                          className={cn(
                            "text-center py-2 px-1 text-xs md:text-sm min-w-[40px]", // Added min-width
                            isRanked ? 'font-semibold' : 'text-muted-foreground',
                            rankClass
                          )}
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

      <Card>
        <CardHeader>
          <CardTitle>GM Playoff Performance</CardTitle>
          <CardDescription>Statistics from playoff appearances.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>GM</TableHead>
                <TableHead className="text-right">Total Matchups</TableHead>
                <TableHead className="text-right">Wins</TableHead>
                <TableHead className="text-right">Losses</TableHead>
                <TableHead className="text-right">Quarterfinals</TableHead>
                <TableHead className="text-right">Semifinals</TableHead>
                <TableHead className="text-right">Championships</TableHead>
                <TableHead className="text-right">Avg Pts</TableHead>
                <TableHead className="text-right">Perf %</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {leagueData.gmPlayoffPerformance.sort((a,b) => b.playoff_performance_pct - a.playoff_performance_pct).map((gmPerf: GMPlayoffPerformanceStat) => (
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
        // Type assertion for the fetched data structure.
        // This assumes data.json has a structure compatible with LeagueData after mapping.
        
        // Map 'points' to 'pointsFor' in careerLeaderboard
        const mappedCareerLeaderboard = data.careerLeaderboard.map((stat: any) => ({
          ...stat,
          pointsFor: stat.points, // Assuming 'points' exists and should be mapped to 'pointsFor'
        }));

        const processedData: LeagueData = {
          ...data,
          careerLeaderboard: mappedCareerLeaderboard,
          // Ensure all other parts of LeagueData are correctly structured or mapped if necessary
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

