
"use client";
import { useRouter } from 'next/router';
import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import type { GM, H2HRivalryData, H2HMatchupTimelineEntry, H2HPlayoffMeetingDetail, ExtremeMatchupInfo, H2HOwnerInfo } from '@/lib/types';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend as RechartsLegend, ResponsiveContainer, DotProps } from 'recharts';
import { Users, CheckCircle2, XCircle, Trophy, ArrowUpDown, BarChart2, CalendarDays, Info } from 'lucide-react';
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { Separator } from '@/components/ui/separator';
import { fetcher } from '@/lib/fetcher'; 

// Using the same mockGms as draft-history for consistency in IDs
const mockGms: GM[] = [
  { id: "1", name: "Jack" }, { id: "2", name: "Josh" }, { id: "3", name: "Jake" }, { id: "4", name: "Mark" }, { id: "5", name: "Sean" }, { id: "6", name: "Nick" }, { id: "7", name: "Will" }, { id: "8", name: "Zach" }, { id: "9", name: "Lac" }, { id: "11", name: "Chris" }, { id: "12", name: "Dylan" }, { id: "13", name: "Dan" }, { id: "14", name: "Fitz" }
];

type SortDirection = 'asc' | 'desc';
interface MatchupSortConfig {
  key: keyof H2HMatchupTimelineEntry | 'margin' | 'owner1_team_name' | 'owner2_team_name' | 'winner_name' | 'is_playoff_display' | 'is_championship_display' | null;
  direction: SortDirection;
}

const CustomizedDot = (props: DotProps & { payload?: H2HMatchupTimelineEntry }) => {
  const { cx, cy, stroke, fill, r, payload } = props;

  if (payload?.is_championship_matchup) {
    return <Trophy x={(cx ?? 0) - 8} y={(cy ?? 0) - 8} width={16} height={16} className="text-yellow-500 fill-yellow-400" />;
  }
  if (payload?.is_playoff_matchup) {
    return <circle cx={cx} cy={cy} r={(r ?? 3) + 3} strokeWidth={1} className="stroke-accent fill-accent" />;
  }
  return <circle cx={cx} cy={cy} r={r} stroke={stroke} fill={fill} />;
};

const CustomTooltip = ({ active, payload, label, gm1Name, gm2Name }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload as H2HMatchupTimelineEntry & { margin: number, winnerName: string };
    const isChampionship = data.is_championship_matchup;
    const isPlayoff = data.is_playoff_matchup;

    return (
      <div className="p-3 bg-popover text-popover-foreground shadow-md rounded-lg border">
        <p className="font-semibold text-sm mb-1">{`Matchup: ${data.season_id} - ${data.fantasy_week}`}</p>
        <Separator className="my-1" />
        <p className="text-xs"><span className="font-medium">{data.owner1_team_name || gm1Name}:</span> {data.owner1_score?.toFixed(1)}</p>
        <p className="text-xs"><span className="font-medium">{data.owner2_team_name || gm2Name}:</span> {data.owner2_score?.toFixed(1)}</p>
        {data.winnerName && <p className="text-xs mt-1"><span className="font-medium">Winner:</span> {data.winnerName}</p>}
        {data.margin !== undefined && <p className="text-xs"><span className="font-medium">Margin:</span> {data.margin.toFixed(1)}</p>}
        {(isPlayoff || isChampionship) &&
          <p className={cn("text-xs font-semibold mt-1", isChampionship ? "text-yellow-500" : "text-accent")}>
            {isChampionship ? "Championship Game" : "Playoff Game"}
          </p>}
      </div>
    );
  }
  return null;
};


export default function H2HPage() {
  const [gm1Id, setGm1Id] = useState<string | undefined>();
  const [gm2Id, setGm2Id] = useState<string | undefined>();
  const [comparisonData, setComparisonData] = useState<H2HRivalryData | null>(null);
  const [displayedGm1Name, setDisplayedGm1Name] = useState<string>("GM 1");
  const [displayedGm2Name, setDisplayedGm2Name] = useState<string>("GM 2");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sortConfig, setSortConfig] = useState<MatchupSortConfig>({ key: 'season_id', direction: 'desc' });


  const { closestMatchupDetail, largestBlowoutDetail } = useMemo(() => {
    if (!comparisonData?.matchup_timeline || comparisonData.matchup_timeline.length === 0) {
      return { closestMatchupDetail: null, largestBlowoutDetail: null };
    }

    let closest: ExtremeMatchupInfo | null = null;
    let largest: ExtremeMatchupInfo | null = null;

    comparisonData.matchup_timeline.forEach(m => {
      const margin = Math.abs(m.owner1_score - m.owner2_score);
      let winnerName = 'Tie';
      if (comparisonData.owner1_info && comparisonData.owner2_info) {
         if (m.winner_owner_id === comparisonData.owner1_info.owner_id) {
          winnerName = comparisonData.owner1_info.owner_name;
        } else if (m.winner_owner_id === comparisonData.owner2_info.owner_id) {
          winnerName = comparisonData.owner2_info.owner_name;
        }
      }


      const currentMatchupInfo: ExtremeMatchupInfo = {
        margin,
        winnerName,
        season: m.season_id,
        week: m.fantasy_week,
        gm1Score: m.owner1_score,
        gm2Score: m.owner2_score,
      };

      if (closest === null || margin < closest.margin) {
        closest = currentMatchupInfo;
      }
      if (largest === null || margin > largest.margin) {
        largest = currentMatchupInfo;
      }
    });
    return { closestMatchupDetail: closest, largestBlowoutDetail: largest };
  }, [comparisonData]);


  useEffect(() => {
    const selectedGm1 = mockGms.find(gm => gm.id === gm1Id);
    const selectedGm2 = mockGms.find(gm => gm.id === gm2Id);

    setDisplayedGm1Name(selectedGm1?.name || "GM 1");
    setDisplayedGm2Name(selectedGm2?.name || "GM 2");

    if (gm1Id && gm2Id) {
      if (gm1Id === gm2Id) {
        setError("Please select two different GMs.");
        setComparisonData(null);
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);
      setComparisonData(null); // Clear previous data before fetching new

      const numGm1Id = parseInt(gm1Id);
      const numGm2Id = parseInt(gm2Id);
      const ids = [numGm1Id, numGm2Id].sort((a, b) => a - b);
      const filePath = `/data/h2h/comparison_${ids[0]}_vs_${ids[1]}.json`;
      console.log(`[H2HPage] Fetching ${filePath}`);

      //
// >>> REPLACE THE ENTIRE fetchData FUNCTION WITH THIS <<<
//
      const fetchData = async () => {
        try {
          const data: H2HRivalryData = await fetcher(filePath);
          console.log("[H2HPage] Fetched H2H data:", data);

          // Case 1: The data is already in the correct order (GM1 is owner1)
          if (data.owner1_info.owner_id.toString() === gm1Id) {
            setComparisonData(data);
            setDisplayedGm1Name(data.owner1_info.owner_name);
            setDisplayedGm2Name(data.owner2_info.owner_name);
          } 
          // Case 2: The data is in the reverse order (GM1 is owner2), so we must swap everything.
          else if (data.owner2_info.owner_id.toString() === gm1Id) {
            setDisplayedGm1Name(data.owner2_info.owner_name);
            setDisplayedGm2Name(data.owner1_info.owner_name);

            // **THIS IS THE CORRECTED PART**
            // We now build the *complete* swapped object before setting the state.
            const swappedData: H2HRivalryData = {
              owner1_info: data.owner2_info,
              owner2_info: data.owner1_info,
              rivalry_summary: {
                ...data.rivalry_summary,
                owner1_wins: data.rivalry_summary.owner2_wins,
                owner2_wins: data.rivalry_summary.owner1_wins,
                owner1_total_points_scored_in_h2h: data.rivalry_summary.owner2_total_points_scored_in_h2h,
                owner2_total_points_scored_in_h2h: data.rivalry_summary.owner1_total_points_scored_in_h2h,
                owner1_average_score_in_h2h: data.rivalry_summary.owner2_average_score_in_h2h,
                owner2_average_score_in_h2h: data.rivalry_summary.owner1_average_score_in_h2h,
                average_margin_of_victory_owner1: data.rivalry_summary.average_margin_of_victory_owner2,
                average_margin_of_victory_owner2: data.rivalry_summary.average_margin_of_victory_owner1,
              },
              matchup_timeline: data.matchup_timeline.map(m => ({
                ...m,
                owner1_score: m.owner2_score,
                owner2_score: m.owner1_score,
                owner1_team_name: m.owner2_team_name,
                owner2_team_name: m.owner1_team_name,
              })),
              playoff_meetings: {
                ...data.playoff_meetings,
                owner1_playoff_wins: data.playoff_meetings.owner2_playoff_wins,
                owner2_playoff_wins: data.playoff_meetings.owner1_playoff_wins,
                matchups_details: data.playoff_meetings.matchups_details.map(pm => ({
                    ...pm,
                    owner1_score: pm.owner2_score,
                    owner2_score: pm.owner1_score,
                }))
              }
            };
            setComparisonData(swappedData);
          } 
          // Case 3: Fallback if IDs don't match (your original logic)
          else {
            console.warn("[H2HPage] Fetched data owner IDs do not match selected GM IDs directly. Displaying as is.");
            setComparisonData(data);
            setDisplayedGm1Name(data.owner1_info.owner_name);
            setDisplayedGm2Name(data.owner2_info.owner_name);
          }
        } catch (err) {
          console.error("[H2HPage] Error in fetchData:", err);
          if (err instanceof Error && err.message.includes("Status: 404")) {
            console.warn(`[H2HPage] Data file not found for this matchup. Assuming no H2H history.`);
            setError(null);
            setComparisonData(null);
          } else {
            setError(err instanceof Error ? err.message : "An unknown error occurred.");
            setComparisonData(null);
          }
        } finally {
          setLoading(false);
        }
      };
      fetchData();
    } else {
      setComparisonData(null);
      setError(null);
      setLoading(false);
    }
  }, [gm1Id, gm2Id]);


  const chartData = useMemo(() => {
    if (!comparisonData?.matchup_timeline) return [];
    return comparisonData.matchup_timeline
      .sort((a, b) => a.season_id - b.season_id || (typeof a.nfl_week === 'number' && typeof b.nfl_week === 'number' ? a.nfl_week - b.nfl_week : String(a.nfl_week).localeCompare(String(b.nfl_week))))
      .map((m) => {
        const margin = Math.abs(m.owner1_score - m.owner2_score);
        let winnerName = 'Tie';
        if (comparisonData.owner1_info && comparisonData.owner2_info) {
            if (m.winner_owner_id === comparisonData.owner1_info.owner_id) {
                winnerName = comparisonData.owner1_info.owner_name;
            } else if (m.winner_owner_id === comparisonData.owner2_info.owner_id) {
                winnerName = comparisonData.owner2_info.owner_name;
            }
        }
        return {
            ...m,
            name: `S${m.season_id} W${m.fantasy_week}`,
            [displayedGm1Name]: m.owner1_score,
            [displayedGm2Name]: m.owner2_score,
            margin,
            winnerName,
        }
    });
  }, [comparisonData, displayedGm1Name, displayedGm2Name]);


  const requestSort = (key: MatchupSortConfig['key']) => {
    let direction: SortDirection = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const getWinnerName = (winnerId: number | null, gm1Info?: H2HOwnerInfo, gm2Info?: H2HOwnerInfo): string => {
    if (!gm1Info || !gm2Info) return "N/A";
    if (winnerId === null) return "Tie";
    if (winnerId === gm1Info.owner_id) return gm1Info.owner_name;
    if (winnerId === gm2Info.owner_id) return gm2Info.owner_name;
    return "Unknown";
  };

  const sortedMatchupTimeline = useMemo(() => {
    if (!comparisonData?.matchup_timeline || !comparisonData.owner1_info || !comparisonData.owner2_info) return [];
    let sortableItems = comparisonData.matchup_timeline.map(m => ({
        ...m,
        margin: Math.abs(m.owner1_score - m.owner2_score),
        winner_name: getWinnerName(m.winner_owner_id, comparisonData.owner1_info, comparisonData.owner2_info),
        is_playoff_display: m.is_playoff_matchup ? 'Yes' : 'No',
        is_championship_display: m.is_championship_matchup ? 'Yes' : 'No',
    }));

    if (sortConfig.key) {
      sortableItems.sort((a, b) => {
        let valA = a[sortConfig.key as keyof typeof a];
        let valB = b[sortConfig.key as keyof typeof b];

        if (valA === null || valA === undefined) return 1;
        if (valB === null || valB === undefined) return -1;

        let comparison = 0;
        if (typeof valA === 'number' && typeof valB === 'number') {
          comparison = valA - valB;
        } else {
          comparison = String(valA).localeCompare(String(valB));
        }
        return sortConfig.direction === 'asc' ? comparison : -comparison;
      });
    }
    return sortableItems;
  }, [comparisonData, sortConfig]);

  const getSortIcon = (columnKey: MatchupSortConfig['key']) => {
    if (sortConfig.key === columnKey) {
      return <ArrowUpDown className="ml-1 h-3 w-3 shrink-0 opacity-50 group-hover:opacity-100 transition-opacity" />;
    }
    return <ArrowUpDown className="ml-1 h-3 w-3 shrink-0 opacity-0 group-hover:opacity-50 transition-opacity" />;
  };


  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Users /> Head-to-Head Comparison</CardTitle>
          <CardDescription>Select two GMs to compare their historical rivalry.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col sm:flex-row gap-4 items-end">
          <div className="flex-1 space-y-1 w-full sm:w-auto">
            <label htmlFor="gm1-select" className="text-sm font-medium">GM 1</label>
            <Select value={gm1Id} onValueChange={setGm1Id}>
              <SelectTrigger id="gm1-select">
                <SelectValue placeholder="Select GM 1" />
              </SelectTrigger>
              <SelectContent>
                {mockGms.map(gm => (
                  <SelectItem key={gm.id} value={gm.id} disabled={gm.id === gm2Id}>{gm.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="text-2xl font-bold px-2 hidden sm:block self-center">VS</div>
          <div className="flex-1 space-y-1 w-full sm:w-auto">
            <label htmlFor="gm2-select" className="text-sm font-medium">GM 2</label>
            <Select value={gm2Id} onValueChange={setGm2Id}>
              <SelectTrigger id="gm2-select">
                <SelectValue placeholder="Select GM 2" />
              </SelectTrigger>
              <SelectContent>
                {mockGms.map(gm => (
                  <SelectItem key={gm.id} value={gm.id} disabled={gm.id === gm1Id}>{gm.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
        {error && !loading && (
            <CardContent><p className="text-destructive text-center py-2">{error}</p></CardContent>
        )}
      </Card>

      {loading && (
        <div className="space-y-6">
          <Skeleton className="h-64 w-full" />
          <Skeleton className="h-80 w-full" />
          <Skeleton className="h-72 w-full" />
        </div>
      )}

      {!loading && !error && !comparisonData && gm1Id && gm2Id && gm1Id !== gm2Id && (
        <Card>
            <CardContent className="pt-6 text-center text-muted-foreground">
                <Info className="mx-auto h-12 w-12 text-primary mb-4" />
                <p className="font-semibold">No H2H comparison data found for {displayedGm1Name} and {displayedGm2Name}.</p>
            </CardContent>
        </Card>
      )}

      {!loading && !error && comparisonData && (
        <div className="space-y-8">
          <Card className="bg-card shadow-lg">
            <CardHeader className="pb-4">
              <CardTitle className="text-3xl text-center font-bold tracking-tight">
                {displayedGm1Name} <span className="text-primary mx-1">VS</span> {displayedGm2Name}: A Head-to-Head History
              </CardTitle>
            </CardHeader>
            <CardContent className="grid md:grid-cols-2 gap-x-8 gap-y-6 items-start">
              <div className="text-center p-4 border border-border rounded-lg bg-muted/30 shadow-sm">
                <h3 className="text-2xl font-semibold text-primary mb-3">{displayedGm1Name}</h3>
                <p className="text-4xl font-bold mb-1">{comparisonData.rivalry_summary.owner1_wins} <span className="text-xl font-medium">WINS</span>
                  {comparisonData.rivalry_summary.owner1_wins > comparisonData.rivalry_summary.owner2_wins && (
                    <Trophy className="inline ml-2 h-7 w-7 text-yellow-500" />
                  )}
                </p>
                <div className="w-full h-3 bg-primary/20 rounded-full overflow-hidden my-3">
                  <div
                    className="h-full bg-primary"
                    style={{ width: `${(comparisonData.rivalry_summary.owner1_wins / (comparisonData.rivalry_summary.total_matchups || 1)) * 100}%`}}
                  ></div>
                </div>
                <p className="text-sm"><span className="font-medium text-muted-foreground">Total H2H Pts:</span> {comparisonData.rivalry_summary.owner1_total_points_scored_in_h2h.toFixed(1)}</p>
                <p className="text-sm"><span className="font-medium text-muted-foreground">Avg H2H Score:</span> {comparisonData.rivalry_summary.owner1_average_score_in_h2h.toFixed(1)}</p>
                <p className="text-sm"><span className="font-medium text-muted-foreground">Avg Win Margin:</span> {comparisonData.rivalry_summary.average_margin_of_victory_owner1?.toFixed(1) ?? 'N/A'} pts</p>
              </div>

              <div className="text-center p-4 border border-border rounded-lg bg-muted/30 shadow-sm">
                <h3 className="text-2xl font-semibold text-primary mb-3">{displayedGm2Name}</h3>
                 <p className="text-4xl font-bold mb-1">{comparisonData.rivalry_summary.owner2_wins} <span className="text-xl font-medium">WINS</span>
                  {comparisonData.rivalry_summary.owner2_wins > comparisonData.rivalry_summary.owner1_wins && (
                    <Trophy className="inline ml-2 h-7 w-7 text-yellow-500" />
                  )}
                </p>
                 <div className="w-full h-3 bg-accent/20 rounded-full overflow-hidden my-3">
                  <div
                    className="h-full bg-accent"
                    style={{ width: `${(comparisonData.rivalry_summary.owner2_wins / (comparisonData.rivalry_summary.total_matchups || 1)) * 100}%`}}
                  ></div>
                </div>
                <p className="text-sm"><span className="font-medium text-muted-foreground">Total H2H Pts:</span> {comparisonData.rivalry_summary.owner2_total_points_scored_in_h2h.toFixed(1)}</p>
                <p className="text-sm"><span className="font-medium text-muted-foreground">Avg H2H Score:</span> {comparisonData.rivalry_summary.owner2_average_score_in_h2h.toFixed(1)}</p>
                <p className="text-sm"><span className="font-medium text-muted-foreground">Avg Win Margin:</span> {comparisonData.rivalry_summary.average_margin_of_victory_owner2?.toFixed(1) ?? 'N/A'} pts</p>
              </div>
            </CardContent>
            <CardFooter className="flex flex-col items-center text-center text-sm text-muted-foreground pt-6 space-y-2">
                <p><span className="font-semibold text-foreground">Total Matchups:</span> {comparisonData.rivalry_summary.total_matchups}
                   {comparisonData.rivalry_summary.ties > 0 && `, Ties: ${comparisonData.rivalry_summary.ties}`}
                </p>
                {closestMatchupDetail && (
                    <p><span className="font-semibold text-foreground">Closest Matchup:</span> {closestMatchupDetail.margin.toFixed(1)} pts
                    (Winner: {closestMatchupDetail.winnerName}, {closestMatchupDetail.season} Wk {closestMatchupDetail.week})</p>
                )}
                {largestBlowoutDetail && (
                    <p><span className="font-semibold text-foreground">Largest Blowout:</span> {largestBlowoutDetail.margin.toFixed(1)} pts
                    (Winner: {largestBlowoutDetail.winnerName}, {largestBlowoutDetail.season} Wk {largestBlowoutDetail.week})</p>
                )}
            </CardFooter>
          </Card>


          <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2"><BarChart2 /> Matchup Timeline: The Story of the Scores</CardTitle>
                <CardDescription>Scores of each manager in every head-to-head matchup over time.</CardDescription>
            </CardHeader>
            <CardContent className="h-[400px] pt-6">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }}/>
                  <RechartsTooltip content={<CustomTooltip gm1Name={displayedGm1Name} gm2Name={displayedGm2Name} />} />
                  <RechartsLegend />
                  <Line type="monotone" dataKey={displayedGm1Name} stroke="hsl(var(--primary))" strokeWidth={2} activeDot={{ r: 6 }} dot={<CustomizedDot />} />
                  <Line type="monotone" dataKey={displayedGm2Name} stroke="hsl(var(--accent))" strokeWidth={2} activeDot={{ r: 6 }} dot={<CustomizedDot />} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2"><Trophy /> Playoff Showdowns</CardTitle>
                <CardDescription>High-stakes playoff encounters between {displayedGm1Name} and {displayedGm2Name}.</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center p-4 bg-muted/30 rounded-lg mb-6">
                    <div>
                        <p className="text-sm text-muted-foreground">{displayedGm1Name} Playoff Wins</p>
                        <p className="text-3xl font-bold">{comparisonData.playoff_meetings.owner1_playoff_wins}</p>
                    </div>
                    <div>
                        <p className="text-sm text-muted-foreground">{displayedGm2Name} Playoff Wins</p>
                        <p className="text-3xl font-bold">{comparisonData.playoff_meetings.owner2_playoff_wins}</p>
                    </div>
                    <div>
                        <p className="text-sm text-muted-foreground">Total Playoff Matchups</p>
                        <p className="text-3xl font-bold">{comparisonData.playoff_meetings.total_playoff_matchups}</p>
                    </div>
                </div>
                {comparisonData.playoff_meetings.matchups_details && comparisonData.playoff_meetings.matchups_details.length > 0 ? (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Season</TableHead>
                          <TableHead>Round</TableHead>
                          <TableHead className="text-left">{displayedGm1Name}'s Score</TableHead> 
                          <TableHead className="text-left">{displayedGm2Name}'s Score</TableHead> 
                          <TableHead>Winner</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {comparisonData.playoff_meetings.matchups_details.map((meeting, index) => {
                           const roundDescription = meeting.matchup_type || meeting.fantasy_week;
                           const isChampionshipGame = roundDescription.toLowerCase().includes('championship');
                           return (
                           <TableRow key={`playoff-detail-${index}-${meeting.season_id}-${meeting.fantasy_week}`} className={cn(isChampionshipGame && "bg-yellow-100/50 dark:bg-yellow-800/20")}>
                             <TableCell>{meeting.season_id}</TableCell>
                             <TableCell className="font-medium">
                                {roundDescription}
                                {isChampionshipGame && <Trophy className="inline ml-2 h-4 w-4 text-yellow-500" />}
                             </TableCell>
                             <TableCell className={cn("text-left font-semibold", meeting.owner1_score > meeting.owner2_score ? 'text-green-600' : '')}>{meeting.owner1_score.toFixed(1)}</TableCell> 
                             <TableCell className={cn("text-left font-semibold", meeting.owner2_score > meeting.owner1_score ? 'text-green-600' : '')}>{meeting.owner2_score.toFixed(1)}</TableCell> 
                             <TableCell className="font-semibold">
                                {getWinnerName(meeting.winner_owner_id, comparisonData.owner1_info, comparisonData.owner2_info)}
                             </TableCell>
                           </TableRow>
                           );
                        })}
                      </TableBody>
                    </Table>
                ) : (
                    <p className="text-center text-muted-foreground mt-4">No detailed playoff matchup data available for these GMs.</p>
                )}
            </CardContent>
        </Card>

          <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2"><CalendarDays /> Full Matchup History</CardTitle>
                <CardDescription>Every H2H game played between {displayedGm1Name} and {displayedGm2Name}.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead><Button variant="ghost" size="sm" onClick={() => requestSort('season_id')} className="px-1 group text-xs justify-start">Season {getSortIcon('season_id')}</Button></TableHead>
                      <TableHead><Button variant="ghost" size="sm" onClick={() => requestSort('fantasy_week')} className="px-1 group text-xs justify-start">Week {getSortIcon('fantasy_week')}</Button></TableHead>
                      <TableHead><Button variant="ghost" size="sm" onClick={() => requestSort('owner1_team_name')} className="px-1 group text-xs justify-start">{displayedGm1Name}'s Team {getSortIcon('owner1_team_name')}</Button></TableHead>
                      <TableHead><Button variant="ghost" size="sm" onClick={() => requestSort('owner1_score')} className="px-1 group justify-start w-full text-xs">{displayedGm1Name}'s Score {getSortIcon('owner1_score')}</Button></TableHead>
                      <TableHead><Button variant="ghost" size="sm" onClick={() => requestSort('owner2_score')} className="px-1 group justify-start w-full text-xs">{displayedGm2Name}'s Score {getSortIcon('owner2_score')}</Button></TableHead>
                      <TableHead><Button variant="ghost" size="sm" onClick={() => requestSort('owner2_team_name')} className="px-1 group text-xs justify-start">{displayedGm2Name}'s Team {getSortIcon('owner2_team_name')}</Button></TableHead>
                      <TableHead className="text-left"><Button variant="ghost" size="sm" onClick={() => requestSort('winner_name')} className="px-1 group text-xs justify-start">Winner {getSortIcon('winner_name')}</Button></TableHead>
                      <TableHead><Button variant="ghost" size="sm" onClick={() => requestSort('margin')} className="px-1 group justify-start w-full text-xs">Margin {getSortIcon('margin')}</Button></TableHead>
                      <TableHead className="text-left"><Button variant="ghost" size="sm" onClick={() => requestSort('is_playoff_display')} className="px-1 group text-xs justify-start">Playoff {getSortIcon('is_playoff_display')}</Button></TableHead>
                      <TableHead className="text-left"><Button variant="ghost" size="sm" onClick={() => requestSort('is_championship_display')} className="px-1 group text-xs justify-start">Championship {getSortIcon('is_championship_display')}</Button></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sortedMatchupTimeline.map((matchup, index) => (
                        <TableRow key={matchup.matchup_id || index}>
                          <TableCell className="text-xs text-left">{matchup.season_id}</TableCell>
                          <TableCell className="text-xs text-left">{matchup.fantasy_week}</TableCell>
                          <TableCell className="text-xs text-left truncate max-w-[100px]">{matchup.owner1_team_name}</TableCell>
                          <TableCell className={cn("text-left font-semibold text-xs", matchup.owner1_score > matchup.owner2_score ? 'text-green-600' : matchup.owner1_score < matchup.owner2_score ? 'text-red-600' : '')}>{matchup.owner1_score.toFixed(1)}</TableCell>
                          <TableCell className={cn("text-left font-semibold text-xs", matchup.owner2_score > matchup.owner1_score ? 'text-green-600' : matchup.owner2_score < matchup.owner1_score ? 'text-red-600' : '')}>{matchup.owner2_score.toFixed(1)}</TableCell>
                          <TableCell className="text-xs text-left truncate max-w-[100px]">{matchup.owner2_team_name}</TableCell>
                          <TableCell className="text-left text-xs font-medium">{getWinnerName(matchup.winner_owner_id, comparisonData.owner1_info, comparisonData.owner2_info)}</TableCell>
                          <TableCell className="text-left text-xs">{matchup.margin.toFixed(1)}</TableCell>
                          <TableCell className="text-left text-xs">{matchup.is_playoff_matchup ? <CheckCircle2 className="h-4 w-4 text-green-500" /> : <XCircle className="h-4 w-4 text-muted-foreground" />}</TableCell>
                          <TableCell className="text-left text-xs">{matchup.is_championship_matchup ? <Trophy className="h-4 w-4 text-yellow-500" /> : <XCircle className="h-4 w-4 text-muted-foreground" />}</TableCell>
                        </TableRow>
                      )
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>

        </div>
      )}
    </div>
  );
}