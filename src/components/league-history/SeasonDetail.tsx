// src/components/league-history/SeasonDetail.tsx
"use client";

import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { cn, getPositionBadgeClass, getPositionName } from "@/lib/utils";
import { fetcher } from '@/lib/fetcher';
import type {
    SeasonDetailData,
    SeasonStandingEntry,
    PlayoffMatchup,
    StrengthOfScheduleEntry,
    WaiverPickupEntry,
    TopPerformerPlayer,
    SeasonBestOverallGameEntry,
    Season as SeasonType_Mock
} from '@/lib/types';
import { Trophy, CalendarDays, BarChart2, LineChart as LineChartIconRecharts, ClipboardList, Zap, ShieldAlert } from 'lucide-react';

const mockSeasonsForTabs: SeasonType_Mock[] = [
    { id: "2009", year: 2009 }, { id: "2010", year: 2010 }, { id: "2011", year: 2011 }, { id: "2012", year: 2012 }, { id: "2013", year: 2013 }, { id: "2014", year: 2014 }, { id: "2015", year: 2015 }, { id: "2016", year: 2016 }, { id: "2017", year: 2017 }, { id: "2018", year: 2018 }, { id: "2019", year: 2019 }, { id: "2020", year: 2020 }, { id: "2021", year: 2021 }, { id: "2022", year: 2022 }, { id: "2023", year: 2023 }, { id: "2024", year: 2024 },
].sort((a,b) => b.year - a.year);

const getRatingBadgeClass = (rating?: string): string => {
  if (!rating) return "bg-gray-200 text-gray-800 dark:bg-gray-700 dark:text-gray-300";
  switch (rating.toLowerCase()) {
    case 'very hard': return 'bg-red-600 text-red-50 dark:bg-red-800 dark:text-red-100';
    case 'hard': return 'bg-orange-500 text-orange-50 dark:bg-orange-700 dark:text-orange-100';
    case 'above avg': return 'bg-yellow-400 text-yellow-800 dark:bg-yellow-600 dark:text-yellow-100';
    case 'below avg': return 'bg-lime-400 text-lime-800 dark:bg-lime-600 dark:text-lime-100';
    case 'easy': return 'bg-green-500 text-green-50 dark:bg-green-700 dark:text-green-100';
    default: return 'bg-gray-200 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
  }
};

const PlayoffMatchupCard = ({ matchup, roundName, isChampionship = false }: { matchup: PlayoffMatchup; roundName: string; isChampionship?: boolean; }) => {
    return (
    <div className={cn("p-3 border rounded-md shadow-sm", isChampionship ? "bg-yellow-100/50 dark:bg-yellow-800/30" : "bg-card")}>
      <p className="text-sm font-semibold text-center mb-1">{roundName}</p>
      <div className="text-xs space-y-1">
        <div className="flex justify-between"><span>{matchup.home.seed}. {matchup.home.name} ({matchup.home.owner})</span><span className="font-medium">{matchup.home.score?.toFixed(1) ?? 'N/A'}</span></div>
        <div className="flex justify-between"><span>{matchup.away.seed}. {matchup.away.name} ({matchup.away.owner})</span><span className="font-medium">{matchup.away.score?.toFixed(1) ?? 'N/A'}</span></div>
        {matchup.home.score != null && matchup.away.score != null && (<p className="text-xs text-muted-foreground mt-1">Winner: {matchup.home.score > matchup.away.score ? matchup.home.owner : matchup.away.owner}</p>)}
      </div>
    </div>
)};

export default function SeasonDetail() {
  const [selectedSeason, setSelectedSeason] = useState<string | undefined>(mockSeasonsForTabs[0]?.id);
  const [seasonData, setSeasonData] = useState<SeasonDetailData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [weeklyScoresDisplayMode, setWeeklyScoresDisplayMode] = useState<'scores' | 'results'>('scores');
  const [activeSubTab, setActiveSubTab] = useState<string>("overview");

  useEffect(() => {
    if (selectedSeason) {
      const fetchSeasonData = async () => {
        setLoading(true);
        setError(null);
        setSeasonData(null);
        const seasonFilePath = `/data/league_data/seasons/${selectedSeason}.json`;
        
        try {
          const jsonData: SeasonDetailData = await fetcher(seasonFilePath);
          if (!jsonData || typeof jsonData !== 'object' || !jsonData.seasonData || !jsonData.standingsData) {
            throw new Error(`Fetched data for ${selectedSeason} is incomplete or malformed.`);
          }
          setSeasonData(jsonData);
        } catch (err) {
          console.error(`[SeasonDetail] Failed to load or process data for ${selectedSeason}:`, err);
          setError(err instanceof Error ? err.message : `An unknown error occurred while fetching data for ${selectedSeason}.`);
          setSeasonData(null);
        } finally {
          setLoading(false);
        }
      };

      fetchSeasonData();
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
    if (!seasonData?.weeklyScoresData?.teams || !seasonData.weeklyScoresData.scores) return {};
    const averages: { [teamName: string]: number | null } = {};
    seasonData.weeklyScoresData.teams.forEach((teamName, teamIndex) => {
      let totalScore = 0;
      let gameCount = 0;
      seasonData.weeklyScoresData.scores.forEach(weekScores => {
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
    { label: '140+ pts', className: 'bg-green-200' },
    { label: '125-139', className: 'bg-green-100' },
    { label: '110-124', className: 'bg-lime-100' },
    { label: '100-109', className: 'bg-yellow-100' },
    { label: '90-99', className: 'bg-orange-100' },
    { label: '<90 pts', className: 'bg-red-100' },
  ];
  const weeklyResultLegendItems = [
    { label: 'Win', symbol: 'W' },
    { label: 'Loss', symbol: 'L' },
    { label: 'Tie', symbol: 'T' },
  ];

  return (
    <div className="space-y-6 w-full">
        <Card className="overflow-visible">
        <CardHeader className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex-1">
                <CardTitle className="flex items-center gap-2"><CalendarDays className="text-primary h-6 w-6" /> {seasonData?.seasonData?.year || selectedSeason} Season Detail</CardTitle>
                {seasonData?.seasonData && (<CardDescription className="mt-1.5">Champion: {seasonData.seasonData.championName}{seasonData.seasonData.runnerUp && `, Runner-up: ${seasonData.seasonData.runnerUp}`}{seasonData.seasonData.teams && `. Teams: ${seasonData.seasonData.teams}`}</CardDescription>)}
            </div>
            <Select value={selectedSeason} onValueChange={setSelectedSeason}><SelectTrigger className="w-full sm:w-[220px] shrink-0"><SelectValue placeholder="Select a season" /></SelectTrigger><SelectContent>{mockSeasonsForTabs.map(s => (<SelectItem key={s.id} value={s.id}>{s.year} Season</SelectItem>))}</SelectContent></Select>
        </CardHeader>
          
        {loading && (<CardContent className="pt-6 space-y-4"><Skeleton className="h-8 w-1/2 mb-2" /><Skeleton className="h-6 w-3/4 mb-4" /><div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-2 mb-4">{[...Array(5)].map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}</div>{[...Array(3)].map((_, i) => (<div key={i} className="space-y-2 mt-6"><Skeleton className="h-6 w-1/3 mb-2" /><Skeleton className="h-40 w-full" /></div>))}</CardContent>)}
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
                <Card><CardHeader><CardTitle className="flex items-center text-xl"><Trophy className="mr-2 h-5 w-5 text-primary"/>Season Standings</CardTitle></CardHeader><CardContent className="overflow-x-auto">
                    {seasonData.standingsData && seasonData.standingsData.length > 0 ? (<Table><TableHeader><TableRow><TableHead className="w-[60px] text-center">POS</TableHead><TableHead>TEAM</TableHead><TableHead>OWNER</TableHead><TableHead className="text-center">W</TableHead><TableHead className="text-center">L</TableHead><TableHead className="text-right">PF</TableHead><TableHead className="text-right">PA</TableHead><TableHead className="text-center">LAST 5</TableHead></TableRow></TableHeader><TableBody>{seasonData.standingsData.map((s) => (<TableRow key={s.owner_name}><TableCell className="font-medium text-center">{s.regular_season_finish}</TableCell><TableCell>{s.wt_team_name}</TableCell><TableCell>{s.owner_name}</TableCell><TableCell className="text-center">{s.regular_season_wins}</TableCell><TableCell className="text-center">{s.regular_season_losses}</TableCell><TableCell className="text-right">{s.regular_season_points_for?.toFixed(1) ?? 'N/A'}</TableCell><TableCell className="text-right">{s.regular_season_points_against?.toFixed(1) ?? 'N/A'}</TableCell><TableCell className="text-center"><div className="flex justify-center space-x-1">{Array.isArray(s.lastFive) && s.lastFive.map((r, i) => (<span key={i} className={cn("h-3 w-3 rounded-full inline-block", r === 1 ? "bg-green-500" : r === 0 ? "bg-red-500" : "bg-gray-300")} title={r === 1 ? 'W' : r === 0 ? 'L' : 'T'}></span>))}</div></TableCell></TableRow>))}</TableBody></Table>
                    ) : (<p className="text-muted-foreground text-center py-4">No standings data available.</p>)}
                </CardContent></Card>
                <Card><CardHeader><CardTitle className="flex items-center text-xl"><Trophy className="mr-2 h-5 w-5 text-primary"/>Playoff Bracket</CardTitle></CardHeader><CardContent>
                    {seasonData.playoffData && (seasonData.playoffData.semiFinals?.length > 0 || seasonData.playoffData.championship?.length > 0) ? (<div className="space-y-6">
                        {seasonData.playoffData.quarterFinals?.length > 0 && (<div><h4 className="text-lg font-semibold mb-2 text-center text-foreground/80">Quarterfinals</h4><div className="grid md:grid-cols-2 gap-4">{seasonData.playoffData.quarterFinals.map((m, i) => (<PlayoffMatchupCard key={`qf-${i}`} matchup={m} roundName={`Quarterfinal ${i + 1}`} />))}</div></div>)}
                        {seasonData.playoffData.semiFinals?.length > 0 && (<div><h4 className="text-lg font-semibold mb-2 mt-4 text-center text-foreground/80">Semifinals</h4><div className="grid md:grid-cols-2 gap-4">{seasonData.playoffData.semiFinals.map((m, i) => (<PlayoffMatchupCard key={`sf-${i}`} matchup={m} roundName={`Semifinal ${i + 1}`} />))}</div></div>)}
                        {seasonData.playoffData.championship?.length > 0 && (<div className="mt-4"><h4 className="text-lg font-semibold mb-2 text-center text-foreground/80">Championship</h4><div className="max-w-md mx-auto">{seasonData.playoffData.championship.map((m, i) => (<PlayoffMatchupCard key={`champ-${i}`} matchup={m} roundName="Championship Game" isChampionship />))}</div><div className="text-center mt-4"><p className="text-lg font-semibold">League Champion:</p><p className="text-xl text-primary font-bold flex items-center justify-center"><Trophy className="mr-2 h-6 w-6 text-yellow-500" />{seasonData.seasonData.championName}</p></div></div>)}
                    </div>) : (<p className="text-muted-foreground text-center py-4">No playoff data available.</p>)}
                </CardContent></Card>
              </TabsContent>

              <TabsContent value="weekly_performance" className="pt-4 space-y-4">
                <Card><CardHeader className="flex flex-col sm:flex-row items-center justify-between"><CardTitle className="flex items-center text-xl"><BarChart2 className="mr-2 h-5 w-5 text-primary" />Weekly Performance</CardTitle><RadioGroup value={weeklyScoresDisplayMode} onValueChange={(v) => setWeeklyScoresDisplayMode(v as 'scores' | 'results')} className="flex items-center space-x-2 mt-3 sm:mt-0"><div className="flex items-center space-x-1"><RadioGroupItem value="scores" id="scores-mode-radio" /><Label htmlFor="scores-mode-radio">Scores</Label></div><div className="flex items-center space-x-1"><RadioGroupItem value="results" id="results-mode-radio" /><Label htmlFor="results-mode-radio">W/L</Label></div></RadioGroup></CardHeader><CardContent>
                    {seasonData.weeklyScoresData && seasonData.weeklyScoresData.teams?.length > 0 ? (<><div className="overflow-x-auto"><Table className="min-w-full table-fixed"><TableHeader><TableRow><TableHead className="sticky left-0 bg-card dark:bg-background z-10 w-1/6 min-w-[150px] p-0.5"><div className="p-1.5 text-xs rounded-md font-semibold truncate">TEAM</div></TableHead>{seasonData.weeklyScoresData.scores.map((_, i) => (<TableHead key={`wk-h-${i}`} className="text-center min-w-[60px] p-1.5 font-semibold">{`W${i + 1}`}</TableHead>))}<TableHead className="text-center min-w-[70px] p-1.5 font-semibold">AVG</TableHead></TableRow></TableHeader><TableBody>{seasonData.weeklyScoresData.teams.map((teamName, teamIndex) => (<TableRow key={teamName}><TableCell className="sticky left-0 bg-card dark:bg-background z-10 font-medium truncate p-0.5"><div className="p-1.5 text-xs rounded-md truncate">{teamName}</div></TableCell>{seasonData.weeklyScoresData!.scores.map((weekScores, weekIndex) => {
                        const score = weekScores[teamIndex];
                        const result = seasonData.weeklyScoresData!.results[weekIndex][teamIndex];
                        let content, classes = "p-1.5 text-xs rounded-md w-full h-full flex items-center justify-center";
                        if (weeklyScoresDisplayMode === 'scores') { content = score?.toFixed(1) ?? '-'; classes = cn(classes, getScoreCellClass(score)); }
                        else {
                            if (result === 'W') { content = <span className="font-semibold">W</span>; classes = cn(classes, "bg-green-100 text-green-700 dark:bg-green-800/30 dark:text-green-300 font-semibold"); }
                            else if (result === 'L') { content = <span className="font-semibold">L</span>; classes = cn(classes, "bg-red-100 text-red-700 dark:bg-red-800/30 dark:text-red-300 font-semibold"); }
                            else if (result === 'T') { content = <span className="font-semibold">T</span>; classes = cn(classes, "bg-gray-100 text-gray-700 dark:bg-gray-700/30 dark:text-gray-300 font-semibold"); }
                            else { content = '-'; classes = cn(classes, "bg-muted/30 text-muted-foreground dark:bg-muted/50"); }
                        }
                        return (<TableCell key={`wk-${weekIndex}-t-${teamIndex}`} className="p-0.5"><div className={classes}>{content}</div></TableCell>);
                    })}<TableCell className="p-0.5"><div className={cn("p-1.5 text-center text-xs rounded-md font-semibold", getScoreCellClass(averageScores[teamName]))}>{averageScores[teamName]?.toFixed(1) ?? 'N/A'}</div></TableCell></TableRow>))}</TableBody></Table></div>
                    <div className="mt-4 flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-xs">
                        {(weeklyScoresDisplayMode === 'scores' ? weeklyScoreLegendItems : weeklyResultLegendItems).map(item => (
                            <div key={item.label} className="flex items-center gap-1.5">
                                <span className={cn("h-3 w-5 rounded-sm", (item as any).className?.split(' ').find((c:string) => c.startsWith('bg-')) || "bg-gray-200")}>{(item as any).symbol}</span>
                                <span>{item.label}</span>
                            </div>
                        ))}
                    </div></>) : (<p className="text-muted-foreground text-center py-4">No weekly scores data available.</p>)}
                </CardContent></Card>
              </TabsContent>

              <TabsContent value="strength_of_schedule" className="pt-4"><Card><CardHeader><CardTitle className="flex items-center"><LineChartIconRecharts className="mr-2 h-5 w-5 text-primary"/>Strength of Schedule</CardTitle><CardDescription>Analysis of schedule difficulty based on opponents' average points.</CardDescription></CardHeader><CardContent className="overflow-x-auto">
                    {seasonData.strengthOfScheduleData && seasonData.strengthOfScheduleData.length > 0 ? (<><Table><TableHeader><TableRow><TableHead>RANK</TableHead><TableHead>TEAM</TableHead><TableHead>OWNER</TableHead><TableHead className="text-right">OPP PPG</TableHead><TableHead className="text-right">LG AVG</TableHead><TableHead className="text-right">DIFF</TableHead><TableHead className="text-center">RATING</TableHead></TableRow></TableHeader><TableBody>{seasonData.strengthOfScheduleData.map((sos) => (<TableRow key={sos.owner}><TableCell>{sos.rank}</TableCell><TableCell>{sos.team}</TableCell><TableCell>{sos.owner}</TableCell><TableCell className="text-right">{sos.actualOpponentsPpg?.toFixed(1) ?? 'N/A'}</TableCell><TableCell className="text-right">{sos.leagueAvgPpg?.toFixed(1) ?? 'N/A'}</TableCell><TableCell className={cn("text-right font-semibold", sos.differential != null && sos.differential > 0 ? 'text-red-600' : 'text-green-600')}>{sos.differential != null ? (sos.differential > 0 ? '+' : '') + sos.differential.toFixed(1) : 'N/A'}</TableCell><TableCell className="text-center"><Badge variant="outline" className={cn("text-xs", getRatingBadgeClass(sos.rating))}>{sos.rating || '-'}</Badge></TableCell></TableRow>))}</TableBody></Table><p className="text-xs text-muted-foreground mt-4">Positive diff indicates a tougher schedule. Ranked hardest to easiest.</p></>) : (<p className="text-muted-foreground text-center py-4">SOS data not available.</p>)}
              </CardContent></Card></TabsContent>

              <TabsContent value="waiver_pickups" className="pt-4"><Card><CardHeader><CardTitle className="flex items-center"><ClipboardList className="mr-2 h-5 w-5 text-primary"/>Best Waiver Wire Pickups</CardTitle></CardHeader><CardContent className="overflow-x-auto">
                    {seasonData.waiverPickupsData && seasonData.waiverPickupsData.length > 0 ? (<><Table><TableHeader><TableRow><TableHead>#</TableHead><TableHead>Player</TableHead><TableHead>POS</TableHead><TableHead>Team</TableHead>{selectedSeason && parseInt(selectedSeason) >= 2019 && <><TableHead>Picked Up By</TableHead><TableHead>Week</TableHead></>}<TableHead className="text-right">Total Points</TableHead></TableRow></TableHeader><TableBody>{seasonData.waiverPickupsData.map((p, i) => (<TableRow key={`${p.player}-${i}`}><TableCell>{p.rank ?? i + 1}</TableCell><TableCell>{p.player}</TableCell><TableCell><Badge variant="outline" className={cn("text-xs font-semibold", getPositionBadgeClass(p.position))}>{p.position}</Badge></TableCell><TableCell>{p.team}</TableCell>{selectedSeason && parseInt(selectedSeason) >= 2019 && <><TableCell>{p.pickedUpBy ?? '-'}</TableCell><TableCell>{p.week ?? '-'}</TableCell></>}<TableCell className="text-right">{p.totalPoints?.toFixed(1) ?? '-'}</TableCell></TableRow>))}</TableBody></Table><p className="text-xs text-muted-foreground mt-4">Top pickups based on points scored after acquisition.</p></>) : (<p className="text-muted-foreground text-center py-4">Waiver data not available.</p>)}
              </CardContent></Card></TabsContent>

              <TabsContent value="top_performers" className="pt-4 space-y-6">
                <Card><CardHeader><CardTitle className="flex items-center text-lg"><BarChart2 className="mr-2 h-5 w-5 text-primary" />Top Performers by Position</CardTitle></CardHeader><CardContent>
                    {seasonData.topPerformersData && Object.keys(seasonData.topPerformersData).length > 0 ? (<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">{Object.entries(seasonData.topPerformersData).map(([pos, players]) => (Array.isArray(players) && players.length > 0 ? (<div key={pos} className="rounded-lg border bg-card p-4"><div className="flex items-center gap-2 mb-3"><span className={cn("h-3 w-3 rounded-sm", getPositionBadgeClass(pos).split(' ').find(c => c.startsWith('bg-')))}></span><h4 className="font-semibold">{getPositionName(pos)}</h4></div><div className="space-y-1 text-sm">{players.slice(0, 5).map((p: TopPerformerPlayer, i: number) => (<div key={`${pos}-${i}-${p.player}`} className="flex justify-between items-center py-1.5 border-b last:border-b-0"><div className="flex items-center gap-1.5"><span className="mr-1.5 font-medium">{i + 1}.</span><span>{p.player} ({p.fantasyTeam || p.team})</span></div><span className="font-medium">{p.totalPoints?.toFixed(1) ?? 'N/A'}</span></div>))}</div></div>) : null))}</div>
                    ) : (<p className="text-muted-foreground text-center py-4">No top performer data available.</p>)}
                </CardContent></Card>
                {seasonData.bestOverallGamesData && seasonData.bestOverallGamesData.length > 0 && (<Card><CardHeader><CardTitle className="flex items-center text-lg"><Zap className="mr-2 h-5 w-5 text-primary" />Best Single-Game Performances</CardTitle></CardHeader><CardContent className="overflow-x-auto"><Table><TableHeader><TableRow><TableHead>RANK</TableHead><TableHead>PLAYER</TableHead><TableHead>POS</TableHead><TableHead>TEAM</TableHead><TableHead>FANTASY TEAM</TableHead><TableHead className="text-center">WEEK</TableHead><TableHead className="text-right">POINTS</TableHead></TableRow></TableHeader><TableBody>{seasonData.bestOverallGamesData.map((g) => (<TableRow key={g.rank}><TableCell>{g.rank}</TableCell><TableCell>{g.player}</TableCell><TableCell><Badge variant="outline" className={cn("text-xs font-semibold", getPositionBadgeClass(g.position))}>{g.position}</Badge></TableCell><TableCell>{g.team}</TableCell><TableCell>{g.fantasyTeam || '-'}</TableCell><TableCell className="text-center">{g.week}</TableCell><TableCell className="text-right">{g.points?.toFixed(1) ?? 'N/A'}</TableCell></TableRow>))}</TableBody></Table></CardContent></Card>)}
              </TabsContent>

            </Tabs>
          </CardContent>
        )}
      </Card>
    </div>
  );
};