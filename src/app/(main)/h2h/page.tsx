
"use client";
import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import type { GM, H2HRivalryData, H2HMatchupTimelineEntry, H2HPlayoffMeetingDetail } from '@/lib/types';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend as RechartsLegend, ResponsiveContainer, DotProps } from 'recharts';
import { Users, CheckCircle2, XCircle, Trophy, ArrowUpDown } from 'lucide-react';
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { cn } from '@/lib/utils';

// Using the same mockGms as draft-history for consistency in IDs
const mockGms: GM[] = [
  { id: "1", name: "Jack" }, { id: "2", name: "Josh" }, { id: "3", name: "Jake" }, { id: "4", name: "Mark" }, { id: "5", name: "Sean" }, { id: "6", name: "Nick" }, { id: "7", name: "Will" }, { id: "8", name: "Zach" }, { id: "9", name: "Lac" }, { id: "11", name: "Chris" }, { id: "12", name: "Dylan" }, { id: "13", name: "Dan" }, { id: "14", name: "Fitz" }
];

type SortDirection = 'asc' | 'desc';
interface MatchupSortConfig {
  key: keyof H2HMatchupTimelineEntry | 'margin' | null;
  direction: SortDirection;
}

const CustomizedDot = (props: DotProps & { isPlayoff?: boolean, isChampionship?: boolean }) => {
  const { cx, cy, stroke, fill, r, isPlayoff, isChampionship } = props;

  if (isChampionship) {
    return <Trophy x={(cx ?? 0) - 8} y={(cy ?? 0) - 8} width={16} height={16} className="text-yellow-500 fill-yellow-400" />;
  }
  if (isPlayoff) {
    return <circle cx={cx} cy={cy} r={(r ?? 3) + 3} stroke="hsl(var(--accent))" fill="hsl(var(--accent))" strokeWidth={1} />;
  }
  return <circle cx={cx} cy={cy} r={r} stroke={stroke} fill={fill} />;
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


  const handleCompare = async () => {
    if (!gm1Id || !gm2Id) {
      setError("Please select two GMs.");
      return;
    }
    if (gm1Id === gm2Id) {
      setError("Please select two different GMs.");
      return;
    }

    setLoading(true);
    setError(null);
    setComparisonData(null);

    const selectedGm1 = mockGms.find(gm => gm.id === gm1Id);
    const selectedGm2 = mockGms.find(gm => gm.id === gm2Id);

    setDisplayedGm1Name(selectedGm1?.name || "GM 1");
    setDisplayedGm2Name(selectedGm2?.name || "GM 2");

    const ids = [parseInt(gm1Id), parseInt(gm2Id)].sort((a, b) => a - b);
    const filePath = `/data/h2h/comparison_${ids[0]}_vs_${ids[1]}.json`;
    
    console.log(`[H2HPage] Fetching ${filePath}`);

    try {
      const response = await fetch(filePath);
      if (!response.ok) {
        const errorText = await response.text();
        console.error("[H2HPage] Fetch failed:", response.status, errorText);
        throw new Error(`Failed to fetch H2H data: ${response.status} ${response.statusText}. File: ${filePath}.`);
      }
      const data: H2HRivalryData = await response.json();
      console.log("[H2HPage] Fetched H2H data:", data);

      if (data.owner1_info.owner_id.toString() === gm1Id) {
        setComparisonData(data);
        setDisplayedGm1Name(data.owner1_info.owner_name);
        setDisplayedGm2Name(data.owner2_info.owner_name);
      } else if (data.owner2_info.owner_id.toString() === gm1Id) {
        setDisplayedGm1Name(data.owner2_info.owner_name);
        setDisplayedGm2Name(data.owner1_info.owner_name);
        setComparisonData({
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
          })),
          playoff_meetings: { 
            ...data.playoff_meetings,
            owner1_playoff_wins: data.playoff_meetings.owner2_playoff_wins,
            owner2_playoff_wins: data.playoff_meetings.owner1_playoff_wins,
            matchups_details: data.playoff_meetings.matchups_details.map(pm => ({
                ...pm,
                owner1_score: pm.owner2_score,
                owner2_score: pm.owner1_score,
                 winner_owner_id: pm.winner_owner_id, // Winner ID remains absolute
            }))
          }
        });
      } else {
        console.warn("[H2HPage] Fetched data owner IDs do not match selected GM IDs directly. Displaying as is.");
        setComparisonData(data);
        setDisplayedGm1Name(data.owner1_info.owner_name);
        setDisplayedGm2Name(data.owner2_info.owner_name);
      }

    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("An unknown error occurred while fetching H2H data.");
      }
      console.error("[H2HPage] Error in handleCompare:", err);
      setComparisonData(null);
    } finally {
      setLoading(false);
    }
  };

  const chartData = useMemo(() => {
    if (!comparisonData?.matchup_timeline) return [];
    return comparisonData.matchup_timeline
      .sort((a, b) => a.season_id - b.season_id || (typeof a.fantasy_week === 'number' && typeof b.fantasy_week === 'number' ? a.fantasy_week - b.fantasy_week : String(a.fantasy_week).localeCompare(String(b.fantasy_week))))
      .map((m, index) => ({
        name: `S${m.season_id} W${m.fantasy_week}`,
        [displayedGm1Name]: m.owner1_score,
        [displayedGm2Name]: m.owner2_score,
        isPlayoff: m.is_playoff_matchup || String(m.fantasy_week).toLowerCase().includes('round') || String(m.fantasy_week).toLowerCase().includes('playoff'),
        isChampionship: m.is_championship_matchup || String(m.fantasy_week).toLowerCase().includes('championship'),
    }));
  }, [comparisonData, displayedGm1Name, displayedGm2Name]);

  const getMatchupResultIcon = (matchup: H2HMatchupTimelineEntry, perspectiveGmId: string | number) => {
    if (matchup.winner_owner_id === null) return <span className="text-muted-foreground font-semibold">T</span>;
    if (matchup.winner_owner_id.toString() === perspectiveGmId.toString()) return <CheckCircle2 className="text-green-500 h-5 w-5" />;
    return <XCircle className="text-red-500 h-5 w-5" />;
  };

  const requestSort = (key: keyof H2HMatchupTimelineEntry | 'margin') => {
    let direction: SortDirection = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const sortedMatchupTimeline = useMemo(() => {
    if (!comparisonData?.matchup_timeline) return [];
    let sortableItems = [...comparisonData.matchup_timeline];
    if (sortConfig.key) {
      sortableItems.sort((a, b) => {
        let valA, valB;
        if (sortConfig.key === 'margin') {
          valA = Math.abs(a.owner1_score - a.owner2_score);
          valB = Math.abs(b.owner1_score - b.owner2_score);
        } else {
          valA = a[sortConfig.key as keyof H2HMatchupTimelineEntry];
          valB = b[sortConfig.key as keyof H2HMatchupTimelineEntry];
        }

        if (valA === null || valA === undefined) return 1;
        if (valB === null || valB === undefined) return -1;

        if (typeof valA === 'number' && typeof valB === 'number') {
          return sortConfig.direction === 'asc' ? valA - valB : valB - valA;
        }
        return sortConfig.direction === 'asc' 
          ? String(valA).localeCompare(String(valB)) 
          : String(valB).localeCompare(String(valA));
      });
    }
    return sortableItems;
  }, [comparisonData?.matchup_timeline, sortConfig]);
  
  const getSortIcon = (columnKey: keyof H2HMatchupTimelineEntry | 'margin') => {
    if (sortConfig.key === columnKey) {
      return <ArrowUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50 group-hover:opacity-100 transition-opacity" />;
    }
    return <ArrowUpDown className="ml-2 h-4 w-4 shrink-0 opacity-0 group-hover:opacity-50 transition-opacity" />;
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
          <Button onClick={handleCompare} disabled={loading || !gm1Id || !gm2Id} className="w-full sm:w-auto">
            {loading ? "Comparing..." : "Compare"}
          </Button>
        </CardContent>
        {error && <CardContent><p className="text-destructive text-center">{error}</p></CardContent>}
      </Card>

      {loading && (
        <div className="space-y-6">
          <Skeleton className="h-48 w-full" />
          <Skeleton className="h-72 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      )}

      {!loading && comparisonData && (
        <div className="space-y-6">
          {/* Tale of the Tape Banner */}
          <Card className="bg-muted/30">
            <CardHeader>
              <CardTitle className="text-2xl text-center font-bold tracking-tight">
                {displayedGm1Name} <span className="text-primary mx-1">VS</span> {displayedGm2Name} - Tale of the Tape
              </CardTitle>
            </CardHeader>
            <CardContent className="grid md:grid-cols-2 gap-6 items-start">
              {/* GM 1 Column */}
              <div className="text-center p-4 border rounded-lg bg-card shadow">
                <h3 className="text-xl font-semibold text-primary mb-2">{displayedGm1Name}</h3>
                <div className="flex items-center justify-center mb-1">
                  <p className="text-3xl font-bold">{comparisonData.rivalry_summary.owner1_wins}</p>
                  <span className="text-lg ml-2">Wins</span>
                  {comparisonData.rivalry_summary.owner1_wins > comparisonData.rivalry_summary.owner2_wins && (
                    <Trophy className="ml-2 h-6 w-6 text-yellow-500" />
                  )}
                </div>
                <div className="w-full h-4 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden my-2">
                  <div 
                    className="h-full bg-green-500" 
                    style={{ width: `${(comparisonData.rivalry_summary.owner1_wins / comparisonData.rivalry_summary.total_matchups) * 100}%`}}
                  ></div>
                </div>
                <p className="text-sm"><span className="font-medium">Total H2H Pts:</span> {comparisonData.rivalry_summary.owner1_total_points_scored_in_h2h.toFixed(1)}</p>
                <p className="text-sm"><span className="font-medium">Avg H2H Score:</span> {comparisonData.rivalry_summary.owner1_average_score_in_h2h.toFixed(1)}</p>
              </div>

              {/* GM 2 Column */}
              <div className="text-center p-4 border rounded-lg bg-card shadow">
                <h3 className="text-xl font-semibold text-primary mb-2">{displayedGm2Name}</h3>
                <div className="flex items-center justify-center mb-1">
                  <p className="text-3xl font-bold">{comparisonData.rivalry_summary.owner2_wins}</p>
                  <span className="text-lg ml-2">Wins</span>
                  {comparisonData.rivalry_summary.owner2_wins > comparisonData.rivalry_summary.owner1_wins && (
                    <Trophy className="ml-2 h-6 w-6 text-yellow-500" />
                  )}
                </div>
                 <div className="w-full h-4 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden my-2">
                  <div 
                    className="h-full bg-red-500" 
                    style={{ width: `${(comparisonData.rivalry_summary.owner2_wins / comparisonData.rivalry_summary.total_matchups) * 100}%`}}
                  ></div>
                </div>
                <p className="text-sm"><span className="font-medium">Total H2H Pts:</span> {comparisonData.rivalry_summary.owner2_total_points_scored_in_h2h.toFixed(1)}</p>
                <p className="text-sm"><span className="font-medium">Avg H2H Score:</span> {comparisonData.rivalry_summary.owner2_average_score_in_h2h.toFixed(1)}</p>
              </div>
            </CardContent>
             <CardFooter className="text-center text-sm text-muted-foreground pt-4">
                Total H2H Matchups: {comparisonData.rivalry_summary.total_matchups}
                {comparisonData.rivalry_summary.ties > 0 && `, Ties: ${comparisonData.rivalry_summary.ties}`}
            </CardFooter>
          </Card>


          <Card>
            <CardHeader><CardTitle>Scoring Trends Over Time</CardTitle><CardDescription>Matchup: Season - Week</CardDescription></CardHeader>
            <CardContent className="h-[350px] pt-6">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <RechartsTooltip contentStyle={{ backgroundColor: 'hsl(var(--background))', border: '1px solid hsl(var(--border))' }} itemStyle={{ color: 'hsl(var(--foreground))' }} />
                  <RechartsLegend />
                  <Line type="monotone" dataKey={displayedGm1Name} stroke="hsl(var(--primary))" activeDot={{ r: 8 }} dot={<CustomizedDot />} />
                  <Line type="monotone" dataKey={displayedGm2Name} stroke="hsl(var(--accent))" activeDot={{ r: 8 }} dot={<CustomizedDot />} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Detailed Matchup Log</CardTitle></CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead><Button variant="ghost" onClick={() => requestSort('season_id')} className="px-1 group">Season {getSortIcon('season_id')}</Button></TableHead>
                    <TableHead><Button variant="ghost" onClick={() => requestSort('fantasy_week')} className="px-1 group">Week {getSortIcon('fantasy_week')}</Button></TableHead>
                    <TableHead className="text-right"><Button variant="ghost" onClick={() => requestSort('owner1_score')} className="px-1 group justify-end w-full">{displayedGm1Name}'s Score {getSortIcon('owner1_score')}</Button></TableHead>
                    <TableHead className="text-right"><Button variant="ghost" onClick={() => requestSort('owner2_score')} className="px-1 group justify-end w-full">{displayedGm2Name}'s Score {getSortIcon('owner2_score')}</Button></TableHead>
                    <TableHead className="text-center">Result for {displayedGm1Name}</TableHead>
                    <TableHead className="text-right"><Button variant="ghost" onClick={() => requestSort('margin')} className="px-1 group justify-end w-full">Margin {getSortIcon('margin')}</Button></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sortedMatchupTimeline.map((matchup, index) => {
                    const margin = Math.abs(matchup.owner1_score - matchup.owner2_score);
                    return (
                      <TableRow key={matchup.matchup_id || index}>
                        <TableCell>{matchup.season_id}</TableCell>
                        <TableCell>{matchup.fantasy_week}</TableCell>
                        <TableCell className={cn("text-right font-semibold", matchup.owner1_score > matchup.owner2_score ? 'text-green-600 font-bold' : matchup.owner1_score < matchup.owner2_score ? 'text-red-600' : '')}>{matchup.owner1_score.toFixed(1)}</TableCell>
                        <TableCell className={cn("text-right font-semibold", matchup.owner2_score > matchup.owner1_score ? 'text-green-600 font-bold' : matchup.owner2_score < matchup.owner1_score ? 'text-red-600' : '')}>{matchup.owner2_score.toFixed(1)}</TableCell>
                        <TableCell className="text-center">{getMatchupResultIcon(matchup, comparisonData.owner1_info.owner_id.toString())}</TableCell>
                        <TableCell className="text-right">{margin.toFixed(1)}</TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
          
          {comparisonData.playoff_meetings && (
             <Card>
                <CardHeader><CardTitle>Playoff Encounters</CardTitle></CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center p-4 bg-muted/50 rounded-lg mb-4">
                        <div>
                            <p className="text-sm text-muted-foreground">{displayedGm1Name} Playoff Wins</p>
                            <p className="text-2xl font-bold">{comparisonData.playoff_meetings.owner1_playoff_wins}</p>
                        </div>
                        <div>
                            <p className="text-sm text-muted-foreground">{displayedGm2Name} Playoff Wins</p>
                            <p className="text-2xl font-bold">{comparisonData.playoff_meetings.owner2_playoff_wins}</p>
                        </div>
                        <div>
                            <p className="text-sm text-muted-foreground">Total Playoff Matchups</p>
                            <p className="text-2xl font-bold">{comparisonData.playoff_meetings.total_playoff_matchups}</p>
                        </div>
                    </div>
                    {comparisonData.playoff_meetings.matchups_details && comparisonData.playoff_meetings.matchups_details.length > 0 ? (
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Season</TableHead>
                              <TableHead>Round</TableHead>
                              <TableHead className="text-right">{displayedGm1Name}'s Score</TableHead>
                              <TableHead className="text-right">{displayedGm2Name}'s Score</TableHead>
                              <TableHead>Winner</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {comparisonData.playoff_meetings.matchups_details.map((meeting, index) => (
                               <TableRow key={`playoff-detail-${index}`}>
                                 <TableCell>{meeting.season_id}</TableCell>
                                 <TableCell>{meeting.fantasy_week}</TableCell>
                                 <TableCell className={cn("text-right", meeting.owner1_score > meeting.owner2_score ? 'font-bold text-green-600' : '')}>{meeting.owner1_score.toFixed(1)}</TableCell>
                                 <TableCell className={cn("text-right", meeting.owner2_score > meeting.owner1_score ? 'font-bold text-green-600' : '')}>{meeting.owner2_score.toFixed(1)}</TableCell>
                                 <TableCell className="font-semibold">
                                    {meeting.winner_owner_id === comparisonData.owner1_info.owner_id ? displayedGm1Name : 
                                     meeting.winner_owner_id === comparisonData.owner2_info.owner_id ? displayedGm2Name : 
                                     meeting.winner_owner_id === null ? 'Tie' : 'Unknown'}
                                 </TableCell>
                               </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                    ) : (
                        <p className="text-center text-muted-foreground mt-4">No detailed playoff matchup data available for these GMs.</p>
                    )}
                </CardContent>
            </Card>
          )}
        </div>
      )}
       {!loading && !comparisonData && gm1Id && gm2Id && gm1Id !== gm2Id && !error &&(
        <Card>
            <CardContent className="pt-6 text-center text-muted-foreground">
                <p>No H2H comparison data found for {mockGms.find(gm => gm.id === gm1Id)?.name} and {mockGms.find(gm => gm.id === gm2Id)?.name}.</p>
                <p>Ensure a file named `comparison_{Math.min(parseInt(gm1Id), parseInt(gm2Id))}_vs_{Math.max(parseInt(gm1Id), parseInt(gm2Id))}.json` exists in `public/data/h2h/`.</p>
                 <p className="text-xs mt-2">Example: For Jack (ID 1) vs Josh (ID 2), the file should be `comparison_1_vs_2.json`.</p>
            </CardContent>
        </Card>
      )}
    </div>
  );
}
