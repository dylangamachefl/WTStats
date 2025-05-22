
"use client";
import { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import type { Season, GM, GMDraftSeasonPerformance, GMDraftHistoryData, DraftPickDetail } from '@/lib/types';
import { BarChart3, ArrowUpDown, Info, CheckCircle2, XCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';

// Mock Data for Season Dropdown in SeasonDraftDetail
const mockSeasons: Season[] = [
  { id: "2024", year: 2024 },{ id: "2023", year: 2023 }, { id: "2022", year: 2022 }, { id: "2021", year: 2021 }, { id: "2020", year: 2020 }, { id: "2019", year: 2019 }, { id: "2018", year: 2018 }, { id: "2017", year: 2017 }, { id: "2016", year: 2016 }, { id: "2015", year: 2015 }, { id: "2014", year: 2014 }, { id: "2013", year: 2013 }, { id: "2012", year: 2012 }, { id: "2011", year: 2011 }, { id: "2009", year: 2009 }
].sort((a, b) => b.year - a.year); // Sort descending by year

const mockGms: GM[] = [
  { id: "gm1", name: "Alice" }, { id: "gm2", name: "Bob" }, { id: "gm3", name: "Charlie" }
];

const mockGMDraftHistory: GMDraftHistoryData = {
  gmId: "gm1",
  gmName: "Alice",
  careerDraftSummary: { totalPicks: 150, avgPickPosition: 75 },
  bestPicks: [], 
  worstPicks: [], 
  roundEfficiency: [{ round: 1, avgPlayerPerformance: 85 }, { round: 2, avgPlayerPerformance: 70 }],
  positionalProfile: [{ position: 'WR', count: 40 }, { position: 'RB', count: 35 }],
};

type SortDirection = 'asc' | 'desc';
interface HeatmapSortConfig {
  key: 'gm_name' | null; 
  direction: SortDirection;
}

interface TransformedHeatmapData {
  [gmName: string]: {
    [seasonYear: string]: GMDraftSeasonPerformance | undefined; 
  };
}

type HeatmapMetricKey = 'avg_pvdre' | 'pvdre_hit_rate' | 'avg_value_vs_adp';

interface MetricConfig {
  label: string;
  key: HeatmapMetricKey;
  format: (value: number | undefined | null) => string;
  tooltipLabel: string;
  description: string;
}

const metricConfigs: Record<HeatmapMetricKey, MetricConfig> = {
  avg_pvdre: { 
    label: 'POE', 
    key: 'avg_pvdre', 
    format: (val) => (typeof val === 'number' ? val.toFixed(1) : '-'), 
    tooltipLabel: 'POE (Points Over Expected)',
    description: 'Points Over Expected (POE) shows average points scored by drafted players over a baseline expectation. Colors relative to average (green=above, red=below, neutral=mid-range).'
  },
  pvdre_hit_rate: { 
    label: 'Hit Rate %', 
    key: 'pvdre_hit_rate', 
    format: (val) => (typeof val === 'number' ? (val * 100).toFixed(1) + '%' : '-'), 
    tooltipLabel: 'PVDRE Hit Rate',
    description: 'PVDRE Hit Rate indicates the percentage of draft picks that met or exceeded expected performance. Colors relative to average (green=above, red=below, neutral=mid-range).'
  },
  avg_value_vs_adp: { 
    label: 'Value vs ADP', 
    key: 'avg_value_vs_adp', 
    format: (val) => (typeof val === 'number' ? val.toFixed(1) : '-'), 
    tooltipLabel: 'Avg Value vs ADP',
    description: 'Average Value vs ADP measures draft value relative to Average Draft Position. Positive values (green) indicate better value; negative (red) indicate lesser value. Neutral for near-zero values.'
  },
};

const getPositionBadgeClass = (position?: string): string => {
  if (!position) return "bg-muted text-muted-foreground"; 
  switch (position?.toUpperCase()) {
    case 'QB':
      return 'bg-red-100 text-red-700'; 
    case 'RB':
      return 'bg-blue-100 text-blue-700';
    case 'WR':
      return 'bg-green-100 text-green-700';
    case 'TE':
      return 'bg-yellow-100 text-yellow-700'; 
    case 'K':
      return 'bg-purple-100 text-purple-700';
    case 'DST':
    case 'DEF':
      return 'bg-indigo-100 text-indigo-700';
    default:
      return "bg-muted text-muted-foreground";
  }
};

const DraftOverview = () => {
  const [rawData, setRawData] = useState<GMDraftSeasonPerformance[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sortConfig, setSortConfig] = useState<HeatmapSortConfig>({ key: 'gm_name', direction: 'asc' });
  const [selectedMetric, setSelectedMetric] = useState<HeatmapMetricKey>('avg_pvdre');

  const { currentMin, currentMax } = useMemo(() => {
    if (!rawData) return { currentMin: 0, currentMax: 0 };
    const values = rawData
        .map(item => item[selectedMetric])
        .filter(val => typeof val === 'number') as number[];
    
    if (values.length === 0) return { currentMin: 0, currentMax: 0 };
    return { currentMin: Math.min(...values), currentMax: Math.max(...values) };
  }, [rawData, selectedMetric]);


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
    
    const validRawData = rawData.filter(
      item => typeof item.gm_name === 'string' && typeof item.season_id === 'number' && typeof item[selectedMetric] === 'number'
    );

    const transformed: TransformedHeatmapData = validRawData.reduce((acc, item) => {
      if (!acc[item.gm_name]) {
        acc[item.gm_name] = {};
      }
      acc[item.gm_name][item.season_id.toString()] = item; 
      return acc;
    }, {} as TransformedHeatmapData);

    let sortedGmNames = Object.keys(transformed);
    if (sortConfig.key === 'gm_name') {
      sortedGmNames.sort((a, b) => {
        const comparison = a.localeCompare(b);
        return sortConfig.direction === 'asc' ? comparison : -comparison;
      });
    }
    
    const uniqueSeasonYears = Array.from(new Set(validRawData.map(item => item.season_id.toString()))).sort((a, b) => parseInt(a) - parseInt(b));
    return { heatmapData: transformed, gmNames: sortedGmNames, seasonYears: uniqueSeasonYears };
  }, [rawData, sortConfig, selectedMetric]);

  const getCellStyle = (
    performanceData: GMDraftSeasonPerformance | undefined, 
    metricKey: HeatmapMetricKey,
    metricMinValue: number, 
    metricMaxValue: number 
  ): React.CSSProperties => {
    if (!performanceData) return { color: 'hsl(var(--muted-foreground))' };

    const value = performanceData[metricKey];
    if (typeof value !== 'number') {
      return { color: 'hsl(var(--muted-foreground))' };
    }

    let hue;
    const saturation = 70; 
    let lightness = 90; 

    if (metricKey === 'avg_value_vs_adp') {
        const adpThreshold = 0.1; 
        if (value > adpThreshold) { 
            hue = 120; // Green
            const effectiveMax = Math.max(adpThreshold * 1.1, metricMaxValue); 
            const intensity = Math.min(1, Math.max(0, value / effectiveMax));
            lightness = 90 - (intensity * 25); 
        } else if (value < -adpThreshold) { 
            hue = 0; // Red
            const effectiveMin = Math.min(-adpThreshold * 1.1, metricMinValue); 
            const intensity = Math.min(1, Math.max(0, value / effectiveMin)); 
            lightness = 90 - (intensity * 25); 
        } else {
            return { backgroundColor: 'hsl(0, 0%, 95%)', color: 'hsl(var(--foreground))', fontWeight: '500' };
        }
    } else { // For POE and Hit Rate
        const range = metricMaxValue - metricMinValue;
        if (range === 0) return { backgroundColor: 'hsl(0, 0%, 95%)', color: 'hsl(var(--foreground))', fontWeight: '500' };

        const normalizedValue = (value - metricMinValue) / range;
        const neutralBandStart = 0.40; 
        const neutralBandEnd = 0.60;   

        if (normalizedValue >= neutralBandStart && normalizedValue <= neutralBandEnd) {
          return { backgroundColor: 'hsl(0, 0%, 95%)', color: 'hsl(var(--foreground))', fontWeight: '500' };
        } else if (normalizedValue < neutralBandStart) {
          hue = 0; // Red for lower values
          const intensity = Math.min(1, (neutralBandStart - normalizedValue) / neutralBandStart);
          lightness = 90 - (intensity * 20); 
        } else { // normalizedValue > neutralBandEnd
          hue = 120; // Green for higher values
          const intensity = Math.min(1, (normalizedValue - neutralBandEnd) / (1 - neutralBandEnd));
          lightness = 90 - (intensity * 20); 
        }
    }
    
    const textColor = lightness < 65 ? 'hsl(var(--primary-foreground))' : 'hsl(var(--foreground))';

    return {
        backgroundColor: `hsl(${hue}, ${saturation}%, ${lightness}%)`,
        color: textColor,
        fontWeight: '500'
    };
  };


  const requestSort = (key: 'gm_name') => {
    let direction: SortDirection = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const getSortIcon = (columnKey: 'gm_name') => {
    if (sortConfig.key === columnKey) {
      return <ArrowUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50 group-hover:opacity-100 transition-opacity" />;
    }
    return <ArrowUpDown className="ml-2 h-4 w-4 shrink-0 opacity-0 group-hover:opacity-50 transition-opacity" />;
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><BarChart3 /> Draft Performance Heatmap</CardTitle>
          <CardDescription>Loading GM draft performance metrics across seasons...</CardDescription>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-8 w-1/2 mb-4" /> {/* Placeholder for toggle */}
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
          <CardTitle className="flex items-center gap-2"><BarChart3 /> Draft Performance Heatmap</CardTitle>
           <CardDescription>
             {metricConfigs[selectedMetric]?.description || "GM draft performance metrics across seasons. Colors indicate performance relative to the average."}
           </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-destructive">Error loading draft performance data: {error}</p>
        </CardContent>
      </Card>
    );
  }

  if (!rawData || rawData.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><BarChart3 /> Draft Performance Heatmap</CardTitle>
           <CardDescription>
             {metricConfigs[selectedMetric]?.description || "GM draft performance metrics across seasons. Colors indicate performance relative to the average."}
           </CardDescription>
        </CardHeader>
        <CardContent>
          <p>No draft performance data available. Please ensure 'gm_season_performance_grid.json' exists in 'public/data/draft_data/' and is correctly formatted.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <TooltipProvider>
      <Card>
        <CardHeader className="flex flex-col sm:flex-row justify-between items-start sm:items-center">
            <div>
                <CardTitle className="flex items-center gap-2"><BarChart3 /> Draft Performance Heatmap</CardTitle>
                <CardDescription>
                    {metricConfigs[selectedMetric].description} Hover over a cell for more details.
                </CardDescription>
            </div>
            <RadioGroup
                value={selectedMetric}
                onValueChange={(value) => setSelectedMetric(value as HeatmapMetricKey)}
                className="flex flex-wrap gap-x-4 gap-y-2 mt-4 sm:mt-0"
            >
                {Object.values(metricConfigs).map(config => (
                    <div key={config.key} className="flex items-center space-x-2">
                        <RadioGroupItem value={config.key} id={config.key} />
                        <Label htmlFor={config.key} className="text-sm cursor-pointer">{config.label}</Label>
                    </div>
                ))}
            </RadioGroup>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
              <Table className="min-w-full border-collapse">
                <TableHeader>
                  <TableRow>
                    <TableHead className="sticky left-0 bg-card z-10 p-2 border text-xs md:text-sm">
                      <Button variant="ghost" onClick={() => requestSort('gm_name')} className="px-1 group">
                          GM Name {getSortIcon('gm_name')}
                      </Button>
                    </TableHead>
                    {seasonYears.map(year => (
                      <TableHead key={year} className="p-2 border text-center text-xs md:text-sm whitespace-nowrap">{year}</TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {gmNames.map(gm_name => (
                    <TableRow key={gm_name}>
                      <TableCell className="font-medium sticky left-0 bg-card z-10 p-2 border text-xs md:text-sm whitespace-nowrap">{gm_name}</TableCell>
                      {seasonYears.map(year => {
                        const performanceData = heatmapData[gm_name]?.[year];
                        const metricValue = performanceData?.[selectedMetric];
                        const cellStyle = getCellStyle(performanceData, selectedMetric, currentMin, currentMax);
                        const displayValue = metricConfigs[selectedMetric].format(metricValue as number | undefined | null);
                        
                        return (
                          <TableCell
                            key={`${gm_name}-${year}-${selectedMetric}`}
                            className="p-0 border text-center text-xs md:text-sm"
                            style={{minWidth: '70px'}}
                          >
                            <Tooltip delayDuration={100}>
                              <TooltipTrigger asChild>
                                <div className="p-2 h-full w-full flex items-center justify-center" style={cellStyle}>
                                  {displayValue}
                                </div>
                              </TooltipTrigger>
                              {performanceData && (
                                <TooltipContent className="bg-popover text-popover-foreground p-3 rounded-md shadow-lg max-w-xs w-auto">
                                  <div className="space-y-1.5 text-left">
                                    <p className="font-semibold">{performanceData.gm_name} - {performanceData.season_id}</p>
                                    <p><span className="font-medium">POE (Avg PVDRE):</span> {performanceData.avg_pvdre?.toFixed(2) ?? 'N/A'}</p>
                                    <p><span className="font-medium">Hit Rate:</span> {performanceData.pvdre_hit_rate !== undefined && performanceData.pvdre_hit_rate !== null ? (performanceData.pvdre_hit_rate * 100).toFixed(1) + '%' : 'N/A'}</p>
                                    <p><span className="font-medium">Avg Value vs ADP:</span> {performanceData.avg_value_vs_adp?.toFixed(1) ?? 'N/A'}</p>
                                    <p><span className="font-medium">Total Picks:</span> {performanceData.total_picks ?? 'N/A'}</p>
                                    <p><span className="font-medium">1st Round Pos:</span> {performanceData.first_round_draft_position ?? 'N/A'}</p>
                                    <p><span className="font-medium">Total PVDRE:</span> {performanceData.total_pvdre?.toFixed(2) ?? 'N/A'}</p>
                                  </div>
                                </TooltipContent>
                              )}
                            </Tooltip>
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
    </TooltipProvider>
  );
};


const SeasonDraftDetail = () => {
  const [selectedSeason, setSelectedSeason] = useState<string | undefined>(mockSeasons[0]?.id);
  const [draftData, setDraftData] = useState<DraftPickDetail[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [showValueAnalysis, setShowValueAnalysis] = useState(false);
  const [showReachSteal, setShowReachSteal] = useState(false);

  useEffect(() => {
    if (selectedSeason) {
      const fetchData = async () => {
        setLoading(true);
        setError(null);
        setDraftData(null); 
        try {
          const filePath = `/data/draft_data/seasons/season_${selectedSeason}_draft_detail.json`;
          console.log(`[SeasonDraftDetail] Fetching ${filePath}`);
          const response = await fetch(filePath);

          if (!response.ok) {
            const errorText = await response.text();
            console.error(`[SeasonDraftDetail] Fetch failed for season draft data (Status: ${response.status}):`, errorText.substring(0, 200));
            throw new Error(`Failed to fetch data for season ${selectedSeason}: ${response.status} ${response.statusText}.`);
          }
          
          const jsonData: any = await response.json(); 
          console.log(`[SeasonDraftDetail] Fetched raw JSON data for season ${selectedSeason}:`, jsonData);

          if (typeof jsonData === 'object' && jsonData !== null && Array.isArray(jsonData.draft_board)) {
            setDraftData(jsonData.draft_board); 
            console.log(`[SeasonDraftDetail] Successfully processed draft_board for season ${selectedSeason}.`);
          } else {
            console.error(`[SeasonDraftDetail] Fetched data for season ${selectedSeason} is not in the expected object format with a 'draft_board' array. Received:`, jsonData);
            setError(`Data for season ${selectedSeason} is not in the expected format. Ensure the JSON file has a "draft_board" array.`);
            setDraftData(null);
          }

        } catch (err) {
          if (err instanceof Error) {
              setError(`Error loading draft data: ${err.message}`);
          } else {
              setError("An unknown error occurred while fetching season draft data.");
          }
          console.error("[SeasonDraftDetail] Error in fetchData for season draft data:", err);
          setDraftData(null);
        } finally {
          setLoading(false);
        }
      };
      fetchData();
    }
  }, [selectedSeason]);

  const { draftBoardPicks, gmNamesForColumns, maxRound, numGms } = useMemo(() => {
    if (!draftData || !Array.isArray(draftData)) { 
      console.warn("[SeasonDraftDetail useMemo] draftData is not an array or is null. draftData:", draftData);
      return { draftBoardPicks: {}, gmNamesForColumns: [], maxRound: 0, numGms: 0 };
    }

    const sortedPicks = [...draftData].sort((a, b) => a.pick_overall - b.pick_overall);

    const picksByOverall: { [overallPick: number]: DraftPickDetail } = {};
    sortedPicks.forEach(pick => {
      picksByOverall[pick.pick_overall] = pick;
    });
    
    const gmMinOverallPick = new Map<string, number>();
    const gmNames = new Set<string>();
    let currentMaxRound = 0;

    sortedPicks.forEach(pick => {
      if (typeof pick.gm_name !== 'string' || typeof pick.round !== 'number' || typeof pick.pick_in_round !== 'number' || typeof pick.pick_overall !== 'number') {
        console.warn("[SeasonDraftDetail useMemo] Invalid pick data encountered (missing gm_name, round, pick_in_round or pick_overall):", pick);
        return; 
      }
      gmNames.add(pick.gm_name);
      if (pick.round > currentMaxRound) {
        currentMaxRound = pick.round;
      }
      if (!gmMinOverallPick.has(pick.gm_name) || pick.pick_overall < gmMinOverallPick.get(pick.gm_name)!) {
        gmMinOverallPick.set(pick.gm_name, pick.pick_overall);
      }
    });
    
    const sortedGmNamesByDraftOrder = Array.from(gmNames).sort((a, b) => {
        const pickA = gmMinOverallPick.get(a) ?? Infinity;
        const pickB = gmMinOverallPick.get(b) ?? Infinity;
        if (pickA === Infinity && pickB === Infinity) return a.localeCompare(b); 
        return pickA - pickB;
    });
    
    const numberOfGms = sortedGmNamesByDraftOrder.length;

    return { draftBoardPicks: picksByOverall, gmNamesForColumns: sortedGmNamesByDraftOrder, maxRound: currentMaxRound, numGms: numberOfGms };
  }, [draftData]);


  const renderDraftBoard = () => {
    if (loading) {
      return <Skeleton className="h-[400px] w-full" />;
    }
    if (error) {
      return <p className="text-destructive text-center py-4">Error loading draft data: {error}</p>;
    }
    if (!draftData || gmNamesForColumns.length === 0 || maxRound === 0) {
      return <p className="text-muted-foreground text-center py-4">No draft data available for the selected season, or data is malformed. Check console for details.</p>;
    }

    return (
      <TooltipProvider>
        <div className="overflow-x-auto">
          <Table className="min-w-full border-collapse">
            <TableHeader>
              <TableRow>
                <TableHead className="sticky left-0 bg-card z-20 p-1.5 border text-xs text-center font-semibold">Round</TableHead>
                {gmNamesForColumns.map(gmName => (
                  <TableHead key={gmName} className="p-1.5 border text-xs text-center font-semibold whitespace-nowrap min-w-[120px]">{gmName}</TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {Array.from({ length: maxRound }, (_, i) => i + 1).map(roundNum => (
                <TableRow key={roundNum}>
                  <TableCell className="sticky left-0 bg-card z-20 p-1.5 border text-xs text-center font-semibold">{roundNum}</TableCell>
                  {gmNamesForColumns.map((_, gmIndex) => {
                    let targetPickInRound: number;
                    if (roundNum % 2 !== 0) { // Odd rounds
                      targetPickInRound = gmIndex + 1;
                    } else { // Even rounds (snake)
                      targetPickInRound = numGms - gmIndex;
                    }
                    const targetOverallPick = (roundNum - 1) * numGms + targetPickInRound;
                    const pick = draftBoardPicks[targetOverallPick];

                    if (!pick) {
                      return <TableCell key={`${roundNum}-${gmIndex}-empty`} className="p-1.5 border text-xs min-h-[60px] bg-muted/20"></TableCell>;
                    }
                    
                    const cellBg = getPositionBadgeClass(pick.player_position);
                    return (
                      <TableCell key={pick.player_id || `${roundNum}-${gmIndex}-${pick.pick_overall}`} className="p-0 border text-xs align-top min-h-[60px]" style={{ backgroundColor: cellBg.startsWith('bg-') ? undefined : cellBg, minWidth: '120px' }}>
                        <Tooltip delayDuration={100}>
                          <TooltipTrigger asChild>
                            <div className={cn("h-full w-full p-1.5 flex flex-col justify-center items-center text-center", cellBg.startsWith('bg-') ? cellBg : '')} style={{ backgroundColor: cellBg.startsWith('bg-') ? undefined : cellBg }}>
                                <p className="font-semibold truncate w-full" title={pick.player_name}>{pick.player_name}</p>
                                <p className="text-muted-foreground truncate w-full">{pick.player_position} - {pick.nfl_team_id}</p>
                            </div>
                          </TooltipTrigger>
                          <TooltipContent className="bg-popover text-popover-foreground p-3 rounded-md shadow-lg max-w-xs w-auto">
                            <div className="space-y-1.5 text-left text-xs">
                                <p className="font-bold text-sm">{pick.player_name} ({pick.player_position} - {pick.nfl_team_id})</p>
                                <p><span className="font-medium">Picked By:</span> {pick.gm_name} ({pick.fantasy_team_name})</p>
                                <p><span className="font-medium">Overall Pick:</span> {pick.pick_overall} (Round {pick.round}, Pick {pick.pick_in_round})</p>
                                {pick.pvdre_points_vs_league_draft_rank_exp !== null && <p><span className="font-medium">PVDRE:</span> {pick.pvdre_points_vs_league_draft_rank_exp?.toFixed(1) ?? 'N/A'}</p>}
                                {pick.fantasy_points_per_game_season !== null && <p><span className="font-medium">Season PPG:</span> {pick.fantasy_points_per_game_season?.toFixed(1) ?? 'N/A'}</p>}
                                {pick.actual_positional_finish_rank !== null && <p><span className="font-medium">Actual Finish:</span> {pick.actual_positional_finish_rank ?? 'N/A'}</p>}
                                {pick.overall_adp_rank !== null && <p><span className="font-medium">Overall ADP:</span> {pick.overall_adp_rank?.toFixed(1) ?? 'N/A'}</p>}
                                {pick.overall_reach_steal_value !== null && <p><span className="font-medium">Reach/Steal Value:</span> {pick.overall_reach_steal_value?.toFixed(1) ?? 'N/A'}</p>}
                            </div>
                          </TooltipContent>
                        </Tooltip>
                      </TableCell>
                    );
                  })}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </TooltipProvider>
    );
  };
  
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Season Draft View</CardTitle>
          <CardDescription>Select a season to view its draft board and analysis. (DH.1)</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
            <Select value={selectedSeason} onValueChange={setSelectedSeason}>
              <SelectTrigger className="w-full sm:w-[280px]">
                <SelectValue placeholder="Select a season's draft" />
              </SelectTrigger>
              <SelectContent>
                {mockSeasons.map(season => (
                  <SelectItem key={season.id} value={season.id}>{season.year} Draft</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="flex items-center space-x-4 mt-4 sm:mt-0">
                <div className="flex items-center space-x-2">
                    <Switch id="value-analysis" checked={showValueAnalysis} onCheckedChange={setShowValueAnalysis} />
                    <Label htmlFor="value-analysis" className="text-sm">Value Analysis</Label>
                </div>
                <div className="flex items-center space-x-2">
                    <Switch id="reach-steal" checked={showReachSteal} onCheckedChange={setShowReachSteal}/>
                    <Label htmlFor="reach-steal" className="text-sm">Reach/Steal</Label>
                </div>
            </div>
          </div>

          {selectedSeason && (
            <Card>
              <CardHeader>
                <CardTitle>{mockSeasons.find(s => s.id === selectedSeason)?.year} Draft Board</CardTitle>
                <CardDescription>Interactive draft board. Color-coded by position. Hover for details.</CardDescription>
              </CardHeader>
              <CardContent>
                {renderDraftBoard()}
              </CardContent>
            </Card>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
              <Card>
                  <CardHeader><CardTitle>Draft Grades (DH.1.5)</CardTitle></CardHeader>
                  <CardContent><p className="text-muted-foreground">Placeholder for draft grade dashboard.</p></CardContent>
              </Card>
                <Card>
                  <CardHeader><CardTitle>Season's Top Steals & Busts (DH.1.6)</CardTitle></CardHeader>
                  <CardContent><p className="text-muted-foreground">Placeholder for season's top steals and busts.</p></CardContent>
              </Card>
          </div>
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
  const section = searchParams.get('section') || 'overview'; 

  return (
    <div className="space-y-6">
      {section === 'overview' && <DraftOverview />}
      {section === 'season-view' && <SeasonDraftDetail />}
      {section === 'gm-view' && <GMDraftHistory />}
    </div>
  );
}

