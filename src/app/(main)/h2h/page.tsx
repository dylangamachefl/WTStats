
"use client";
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import type { GM, H2HComparisonData } from '@/lib/types';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Users } from 'lucide-react';

const mockGms: GM[] = [
  { id: "gm1", name: "Alice" },
  { id: "gm2", name: "Bob" },
  { id: "gm3", name: "Charlie" },
  { id: "gm4", name: "Diana" },
];

const mockH2HData: H2HComparisonData = {
  gm1Id: "gm1",
  gm1Name: "Alice",
  gm2Id: "gm2",
  gm2Name: "Bob",
  overallRecord: { gm1Wins: 5, gm2Wins: 3, ties: 1 },
  pointsRecord: { gm1Points: 1250.5, gm2Points: 1180.2 },
  matchups: [
    { seasonYear: 2023, week: 1, gm1Score: 120.5, gm2Score: 110.0, winnerId: "gm1" },
    { seasonYear: 2023, week: 8, gm1Score: 105.0, gm2Score: 130.2, winnerId: "gm2" },
    { seasonYear: 2022, week: 5, gm1Score: 98.0, gm2Score: 98.0 }, // Tie
    { seasonYear: 2022, week: "Playoffs R1", gm1Score: 140.0, gm2Score: 115.5, winnerId: "gm1" },
  ],
  playoffMeetings: [
    { seasonYear: 2022, round: "Playoffs R1", winner: "Alice", score: "140.0 - 115.5" }
  ]
};

export default function H2HPage() {
  const [gm1, setGm1] = useState<string | undefined>();
  const [gm2, setGm2] = useState<string | undefined>();
  const [comparisonData, setComparisonData] = useState<H2HComparisonData | null>(null);
  const [loading, setLoading] = useState(false);

  const handleCompare = async () => {
    if (!gm1 || !gm2 || gm1 === gm2) {
      alert("Please select two different GMs.");
      return;
    }
    setLoading(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 500));
    // In a real app, fetch /data/h2h/comparison_${gm1}_vs_${gm2}.json
    // For now, use mock data if Alice and Bob are selected
    if ((gm1 === "gm1" && gm2 === "gm2") || (gm1 === "gm2" && gm2 === "gm1")) {
      setComparisonData(mockH2HData);
    } else {
      const randomData: H2HComparisonData = { // Generate some random data for other pairs
        gm1Id: gm1, gm1Name: mockGms.find(g=>g.id===gm1)?.name || '',
        gm2Id: gm2, gm2Name: mockGms.find(g=>g.id===gm2)?.name || '',
        overallRecord: { gm1Wins: Math.floor(Math.random()*5), gm2Wins: Math.floor(Math.random()*5), ties: Math.floor(Math.random()*2) },
        pointsRecord: { gm1Points: Math.floor(Math.random()*500)+1000, gm2Points: Math.floor(Math.random()*500)+1000 },
        matchups: [], playoffMeetings: []
      };
      setComparisonData(randomData);
    }
    setLoading(false);
  };

  const chartData = comparisonData?.matchups.map((m, index) => ({
    name: `S${m.seasonYear} W${m.week}`,
    [comparisonData.gm1Name]: m.gm1Score,
    [comparisonData.gm2Name]: m.gm2Score,
  })) || [];

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Users /> Head-to-Head Comparison</CardTitle>
          <CardDescription>Select two GMs to compare their historical rivalry.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col sm:flex-row gap-4 items-end">
          <div className="flex-1 space-y-1">
            <label htmlFor="gm1-select" className="text-sm font-medium">GM 1</label>
            <Select value={gm1} onValueChange={setGm1}>
              <SelectTrigger id="gm1-select">
                <SelectValue placeholder="Select GM 1" />
              </SelectTrigger>
              <SelectContent>
                {mockGms.map(gm => (
                  <SelectItem key={gm.id} value={gm.id} disabled={gm.id === gm2}>{gm.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="text-2xl font-bold px-2 hidden sm:block">VS</div>
          <div className="flex-1 space-y-1">
            <label htmlFor="gm2-select" className="text-sm font-medium">GM 2</label>
            <Select value={gm2} onValueChange={setGm2}>
              <SelectTrigger id="gm2-select">
                <SelectValue placeholder="Select GM 2" />
              </SelectTrigger>
              <SelectContent>
                {mockGms.map(gm => (
                  <SelectItem key={gm.id} value={gm.id} disabled={gm.id === gm1}>{gm.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button onClick={handleCompare} disabled={loading || !gm1 || !gm2 || gm1 === gm2} className="w-full sm:w-auto">
            {loading ? "Comparing..." : "Compare"}
          </Button>
        </CardContent>
      </Card>

      {comparisonData && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Rivalry Dashboard: {comparisonData.gm1Name} vs {comparisonData.gm2Name}</CardTitle>
            </CardHeader>
            <CardContent className="grid md:grid-cols-2 gap-4">
              <div>
                <h3 className="font-semibold">Overall Record</h3>
                <p>{comparisonData.gm1Name}: {comparisonData.overallRecord.gm1Wins} Wins</p>
                <p>{comparisonData.gm2Name}: {comparisonData.overallRecord.gm2Wins} Wins</p>
                <p>Ties: {comparisonData.overallRecord.ties}</p>
              </div>
              <div>
                <h3 className="font-semibold">Total Points Scored</h3>
                <p>{comparisonData.gm1Name}: {comparisonData.pointsRecord.gm1Points.toFixed(1)}</p>
                <p>{comparisonData.gm2Name}: {comparisonData.pointsRecord.gm2Points.toFixed(1)}</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Scoring Trends Over Time</CardTitle></CardHeader>
            <CardContent className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey={comparisonData.gm1Name} stroke="var(--color-primary-DEFAULT)" activeDot={{ r: 8 }} />
                  <Line type="monotone" dataKey={comparisonData.gm2Name} stroke="var(--color-accent-DEFAULT)" />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
          
          {comparisonData.playoffMeetings && comparisonData.playoffMeetings.length > 0 && (
             <Card>
                <CardHeader><CardTitle>Playoff Meeting Highlights</CardTitle></CardHeader>
                <CardContent>
                    <ul className="list-disc pl-5">
                    {comparisonData.playoffMeetings.map((meeting, index) => (
                        <li key={index}>
                        {meeting.seasonYear} {meeting.round}: {meeting.winner} won ({meeting.score})
                        </li>
                    ))}
                    </ul>
                </CardContent>
            </Card>
          )}
        </div>
      )}
       {!comparisonData && !loading && gm1 && gm2 && gm1 !== gm2 && (
        <Card>
            <CardContent className="pt-6 text-center text-muted-foreground">
                <p>No comparison data found for {mockGms.find(g=>g.id===gm1)?.name} and {mockGms.find(g=>g.id===gm2)?.name}.</p>
                <p>Mock data is only available for Alice vs Bob.</p>
            </CardContent>
        </Card>
      )}
    </div>
  );
}
