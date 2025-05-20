
"use client";
import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { Season, GM, SeasonDraftData, GMDraftHistoryData } from '@/lib/types';
// Removed AI related imports: getDraftStrategyInsights, DraftStrategyInsightsOutput, Loader2, Zap, Textarea, Alert

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

// DraftStrategyAIInsights component removed

export default function DraftHistoryPage() {
  return (
    <Tabs defaultValue="season-draft" className="w-full">
      <TabsList className="grid w-full grid-cols-2 mb-6"> {/* Changed grid-cols-3 to grid-cols-2 */}
        <TabsTrigger value="season-draft">Season Draft Detail</TabsTrigger>
        <TabsTrigger value="gm-draft-history">GM Draft History</TabsTrigger>
        {/* AI Insights TabTrigger removed */}
      </TabsList>
      <TabsContent value="season-draft">
        <SeasonDraftDetail />
      </TabsContent>
      <TabsContent value="gm-draft-history">
        <GMDraftHistory />
      </TabsContent>
      {/* AI Insights TabsContent removed */}
    </Tabs>
  );
}
