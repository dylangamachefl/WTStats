
export interface GM {
  id: string;
  name: string;
  teamName?: string; // Optional: GM's current/last known team name
  photoUrl?: string; // Optional: URL to GM's photo
}

export interface Season {
  id: string; // e.g., "2023"
  year: number;
  championId?: string;
  championName?: string;
  championTeamName?: string;
  championPhotoUrl?: string;
}

export interface LeagueRecord {
  id: string;
  title: string;
  value: string | number;
  holderName: string;
  seasonYear?: number;
  details?: string;
}

export interface CareerStat {
  gmId: string;
  gmName: string;
  wins: number;
  losses: number;
  ties: number;
  championships: number;
  playoffAppearances: number;
  pointsFor: number;
  pointsAgainst: number;
}

export interface PlayoffAppearanceRate {
  gmId: string;
  gmName: string;
  rate: number; // percentage, e.g. 0.75 for 75%
}

export interface FinalStanding {
  seasonYear: number;
  gmId: string;
  gmName: string;
  position: number;
}

// Data for a specific season
export interface SeasonDetailData {
  seasonId: string;
  year: number;
  summary: string;
  standings: Array<{ gmId: string; gmName: string; rank: number; wins: number; losses: number; ties: number; pointsFor: number }>;
  playoffBracket?: any; // Simplified for now
  weeklyScores?: Array<{ week: number; gmId: string; opponentId: string; score: number; opponentScore: number }>;
  topPerformers?: Array<{ player: string; position: string; points: number; gmId: string }>;
}

// Data for a specific GM's career
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
  // This structure should align with what the AI flow `draftStrategyInsightsFlow` expects
  // For now, a placeholder. It might be a stringified JSON of aggregated data.
  // Example:
  seasons: Array<{
    year: number;
    champion: string; // GM Name
    draftPicks: Array<{
      round: number;
      pick: number;
      player: string;
      gm: string; // GM Name
      // Add other relevant details like player's end-of-season rank or points
    }>;
    finalStandings: Array<{
      gm: string; // GM Name
      rank: number;
    }>;
  }>;
  // Potentially other aggregated stats useful for draft strategy insights
}
