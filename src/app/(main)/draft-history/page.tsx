
"use client";
import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import type { Season, GM, SeasonDraftData, GMDraftHistoryData, LeagueHistoryForAI } from '@/lib/types';
import { getDraftStrategyInsights, type DraftStrategyInsightsOutput } from '@/ai/flows/draft-strategy-insights';
import { Loader2, Zap } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

// Mock Data
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

// Mock league history data for AI - In a real app, this would be fetched from public/data
const mockLeagueHistoryForAI: LeagueHistoryForAI = {
  seasons: [
    {
      year: 2023, champion: "Alice",
      draftPicks: mockSeasonDraftData.draftPicks.map(p => ({ round: p.round, pick: p.pickOverall, player: p.playerName, gm: p.pickedByGmName })),
      finalStandings: mockGms.map((gm, i) => ({ gm: gm.name, rank: i + 1 }))
    },
    {
      year: 2022, champion: "Bob",
      draftPicks: mockSeasonDraftData.draftPicks.slice(0,20).map(p => ({ round: p.round, pick: p.pickOverall, player: p.playerName, gm: p.pickedByGmName })), // fewer picks for variety
      finalStandings: mockGms.map((gm, i) => ({ gm: gm.name, rank: (i+1 % mockGms.length) +1 })) // different ranks
    }
  ]
};


const SeasonDraftDetail = () => {
  const [selectedSeason, setSelectedSeason] = useState<string | undefined>(mockSeasons[0]?.id);
  // Add state for toggles (value, reach/steal) if implementing DH.1.3, DH.1.4

  return (
    <div className="space-y-6">
      <Select value={selectedSeason} onValueChange={setSelectedSeason}>
        <SelectTrigger className="w-[280px]">
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
            <CardDescription>Interactive draft board, analysis, and grades.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <Card>
                    <CardHeader><CardTitle>Draft Grades</CardTitle></CardHeader>
                    <CardContent><p className="text-muted-foreground">Placeholder for draft grade dashboard.</p></CardContent>
                </Card>
                 <Card>
                    <CardHeader><CardTitle>Top Steals & Busts</CardTitle></CardHeader>
                    <CardContent><p className="text-muted-foreground">Placeholder for season's top steals and busts.</p></CardContent>
                </Card>
            </div>
            <CardTitle className="text-lg mb-2">Draft Board</CardTitle>
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
    </div>
  );
};

const GMDraftHistory = () => {
  const [selectedGm, setSelectedGm] = useState<string | undefined>(mockGms[0]?.id);

  return (
    <div className="space-y-6">
      <Select value={selectedGm} onValueChange={setSelectedGm}>
        <SelectTrigger className="w-[280px]">
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
          <CardContent>
            <p>Placeholder for GM draft history components and Recharts visualizations.</p>
            <p>Best picks: {mockGMDraftHistory.bestPicks.map(p => p.playerName).join(', ')}</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

const DraftStrategyAIInsights = () => {
  const [insights, setInsights] = useState<DraftStrategyInsightsOutput | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [leagueHistoryJson, setLeagueHistoryJson] = useState<string>(JSON.stringify(mockLeagueHistoryForAI, null, 2));

  const handleGenerateInsights = async () => {
    setLoading(true);
    setError(null);
    setInsights(null);
    try {
      // In a real app, fetch leagueHistory from a file or construct it dynamically
      // For this example, we use mock data stringified from state.
      // const response = await fetch('/data/league_history_for_ai.json');
      // if (!response.ok) throw new Error('Failed to load league history data');
      // const leagueHistoryData = await response.json();
      
      // The AI flow expects a stringified JSON
      const result = await getDraftStrategyInsights({ leagueHistory: leagueHistoryJson });
      setInsights(result);
    } catch (e) {
      console.error(e);
      setError(e instanceof Error ? e.message : "An unknown error occurred.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><Zap className="text-primary" /> AI-Powered Draft Strategy Insights</CardTitle>
        <CardDescription>Analyze historical league data to uncover optimal drafting strategies. Provide league history JSON below (or it will use mock data).</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <label htmlFor="leagueHistoryJson" className="block text-sm font-medium text-gray-700 mb-1">
            League History Data (JSON format for AI)
          </label>
          <Textarea 
            id="leagueHistoryJson"
            value={leagueHistoryJson}
            onChange={(e) => setLeagueHistoryJson(e.target.value)}
            rows={8}
            className="font-mono text-xs"
            placeholder="Paste league history JSON here..."
          />
           <p className="mt-1 text-xs text-muted-foreground">Edit the mock data or paste your league's historical data in JSON format to get tailored insights.</p>
        </div>
        <Button onClick={handleGenerateInsights} disabled={loading}>
          {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Generate Insights
        </Button>
        {error && (
          <Alert variant="destructive">
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        {insights && (
          <div className="space-y-6 pt-4">
            <Card className="bg-primary/5 border-primary/20">
              <CardHeader>
                <CardTitle>Overall Strategy Grade: <span className="text-primary">{insights.overallGrade}</span></CardTitle>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader><CardTitle>Key Insights</CardTitle></CardHeader>
              <CardContent>
                <ul className="list-disc pl-5 space-y-1 text-sm">
                  {insights.keyInsights.map((insight, index) => <li key={index}>{insight}</li>)}
                </ul>
              </CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle>Suggested Strategies</CardTitle></CardHeader>
              <CardContent>
                <ul className="list-disc pl-5 space-y-1 text-sm">
                  {insights.suggestedStrategies.map((strategy, index) => <li key={index}>{strategy}</li>)}
                </ul>
              </CardContent>
            </Card>
          </div>
        )}
      </CardContent>
    </Card>
  );
};


export default function DraftHistoryPage() {
  return (
    <Tabs defaultValue="season-draft" className="w-full">
      <TabsList className="grid w-full grid-cols-3 mb-6">
        <TabsTrigger value="season-draft">Season Draft Detail</TabsTrigger>
        <TabsTrigger value="gm-draft-history">GM Draft History</TabsTrigger>
        <TabsTrigger value="ai-insights">AI Insights</TabsTrigger>
      </TabsList>
      <TabsContent value="season-draft">
        <SeasonDraftDetail />
      </TabsContent>
      <TabsContent value="gm-draft-history">
        <GMDraftHistory />
      </TabsContent>
      <TabsContent value="ai-insights">
        <DraftStrategyAIInsights />
      </TabsContent>
    </Tabs>
  );
}
