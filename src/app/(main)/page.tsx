
"use client";

import { useEffect, useState } from "react";
import type { LeagueRecord, Season, GM } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowRight, Trophy, Users, BarChart2 } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import {
  ResponsiveContainer,
  BarChart,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
} from "recharts";

// Mock data fetching functions
async function fetchDashboardData() {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 500));
  const champions: Season[] = [
    { id: "2023", year: 2023, championId: "gm1", championName: "The Champs", championTeamName: "Victorious Secret", championPhotoUrl: "https://placehold.co/80x80.png" },
    { id: "2022", year: 2022, championId: "gm2", championName: "Gridiron Greats", championTeamName: "Endzone Eagles", championPhotoUrl: "https://placehold.co/80x80.png" },
    { id: "2021", year: 2021, championId: "gm3", championName: "Fantasy Phenoms", championTeamName: "Touchdown Titans", championPhotoUrl: "https://placehold.co/80x80.png" },
  ];
  const leagueRecords: LeagueRecord[] = [
    { id: "rec1", title: "Most Points in a Season", value: "2250.5", holderName: "GM Alpha", seasonYear: 2022 },
    { id: "rec2", title: "Highest Weekly Score", value: "198.2", holderName: "GM Beta", seasonYear: 2023 },
    { id: "rec3", title: "Longest Winning Streak", value: "9 Games", holderName: "GM Charlie", seasonYear: 2021 },
  ];
  const gms: GM[] = [
    { id: "gm1", name: "GM Alpha" }, { id: "gm2", name: "GM Beta" }, { id: "gm3", name: "GM Charlie" }, { id: "gm4", name: "GM Delta" }
  ];
  return { champions, leagueRecords, gms };
}

const MOCK_POINTS_DISTRIBUTION = [
  { name: '0-50', value: 5 },
  { name: '51-75', value: 15 },
  { name: '76-100', value: 40 },
  { name: '101-125', value: 60 },
  { name: '126-150', value: 30 },
  { name: '150+', value: 10 },
];
const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82Ca9D'];


export default function DashboardPage() {
  const [champions, setChampions] = useState<Season[]>([]);
  const [leagueRecords, setLeagueRecords] = useState<LeagueRecord[]>([]);
  const [gmsCount, setGmsCount] = useState<number>(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      const data = await fetchDashboardData();
      setChampions(data.champions);
      setLeagueRecords(data.leagueRecords);
      setGmsCount(data.gms.length);
      setLoading(false);
    }
    loadData();
  }, []);

  if (loading) {
    return <DashboardLoadingSkeleton />;
  }

  return (
    <div className="space-y-8">
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card className="shadow-lg hover:shadow-xl transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total GMs</CardTitle>
            <Users className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{gmsCount}</div>
            <p className="text-xs text-muted-foreground">Currently active in the league</p>
          </CardContent>
        </Card>
        <Card className="shadow-lg hover:shadow-xl transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Latest Champion</CardTitle>
            <Trophy className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{champions[0]?.championName || "N/A"}</div>
            <p className="text-xs text-muted-foreground">{champions[0]?.year} Season Winner</p>
          </CardContent>
        </Card>
        <Card className="shadow-lg hover:shadow-xl transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Key Record</CardTitle>
            <BarChart2 className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{leagueRecords[0]?.value || "N/A"}</div>
            <p className="text-xs text-muted-foreground">{leagueRecords[0]?.title || "N/A"}</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle>Recent Champions</CardTitle>
            <CardDescription>A hall of fame for the recent league winners.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {champions.slice(0, 3).map((champion) => (
              <div key={champion.id} className="flex items-center gap-4 p-3 bg-secondary/50 rounded-lg">
                <Image data-ai-hint="trophy person" src={champion.championPhotoUrl || "https://placehold.co/80x80.png"} alt={champion.championName || ""} width={60} height={60} className="rounded-full border-2 border-primary" />
                <div>
                  <h3 className="font-semibold text-lg">{champion.championName} ({champion.year})</h3>
                  <p className="text-sm text-muted-foreground">{champion.championTeamName}</p>
                </div>
                <Trophy className="ml-auto h-8 w-8 text-yellow-500" />
              </div>
            ))}
             <Link href="/league-history" passHref>
                <Button variant="outline" className="w-full mt-2">View Full History <ArrowRight className="ml-2 h-4 w-4" /></Button>
              </Link>
          </CardContent>
        </Card>

        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle>League Records Highlights</CardTitle>
            <CardDescription>Some of the most notable achievements in league history.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {leagueRecords.slice(0, 3).map((record) => (
              <div key={record.id} className="p-3 border rounded-lg hover:bg-accent/10 transition-colors">
                <h4 className="font-semibold">{record.title}</h4>
                <p className="text-primary text-xl font-bold">{record.value}</p>
                <p className="text-sm text-muted-foreground">Set by {record.holderName} in {record.seasonYear}</p>
              </div>
            ))}
            <Link href="/league-history" passHref>
              <Button variant="outline" className="w-full mt-2">Explore All Records <ArrowRight className="ml-2 h-4 w-4" /></Button>
            </Link>
          </CardContent>
        </Card>
      </div>
      
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle>Weekly Score Distribution (Mock Data)</CardTitle>
          <CardDescription>A look at the common range of weekly scores across the league.</CardDescription>
        </CardHeader>
        <CardContent className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={MOCK_POINTS_DISTRIBUTION}
                cx="50%"
                cy="50%"
                labelLine={false}
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
                label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
              >
                {MOCK_POINTS_DISTRIBUTION.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}

function DashboardLoadingSkeleton() {
  return (
    <div className="space-y-8 animate-pulse">
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {[...Array(3)].map((_, i) => (
          <Card key={i} className="shadow-lg">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <div className="h-4 bg-muted rounded w-1/2"></div>
              <div className="h-5 w-5 bg-muted rounded-full"></div>
            </CardHeader>
            <CardContent>
              <div className="h-8 bg-muted rounded w-1/3 mb-1"></div>
              <div className="h-3 bg-muted rounded w-3/4"></div>
            </CardContent>
          </Card>
        ))}
      </div>
       <div className="grid gap-6 lg:grid-cols-2">
        <Card className="shadow-lg">
          <CardHeader>
            <div className="h-6 bg-muted rounded w-1/2 mb-1"></div>
            <div className="h-4 bg-muted rounded w-3/4"></div>
          </CardHeader>
          <CardContent className="space-y-4">
            {[...Array(2)].map((_, i) => (
              <div key={i} className="flex items-center gap-4 p-3 bg-muted/50 rounded-lg">
                <div className="h-16 w-16 bg-muted rounded-full"></div>
                <div className="flex-1 space-y-2">
                  <div className="h-5 bg-muted rounded w-3/4"></div>
                  <div className="h-4 bg-muted rounded w-1/2"></div>
                </div>
              </div>
            ))}
            <div className="h-10 bg-muted rounded w-full mt-2"></div>
          </CardContent>
        </Card>
        <Card className="shadow-lg">
          <CardHeader>
            <div className="h-6 bg-muted rounded w-1/2 mb-1"></div>
            <div className="h-4 bg-muted rounded w-3/4"></div>
          </CardHeader>
          <CardContent className="space-y-3">
            {[...Array(2)].map((_, i) => (
               <div key={i} className="p-3 border border-muted rounded-lg space-y-2">
                <div className="h-4 bg-muted rounded w-5/6"></div>
                <div className="h-6 bg-muted rounded w-1/3"></div>
                <div className="h-3 bg-muted rounded w-1/2"></div>
              </div>
            ))}
            <div className="h-10 bg-muted rounded w-full mt-2"></div>
          </CardContent>
        </Card>
      </div>
      <Card className="shadow-lg">
        <CardHeader>
          <div className="h-6 bg-muted rounded w-1/2 mb-1"></div>
          <div className="h-4 bg-muted rounded w-3/4"></div>
        </CardHeader>
        <CardContent className="h-[300px] w-full bg-muted/50 rounded-md">
        </CardContent>
      </Card>
    </div>
  );
}

