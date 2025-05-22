
"use client";
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import type { GM, H2HComparisonData, H2HMatchupDetail } from '@/lib/types';
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
  const [comparisonData, setComparisonData] = useState<H2HComparisonData | null>(null);
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

    // Ensure IDs are sorted for consistent filename (e.g., 1_vs_2 not 2_vs_1)
    const ids = [parseInt(gm1Id), parseInt(gm2Id)].sort((a, b) => a - b);
    const filePath = `/data/h2h_data/h2h_${ids[0]}_vs_${ids[1]}.json`;
    
    console.log(`[H2HPage] Fetching ${filePath}`);

    try {
      const response = await fetch(filePath);
      if (!response.ok) {
        const errorText = await response.text();
        console.error("[H2HPage] Fetch failed:", response.status, errorText);
        throw new Error(`Failed to fetch H2H data: ${response.status} ${response.statusText}. File: ${filePath}.`);
      }
      const data: H2HComparisonData = await response.json();
      console.log("[H2HPage] Fetched H2H data:", data);

      // Ensure gm1Id in data matches the selected gm1Id (or gm2Id if swapped)
      if (data.gm1Id === gm1Id) {
        setComparisonData(data);
      } else if (data.gm2Id === gm1Id) {
        // Swap data if gm1 in file is actually gm2 selected by user
        setComparisonData({
          ...data,
          gm1Id: data.gm2Id,
          gm1Name: data.gm2Name,
          gm2Id: data.gm1Id,
          gm2Name: data.gm1Name,
          overallRecord: {
            gm1Wins: data.overallRecord.gm2Wins,
            gm2Wins: data.overallRecord.gm1Wins,
            ties: data.overallRecord.ties,
          },
          pointsRecord: {
            gm1TotalPoints: data.pointsRecord.gm2TotalPoints,
            gm2TotalPoints: data.pointsRecord.gm1TotalPoints,
          },
          matchups: data.matchups.map(m => ({
            ...m,
            gm1Score: m.gm2Score,
            gm2Score: m.gm1Score,
            winnerId: m.winnerId === data.gm1Id ? data.gm2Id : (m.winnerId === data.gm2Id ? data.gm1Id : null)
          })),
          playoffMeetings: data.playoffMeetings?.map(pm => ({
            ...pm,
            // Winner logic might need more robust handling if winnerName isn't simply swapped
            winnerId: pm.winnerId === data.gm1Id ? data.gm2Id : (pm.winnerId === data.gm2Id ? data.gm1Id : null)
          }))
        });
      } else {
         setComparisonData(data); // Default if no direct match, UI will use names from file
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

  const selectedGm1 = mockGms.find(gm => gm.id === gm1Id);
  const selectedGm2 = mockGms.find(gm => gm.id === gm2Id);

  const chartData = comparisonData?.matchups.map((m, index) => ({
    name: `S${m.seasonYear} W${m.week}`,
    [comparisonData.gm1Name]: m.gm1Score,
    [comparisonData.gm2Name]: m.gm2Score,
  })) || [];

  const getMatchupResultIcon = (matchup: H2HMatchupDetail, perspectiveGmId: string) => {
    if (!matchup.winnerId) return <span className="text-muted-foreground font-semibold">T</span>;
    if (matchup.winnerId === perspectiveGmId) return <CheckCircle2 className="text-green-500 h-5 w-5" />;
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

      {!loading && comparisonData && selectedGm1 && selectedGm2 && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Rivalry Dashboard: {comparisonData.gm1Name} vs {comparisonData.gm2Name}</CardTitle>
            </CardHeader>
            <CardContent className="grid md:grid-cols-3 gap-6 text-center">
              <div className="p-4 bg-muted/50 rounded-lg">
                <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Overall Record</h3>
                <p className="text-3xl font-bold">{comparisonData.gm1Name}: {comparisonData.overallRecord.gm1Wins}</p>
                <p className="text-3xl font-bold">{comparisonData.gm2Name}: {comparisonData.overallRecord.gm2Wins}</p>
                <p className="text-xl text-muted-foreground">Ties: {comparisonData.overallRecord.ties}</p>
              </div>
              <div className="p-4 bg-muted/50 rounded-lg">
                <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Total Points Scored</h3>
                <p className="text-3xl font-bold">{comparisonData.gm1Name}: {comparisonData.pointsRecord.gm1TotalPoints.toFixed(1)}</p>
                <p className="text-3xl font-bold">{comparisonData.gm2Name}: {comparisonData.pointsRecord.gm2TotalPoints.toFixed(1)}</p>
              </div>
               <div className="p-4 bg-muted/50 rounded-lg">
                <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Avg Points Difference</h3>
                <p className="text-3xl font-bold">
                  {comparisonData.gm1Name} {((comparisonData.pointsRecord.gm1TotalPoints - comparisonData.pointsRecord.gm2TotalPoints) / (comparisonData.overallRecord.gm1Wins + comparisonData.overallRecord.gm2Wins + comparisonData.overallRecord.ties || 1)).toFixed(1)}
                </p>
                 <p className="text-xs text-muted-foreground">per game vs {comparisonData.gm2Name}</p>
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
                  <Line type="monotone" dataKey={comparisonData.gm1Name} stroke="hsl(var(--primary))" activeDot={{ r: 8 }} />
                  <Line type="monotone" dataKey={comparisonData.gm2Name} stroke="hsl(var(--accent))" activeDot={{ r: 8 }} />
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
                    <TableHead className="text-right">{comparisonData.gm1Name}'s Score</TableHead>
                    <TableHead className="text-right">{comparisonData.gm2Name}'s Score</TableHead>
                    <TableHead className="text-center">Result for {comparisonData.gm1Name}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {comparisonData.matchups.sort((a,b) => b.seasonYear - a.seasonYear || (typeof a.week === 'number' && typeof b.week === 'number' ? a.week - b.week : String(a.week).localeCompare(String(b.week)))).map((matchup, index) => (
                    <TableRow key={index}>
                      <TableCell>{matchup.seasonYear}</TableCell>
                      <TableCell>{matchup.week}</TableCell>
                      <TableCell className={cn("text-right font-semibold", matchup.gm1Score > matchup.gm2Score ? 'text-green-600' : matchup.gm1Score < matchup.gm2Score ? 'text-red-600': '')}>{matchup.gm1Score.toFixed(1)}</TableCell>
                      <TableCell className={cn("text-right font-semibold", matchup.gm2Score > matchup.gm1Score ? 'text-green-600' : matchup.gm2Score < matchup.gm1Score ? 'text-red-600': '')}>{matchup.gm2Score.toFixed(1)}</TableCell>
                      <TableCell className="text-center">{getMatchupResultIcon(matchup, comparisonData.gm1Id)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
          
          {comparisonData.playoffMeetings && comparisonData.playoffMeetings.length > 0 && (
             <Card>
                <CardHeader><CardTitle>Playoff Meeting Highlights</CardTitle></CardHeader>
                <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Season</TableHead>
                          <TableHead>Round</TableHead>
                          <TableHead>{comparisonData.gm1Name}</TableHead>
                          <TableHead>{comparisonData.gm2Name}</TableHead>
                          <TableHead>Winner</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {comparisonData.playoffMeetings.map((meeting, index) => (
                           <TableRow key={`playoff-${index}`}>
                             <TableCell>{meeting.seasonYear}</TableCell>
                             <TableCell>{meeting.round}</TableCell>
                             <TableCell className={cn(meeting.gm1Score > meeting.gm2Score ? 'font-bold text-green-600' : '')}>{meeting.gm1Score.toFixed(1)}</TableCell>
                             <TableCell className={cn(meeting.gm2Score > meeting.gm1Score ? 'font-bold text-green-600' : '')}>{meeting.gm2Score.toFixed(1)}</TableCell>
                             <TableCell className="font-semibold">{meeting.winnerId === meeting.gm1Id ? meeting.gm1Name : meeting.gm2Name}</TableCell>
                           </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                </CardContent>
            </Card>
          )}
        </div>
      )}
       {!loading && !comparisonData && gm1Id && gm2Id && gm1Id !== gm2Id && !error &&(
        <Card>
            <CardContent className="pt-6 text-center text-muted-foreground">
                <p>No H2H comparison data found for {selectedGm1?.name} and {selectedGm2?.name}.</p>
                <p>Ensure a file named `h2h_{Math.min(parseInt(gm1Id), parseInt(gm2Id))}_vs_{Math.max(parseInt(gm1Id), parseInt(gm2Id))}.json` exists in `public/data/h2h_data/`.</p>
                 <p className="text-xs mt-2">Example: For Jack (ID 1) vs Josh (ID 2), the file should be `h2h_1_vs_2.json`.</p>
            </CardContent>
        </Card>
      )}
    </div>
  );
}
