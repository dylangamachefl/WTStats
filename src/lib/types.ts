
export interface GM {
  id: string;
  name: string;
  teamName?: string; // Optional: GM's current/last known team name
  photoUrl?: string; // Optional: URL to GM's photo
}

export interface ChampionTimelineEntry {
  year: number;
  championName: string;
  teamName: string;
  imgUrl: string | null;
  wins: number;
  losses: number;
  pointsFor: number;
  pointsAgainst: number;
  roster: string;
  parsedRoster: string[];
}

// This replaces the old Season type for the main page context
// export interface Season {
//   id: string; // e.g., "2023"
//   year: number;
//   championId?: string;
//   championName?: string;
//   championTeamName?: string;
//   championPhotoUrl?: string;
// }


export interface LeagueRecord {
  gm_name: string;
  seasons: string; // e.g., "2019" or "2019-2021"
  week: string; // e.g., "5" or ""
  value: string | number;
  record_category: string; // e.g., "Highest Score"
}

export interface CareerStat {
  name: string; // GM's name
  wins: number;
  losses: number;
  ties: number;
  championships: number;
  pointsFor: number; // from JSON "points"
  pointsAgainst: number;
  winPct: string; // e.g., "53.66%"
  playoffRate: number; // e.g., 0.44
  acquisitions: number;
  avgRegularSeasonFinish: number;
  avgFinalStanding: number;
}

export interface PlayoffAppearanceRate {
  gm_name: string;
  seasons_played: number;
  playoff_appearances: number;
  qualification_rate: number; // percentage, e.g. 0.75 for 75%
}

export interface FinalStandingsHeatmapEntry {
  gm_name: string;
  [year: string]: number | string | null; // Allows for year keys like "2009", "2010", etc.
}

export interface GMPlayoffPerformanceStat {
  gm_name: string;
  total_matchups: number;
  wins: number;
  losses: number;
  quarterfinal_matchups: number;
  semifinal_matchups: number;
  championship_matchups: number;
  avg_playoff_points_weekly: number;
  playoff_performance_pct: number;
}


// Below are older types that might still be used by other pages or need updating/removal later.
// Ensure they don't conflict if mock data is still used elsewhere.

export interface Season { // Kept for other pages if they use it, but main page uses ChampionTimelineEntry
  id: string;
  year: number;
  championId?: string;
  championName?: string; // This will be from ChampionTimelineEntry on main page
  championTeamName?: string; // This will be from ChampionTimelineEntry on main page
  championPhotoUrl?: string; // This will be from ChampionTimelineEntry's imgUrl on main page
}

export interface FinalStanding { // Potentially for Season Detail page
  seasonYear: number;
  gmId: string;
  gmName: string;
  position: number;
}

// Data for a specific season (for Season Detail page)
export interface SeasonDetailData {
  seasonId: string;
  year: number;
  summary: string;
  standings: Array<{ gmId: string; gmName: string; rank: number; wins: number; losses: number; ties: number; pointsFor: number }>;
  playoffBracket?: any; // Simplified for now
  weeklyScores?: Array<{ week: number; gmId: string; opponentId: string; score: number; opponentScore: number }>;
  topPerformers?: Array<{ player: string; position: string; points: number; gmId: string }>;
}

// Data for a specific GM's career (for GM Career page)
export interface GMCareerData {
  gmId: string;
  gmName: string;
  careerSummary: {
    totalSeasons: number;
    wins: number;
    losses: number;
    ties: number;
    championships: number;
  };
  seasonBySeason: Array<{
    year: number;
    rank: number;
    wins: number;
    losses: number;
    ties: number;
  }>;
  // ... more detailed career stats
}


export interface DraftPick {
  id: string;
  seasonYear: number;
  round: number;
  pickOverall: number;
  playerName: string;
  position: string;
  college?: string;
  pickedByGmId: string;
  pickedByGmName: string;
  originalOwnerGmId?: string; // For traded picks
}

export interface SeasonDraftData {
  seasonYear: number;
  draftPicks: DraftPick[];
  draftGrades?: Array<{ gmId: string; gmName: string; grade: string; analysis: string }>;
  topSteals?: DraftPick[];
  topBusts?: DraftPick[];
}

export interface GMDraftHistoryData {
  gmId: string;
  gmName: string;
  careerDraftSummary: {
    totalPicks: number;
    avgPickPosition: number;
  };
  bestPicks: DraftPick[];
  worstPicks: DraftPick[];
  roundEfficiency: Array<{ round: number; avgPlayerPerformance: number }>; // Placeholder for complex metric
  positionalProfile: Array<{ position: string; count: number }>;
}

export interface H2HComparisonData {
  gm1Id: string;
  gm1Name: string;
  gm2Id: string;
  gm2Name: string;
  overallRecord: { gm1Wins: number; gm2Wins: number; ties: number };
  pointsRecord: { gm1Points: number; gm2Points: number };
  matchups: Array<{
    seasonYear: number;
    week: number | string; // 'Playoffs R1' etc.
    gm1Score: number;
    gm2Score: number;
    winnerId?: string;
  }>;
  playoffMeetings: Array<any>; // Simplified
}


export interface LeagueHistoryForAI {
  seasons: Array<{
    year: number;
    champion: string; // GM Name
    draftPicks: Array<{
      round: number;
      pick: number;
      player: string;
      gm: string; // GM Name
    }>;
    finalStandings: Array<{
      gm: string; // GM Name
      rank: number;
    }>;
  }>;
}

// Structure for the entire league data JSON
export interface LeagueData {
  championshipTimeline: ChampionTimelineEntry[];
  careerLeaderboard: CareerStat[];
  leagueRecords: LeagueRecord[];
  finalStandingsHeatmap: FinalStandingsHeatmapEntry[];
  playoffQualificationRate: PlayoffAppearanceRate[];
  gmPlayoffPerformance: GMPlayoffPerformanceStat[];
}
