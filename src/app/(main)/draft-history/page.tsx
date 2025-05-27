
"use client";
import { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableFooter } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import type { Season, GM, GMDraftSeasonPerformance, DraftPickDetail, SeasonDraftDetailJson, TeamDraftPerformanceEntry, GMDraftHistoryDetailData, GMDraftPositionalProfileEntry, DraftOverviewData, GMAverageMetrics, SeasonAverageMetrics, GMDraftHistoryCareerSummary, GMDraftHistoryRoundEfficiencyEntry } from '@/lib/types';
import { BarChart as BarChartLucide, ArrowUpDown, Info, CheckCircle2, XCircle, ThumbsUp, ThumbsDown, ArrowUpCircle, ArrowDownCircle, UserCircle2, BarChart2, PieChart as PieChartLucide, ListChecks, TrendingUp, TrendingDown, Shield, Target, Users as UsersIcon, PersonStanding, Replace, GripVertical, BarChartHorizontal, MoreHorizontal, ShieldAlert } from 'lucide-react';
import { cn } from '@/lib/utils';
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend as RechartsLegend, Cell as RechartsCell } from 'recharts';


// Mock Data for Season Dropdown in SeasonDraftDetail
const mockSeasons: Season[] = [
  { id: "2024", year: 2024 },{ id: "2023", year: 2023 }, { id: "2022", year: 2022 }, { id: "2021", year: 2021 }, { id: "2020", year: 2020 }, { id: "2019", year: 2019 }, { id: "2018", year: 2018 }, { id: "2017", year: 2017 }, { id: "2016", year: 2016 }, { id: "2015", year: 2015 }, { id: "2014", year: 2014 }, { id: "2013", year: 2013 }, { id: "2012", year: 2012 }, { id: "2011", year: 2011 }, { id: "2009", year: 2009 }
].sort((a, b) => b.year - a.year); // Sort descending by year

// Updated mockGms to use numeric string IDs for file fetching
const mockGms: GM[] = [
  { id: "1", name: "Jack" }, { id: "2", name: "Josh" }, { id: "3", name: "Jake" }, { id: "4", name: "Mark" }, { id: "5", name: "Sean" }, { id: "6", name: "Nick" }, { id: "7", name: "Will" }, { id: "8", name: "Zach" }, { id: "9", name: "Lac" }, { id: "11", name: "Chris" }, { id: "12", name: "Dylan" }, { id: "13", name: "Dan" }, { id: "14", name: "Fitz" }
];


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
    tooltipLabel: 'Hit Rate %',
    description: 'Hit Rate % indicates the percentage of draft picks that met or exceeded expected performance. Colors relative to average (green=above, red=below, neutral=mid-range).'
  },
  avg_value_vs_adp: { 
    label: 'Value vs ADP', 
    key: 'avg_value_vs_adp', 
    format: (val) => (typeof val === 'number' ? val.toFixed(1) : '-'), 
    tooltipLabel: 'Avg Value vs ADP',
    description: 'Average Value vs ADP measures draft value relative to Average Draft Position. Green for positive (steal), red for negative (reach).'
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
  const [overviewData, setOverviewData] = useState<DraftOverviewData | null>(null);
  const [rawData, setRawData] = useState<GMDraftSeasonPerformance[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sortConfig, setSortConfig] = useState<HeatmapSortConfig>({ key: 'gm_name', direction: 'asc' });
  const [selectedMetric, setSelectedMetric] = useState<HeatmapMetricKey>('avg_pvdre');

  const { currentMin, currentMax } = useMemo(() => {
    if (!rawData || !Array.isArray(rawData)) return { currentMin: 0, currentMax: 0 };
    const values = rawData
        .map(item => item[selectedMetric as keyof GMDraftSeasonPerformance] as number | undefined | null)
        .filter(val => typeof val === 'number') as number[];
    
    if (values.length === 0) return { currentMin: 0, currentMax: 0 };
    return { currentMin: Math.min(...values), currentMax: Math.max(...values) };
  }, [rawData, selectedMetric]);

  const { minGmAvg, maxGmAvg } = useMemo(() => {
    if (!overviewData?.gmAverages || !Array.isArray(overviewData.gmAverages)) return { minGmAvg: 0, maxGmAvg: 0 };
    const values = overviewData.gmAverages
        .map(item => item[selectedMetric as keyof GMAverageMetrics] as number | undefined | null)
        .filter(val => typeof val === 'number') as number[];
    if (values.length === 0) return { minGmAvg: 0, maxGmAvg: 0 };
    return { minGmAvg: Math.min(...values), maxGmAvg: Math.max(...values) };
  }, [overviewData?.gmAverages, selectedMetric]);
  
  const { minSeasonAvg, maxSeasonAvg } = useMemo(() => {
    if (!overviewData?.seasonAverages || !Array.isArray(overviewData.seasonAverages)) return { minSeasonAvg: 0, maxSeasonAvg: 0 };
    const values = overviewData.seasonAverages
        .map(item => item[selectedMetric as keyof SeasonAverageMetrics] as number | undefined | null)
        .filter(val => typeof val === 'number') as number[];
    if (values.length === 0) return { minSeasonAvg: 0, maxSeasonAvg: 0 };
    return { minSeasonAvg: Math.min(...values), maxSeasonAvg: Math.max(...values) };
  }, [overviewData?.seasonAverages, selectedMetric]);


  const overallAverage = useMemo(() => {
    if (!rawData || rawData.length === 0) return null;
    const values = rawData
      .map(item => item[selectedMetric as keyof GMDraftSeasonPerformance] as number | undefined | null)
      .filter(val => typeof val === 'number') as number[];
    if (values.length === 0) return null;
    return values.reduce((sum, val) => sum + val, 0) / values.length;
  }, [rawData, selectedMetric]);


  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const filePath = '/data/draft_data/gm_season_performance_grid.json';
        console.log(`[DraftOverview] Fetching ${filePath}`);
        const response = await fetch(filePath);
        if (!response.ok) {
          const errorText = await response.text();
          console.error("[DraftOverview] Fetch failed:", response.status, errorText);
          throw new Error(`Failed to fetch data: ${response.status} ${response.statusText}. ${errorText.substring(0,100)}`);
        }
        const data: DraftOverviewData = await response.json();
        console.log("[DraftOverview] Fetched data:", data);
        setOverviewData(data);
        setRawData(data.gmSeasonPerformanceGrid || null);

      } catch (err) {
        if (err instanceof Error) {
            setError(err.message);
        } else {
            setError("An unknown error occurred");
        }
        console.error("[DraftOverview] Error in fetchData:", err);
        setOverviewData(null); 
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
      item => typeof item.gm_name === 'string' && typeof item.season_id === 'number'
    );

    const transformed: TransformedHeatmapData = validRawData.reduce((acc, item) => {
      if (!acc[item.gm_name]) {
        acc[item.gm_name] = {};
      }
      acc[item.gm_name][item.season_id.toString()] = item; 
      return acc;
    }, {} as TransformedHeatmapData);

    let sortedGmNames = Array.from(new Set(validRawData.map(item => item.gm_name)));
    const gmDataMap = new Map<string, GMDraftSeasonPerformance[]>();
    validRawData.forEach(item => {
      if (!gmDataMap.has(item.gm_name)) {
        gmDataMap.set(item.gm_name, []);
      }
      gmDataMap.get(item.gm_name)!.push(item);
    });


    if (sortConfig.key === 'gm_name') {
      sortedGmNames.sort((a, b) => {
        const comparison = a.localeCompare(b);
        return sortConfig.direction === 'asc' ? comparison : -comparison;
      });
    }
    
    const uniqueSeasonYears = Array.from(new Set(validRawData.map(item => item.season_id.toString()))).sort((a, b) => parseInt(a) - parseInt(b));
    return { heatmapData: transformed, gmNames: sortedGmNames, seasonYears: uniqueSeasonYears };
  }, [rawData, sortConfig]);

  const getCellStyle = (
    value: number | undefined | null, 
    metricKey: HeatmapMetricKey,
    metricMinValue: number, 
    metricMaxValue: number 
  ): string => {
    if (value === null || value === undefined) { 
      return 'bg-muted/30 text-muted-foreground';
    }

    let baseClasses = "font-semibold ";

    if (metricKey === 'avg_value_vs_adp') {
        const adpThreshold = 0.1; 
        if (value > adpThreshold) { 
            const effectiveMax = Math.max(adpThreshold * 1.1, metricMaxValue); 
            const intensity = Math.min(1, Math.max(0, value / effectiveMax));
            if (intensity > 0.66) return baseClasses + 'bg-green-300 text-green-800';
            if (intensity > 0.33) return baseClasses + 'bg-green-200 text-green-800';
            return baseClasses + 'bg-green-100 text-green-700';
        } else if (value < -adpThreshold) { 
            const effectiveMin = Math.min(-adpThreshold * 1.1, metricMinValue); 
            const intensity = Math.min(1, Math.max(0, value / effectiveMin)); 
            if (intensity > 0.66) return baseClasses + 'bg-red-300 text-red-800';
            if (intensity > 0.33) return baseClasses + 'bg-red-200 text-red-800';
            return baseClasses + 'bg-red-100 text-red-700';
        } else {
            return baseClasses + 'bg-neutral-100 text-neutral-700';
        }
    } else { 
        const range = metricMaxValue - metricMinValue;
        if (range === 0) return baseClasses + 'bg-neutral-100 text-neutral-700';

        const normalizedValue = (value - metricMinValue) / range;
        const neutralBandStart = 0.40; 
        const neutralBandEnd = 0.60;   

        if (normalizedValue >= neutralBandStart && normalizedValue <= neutralBandEnd) {
          return baseClasses + 'bg-neutral-100 text-neutral-700';
        } else if (normalizedValue < neutralBandStart) {
          const intensity = Math.min(1, (neutralBandStart - normalizedValue) / neutralBandStart);
          if (intensity > 0.66) return baseClasses + 'bg-red-300 text-red-800';
          if (intensity > 0.33) return baseClasses + 'bg-red-200 text-red-800';
          return baseClasses + 'bg-red-100 text-red-700';
        } else { 
          const intensity = Math.min(1, (normalizedValue - neutralBandEnd) / (1 - neutralBandEnd));
           if (intensity > 0.66) return baseClasses + 'bg-green-300 text-green-800';
           if (intensity > 0.33) return baseClasses + 'bg-green-200 text-green-800';
           return baseClasses + 'bg-green-100 text-green-700';
        }
    }
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
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><BarChartLucide /> Draft Performance Heatmap</CardTitle>
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
         <div className="grid md:grid-cols-2 gap-6 mt-6">
          <Skeleton className="h-64 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><BarChartLucide /> Draft Performance Heatmap</CardTitle>
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

  if (!overviewData || !rawData || rawData.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><BarChartLucide /> Draft Performance Heatmap</CardTitle>
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
      <div className="space-y-6">
        <Card>
          <CardHeader className="flex flex-col sm:flex-row justify-between items-start sm:items-center">
              <div>
                  <CardTitle className="flex items-center gap-2"><BarChartLucide /> Draft Performance Heatmap</CardTitle>
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
                      <TableHead className="p-2 border text-center text-xs md:text-sm whitespace-nowrap font-bold bg-muted/50">GM Avg</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {gmNames.map(gm_name => {
                      const gmAvgData = overviewData.gmAverages?.find(avg => avg.gm_name === gm_name || (avg.gm_id && rawData.find(rd => rd.gm_name === gm_name)?.gm_id === avg.gm_id));
                      let gmAvgValueForMetric: number | undefined | null = undefined;
                      if (gmAvgData && selectedMetric in gmAvgData) {
                        gmAvgValueForMetric = gmAvgData[selectedMetric as keyof GMAverageMetrics] as number | undefined | null;
                      }
                      
                      return (
                      <TableRow key={gm_name}>
                        <TableCell className="font-medium sticky left-0 bg-card z-10 p-2 border text-xs md:text-sm whitespace-nowrap">{gm_name}</TableCell>
                        {seasonYears.map(year => {
                          const performanceData = heatmapData[gm_name]?.[year];
                          const metricValue = performanceData?.[selectedMetric as keyof GMDraftSeasonPerformance];
                          const cellClasses = getCellStyle(metricValue as number | undefined | null, selectedMetric, currentMin, currentMax);
                          const displayValue = metricConfigs[selectedMetric].format(metricValue as number | undefined | null);
                          
                          return (
                            <TableCell
                              key={`${gm_name}-${year}-${selectedMetric}`}
                              className="p-0 border text-center text-xs md:text-sm"
                              style={{minWidth: '70px'}}
                            >
                              <Tooltip delayDuration={100}>
                                <TooltipTrigger asChild>
                                  <div className={cn("p-2 h-full w-full flex items-center justify-center", cellClasses)}>
                                    {displayValue}
                                  </div>
                                </TooltipTrigger>
                                {performanceData && (
                                  <TooltipContent className="bg-popover text-popover-foreground p-3 rounded-md shadow-lg max-w-xs w-auto">
                                    <div className="space-y-1.5 text-left">
                                      <p className="font-semibold">{performanceData.gm_name} - {performanceData.season_id}</p>
                                      <p><span className="font-medium">POE per pick:</span> {performanceData.avg_pvdre?.toFixed(2) ?? 'N/A'}</p>
                                      <p><span className="font-medium">Hit Rate:</span> {performanceData.pvdre_hit_rate !== undefined && performanceData.pvdre_hit_rate !== null ? (performanceData.pvdre_hit_rate * 100).toFixed(1) + '%' : 'N/A'}</p>
                                      <p><span className="font-medium">Avg Value vs ADP:</span> {performanceData.avg_value_vs_adp?.toFixed(1) ?? 'N/A'}</p>
                                      <p><span className="font-medium">Total Picks:</span> {performanceData.total_picks ?? 'N/A'}</p>
                                      <p><span className="font-medium">1st Round Pos:</span> {performanceData.first_round_draft_position ?? 'N/A'}</p>
                                      <p><span className="font-medium">Total POE:</span> {performanceData.total_pvdre?.toFixed(2) ?? 'N/A'}</p>
                                    </div>
                                  </TooltipContent>
                                )}
                              </Tooltip>
                            </TableCell>
                          );
                        })}
                        <TableCell className="p-0 border text-center text-xs md:text-sm font-bold bg-muted/50" style={{minWidth: '70px'}}>
                           <Tooltip delayDuration={100}>
                                <TooltipTrigger asChild>
                                  <div className={cn("p-2 h-full w-full flex items-center justify-center", getCellStyle(gmAvgValueForMetric, selectedMetric, minGmAvg, maxGmAvg))}>
                                     {metricConfigs[selectedMetric].format(gmAvgValueForMetric)}
                                  </div>
                                </TooltipTrigger>
                                <TooltipContent className="bg-popover text-popover-foreground p-3 rounded-md shadow-lg max-w-xs w-auto">
                                    <p className="font-semibold">{gm_name} - Career Avg</p>
                                    <p><span className="font-medium">{metricConfigs[selectedMetric].tooltipLabel}:</span> {metricConfigs[selectedMetric].format(gmAvgValueForMetric)}</p>
                                </TooltipContent>
                            </Tooltip>
                        </TableCell>
                      </TableRow>
                    );
                    })}
                  </TableBody>
                   <TableFooter>
                        <TableRow>
                            <TableCell className="font-bold sticky left-0 bg-muted/60 z-10 p-2 border text-xs md:text-sm whitespace-nowrap">Season Avg</TableCell>
                            {seasonYears.map(year => {
                                const seasonAvgData = overviewData.seasonAverages?.find(sa => sa.season_id.toString() === year);
                                let seasonAvgValueForMetric: number | undefined | null = undefined;
                                if (seasonAvgData && selectedMetric in seasonAvgData) {
                                    seasonAvgValueForMetric = seasonAvgData[selectedMetric as keyof SeasonAverageMetrics] as number | undefined | null;
                                }
                                return (
                                    <TableCell key={`season-avg-${year}`} className="p-0 border text-center text-xs md:text-sm font-bold bg-muted/60" style={{minWidth: '70px'}}>
                                         <Tooltip delayDuration={100}>
                                            <TooltipTrigger asChild>
                                               <div className={cn("p-2 h-full w-full flex items-center justify-center", getCellStyle(seasonAvgValueForMetric, selectedMetric, minSeasonAvg, maxSeasonAvg))}>
                                                 {metricConfigs[selectedMetric].format(seasonAvgValueForMetric)}
                                               </div>
                                            </TooltipTrigger>
                                            <TooltipContent className="bg-popover text-popover-foreground p-3 rounded-md shadow-lg max-w-xs w-auto">
                                                <p className="font-semibold">{year} Season Average</p>
                                                <p><span className="font-medium">{metricConfigs[selectedMetric].tooltipLabel}:</span> {metricConfigs[selectedMetric].format(seasonAvgValueForMetric)}</p>
                                            </TooltipContent>
                                        </Tooltip>
                                    </TableCell>
                                );
                            })}
                            <TableCell className="p-0 border text-center text-xs md:text-sm font-bold bg-muted/80" style={{minWidth: '70px'}}>
                                <Tooltip delayDuration={100}>
                                    <TooltipTrigger asChild>
                                        <div className={cn("p-2 h-full w-full flex items-center justify-center", getCellStyle(overallAverage, selectedMetric, currentMin, currentMax))}>
                                            {metricConfigs[selectedMetric].format(overallAverage)}
                                        </div>
                                    </TooltipTrigger>
                                    <TooltipContent className="bg-popover text-popover-foreground p-3 rounded-md shadow-lg max-w-xs w-auto">
                                        <p className="font-semibold">Overall League Average</p>
                                        <p><span className="font-medium">{metricConfigs[selectedMetric].tooltipLabel}:</span> {metricConfigs[selectedMetric].format(overallAverage)}</p>
                                    </TooltipContent>
                                </Tooltip>
                            </TableCell>
                        </TableRow>
                    </TableFooter>
                </Table>
            </div>
          </CardContent>
        </Card>

        <div className="grid md:grid-cols-2 gap-6 mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><ArrowUpCircle className="text-green-500" /> All-Time Top Draft Steals</CardTitle>
            </CardHeader>
            <CardContent>
              {overviewData.allTimeDraftSteals && overviewData.allTimeDraftSteals.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Player</TableHead>
                      <TableHead className="text-center">Season</TableHead>
                      <TableHead className="text-center">Overall Pick</TableHead>
                      <TableHead>GM</TableHead>
                      <TableHead className="text-center">Drafted (Pos)</TableHead>
                      <TableHead className="text-center">Finished (Pos)</TableHead>
                      <TableHead className="text-right">PVDRE</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {overviewData.allTimeDraftSteals.slice(0, 10).map((pick, index) => (
                      <TableRow key={`steal-${pick.player_id}-${pick.season_id}-${index}`}>
                        <TableCell className="font-medium">{pick.player_name} ({pick.nfl_team_id || 'N/A'})</TableCell>
                        <TableCell className="text-center">{pick.season_id}</TableCell>
                        <TableCell className="text-center">{pick.pick_overall}</TableCell>
                        <TableCell>{pick.gm_name}</TableCell>
                        <TableCell className="text-center">
                          <Badge variant="outline" className={getPositionBadgeClass(pick.player_position)}>
                            {pick.player_position || 'N/A'}{pick.league_positional_draft_rank ?? ''}
                          </Badge>
                        </TableCell>
                         <TableCell className="text-center">
                          {pick.actual_positional_finish_rank !== null && pick.actual_positional_finish_rank !== undefined ? (
                            <Badge variant="outline" className={getPositionBadgeClass(pick.player_position)}>
                              {pick.player_position || 'N/A'}{pick.actual_positional_finish_rank}
                            </Badge>
                          ) : (
                            '-'
                          )}
                        </TableCell>
                        <TableCell className="text-right font-semibold text-green-600">{pick.pvdre_points_vs_league_draft_rank_exp?.toFixed(1) ?? 'N/A'}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <p className="text-muted-foreground text-center">No all-time steals data available.</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><ArrowDownCircle className="text-red-500" /> All-Time Top Draft Busts</CardTitle>
            </CardHeader>
            <CardContent>
              {overviewData.allTimeDraftBusts && overviewData.allTimeDraftBusts.length > 0 ? (
                <Table>
                  <TableHeader>
                     <TableRow>
                      <TableHead>Player</TableHead>
                      <TableHead className="text-center">Season</TableHead>
                      <TableHead className="text-center">Overall Pick</TableHead>
                      <TableHead>GM</TableHead>
                      <TableHead className="text-center">Drafted (Pos)</TableHead>
                      <TableHead className="text-center">Finished (Pos)</TableHead>
                      <TableHead className="text-right">PVDRE</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {overviewData.allTimeDraftBusts.slice(0, 10).map((pick, index) => (
                      <TableRow key={`bust-${pick.player_id}-${pick.season_id}-${index}`}>
                        <TableCell className="font-medium">{pick.player_name} ({pick.nfl_team_id || 'N/A'})</TableCell>
                        <TableCell className="text-center">{pick.season_id}</TableCell>
                        <TableCell className="text-center">{pick.pick_overall}</TableCell>
                        <TableCell>{pick.gm_name}</TableCell>
                        <TableCell className="text-center">
                          <Badge variant="outline" className={getPositionBadgeClass(pick.player_position)}>
                            {pick.player_position || 'N/A'}{pick.league_positional_draft_rank ?? ''}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-center">
                           {pick.actual_positional_finish_rank !== null && pick.actual_positional_finish_rank !== undefined ? (
                            <Badge variant="outline" className={getPositionBadgeClass(pick.player_position)}>
                              {pick.player_position || 'N/A'}{pick.actual_positional_finish_rank}
                            </Badge>
                          ) : (
                            '-'
                          )}
                        </TableCell>
                        <TableCell className="text-right font-semibold text-red-600">{pick.pvdre_points_vs_league_draft_rank_exp?.toFixed(1) ?? 'N/A'}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <p className="text-muted-foreground text-center">No all-time busts data available.</p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </TooltipProvider>
  );
};


const getPVDRECellStyle = (pvdre: number | null | undefined, minPvdre: number, maxPvdre: number): string => {
    if (pvdre === null || pvdre === undefined) return 'bg-muted/30 text-muted-foreground';
    
    const baseClasses = "font-semibold ";

    const range = maxPvdre - minPvdre;
    if (range === 0) return baseClasses + 'bg-neutral-100 text-neutral-700';

    const normalizedValue = (pvdre - minPvdre) / range;
    
    const neutralBandStart = 0.45; 
    const neutralBandEnd = 0.55;   

    if (normalizedValue >= neutralBandStart && normalizedValue <= neutralBandEnd) {
      return baseClasses + 'bg-neutral-100 text-neutral-700';
    } else if (normalizedValue < neutralBandStart) { 
      const intensity = Math.min(1, (neutralBandStart - normalizedValue) / neutralBandStart);
      if (intensity > 0.66) return baseClasses + 'bg-red-300 text-red-800'; 
      if (intensity > 0.33) return baseClasses + 'bg-red-200 text-red-800'; 
      return baseClasses + 'bg-red-100 text-red-700';                   
    } else { 
      const intensity = Math.min(1, (normalizedValue - neutralBandEnd) / (1 - neutralBandEnd)); 
      if (intensity > 0.66) return baseClasses + 'bg-green-300 text-green-800'; 
      if (intensity > 0.33) return baseClasses + 'bg-green-200 text-green-800'; 
      return baseClasses + 'bg-green-100 text-green-700';                  
    }
};

const getReachStealCellStyle = (reachStealValue: number | null | undefined): string => {
    if (reachStealValue === null || reachStealValue === undefined) return 'bg-muted/30 text-muted-foreground';
    
    const baseClasses = "font-semibold ";
    const threshold = 0.1; 
    if (reachStealValue > threshold) {
        if (reachStealValue > 10) return baseClasses + 'bg-green-300 text-green-800';
        if (reachStealValue > 5) return baseClasses + 'bg-green-200 text-green-800';
        return baseClasses + 'bg-green-100 text-green-700';
    } else if (reachStealValue < -threshold) {
        if (reachStealValue < -10) return baseClasses + 'bg-red-300 text-red-800';
        if (reachStealValue < -5) return baseClasses + 'bg-red-200 text-red-800';
        return baseClasses + 'bg-red-100 text-red-700';
    } else {
        return baseClasses + 'bg-neutral-100 text-neutral-700'; 
    }
};


const SeasonDraftDetail = () => {
  const [selectedSeason, setSelectedSeason] = useState<string | undefined>(mockSeasons[0]?.id);
  const [draftData, setDraftData] = useState<DraftPickDetail[] | null>(null);
  const [teamDraftPerformance, setTeamDraftPerformance] = useState<TeamDraftPerformanceEntry[] | null>(null);
  const [topSteals, setTopSteals] = useState<DraftPickDetail[] | null>(null);
  const [topBusts, setTopBusts] = useState<DraftPickDetail[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [analysisMode, setAnalysisMode] = useState<'none' | 'value' | 'reachSteal'>('none');


  useEffect(() => {
    if (selectedSeason) {
      const fetchData = async () => {
        setLoading(true);
        setError(null);
        setDraftData(null); 
        setTeamDraftPerformance(null);
        setTopSteals(null);
        setTopBusts(null);
        try {
          const filePath = `/data/draft_data/seasons/season_${selectedSeason}_draft_detail.json`;
          console.log(`[SeasonDraftDetail] Fetching ${filePath}`);
          const response = await fetch(filePath);

          if (!response.ok) {
            const errorText = await response.text();
            console.error(`[SeasonDraftDetail] Fetch failed for season draft data (Status: ${response.status}):`, errorText.substring(0, 200));
            throw new Error(`Failed to fetch data for season ${selectedSeason}: ${response.status} ${response.statusText}.`);
          }
          
          const jsonData: SeasonDraftDetailJson = await response.json(); 
          console.log(`[SeasonDraftDetail] Fetched raw JSON data for season ${selectedSeason}:`, jsonData);

           if (typeof jsonData === 'object' && jsonData !== null && Array.isArray(jsonData.draft_board)) {
            setDraftData(jsonData.draft_board);
            setTeamDraftPerformance(jsonData.team_draft_performance_ranking || null);
            setTopSteals(jsonData.season_highlights?.top_steals_by_pvdre || null);
            setTopBusts(jsonData.season_highlights?.top_busts_by_pvdre || null);
            console.log(`[SeasonDraftDetail] Successfully processed draft_board and other sections for season ${selectedSeason}.`);
          } else {
            console.error(`[SeasonDraftDetail] Fetched data for season ${selectedSeason} is not in the expected object format with a 'draft_board' array. Received:`, jsonData);
            setError(`Data for season ${selectedSeason} is not in the expected format. Ensure the JSON file has a "draft_board" array and optionally "team_draft_performance_ranking", "season_highlights.top_steals_by_pvdre", "season_highlights.top_busts_by_pvdre".`);
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

  const { draftBoardPicks, gmNamesForColumns, maxRound, numGms, minPVDRE, maxPVDRE } = useMemo(() => {
    if (!draftData || !Array.isArray(draftData)) { 
      console.warn("[SeasonDraftDetail useMemo] draftData is not an array or is null. draftData:", draftData);
      return { draftBoardPicks: {}, gmNamesForColumns: [], maxRound: 0, numGms: 0, minPVDRE: 0, maxPVDRE: 0 };
    }

    const sortedPicks = [...draftData].sort((a, b) => a.pick_overall - b.pick_overall);

    const picksByOverall: { [overallPick: number]: DraftPickDetail } = {};
    let currentMinPVDRE = Infinity;
    let currentMaxPVDRE = -Infinity;

    sortedPicks.forEach(pick => {
      if (typeof pick.gm_name !== 'string' || typeof pick.round !== 'number' || typeof pick.pick_in_round !== 'number' || typeof pick.pick_overall !== 'number') {
        console.warn("[SeasonDraftDetail useMemo] Invalid pick data encountered (missing gm_name, round, pick_in_round or pick_overall):", pick);
        return; 
      }
      picksByOverall[pick.pick_overall] = pick;
      if (pick.pvdre_points_vs_league_draft_rank_exp !== null && pick.pvdre_points_vs_league_draft_rank_exp !== undefined) {
        currentMinPVDRE = Math.min(currentMinPVDRE, pick.pvdre_points_vs_league_draft_rank_exp);
        currentMaxPVDRE = Math.max(currentMaxPVDRE, pick.pvdre_points_vs_league_draft_rank_exp);
      }
    });
    
    const gmMinOverallPick = new Map<string, number>();
    const gmNames = new Set<string>();
    let currentMaxRound = 0;

    sortedPicks.forEach(pick => {
      if (typeof pick.gm_name !== 'string' || typeof pick.round !== 'number' || typeof pick.pick_in_round !== 'number' || typeof pick.pick_overall !== 'number') {
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

    return { 
        draftBoardPicks: picksByOverall, 
        gmNamesForColumns: sortedGmNamesByDraftOrder, 
        maxRound: currentMaxRound, 
        numGms: numberOfGms,
        minPVDRE: currentMinPVDRE === Infinity ? 0 : currentMinPVDRE,
        maxPVDRE: currentMaxPVDRE === -Infinity ? 0 : currentMaxPVDRE
    };
  }, [draftData]);


  const renderDraftBoard = () => {
    if (loading && !draftData) { 
      return <Skeleton className="h-[400px] w-full" />;
    }
    if (error && !draftData) {
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
                    if (roundNum % 2 !== 0) { 
                      targetPickInRound = gmIndex + 1;
                    } else { 
                      targetPickInRound = numGms - gmIndex;
                    }
                    const targetOverallPick = (roundNum - 1) * numGms + targetPickInRound;
                    const pick = draftBoardPicks[targetOverallPick];

                    let cellContent;
                    let cellClasses = `p-1.5 border text-xs align-middle h-[50px]`; 

                    if (!pick) {
                       return <TableCell key={`${roundNum}-${gmIndex}-empty`} className={cn(cellClasses, "bg-muted/20")} style={{minWidth: '120px' }}></TableCell>;
                    }
                    
                    let innerDivLayoutClasses = "flex items-center justify-center h-full w-full text-center";

                    if (analysisMode === 'none') {
                        innerDivLayoutClasses = "flex flex-col items-center justify-center h-full w-full text-center";
                        cellContent = (
                             <>
                                <p className="font-semibold truncate w-full" title={pick.player_name}>{pick.player_name}</p>
                                <p className="text-muted-foreground truncate w-full text-xs">{pick.player_position} - {pick.nfl_team_id}</p>
                            </>
                        );
                        cellClasses = cn(cellClasses, getPositionBadgeClass(pick.player_position));
                    } else if (analysisMode === 'value') {
                        cellContent = (
                            <p className="font-semibold">{pick.pvdre_points_vs_league_draft_rank_exp?.toFixed(1) ?? 'N/A'}</p>
                        );
                        cellClasses = cn(cellClasses, getPVDRECellStyle(pick.pvdre_points_vs_league_draft_rank_exp, minPVDRE, maxPVDRE));
                    } else { // analysisMode === 'reachSteal'
                        cellContent = (
                             <p className="font-semibold">{pick.overall_reach_steal_value?.toFixed(1) ?? 'N/A'}</p>
                        );
                        cellClasses = cn(cellClasses, getReachStealCellStyle(pick.overall_reach_steal_value));
                    }
                    
                    return (
                      <TableCell 
                        key={pick.player_id || `${roundNum}-${gmIndex}-${pick.pick_overall}`} 
                        className={cellClasses}
                        style={{minWidth: '120px', height: '60px'}} 
                      >
                        <Tooltip delayDuration={100}>
                          <TooltipTrigger asChild>
                            <div className={innerDivLayoutClasses}>
                                {cellContent}
                            </div>
                          </TooltipTrigger>
                          <TooltipContent className="bg-popover text-popover-foreground p-3 rounded-md shadow-lg max-w-xs w-auto">
                            <div className="space-y-1.5 text-left text-xs">
                                <p className="font-bold text-sm">{pick.player_name} ({pick.nfl_team_id})</p>
                                <p><span className="font-medium">Picked By:</span> {pick.gm_name} ({pick.fantasy_team_name})</p>
                                <p><span className="font-medium">Overall Pick:</span> {pick.pick_overall} (Round {pick.round}, Pick {pick.pick_in_round})</p>
                                <p><span className="font-medium">Overall ADP:</span> {pick.overall_adp_rank?.toFixed(1) ?? 'N/A'}</p>
                                <p><span className="font-medium">Reach/Steal Value:</span> {pick.overall_reach_steal_value?.toFixed(1) ?? 'N/A'}</p>
                                <p><span className="font-medium">Drafted Pos:</span> {pick.player_position}{pick.league_positional_draft_rank ?? ''}</p>
                                 <p>
                                  <span className="font-medium">Finished Pos:</span> {
                                    pick.actual_positional_finish_rank !== null && pick.actual_positional_finish_rank !== undefined 
                                    ? `${pick.player_position}${pick.actual_positional_finish_rank}` 
                                    : '-'
                                  }
                                </p>
                                <p><span className="font-medium">Expected Points:</span> {pick.expected_points_for_league_draft_rank_smoothed?.toFixed(1) ?? 'N/A'}</p>
                                <p><span className="font-medium">Actual Points:</span> {pick.actual_total_fantasy_points_season?.toFixed(1) ?? 'N/A'}</p>
                                <p><span className="font-medium">POE:</span> {pick.pvdre_points_vs_league_draft_rank_exp?.toFixed(1) ?? 'N/A'}</p>
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
          <CardDescription>Select a season to view its draft board and analysis.</CardDescription>
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
                    <Switch id="value-analysis" checked={analysisMode === 'value'} onCheckedChange={(checked) => setAnalysisMode(checked ? 'value' : 'none')} />
                    <Label htmlFor="value-analysis" className="text-sm">Value Analysis</Label>
                </div>
                <div className="flex items-center space-x-2">
                    <Switch id="reach-steal" checked={analysisMode === 'reachSteal'} onCheckedChange={(checked) => setAnalysisMode(checked ? 'reachSteal' : 'none')}/>
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
                  <CardHeader><CardTitle>Team Draft Performance</CardTitle></CardHeader>
                  <CardContent>
                    {loading && !teamDraftPerformance && <Skeleton className="h-24 w-full" />}
                    {!loading && error && <p className="text-destructive text-center py-4">Error loading draft performance data.</p>}
                    {!loading && !error && teamDraftPerformance && teamDraftPerformance.length > 0 && (
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>GM</TableHead>
                            <TableHead className="text-right">Avg POE (Per Pick)</TableHead>
                            <TableHead className="text-right">Hit Rate</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {teamDraftPerformance.sort((a,b) => (b.avg_pvdre_per_pick ?? -Infinity) - (a.avg_pvdre_per_pick ?? -Infinity)).map((perf, index) => (
                            <TableRow key={index}>
                              <TableCell>
                                <p className="font-medium">{perf.gm_name}</p>
                                <p className="text-xs text-muted-foreground">{perf.fantasy_team_name}</p>
                              </TableCell>
                              <TableCell className="text-right font-semibold">{perf.avg_pvdre_per_pick?.toFixed(2) ?? 'N/A'}</TableCell>
                              <TableCell className="text-right">{perf.hit_rate_percentage?.toFixed(1) ?? 'N/A'}%</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    )}
                    {!loading && !error && (!teamDraftPerformance || teamDraftPerformance.length === 0) && (
                      <p className="text-muted-foreground text-center py-4">No team draft performance data available for this season.</p>
                    )}
                  </CardContent>
              </Card>
              <Card>
                <CardHeader><CardTitle>Season's Top Steals & Busts</CardTitle></CardHeader>
                <CardContent>
                  {loading && (!topSteals || !topBusts) && <Skeleton className="h-48 w-full" />}
                  {!loading && error && <p className="text-destructive text-center py-4">Error loading steals/busts.</p>}
                  {!loading && !error && (topSteals || topBusts) && (
                    <div className="space-y-6">
                      <div>
                        <h4 className="font-semibold mb-2 flex items-center"><ArrowUpCircle className="text-green-500 mr-2 h-5 w-5" /> Top Steals</h4>
                        {topSteals && topSteals.length > 0 ? (
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead>Player</TableHead>
                                <TableHead>Pos</TableHead>
                                <TableHead className="text-right">POE (Points Over Expected)</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {topSteals.slice(0, 5).map((player, index) => (
                                <TableRow key={`steal-${index}`}>
                                  <TableCell>
                                    <p className="font-medium">{player.player_name}</p>
                                    <p className="text-xs text-muted-foreground">Picked by {player.gm_name} (Overall: {player.pick_overall})</p>
                                  </TableCell>
                                  <TableCell><Badge variant="outline" className={getPositionBadgeClass(player.player_position)}>{player.player_position}</Badge></TableCell>
                                  <TableCell className="text-right text-green-600 font-semibold">
                                    {player.pvdre_points_vs_league_draft_rank_exp?.toFixed(1) ?? 'N/A'}
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        ) : (
                          <p className="text-muted-foreground text-sm text-center py-3">No top steals data available.</p>
                        )}
                      </div>
                      <div>
                        <h4 className="font-semibold mb-2 flex items-center"><ArrowDownCircle className="text-red-500 mr-2 h-5 w-5" /> Top Busts</h4>
                        {topBusts && topBusts.length > 0 ? (
                           <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead>Player</TableHead>
                                <TableHead>Pos</TableHead>
                                <TableHead className="text-right">POE (Points Over Expected)</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {topBusts.slice(0, 5).map((player, index) => (
                                <TableRow key={`bust-${index}`}>
                                   <TableCell>
                                    <p className="font-medium">{player.player_name}</p>
                                    <p className="text-xs text-muted-foreground">Picked by {player.gm_name} (Overall: {player.pick_overall})</p>
                                  </TableCell>
                                  <TableCell><Badge variant="outline" className={getPositionBadgeClass(player.player_position)}>{player.player_position}</Badge></TableCell>
                                  <TableCell className="text-right text-red-600 font-semibold">
                                     {player.pvdre_points_vs_league_draft_rank_exp?.toFixed(1) ?? 'N/A'}
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        ) : (
                          <p className="text-muted-foreground text-sm text-center py-3">No top busts data available.</p>
                        )}
                      </div>
                    </div>
                  )}
                  {!loading && !error && (!topSteals && !topBusts) && (
                     <p className="text-muted-foreground text-center py-4">No steals or busts data available for this season.</p>
                  )}
                </CardContent>
            </Card>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

const getPositionIcon = (position?: string): React.ReactNode => {
  if (!position) return <MoreHorizontal size={18} className="text-muted-foreground" />;
  switch (position.toUpperCase()) {
    case 'QB':
      return <UserCircle2 size={18} className="text-red-500" />;
    case 'RB':
      return <UsersIcon size={18} className="text-blue-500" />;
    case 'WR':
      return <PersonStanding size={18} className="text-green-500" />; 
    case 'TE':
      return <GripVertical size={18} className="text-yellow-500" />; 
    case 'K':
      return <Target size={18} className="text-purple-500" />;
    case 'DST':
    case 'DEF':
      return <Shield size={18} className="text-indigo-500" />; // Changed from ShieldAlert
    default:
      return <MoreHorizontal size={18} className="text-muted-foreground" />;
  }
};

// Helper to format PVDRE values
const formatPvdreValue = (value: number | null | undefined): string => {
  if (value === null || value === undefined) return 'N/A';
  return (value >= 0 ? '+' : '') + value.toFixed(1);
};


const GMDraftHistory = () => {
  const [selectedGmId, setSelectedGmId] = useState<string | undefined>(mockGms[0]?.id);
  const [gmDraftData, setGmDraftData] = useState<GMDraftHistoryDetailData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (selectedGmId) {
      const fetchData = async () => {
        setLoading(true);
        setError(null);
        setGmDraftData(null);
        try {
          const gmInfo = mockGms.find(g => g.id === selectedGmId);
          if (!gmInfo) {
            throw new Error("Selected GM not found in mock data.");
          }
          const filePath = `/data/draft_data/gm/gm_${selectedGmId}_draft_history.json`;
          console.log(`[GMDraftHistory] Fetching ${filePath}`);
          const response = await fetch(filePath);
          if (!response.ok) {
             const errorText = await response.text();
             console.error(`[GMDraftHistory] Fetch failed for GM ${selectedGmId} (Status: ${response.status}):`, errorText.substring(0,200));
            throw new Error(`Failed to fetch data for GM ${gmInfo.name}: ${response.status} ${response.statusText}`);
          }
          const data: GMDraftHistoryDetailData = await response.json();
          console.log(`[GMDraftHistory] Fetched data for GM ${selectedGmId}:`, data);
          if (data.gm_name !== gmInfo.name && data.gm_id?.toString() !== selectedGmId) {
            console.warn(`[GMDraftHistory] Mismatch between selected GM (${gmInfo.name}, ID ${selectedGmId}) and fetched data (${data.gm_name}, ID ${data.gm_id}). Using fetched data.`);
          }
          setGmDraftData(data);
        } catch (err) {
          if (err instanceof Error) {
              setError(err.message);
          } else {
              setError("An unknown error occurred");
          }
           console.error(`[GMDraftHistory] Error in fetchData for GM ${selectedGmId}:`, err);
          setGmDraftData(null);
        } finally {
          setLoading(false);
        }
      };
      fetchData();
    }
  }, [selectedGmId]);

  const roundEfficiencyChartData = useMemo(() => {
    return gmDraftData?.round_efficiency.map(r => ({
      name: `R${r.round.toFixed(0)}`,
      'Avg POE': r.average_pvdre,
    })) || [];
  }, [gmDraftData?.round_efficiency]);

  const positionalProfileChartData = useMemo(() => {
    if (!gmDraftData?.positional_profile) return [];
    return gmDraftData.positional_profile.map(p => ({
      name: p.position,
      'GM Avg POE': p.gm_average_pvdre,
      'League Avg POE': p.league_average_pvdre ?? 0, 
    }));
  }, [gmDraftData?.positional_profile]);


  if (!selectedGmId) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><UserCircle2 /> GM Draft History</CardTitle>
          <CardDescription>Select a GM to view their career draft history.</CardDescription>
        </CardHeader>
        <CardContent>
          <Select onValueChange={setSelectedGmId}>
            <SelectTrigger className="w-full sm:w-[280px]">
              <SelectValue placeholder="Select a GM" />
            </SelectTrigger>
            <SelectContent>
              {mockGms.map(gm => (
                <SelectItem key={gm.id} value={gm.id}>{gm.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>
    );
  }
  
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
            <div>
              <CardTitle className="flex items-center gap-2"><UserCircle2 /> {gmDraftData?.gm_name || mockGms.find(g=>g.id===selectedGmId)?.name || 'GM'} Draft History</CardTitle>
              <CardDescription>Career draft summary, efficiency, best/worst picks, and more.</CardDescription>
            </div>
            <Select value={selectedGmId} onValueChange={setSelectedGmId}>
              <SelectTrigger className="w-full sm:w-[280px] mt-2 sm:mt-0">
                <SelectValue placeholder="Select a GM" />
              </SelectTrigger>
              <SelectContent>
                {mockGms.map(gm => (
                  <SelectItem key={gm.id} value={gm.id}>{gm.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CardHeader>
        <CardContent>
          {loading && (
            <div className="space-y-4">
              <Skeleton className="h-24 w-full" />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Skeleton className="h-64 w-full" />
                <Skeleton className="h-64 w-full" />
              </div>
              <Skeleton className="h-48 w-full" />
            </div>
          )}
          {error && <p className="text-destructive text-center py-4">Error loading draft history data: {error}</p>}
          {!loading && !gmDraftData && !error && <p className="text-muted-foreground text-center py-4">No draft history data found for this GM. Ensure 'gm_GMID_draft_history.json' exists in 'public/data/draft_data/gm/'.</p>}
          
          {!loading && gmDraftData && (
            <div className="space-y-6">
              <Card>
                  <CardContent className="grid md:grid-cols-2 gap-6 pt-6">
                      <div>
                          <CardTitle className="text-lg mb-2">Pick Analysis</CardTitle>
                          <div className="space-y-2 text-center">
                              <div>
                                  <p className="text-sm text-muted-foreground">Total Picks Made</p>
                                  <p className="text-2xl font-bold">{gmDraftData.career_summary.total_picks_made}</p>
                              </div>
                              <div>
                                  <p className="text-sm text-muted-foreground">Total Hits</p>
                                  <p className="text-2xl font-bold">{gmDraftData.career_summary.total_hits}</p>
                              </div>
                              <div>
                                  <p className="text-sm text-muted-foreground">Total Misses</p>
                                  <p className="text-2xl font-bold">{gmDraftData.career_summary.total_misses}</p>
                              </div>
                              <div>
                                  <p className="text-sm text-muted-foreground">Career Hit Rate</p>
                                  <p className="text-2xl font-bold">{(gmDraftData.career_summary.career_hit_rate_percentage).toFixed(1)}%</p>
                              </div>
                          </div>
                      </div>
                      <div>
                          <CardTitle className="text-lg mb-2">Performance Overview (POE)</CardTitle>
                          <div className="space-y-2 text-center">
                              <div>
                                  <p className="text-sm text-muted-foreground">Sum Total POE</p>
                                  <p className="text-2xl font-bold">{gmDraftData.career_summary.sum_total_pvdre.toFixed(2)}</p>
                              </div>
                              <div>
                                  <p className="text-sm text-muted-foreground">Avg. POE / Pick</p>
                                  <p className="text-2xl font-bold">{gmDraftData.career_summary.average_pvdre_per_pick.toFixed(2)}</p>
                              </div>
                          </div>
                      </div>
                  </CardContent>
              </Card>


              <Card>
                <CardHeader><CardTitle className="text-lg">Round Efficiency (Avg. POE)</CardTitle></CardHeader>
                <CardContent className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={roundEfficiencyChartData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <RechartsTooltip formatter={(value: number) => value.toFixed(1)}/>
                      <Bar dataKey="Avg POE" fill="hsl(var(--primary))">
                        {roundEfficiencyChartData.map((entry, index) => (
                          <RechartsCell key={`cell-${index}`} fill={entry['Avg POE'] >= 0 ? 'hsl(var(--chart-2))' : 'hsl(var(--destructive))'} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader><CardTitle className="text-lg flex items-center"><ArrowUpCircle className="text-green-500 mr-2 h-5 w-5" />Best Picks (by POE)</CardTitle></CardHeader>
                  <CardContent>
                    {gmDraftData.best_picks && gmDraftData.best_picks.length > 0 ? (
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Player (Team)</TableHead>
                            <TableHead className="text-center">Season</TableHead>
                            <TableHead className="text-center">Pick (Overall)</TableHead>
                            <TableHead className="text-center">Drafted (Pos)</TableHead>
                            <TableHead className="text-center">Finished (Pos)</TableHead>
                            <TableHead className="text-right">POE</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {gmDraftData.best_picks.slice(0,5).map(pick => (
                            <TableRow key={pick.player_id + (pick.draft_id?.toString() || pick.pick_overall.toString())}>
                              <TableCell className="font-medium">{pick.player_name} ({pick.nfl_team_id || 'N/A'})</TableCell>
                              <TableCell className="text-center">{pick.season_id}</TableCell>
                              <TableCell className="text-center">{pick.pick_overall}</TableCell>
                              <TableCell className="text-center">
                                <Badge variant="outline" className={getPositionBadgeClass(pick.player_position)}>
                                  {pick.player_position}{pick.league_positional_draft_rank ?? ''}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-center">
                                {pick.actual_positional_finish_rank !== null && pick.actual_positional_finish_rank !== undefined ? (
                                  <Badge variant="outline" className={getPositionBadgeClass(pick.player_position)}>
                                    {pick.player_position}{pick.actual_positional_finish_rank}
                                  </Badge>
                                ) : (
                                  '-'
                                )}
                              </TableCell>
                              <TableCell className="text-right text-green-600 font-semibold">{pick.pvdre_points_vs_league_draft_rank_exp?.toFixed(1)}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    ) : <p className="text-muted-foreground">No best picks data available.</p>}
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader><CardTitle className="text-lg flex items-center"><ArrowDownCircle className="text-red-500 mr-2 h-5 w-5" />Worst Picks (by POE)</CardTitle></CardHeader>
                  <CardContent>
                    {gmDraftData.worst_picks && gmDraftData.worst_picks.length > 0 ? (
                       <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Player (Team)</TableHead>
                            <TableHead className="text-center">Season</TableHead>
                            <TableHead className="text-center">Pick (Overall)</TableHead>
                            <TableHead className="text-center">Drafted (Pos)</TableHead>
                            <TableHead className="text-center">Finished (Pos)</TableHead>
                            <TableHead className="text-right">POE</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {gmDraftData.worst_picks.slice(0,5).map(pick => (
                            <TableRow key={pick.player_id + (pick.draft_id?.toString() || pick.pick_overall.toString())}>
                               <TableCell className="font-medium">{pick.player_name} ({pick.nfl_team_id || 'N/A'})</TableCell>
                              <TableCell className="text-center">{pick.season_id}</TableCell>
                              <TableCell className="text-center">{pick.pick_overall}</TableCell>
                               <TableCell className="text-center">
                                <Badge variant="outline" className={getPositionBadgeClass(pick.player_position)}>
                                  {pick.player_position}{pick.league_positional_draft_rank ?? ''}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-center">
                                {pick.actual_positional_finish_rank !== null && pick.actual_positional_finish_rank !== undefined ? (
                                  <Badge variant="outline" className={getPositionBadgeClass(pick.player_position)}>
                                    {pick.player_position}{pick.actual_positional_finish_rank}
                                  </Badge>
                                ) : (
                                  '-'
                                )}
                              </TableCell>
                              <TableCell className="text-right text-red-600 font-semibold">{pick.pvdre_points_vs_league_draft_rank_exp?.toFixed(1)}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    ) : <p className="text-muted-foreground">No worst picks data available.</p>}
                  </CardContent>
                </Card>
              </div>

             <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Positional Performance Analysis</CardTitle>
                  <CardDescription>Comparing GM draft value vs. league averages by position.</CardDescription>
                </CardHeader>
                <CardContent>
                {gmDraftData.positional_profile && gmDraftData.positional_profile.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {gmDraftData.positional_profile.map((profile) => {
                        const isOutperforming = typeof profile.gm_average_pvdre === 'number' && 
                                                typeof profile.league_average_pvdre === 'number' && 
                                                profile.league_average_pvdre !== null && 
                                                profile.gm_average_pvdre > profile.league_average_pvdre;
                        const isUnderperforming = typeof profile.gm_average_pvdre === 'number' && 
                                                 typeof profile.league_average_pvdre === 'number' && 
                                                 profile.league_average_pvdre !== null && 
                                                 profile.gm_average_pvdre < profile.league_average_pvdre;
                        
                        let borderColorClass = 'border-border';
                        if (isOutperforming) borderColorClass = 'border-green-500';
                        if (isUnderperforming) borderColorClass = 'border-red-500';

                        return (
                        <Card key={profile.position} className={cn("shadow-md", borderColorClass, "border-2")}>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 pt-4 px-4">
                            <div className="flex items-center gap-2">
                                {getPositionIcon(profile.position)}
                                <CardTitle className="text-base font-medium">{profile.position}</CardTitle>
                            </div>
                            <p className="text-xs text-muted-foreground">Picks: {profile.picks_count}</p>
                            </CardHeader>
                            <CardContent className="px-4 pb-4 space-y-1">
                            <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground">GM Avg POE:</span>
                                <span className={cn("font-semibold", typeof profile.gm_average_pvdre === 'number' && profile.gm_average_pvdre < 0 ? 'text-red-600' : 'text-green-600')}>{formatPvdreValue(profile.gm_average_pvdre)}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground">League Avg POE:</span>
                                <span className={cn("font-semibold", typeof profile.league_average_pvdre === 'number' && profile.league_average_pvdre < 0 ? 'text-red-600' : 'text-green-600')}>{formatPvdreValue(profile.league_average_pvdre)}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground">GM Total POE:</span>
                                <span className={cn("font-semibold", typeof profile.gm_total_pvdre === 'number' && profile.gm_total_pvdre < 0 ? 'text-red-600' : 'text-green-600')}>{formatPvdreValue(profile.gm_total_pvdre)}</span>
                            </div>
                            </CardContent>
                            {(isOutperforming || isUnderperforming) && (
                                <CardFooter className="pt-0 pb-3 px-4">
                                    <div className={cn("flex items-center text-xs font-medium", isOutperforming ? "text-green-600" : "text-red-600")}>
                                    {isOutperforming ? <TrendingUp size={16} className="mr-1" /> : <TrendingDown size={16} className="mr-1" />}
                                    {isOutperforming ? "Outperforming League Avg" : "Underperforming League Avg"}
                                    </div>
                                </CardFooter>
                            )}
                        </Card>
                        );
                    })}
                    </div>
                ) : (
                    <p className="text-muted-foreground">No positional profile data available.</p>
                )}
                </CardContent>
              </Card>
              
            </div>
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

    



    



