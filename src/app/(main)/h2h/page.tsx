
"use client";
import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import type { GM, H2HRivalryData, H2HMatchupTimelineEntry } from '@/lib/types';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend as RechartsLegend, ResponsiveContainer } from 'recharts';
import { Users, CheckCircle2, XCircle } from 'lucide-react';
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { cn } from '@/lib/utils';

// Using the same mockGms as draft-history for consistency in IDs
const mockGms: GM[] = [
  { id: "1", name: "Jack" }, { id: "2", name: "Josh" }, { id: "3", name: "Jake" }, { id: "4", name: "Mark" }, { id: "5", name: "Sean" }, { id: "6", name: "Nick" }, { id: "7", name: "Will" }, { id: "8", name: "Zach" }, { id: "9", name: "Lac" }, { id: "11", name: "Chris" }, { id: "12", name: "Dylan" }, { id: "13", name: "Dan" }, { id: "14", name: "Fitz" }
];

export default function H2HPage() {
  const [gm1Id, setGm1Id] = useState<string | undefined>();
  const [gm2Id, setGm2Id] = useState<string | undefined>();
  const [comparisonData, setComparisonData] = useState<H2HRivalryData | null>(null);
  const [displayedGm1Name, setDisplayedGm1Name] = useState<string>("GM 1");
  const [displayedGm2Name, setDisplayedGm2Name] = useState<string>("GM 2");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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


    // Ensure IDs are sorted for consistent filename (e.g., 1_vs_2 not 2_vs_1)
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

      // Check if the fetched data needs to be swapped based on user selection
      if (data.owner1_info.owner_id.toString() === gm1Id) {
        setComparisonData(data);
        setDisplayedGm1Name(data.owner1_info.owner_name);
        setDisplayedGm2Name(data.owner2_info.owner_name);
      } else if (data.owner2_info.owner_id.toString() === gm1Id) {
        // User selected GM2 as their GM1, so we need to swap the data for display
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
            // Scores are owner1_score vs owner2_score, so swap them
            owner1_score: m.owner2_score,
            owner2_score: m.owner1_score,
            // Winner ID remains the same as it's absolute
          })),
          playoff_meetings: { // Also swap playoff meeting summary if needed
            ...data.playoff_meetings,
            owner1_playoff_wins: data.playoff_meetings.owner2_playoff_wins,
            owner2_playoff_wins: data.playoff_meetings.owner1_playoff_wins,
            matchups_details: data.playoff_meetings.matchups_details.map(pm => ({
                ...pm,
                owner1_score: pm.owner2_score,
                owner2_score: pm.owner1_score,
            }))
          }
        });
      } else {
        // Fallback if IDs don't match, should ideally not happen with sorted filenames
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
    if (!comparisonData) return [];
    return comparisonData.matchup_timeline.map((m) => ({
      name: `S${m.season_id} W${m.fantasy_week}`,
      [displayedGm1Name]: m.owner1_score,
      [displayedGm2Name]: m.owner2_score,
    }));
  }, [comparisonData, displayedGm1Name, displayedGm2Name]);

  const getMatchupResultIcon = (matchup: H2HMatchupTimelineEntry, perspectiveGmId: number) => {
    if (matchup.winner_owner_id === null) return <span className="text-muted-foreground font-semibold">T</span>;
    if (matchup.winner_owner_id === perspectiveGmId) return <CheckCircle2 className="text-green-500 h-5 w-5" />;
    return <XCircle className="text-red-500 h-5 w-5" />;
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
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-72 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      )}

      {!loading && comparisonData && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Rivalry Dashboard: {displayedGm1Name} vs {displayedGm2Name}</CardTitle>
            </CardHeader>
            <CardContent className="grid md:grid-cols-3 gap-6 text-center">
              <div className="p-4 bg-muted/50 rounded-lg">
                <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Overall Record</h3>
                <p className="text-3xl font-bold">{displayedGm1Name}: {comparisonData.rivalry_summary.owner1_wins}</p>
                <p className="text-3xl font-bold">{displayedGm2Name}: {comparisonData.rivalry_summary.owner2_wins}</p>
                <p className="text-xl text-muted-foreground">Ties: {comparisonData.rivalry_summary.ties}</p>
              </div>
              <div className="p-4 bg-muted/50 rounded-lg">
                <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Total Points Scored</h3>
                <p className="text-3xl font-bold">{displayedGm1Name}: {comparisonData.rivalry_summary.owner1_total_points_scored_in_h2h.toFixed(1)}</p>
                <p className="text-3xl font-bold">{displayedGm2Name}: {comparisonData.rivalry_summary.owner2_total_points_scored_in_h2h.toFixed(1)}</p>
              </div>
               <div className="p-4 bg-muted/50 rounded-lg">
                <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Avg Points Difference</h3>
                <p className="text-3xl font-bold">
                  {displayedGm1Name} {(comparisonData.rivalry_summary.owner1_average_score_in_h2h - comparisonData.rivalry_summary.owner2_average_score_in_h2h).toFixed(1)}
                </p>
                 <p className="text-xs text-muted-foreground">per game vs {displayedGm2Name}</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Scoring Trends Over Time</CardTitle></CardHeader>
            <CardContent className="h-[350px] pt-6">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <RechartsLegend />
                  <Line type="monotone" dataKey={displayedGm1Name} stroke="hsl(var(--primary))" activeDot={{ r: 8 }} />
                  <Line type="monotone" dataKey={displayedGm2Name} stroke="hsl(var(--accent))" activeDot={{ r: 8 }} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Matchup History</CardTitle></CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Season</TableHead>
                    <TableHead>Week</TableHead>
                    <TableHead className="text-right">{displayedGm1Name}'s Score</TableHead>
                    <TableHead className="text-right">{displayedGm2Name}'s Score</TableHead>
                    <TableHead className="text-center">Result for {displayedGm1Name}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {comparisonData.matchup_timeline.sort((a,b) => b.season_id - a.season_id || (typeof a.fantasy_week === 'number' && typeof b.fantasy_week === 'number' ? Number(a.fantasy_week) - Number(b.fantasy_week) : String(a.fantasy_week).localeCompare(String(b.fantasy_week)))).map((matchup, index) => (
                    <TableRow key={index}>
                      <TableCell>{matchup.season_id}</TableCell>
                      <TableCell>{matchup.fantasy_week}</TableCell>
                      <TableCell className={cn("text-right font-semibold", matchup.owner1_score > matchup.owner2_score ? 'text-green-600' : matchup.owner1_score < matchup.owner2_score ? 'text-red-600': '')}>{matchup.owner1_score.toFixed(1)}</TableCell>
                      <TableCell className={cn("text-right font-semibold", matchup.owner2_score > matchup.owner1_score ? 'text-green-600' : matchup.owner2_score < matchup.owner1_score ? 'text-red-600': '')}>{matchup.owner2_score.toFixed(1)}</TableCell>
                      <TableCell className="text-center">{getMatchupResultIcon(matchup, comparisonData.owner1_info.owner_id)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
          
          {comparisonData.playoff_meetings && comparisonData.playoff_meetings.total_playoff_matchups > 0 && (
             <Card>
                <CardHeader><CardTitle>Playoff Meeting Summary</CardTitle></CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center p-4 bg-muted/50 rounded-lg">
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
                        <Table className="mt-4">
                          <TableHeader>
                            <TableRow>
                              <TableHead>Season</TableHead>
                              <TableHead>Round</TableHead>
                              <TableHead>{displayedGm1Name}</TableHead>
                              <TableHead>{displayedGm2Name}</TableHead>
                              <TableHead>Winner</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {comparisonData.playoff_meetings.matchups_details.map((meeting, index) => (
                               <TableRow key={`playoff-detail-${index}`}>
                                 <TableCell>{meeting.season_id}</TableCell>
                                 <TableCell>{meeting.fantasy_week}</TableCell>
                                 <TableCell className={cn(meeting.owner1_score > meeting.owner2_score ? 'font-bold text-green-600' : '')}>{meeting.owner1_score.toFixed(1)}</TableCell>
                                 <TableCell className={cn(meeting.owner2_score > meeting.owner1_score ? 'font-bold text-green-600' : '')}>{meeting.owner2_score.toFixed(1)}</TableCell>
                                 <TableCell className="font-semibold">
                                    {meeting.winner_owner_id === comparisonData.owner1_info.owner_id ? displayedGm1Name : 
                                     meeting.winner_owner_id === comparisonData.owner2_info.owner_id ? displayedGm2Name : 'Tie/Unknown'}
                                 </TableCell>
                               </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                    ) : (
                        <p className="text-center text-muted-foreground mt-4">No detailed playoff matchup data available.</p>
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
