
"use client";
import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import type { Season, GM, SeasonDraftData, GMDraftHistoryData, GMDraftSeasonPerformance } from '@/lib/types';
import { BarChart3 } from 'lucide-react'; // Added for overview title

// Mock Data for Season View and GM View (as existing)
const mockSeasons: Season[] = [
  { id: "2023", year: 2023 }, { id: "2022", year: 2022 }, { id: "2021", year: 2021 }
];
const mockGms: GM[] = [
  { id: "gm1", name: "Alice" }, { id: "gm2", name: "Bob" }, { id: "gm3", name: "Charlie" }
];

const mockSeasonDraftData: SeasonDraftData = {
  seasonYear: 2023,
  draftPicks: Array.from({ length: 50 }, (_, i) => ({
    id: `pick-${i}`,
    seasonYear: 2023,
    round: Math.floor(i / mockGms.length) + 1,
    pickOverall: i + 1,
    playerName: `Player ${String.fromCharCode(65 + (i%26))}${Math.floor(i/26) || ''}`,
    position: ['QB', 'RB', 'WR', 'TE', 'K', 'DEF'][i % 6],
    pickedByGmId: mockGms[i % mockGms.length].id,
    pickedByGmName: mockGms[i % mockGms.length].name,
  })),
};

const mockGMDraftHistory: GMDraftHistoryData = {
  gmId: "gm1",
  gmName: "Alice",
  careerDraftSummary: { totalPicks: 150, avgPickPosition: 75 },
  bestPicks: [mockSeasonDraftData.draftPicks[0], mockSeasonDraftData.draftPicks[5]],
  worstPicks: [mockSeasonDraftData.draftPicks[10]],
  roundEfficiency: [{ round: 1, avgPlayerPerformance: 85 }, { round: 2, avgPlayerPerformance: 70 }],
  positionalProfile: [{ position: 'WR', count: 40 }, { position: 'RB', count: 35 }],
};

const DraftOverview = () => {
  const [overviewData, setOverviewData] = useState<GMDraftSeasonPerformance[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch('/data/league_data/gm_season_performance_grid.json');
        if (!response.ok) {
          throw new Error(`Failed to fetch data: ${response.status} ${response.statusText}`);
        }
        const data: GMDraftSeasonPerformance[] = await response.json();
        setOverviewData(data);
      } catch (err) {
        if (err instanceof Error) {
            setError(err.message);
        } else {
            setError("An unknown error occurred");
        }
        setOverviewData(null);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><BarChart3 /> Draft Performance Grid</CardTitle>
          <CardDescription>Loading GM draft metrics across seasons...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} className="h-10 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><BarChart3 /> Draft Performance Grid</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-destructive">Error loading draft overview data: {error}</p>
        </CardContent>
      </Card>
    );
  }

  if (!overviewData || overviewData.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><BarChart3 /> Draft Performance Grid</CardTitle>
        </CardHeader>
        <CardContent>
          <p>No draft overview data available.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><BarChart3 /> Draft Performance Grid</CardTitle>
        <CardDescription>Overview of GM draft metrics for each season.</CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>GM Name</TableHead>
              <TableHead>Season</TableHead>
              <TableHead>Draft Grade</TableHead>
              <TableHead>Draft Position</TableHead>
              <TableHead>Avg. Pick Value Score</TableHead>
              <TableHead>Top Rookie Points</TableHead>
              <TableHead>Value Picks</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {overviewData.map((item, index) => (
              <TableRow key={`${item.gmId}-${item.seasonYear}-${index}`}>
                <TableCell>{item.gmName}</TableCell>
                <TableCell>{item.seasonYear}</TableCell>
                <TableCell>{item.draftGrade}</TableCell>
                <TableCell>{item.draftPosition}</TableCell>
                <TableCell>{item.avgPickValueScore?.toFixed(1) ?? '-'}</TableCell>
                <TableCell>{item.topRookiePoints?.toFixed(1) ?? '-'}</TableCell>
                <TableCell>{item.valuePicksCount ?? '-'}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};


const SeasonDraftDetail = () => {
  const [selectedSeason, setSelectedSeason] = useState<string | undefined>(mockSeasons[0]?.id);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Season Draft View</CardTitle>
          <CardDescription>Select a season to view detailed draft information.</CardDescription>
        </CardHeader>
        <CardContent>
          <Select value={selectedSeason} onValueChange={setSelectedSeason}>
            <SelectTrigger className="w-[280px] mb-6">
              <SelectValue placeholder="Select a season's draft" />
            </SelectTrigger>
            <SelectContent>
              {mockSeasons.map(season => (
                <SelectItem key={season.id} value={season.id}>{season.year} Draft</SelectItem>
              ))}
            </SelectContent>
          </Select>
          {selectedSeason && (
            <Card>
              <CardHeader>
                <CardTitle>{mockSeasons.find(s => s.id === selectedSeason)?.year} Draft Details</CardTitle>
                <CardDescription>Interactive draft board, analysis, and grades (DH.1).</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                    <Card>
                        <CardHeader><CardTitle>Draft Grades (DH.1.5)</CardTitle></CardHeader>
                        <CardContent><p className="text-muted-foreground">Placeholder for draft grade dashboard.</p></CardContent>
                    </Card>
                     <Card>
                        <CardHeader><CardTitle>Top Steals & Busts (DH.1.6)</CardTitle></CardHeader>
                        <CardContent><p className="text-muted-foreground">Placeholder for season's top steals and busts.</p></CardContent>
                    </Card>
                </div>
                <CardTitle className="text-lg mb-2">Draft Board (DH.1.2)</CardTitle>
                <p className="text-sm text-muted-foreground mb-2">Toggles for Value Analysis (DH.1.3) and Reach/Steal (DH.1.4) would go here.</p>
                <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 gap-1 p-2 border rounded-md max-h-96 overflow-y-auto">
                  {mockSeasonDraftData.draftPicks.map(pick => (
                    <div key={pick.id} title={`${pick.playerName} (${pick.position}) - Picked by ${pick.pickedByGmName}`} className="p-1.5 text-xs border rounded bg-muted/50 hover:bg-accent/20 cursor-default truncate">
                      <p className="font-semibold">{pick.round}.{pick.pickOverall % mockGms.length || mockGms.length}</p>
                      <p className="truncate">{pick.playerName}</p>
                      <p className="text-muted-foreground text-[10px]">{pick.position} - {pick.pickedByGmName.substring(0,3)}.</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

const GMDraftHistory = () => {
  const [selectedGm, setSelectedGm] = useState<string | undefined>(mockGms[0]?.id);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>GM Draft History View</CardTitle>
          <CardDescription>Select a GM to view their career draft history (DH.2).</CardDescription>
        </CardHeader>
        <CardContent>
            <Select value={selectedGm} onValueChange={setSelectedGm}>
                <SelectTrigger className="w-[280px] mb-6">
                <SelectValue placeholder="Select a GM" />
                </SelectTrigger>
                <SelectContent>
                {mockGms.map(gm => (
                    <SelectItem key={gm.id} value={gm.id}>{gm.name}</SelectItem>
                ))}
                </SelectContent>
            </Select>
            {selectedGm && (
                <Card>
                <CardHeader>
                    <CardTitle>{mockGms.find(g => g.id === selectedGm)?.name}'s Draft History</CardTitle>
                    <CardDescription>Career draft summary, efficiency, best/worst picks.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <p><strong>Career Draft Summary (DH.2.2):</strong> Placeholder. Total Picks: {mockGMDraftHistory.careerDraftSummary.totalPicks}, Avg. Position: {mockGMDraftHistory.careerDraftSummary.avgPickPosition}</p>
                    <p><strong>Round Efficiency Analysis (DH.2.3):</strong> Placeholder for Recharts charts.</p>
                    <p><strong>Best & Worst Picks (DH.2.4):</strong> Best: {mockGMDraftHistory.bestPicks.map(p => p.playerName).join(', ') || 'N/A'}. Worst: {mockGMDraftHistory.worstPicks.map(p => p.playerName).join(', ') || 'N/A'}</p>
                    <p><strong>Positional Drafting Profile (DH.2.5):</strong> Placeholder for Recharts charts or components.</p>
                    <p><strong>Draft Strategy Overview (DH.2.6):</strong> Placeholder text.</p>
                </CardContent>
                </Card>
            )}
        </CardContent>
      </Card>
    </div>
  );
};


export default function DraftHistoryPage() {
  const searchParams = useSearchParams();
  const section = searchParams.get('section') || 'overview'; // Default to overview

  return (
    <div className="space-y-6">
      {section === 'overview' && <DraftOverview />}
      {section === 'season-view' && <SeasonDraftDetail />}
      {section === 'gm-view' && <GMDraftHistory />}
    </div>
  );
}

    