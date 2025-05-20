
"use client";
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { Season, GM, CareerStat, LeagueRecord, FinalStanding, PlayoffAppearanceRate } from '@/lib/types';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import Image from 'next/image';

// Mock data - replace with actual data fetching from public/data/*.json
const mockSeasons: Season[] = [
  { id: "2023", year: 2023, championId: "gm1", championName: "The Champs", championTeamName: "Victorious Secret", championPhotoUrl: "https://placehold.co/60x60.png" },
  { id: "2022", year: 2022, championId: "gm2", championName: "Gridiron Greats", championTeamName: "Endzone Eagles", championPhotoUrl: "https://placehold.co/60x60.png" },
  { id: "2021", year: 2021, championId: "gm3", championName: "Fantasy Phenoms", championTeamName: "Touchdown Titans", championPhotoUrl: "https://placehold.co/60x60.png" },
];

const mockGms: GM[] = [
  { id: "gm1", name: "Alice" },
  { id: "gm2", name: "Bob" },
  { id: "gm3", name: "Charlie" },
  { id: "gm4", name: "Diana" },
];

const mockCareerStats: CareerStat[] = mockGms.map(gm => ({
  gmId: gm.id,
  gmName: gm.name,
  wins: Math.floor(Math.random() * 100),
  losses: Math.floor(Math.random() * 100),
  ties: Math.floor(Math.random() * 10),
  championships: Math.floor(Math.random() * 3),
  playoffAppearances: Math.floor(Math.random() * 5),
  pointsFor: Math.floor(Math.random() * 5000) + 10000,
  pointsAgainst: Math.floor(Math.random() * 5000) + 10000,
}));

const mockLeagueRecords: LeagueRecord[] = [
  { id: "rec1", title: "Most Points in a Season", value: "2250.5", holderName: "Alice", seasonYear: 2022 },
  { id: "rec2", title: "Highest Weekly Score", value: "198.2", holderName: "Bob", seasonYear: 2023 },
  { id: "rec3", title: "Longest Winning Streak", value: "9 Games", holderName: "Charlie", seasonYear: 2021 },
];

const mockPlayoffRates: PlayoffAppearanceRate[] = mockGms.map(gm => ({
  gmId: gm.id,
  gmName: gm.name,
  rate: Math.random() * 0.8 + 0.2, // Rate between 20% and 100%
}));

const mockFinalStandings: FinalStanding[] = mockSeasons.flatMap(season => 
  mockGms.map((gm, index) => ({
    seasonYear: season.year,
    gmId: gm.id,
    gmName: gm.name,
    position: (index % mockGms.length) + 1 // Simplified positions
  }))
);

const AllSeasonsOverview = () => (
  <div className="space-y-6">
    <Card>
      <CardHeader>
        <CardTitle>Championship Timeline</CardTitle>
        <CardDescription>A chronological display of league champions.</CardDescription>
      </CardHeader>
      <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {mockSeasons.map(season => (
          <Card key={season.id} className="flex flex-col items-center p-4 text-center bg-card hover:shadow-lg transition-shadow">
            <Image data-ai-hint="trophy winner" src={season.championPhotoUrl || "https://placehold.co/80x80.png"} alt={season.championName || "Champion"} width={80} height={80} className="rounded-full mb-2 border-2 border-primary" />
            <p className="font-semibold text-lg">{season.championName}</p>
            <p className="text-sm text-muted-foreground">{season.championTeamName}</p>
            <p className="text-xs text-muted-foreground">Champion of {season.year}</p>
          </Card>
        ))}
      </CardContent>
    </Card>

    <Card>
      <CardHeader><CardTitle>Career Leaderboard</CardTitle></CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>GM</TableHead>
              <TableHead>Wins</TableHead>
              <TableHead>Losses</TableHead>
              <TableHead>Ties</TableHead>
              <TableHead>Championships</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {mockCareerStats.map(stat => (
              <TableRow key={stat.gmId}>
                <TableCell>{stat.gmName}</TableCell>
                <TableCell>{stat.wins}</TableCell>
                <TableCell>{stat.losses}</TableCell>
                <TableCell>{stat.ties}</TableCell>
                <TableCell>{stat.championships}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
    
    <Card>
        <CardHeader><CardTitle>Playoff Qualification Rate</CardTitle></CardHeader>
        <CardContent className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
            <BarChart data={mockPlayoffRates.sort((a,b) => b.rate - a.rate)}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="gmName" />
                <YAxis tickFormatter={(value) => `${(value * 100).toFixed(0)}%`} />
                <Tooltip formatter={(value: number) => `${(value * 100).toFixed(1)}%`} />
                <Legend />
                <Bar dataKey="rate" fill="var(--color-primary-DEFAULT)" name="Playoff Rate" />
            </BarChart>
            </ResponsiveContainer>
        </CardContent>
    </Card>
  </div>
);

const SeasonDetail = () => {
  const [selectedSeason, setSelectedSeason] = useState<string | undefined>(mockSeasons[0]?.id);

  return (
    <div className="space-y-6">
      <Select value={selectedSeason} onValueChange={setSelectedSeason}>
        <SelectTrigger className="w-[280px]">
          <SelectValue placeholder="Select a season" />
        </SelectTrigger>
        <SelectContent>
          {mockSeasons.map(season => (
            <SelectItem key={season.id} value={season.id}>{season.year} Season</SelectItem>
          ))}
        </SelectContent>
      </Select>
      {selectedSeason && (
        <Card>
          <CardHeader><CardTitle>{mockSeasons.find(s => s.id === selectedSeason)?.year} Season Details</CardTitle></CardHeader>
          <CardContent>
            <Tabs defaultValue="overview">
              <TabsList>
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="weekly_scores">Weekly Scores</TabsTrigger>
                <TabsTrigger value="top_performers">Top Performers</TabsTrigger>
              </TabsList>
              <TabsContent value="overview" className="pt-4">
                <p>Standings and playoff bracket for {selectedSeason}.</p>
                {/* Placeholder for standings table and playoff bracket component */}
              </TabsContent>
              <TabsContent value="weekly_scores" className="pt-4">
                <p>Weekly scores heatmap for {selectedSeason}.</p>
                {/* Placeholder for Recharts heatmap */}
              </TabsContent>
              <TabsContent value="top_performers" className="pt-4">
                <p>Top performing players for {selectedSeason}.</p>
                {/* Placeholder for top performers list/table */}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

const GMCareer = () => {
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
          <CardHeader><CardTitle>{mockGms.find(g => g.id === selectedGm)?.name}'s Career</CardTitle></CardHeader>
          <CardContent>
            <p>Detailed career statistics, season progression, and more for {selectedGm}.</p>
            {/* Placeholder for GM career components and charts */}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default function LeagueHistoryPage() { // Function name kept for simplicity, path makes it the homepage
  return (
    <Tabs defaultValue="all-seasons" className="w-full">
      <TabsList className="grid w-full grid-cols-3 mb-6">
        <TabsTrigger value="all-seasons">All Seasons Overview</TabsTrigger>
        <TabsTrigger value="season-detail">Season Detail</TabsTrigger>
        <TabsTrigger value="gm-career">GM Career</TabsTrigger>
      </TabsList>
      <TabsContent value="all-seasons">
        <AllSeasonsOverview />
      </TabsContent>
      <TabsContent value="season-detail">
        <SeasonDetail />
      </TabsContent>
      <TabsContent value="gm-career">
        <GMCareer />
      </TabsContent>
    </Tabs>
  );
}
