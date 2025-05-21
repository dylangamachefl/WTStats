
"use client";
import { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import type { Season, GM, SeasonDraftData, GMDraftHistoryData, GMDraftSeasonPerformance } from '@/lib/types';
import { BarChart3, ArrowUpDown } from 'lucide-react';
import { cn } from '@/lib/utils';

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

type SortDirection = 'asc' | 'desc';
interface HeatmapSortConfig {
  key: 'gmName' | null; // Only GM Name is sortable for this heatmap
  direction: SortDirection;
}

interface TransformedHeatmapData {
  [gmName: string]: {
    [seasonYear: string]: number | undefined; // POE value
  };
}

const DraftOverview = () => {
  const [rawData, setRawData] = useState<GMDraftSeasonPerformance[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [minPoe, setMinPoe] = useState(0);
  const [maxPoe, setMaxPoe] = useState(0);
  const [sortConfig, setSortConfig] = useState<HeatmapSortConfig>({ key: 'gmName', direction: 'asc' });

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        console.log("Fetching /data/draft_data/gm_season_performance_grid.json");
        const response = await fetch('/data/draft_data/gm_season_performance_grid.json');
        if (!response.ok) {
          const errorText = await response.text();
          console.error("Fetch failed:", response.status, errorText);
          throw new Error(`Failed to fetch data: ${response.status} ${response.statusText}. ${errorText.substring(0,100)}`);
        }
        const data: GMDraftSeasonPerformance[] = await response.json();
        console.log("Fetched data:", data);
        setRawData(data);

        if (data && data.length > 0) {
          const poeValues = data.map(item => item.avg_pvdre).filter(val => typeof val === 'number') as number[];
          if (poeValues.length > 0) {
            setMinPoe(Math.min(...poeValues));
            setMaxPoe(Math.max(...poeValues));
          } else {
            setMinPoe(0);
            setMaxPoe(0);
          }
        }
      } catch (err) {
        if (err instanceof Error) {
            setError(err.message);
        } else {
            setError("An unknown error occurred");
        }
        console.error("Error in fetchData:", err);
        setRawData(null);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const { heatmapData, gmNames, seasonYears } = useMemo(() => {
    if (!rawData) return { heatmapData: {}, gmNames: [], seasonYears: [] };

    const transformed: TransformedHeatmapData = rawData.reduce((acc, item) => {
      if (!acc[item.gmName]) {
        acc[item.gmName] = {};
      }
      acc[item.gmName][item.seasonYear.toString()] = item.avg_pvdre;
      return acc;
    }, {} as TransformedHeatmapData);

    let sortedGmNames = Object.keys(transformed);
    if (sortConfig.key === 'gmName') {
      sortedGmNames.sort((a, b) => {
        const comparison = a.localeCompare(b);
        return sortConfig.direction === 'asc' ? comparison : -comparison;
      });
    }
    
    const uniqueSeasonYears = Array.from(new Set(rawData.map(item => item.seasonYear.toString()))).sort((a, b) => parseInt(a) - parseInt(b));
    return { heatmapData: transformed, gmNames: sortedGmNames, seasonYears: uniqueSeasonYears };
  }, [rawData, sortConfig]);

  const getPoeColorStyle = (value: number | undefined): React.CSSProperties => {
    if (value === undefined || value === null) return { color: 'hsl(var(--muted-foreground))' };

    const range = maxPoe - minPoe;
    if (range === 0) return { backgroundColor: 'hsl(0, 0%, 95%)', color: 'hsl(var(--foreground))' }; // Neutral if no range

    let hue;
    let saturation = 70;
    let lightness = 85; // Lighter pastels

    // Normalize value considering 0 as the midpoint for color transition
    const zeroNormalized = (0 - minPoe) / range; // Where 0 POE falls in the normalized scale
    const valueNormalized = (value - minPoe) / range;

    if (value > 0) { // Green shades for positive POE
        hue = 120; // Green
        // Intensity based on how far from 0 (or maxPoe if 0 is not in range/all positive)
        const positiveRange = maxPoe > 0 ? maxPoe : 1; // Avoid division by zero if maxPoe is 0 or less
        const intensity = Math.min(1, Math.abs(value) / positiveRange);
        lightness = 90 - (intensity * 20); // Lighter for lower positive, darker for higher positive
    } else if (value < 0) { // Red shades for negative POE
        hue = 0; // Red
        const negativeRange = minPoe < 0 ? Math.abs(minPoe) : 1;
        const intensity = Math.min(1, Math.abs(value) / negativeRange);
        lightness = 90 - (intensity * 20); 
    } else { // Near zero POE
        return { backgroundColor: 'hsl(0, 0%, 95%)', color: 'hsl(var(--foreground))' }; // Neutral light gray
    }
    
    const textColor = lightness < 65 ? 'hsl(var(--primary-foreground))' : 'hsl(var(--foreground))';

    return {
        backgroundColor: `hsl(${hue}, ${saturation}%, ${lightness}%)`,
        color: textColor,
        fontWeight: '500'
    };
  };

  const requestSort = (key: 'gmName') => {
    let direction: SortDirection = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const getSortIcon = (columnKey: 'gmName') => {
    if (sortConfig.key === columnKey) {
      return <ArrowUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50 group-hover:opacity-100 transition-opacity" />;
    }
    return <ArrowUpDown className="ml-2 h-4 w-4 shrink-0 opacity-0 group-hover:opacity-50 transition-opacity" />;
  };


  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><BarChart3 /> Draft POE Heatmap</CardTitle>
          <CardDescription>Loading GM draft POE (Points Over Expected) metrics across seasons...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {[...Array(10)].map((_, i) => (
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
          <CardTitle className="flex items-center gap-2"><BarChart3 /> Draft POE Heatmap</CardTitle>
           <CardDescription>GM draft POE (Points Over Expected) metrics across seasons. Higher is better.</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-destructive">Error loading draft POE data: {error}</p>
        </CardContent>
      </Card>
    );
  }

  if (!rawData || rawData.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><BarChart3 /> Draft POE Heatmap</CardTitle>
           <CardDescription>GM draft POE (Points Over Expected) metrics across seasons. Higher is better.</CardDescription>
        </CardHeader>
        <CardContent>
          <p>No draft POE data available. Please ensure 'gm_season_performance_grid.json' exists in 'public/data/draft_data/' and is correctly formatted.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><BarChart3 /> Draft POE Heatmap</CardTitle>
        <CardDescription>GM draft POE (Points Over Expected) metrics across seasons. Green for positive POE (good), Red for negative POE (bad).</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
            <Table className="min-w-full border-collapse">
              <TableHeader>
                <TableRow>
                  <TableHead className="sticky left-0 bg-card z-10 p-2 border text-xs md:text-sm">
                    <Button variant="ghost" onClick={() => requestSort('gmName')} className="px-1 group">
                        GM Name {getSortIcon('gmName')}
                    </Button>
                  </TableHead>
                  {seasonYears.map(year => (
                    <TableHead key={year} className="p-2 border text-center text-xs md:text-sm whitespace-nowrap">{year}</TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {gmNames.map(gmName => (
                  <TableRow key={gmName}>
                    <TableCell className="font-medium sticky left-0 bg-card z-10 p-2 border text-xs md:text-sm whitespace-nowrap">{gmName}</TableCell>
                    {seasonYears.map(year => {
                      const poeValue = heatmapData[gmName]?.[year];
                      const cellStyle = getPoeColorStyle(poeValue);
                      return (
                        <TableCell
                          key={`${gmName}-${year}`}
                          className="p-0 border text-center text-xs md:text-sm"
                          style={{minWidth: '60px'}} // Ensure cells have some min width
                        >
                           <div className="p-2 h-full w-full flex items-center justify-center" style={cellStyle}>
                            {typeof poeValue === 'number' ? poeValue.toFixed(1) : '-'}
                           </div>
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
  );
};


const SeasonDraftDetail = () => {
  const [selectedSeason, setSelectedSeason] = useState<string | undefined>(mockSeasons[0]?.id);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Season Draft View</CardTitle>
          <CardDescription>Select a season to view detailed draft information. (DH.1)</CardDescription>
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
                <CardDescription>Interactive draft board, analysis, and grades. (DH.1.2 - DH.1.7)</CardDescription>
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
          <CardDescription>Select a GM to view their career draft history. (DH.2)</CardDescription>
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
                    <CardDescription>Career draft summary, efficiency, best/worst picks. (DH.2.2 - DH.2.6)</CardDescription>
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

    
