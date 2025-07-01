// src/components/draft-history/DraftOverview.tsx
"use client";

import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableFooter } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import type { GMDraftSeasonPerformance, DraftOverviewData, GMAverageMetrics, SeasonAverageMetrics, DraftPickDetail } from '@/lib/types';
import { BarChart as BarChartLucide, ArrowUpDown, ArrowUpCircle, ArrowDownCircle } from 'lucide-react';
import { cn, getPositionBadgeClass } from "@/lib/utils";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Badge } from '@/components/ui/badge';
import { Button } from "@/components/ui/button";
import { fetcher } from '@/lib/fetcher';

// --- Type definitions specific to this component ---
interface HeatmapSortConfig {
  key: 'gm_name' | null;
  direction: 'asc' | 'desc';
}
interface TransformedHeatmapData {
  [gmName: string]: { [seasonYear: string]: GMDraftSeasonPerformance | undefined; };
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
  avg_pvdre: { label: 'POE', key: 'avg_pvdre', format: (val) => (typeof val === 'number' ? val.toFixed(1) : '-'), tooltipLabel: 'POE (Points Over Expected)', description: 'Points Over Expected (POE) shows average points scored over a baseline. Colors relative to average.' },
  pvdre_hit_rate: { label: 'Hit Rate %', key: 'pvdre_hit_rate', format: (val) => (typeof val === 'number' ? (val * 100).toFixed(1) + '%' : '-'), tooltipLabel: 'Hit Rate %', description: 'Hit Rate % indicates the percentage of draft picks that met or exceeded expectations. Colors relative to average.' },
  avg_value_vs_adp: { label: 'Value vs ADP', key: 'avg_value_vs_adp', format: (val) => (typeof val === 'number' ? val.toFixed(1) : '-'), tooltipLabel: 'Avg Value vs ADP', description: 'Average Value vs ADP. Green for positive (steal), red for negative (reach).' },
};


const formatPositionalRank = (position?: string, rank?: number | null) => {
  if (!position || rank == null) return '-';
  return `${position}${rank}`;
};


// --- The Main Component ---
export default function DraftOverview() {
  const [overviewData, setOverviewData] = useState<DraftOverviewData | null>(null);
  const [rawData, setRawData] = useState<GMDraftSeasonPerformance[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sortConfig, setSortConfig] = useState<HeatmapSortConfig>({ key: 'gm_name', direction: 'asc' });
  const [selectedMetric, setSelectedMetric] = useState<HeatmapMetricKey>('pvdre_hit_rate');

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const data: DraftOverviewData = await fetcher('/data/draft_data/gm_season_performance_grid.json');
        setOverviewData(data);
        setRawData(data.gmSeasonPerformanceGrid || null);
      } catch (err) {
        setError(err instanceof Error ? err.message : "An unknown error occurred");
        setOverviewData(null);
        setRawData(null);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const { currentMin, currentMax } = useMemo(() => {
    if (!rawData) return { currentMin: 0, currentMax: 0 };
    const values = rawData.map(item => item[selectedMetric] as number).filter(val => typeof val === 'number');
    if (values.length === 0) return { currentMin: 0, currentMax: 0 };
    return { currentMin: Math.min(...values), currentMax: Math.max(...values) };
  }, [rawData, selectedMetric]);

  const { minGmAvg, maxGmAvg } = useMemo(() => {
    if (!overviewData?.gmAverages) return { minGmAvg: 0, maxGmAvg: 0 };
    const values = overviewData.gmAverages.map(item => item[selectedMetric] as number).filter(val => typeof val === 'number');
    if (values.length === 0) return { minGmAvg: 0, maxGmAvg: 0 };
    return { minGmAvg: Math.min(...values), maxGmAvg: Math.max(...values) };
  }, [overviewData?.gmAverages, selectedMetric]);

  const { minSeasonAvg, maxSeasonAvg } = useMemo(() => {
    if (!overviewData?.seasonAverages) return { minSeasonAvg: 0, maxSeasonAvg: 0 };
    const values = overviewData.seasonAverages.map(item => item[selectedMetric] as number).filter(val => typeof val === 'number');
    if (values.length === 0) return { minSeasonAvg: 0, maxSeasonAvg: 0 };
    return { minSeasonAvg: Math.min(...values), maxSeasonAvg: Math.max(...values) };
  }, [overviewData?.seasonAverages, selectedMetric]);
  
  const overallAverage = useMemo(() => {
    if (!rawData) return null;
    const values = rawData.map(item => item[selectedMetric] as number).filter(val => typeof val === 'number');
    if (values.length === 0) return null;
    return values.reduce((sum, val) => sum + val, 0) / values.length;
  }, [rawData, selectedMetric]);

  const { heatmapData, gmNames, seasonYears } = useMemo(() => {
    if (!rawData) return { heatmapData: {}, gmNames: [], seasonYears: [] };
    const transformed: TransformedHeatmapData = rawData.reduce((acc, item) => {
      if (item.gm_name) {
        if (!acc[item.gm_name]) acc[item.gm_name] = {};
        acc[item.gm_name][item.season_id.toString()] = item;
      }
      return acc;
    }, {} as TransformedHeatmapData);
    let sortedGmNames = Array.from(new Set(rawData.map(item => item.gm_name).filter(Boolean) as string[]));
    if (sortConfig.key === 'gm_name') sortedGmNames.sort((a, b) => sortConfig.direction === 'asc' ? a.localeCompare(b) : b.localeCompare(a));
    const uniqueSeasonYears = Array.from(new Set(rawData.map(item => item.season_id.toString()))).sort((a, b) => parseInt(a) - parseInt(b));
    return { heatmapData: transformed, gmNames: sortedGmNames, seasonYears: uniqueSeasonYears };
  }, [rawData, sortConfig]);

  const getCellStyle = (performanceData: GMDraftSeasonPerformance | undefined | null, metricKey: HeatmapMetricKey, metricMinValue: number, metricMaxValue: number): string => {
    const value = performanceData?.[metricKey] as number | undefined | null;
    if (value == null) return 'bg-muted/30 text-muted-foreground';
    let baseClasses = "font-semibold ";
    if (metricKey === 'avg_value_vs_adp') {
      const threshold = 0.1;
      if (value > threshold) return baseClasses + 'bg-green-200 text-green-800 dark:bg-green-800/30 dark:text-green-200';
      if (value < -threshold) return baseClasses + 'bg-red-200 text-red-800 dark:bg-red-800/30 dark:text-red-200';
      return baseClasses + 'bg-neutral-100 text-neutral-700 dark:bg-neutral-800/30 dark:text-neutral-200';
    } else {
      const range = metricMaxValue - metricMinValue;
      if (range === 0) return baseClasses + 'bg-neutral-100 text-neutral-700 dark:bg-neutral-800/30 dark:text-neutral-200';
      const normalizedValue = (value - metricMinValue) / range;
      const neutralBandStart = 0.40;
      const neutralBandEnd = 0.60;
      if (normalizedValue >= neutralBandStart && normalizedValue <= neutralBandEnd) return baseClasses + 'bg-neutral-100 text-neutral-700 dark:bg-neutral-800/30 dark:text-neutral-200';
      else if (normalizedValue < neutralBandStart) {
        const intensity = Math.min(1, (neutralBandStart - normalizedValue) / neutralBandStart);
        if (intensity > 0.66) return baseClasses + 'bg-red-300 text-red-800 dark:bg-red-700/50 dark:text-red-200';
        if (intensity > 0.33) return baseClasses + 'bg-red-200 text-red-800 dark:bg-red-800/30 dark:text-red-200';
        return baseClasses + 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300';
      } else {
        const intensity = Math.min(1, (normalizedValue - neutralBandEnd) / (1 - neutralBandEnd));
        if (intensity > 0.66) return baseClasses + 'bg-green-300 text-green-800 dark:bg-green-700/50 dark:text-green-200';
        if (intensity > 0.33) return baseClasses + 'bg-green-200 text-green-800 dark:bg-green-800/30 dark:text-green-200';
        return baseClasses + 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300';
      }
    }
  };

  const requestSort = (key: 'gm_name') => setSortConfig(prev => ({ key, direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc' }));
  const getSortIcon = (columnKey: 'gm_name') => sortConfig.key === columnKey ? <ArrowUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" /> : <ArrowUpDown className="ml-2 h-4 w-4 shrink-0 opacity-0 group-hover:opacity-50" />;

  if (loading) return <div className="space-y-6"><Card><CardHeader><CardTitle>Draft Performance Heatmap</CardTitle><CardDescription>Loading...</CardDescription></CardHeader><CardContent><Skeleton className="h-64 w-full" /></CardContent></Card></div>;
  if (error) return <Card><CardContent>Error: {error}</CardContent></Card>;
  if (!overviewData || !rawData) return <Card><CardContent>No draft overview data available.</CardContent></Card>;

  return (
    <TooltipProvider>
      <div className="space-y-6">
        <Card>
          <CardHeader className="flex flex-col sm:flex-row justify-between items-start sm:items-center">
              <div><CardTitle className="flex items-center gap-2"><BarChartLucide /> Draft Performance Heatmap</CardTitle><CardDescription className="mt-1">{metricConfigs[selectedMetric].description}</CardDescription></div>
              <RadioGroup value={selectedMetric} onValueChange={(v) => setSelectedMetric(v as HeatmapMetricKey)} className="flex flex-wrap gap-x-4 gap-y-2 mt-4 sm:mt-0">
                  {Object.values(metricConfigs).map(config => (<div key={config.key} className="flex items-center space-x-2"><RadioGroupItem value={config.key} id={config.key} /><Label htmlFor={config.key}>{config.label}</Label></div>))}
              </RadioGroup>
          </CardHeader>
          <CardContent><div className="overflow-x-auto"><Table className="min-w-full border-collapse">
            <TableHeader><TableRow><TableHead className="sticky left-0 bg-card z-10 p-2 border text-xs md:text-sm"><Button variant="ghost" onClick={() => requestSort('gm_name')} className="px-1 group">GM Name {getSortIcon('gm_name')}</Button></TableHead>{seasonYears.map(year => (<TableHead key={year} className="p-2 border text-center text-xs md:text-sm whitespace-nowrap">{year}</TableHead>))}<TableHead className="p-2 border text-center text-xs md:text-sm whitespace-nowrap font-bold bg-muted/50 dark:bg-muted/30">GM Avg</TableHead></TableRow></TableHeader>
            <TableBody>{gmNames.map(gm_name => {
                const gmAvgData = overviewData.gmAverages?.find(avg => avg.gm_name === gm_name);
                const gmAvgValue = gmAvgData ? gmAvgData[selectedMetric] : undefined;
                const gmAvgPerfObject: GMDraftSeasonPerformance = { gm_name, avg_pvdre: gmAvgData?.avg_pvdre, pvdre_hit_rate: gmAvgData?.pvdre_hit_rate, avg_value_vs_adp: gmAvgData?.avg_value_vs_adp };
                return (<TableRow key={gm_name}><TableCell className="font-medium sticky left-0 bg-card z-10 p-2 border whitespace-nowrap">{gm_name}</TableCell>{seasonYears.map(year => {
                    const perfData = heatmapData[gm_name]?.[year];
                    const metricValue = perfData?.[selectedMetric];
                    const cellClasses = getCellStyle(perfData, selectedMetric, currentMin, currentMax);
                    const displayValue = metricConfigs[selectedMetric].format(metricValue);
                    return (<TableCell key={`${gm_name}-${year}`} className="p-0 border text-center text-sm" style={{minWidth: '70px'}}>
                        <Tooltip delayDuration={100}><TooltipTrigger asChild><div className={cn("p-2 h-full w-full", cellClasses)}>{displayValue}</div></TooltipTrigger>
                          {perfData && <TooltipContent className="p-3 bg-popover text-popover-foreground shadow-md rounded-lg border w-48">
                            <p className="font-semibold text-sm mb-1">{perfData.gm_name} - {perfData.season_id}</p>
                            <div className="space-y-1 text-xs">
                              <div className="flex justify-between"><span>POE per pick:</span> <span className="font-medium">{perfData.avg_pvdre?.toFixed(2) ?? 'N/A'}</span></div>
                              <div className="flex justify-between"><span>Hit Rate:</span> <span className="font-medium">{perfData.pvdre_hit_rate != null ? (perfData.pvdre_hit_rate * 100).toFixed(1) + '%' : 'N/A'}</span></div>
                              <div className="flex justify-between"><span>Avg Value vs ADP:</span> <span className="font-medium">{perfData.avg_value_vs_adp?.toFixed(2) ?? 'N/A'}</span></div>
                              <div className="flex justify-between"><span>Total Picks:</span> <span className="font-medium">{perfData.total_picks ?? 'N/A'}</span></div>
                              <div className="flex justify-between"><span>Total POE:</span> <span className="font-medium">{perfData.total_pvdre?.toFixed(2) ?? 'N/A'}</span></div>
                            </div>
                          </TooltipContent>}
                        </Tooltip>
                    </TableCell>);
                })}
                <TableCell className="p-0 border text-center text-sm font-bold bg-muted/50 dark:bg-muted/30"><Tooltip delayDuration={100}><TooltipTrigger asChild><div className={cn("p-2 h-full w-full", getCellStyle(gmAvgPerfObject, selectedMetric, minGmAvg, maxGmAvg))}>{metricConfigs[selectedMetric].format(gmAvgValue)}</div></TooltipTrigger><TooltipContent><p className="font-semibold">{gm_name} - Career Avg</p></TooltipContent></Tooltip></TableCell>
                </TableRow>);
            })}</TableBody>
            <TableFooter><TableRow><TableCell className="font-bold sticky left-0 bg-muted/60 dark:bg-muted/40 z-10 p-2 border">Season Avg</TableCell>{seasonYears.map(year => {
                const seasonAvgData = overviewData.seasonAverages?.find(sa => sa.season_id.toString() === year);
                const seasonAvgValue = seasonAvgData ? seasonAvgData[selectedMetric] : undefined;
                const seasonAvgPerfObject: GMDraftSeasonPerformance = { season_id: parseInt(year), gm_name: "League Average", avg_pvdre: seasonAvgData?.avg_pvdre, pvdre_hit_rate: seasonAvgData?.pvdre_hit_rate, avg_value_vs_adp: seasonAvgData?.avg_value_vs_adp };
                return (<TableCell key={`season-avg-${year}`} className="p-0 border text-center font-bold bg-muted/60 dark:bg-muted/40"><Tooltip delayDuration={100}><TooltipTrigger asChild><div className={cn("p-2 h-full w-full", getCellStyle(seasonAvgPerfObject, selectedMetric, minSeasonAvg, maxSeasonAvg))}>{metricConfigs[selectedMetric].format(seasonAvgValue)}</div></TooltipTrigger><TooltipContent><p className="font-semibold">{year} Season Average</p></TooltipContent></Tooltip></TableCell>);
            })}
            <TableCell className="p-0 border text-center font-bold bg-muted/80 dark:bg-muted/50"><Tooltip delayDuration={100}><TooltipTrigger asChild><div className={cn("p-2 h-full w-full", getCellStyle({avg_pvdre: overallAverage, pvdre_hit_rate: overallAverage, avg_value_vs_adp: overallAverage} as GMDraftSeasonPerformance, selectedMetric, currentMin, currentMax))}>{metricConfigs[selectedMetric].format(overallAverage)}</div></TooltipTrigger><TooltipContent>Overall League Average</TooltipContent></Tooltip></TableCell>
            </TableRow></TableFooter>
          </Table></div></CardContent>
        </Card>
        <div className="grid md:grid-cols-2 gap-6 mt-6">
          <Card>
            <CardHeader><CardTitle className="flex items-center gap-2"><ArrowUpCircle className="text-green-500" /> All-Time Top Draft Steals</CardTitle></CardHeader>
            <CardContent className="overflow-x-auto">
              {overviewData.allTimeDraftSteals?.length > 0 ? <Table>
                <TableHeader><TableRow><TableHead>Player</TableHead><TableHead className="text-center">Season</TableHead><TableHead className="text-center">Overall Pick</TableHead><TableHead>GM</TableHead><TableHead>Drafted (Pos)</TableHead><TableHead>Finished (Pos)</TableHead><TableHead className="text-right">PVDRE</TableHead></TableRow></TableHeader>
                <TableBody>
                  {overviewData.allTimeDraftSteals.slice(0, 10).map((pick, index) => (<TableRow key={`steal-${index}`}>
                    <TableCell>{pick.player_name}</TableCell>
                    <TableCell className="text-center">{pick.season_id}</TableCell>
                    <TableCell className="text-center">{pick.pick_overall}</TableCell>
                    <TableCell>{pick.gm_name}</TableCell>
                    <TableCell><Badge variant="outline" className={cn(getPositionBadgeClass(pick.player_position))}>{formatPositionalRank(pick.player_position, pick.league_positional_draft_rank)}</Badge></TableCell>
                    <TableCell><Badge variant="outline" className={cn(getPositionBadgeClass(pick.player_position))}>{formatPositionalRank(pick.player_position, pick.actual_positional_finish_rank)}</Badge></TableCell>
                    <TableCell className="text-right font-semibold text-green-600">{pick.pvdre_points_vs_league_draft_rank_exp?.toFixed(1)}</TableCell>
                  </TableRow>))}
                </TableBody>
              </Table> : <p>No data available.</p>}
            </CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle className="flex items-center gap-2"><ArrowDownCircle className="text-red-500" /> All-Time Top Draft Busts</CardTitle></CardHeader>
            <CardContent className="overflow-x-auto">
              {overviewData.allTimeDraftBusts?.length > 0 ? <Table>
                <TableHeader><TableRow><TableHead>Player</TableHead><TableHead className="text-center">Season</TableHead><TableHead className="text-center">Overall Pick</TableHead><TableHead>GM</TableHead><TableHead>Drafted (Pos)</TableHead><TableHead>Finished (Pos)</TableHead><TableHead className="text-right">PVDRE</TableHead></TableRow></TableHeader>
                <TableBody>
                  {overviewData.allTimeDraftBusts.slice(0, 10).map((pick, index) => (<TableRow key={`bust-${index}`}>
                    <TableCell>{pick.player_name}</TableCell>
                    <TableCell className="text-center">{pick.season_id}</TableCell>
                    <TableCell className="text-center">{pick.pick_overall}</TableCell>
                    <TableCell>{pick.gm_name}</TableCell>
                    <TableCell><Badge variant="outline" className={cn(getPositionBadgeClass(pick.player_position))}>{formatPositionalRank(pick.player_position, pick.league_positional_draft_rank)}</Badge></TableCell>
                    <TableCell><Badge variant="outline" className={cn(getPositionBadgeClass(pick.player_position))}>{formatPositionalRank(pick.player_position, pick.actual_positional_finish_rank)}</Badge></TableCell>
                    <TableCell className="text-right font-semibold text-red-600">{pick.pvdre_points_vs_league_draft_rank_exp?.toFixed(1)}</TableCell>
                  </TableRow>))}
                </TableBody>
              </Table> : <p>No data available.</p>}
            </CardContent>
          </Card>
        </div>
      </div>
    </TooltipProvider>
  );
};
