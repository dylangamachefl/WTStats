
export interface GM {
  id: string;
  name: string;
  teamName?: string;
  photoUrl?: string;
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

export interface LeagueRecord {
  gm_name: string;
  seasons: string;
  week: string;
  value: string | number;
  record_category: string;
}

export interface CareerStat {
  name: string;
  wins: number;
  losses: number;
  ties: number;
  championships: number;
  pointsFor: number;
  pointsAgainst: number;
  winPct: string;
  playoffRate: number;
  acquisitions: number;
  avgRegularSeasonFinish: number;
  avgFinalStanding: number;
}

export interface PlayoffAppearanceRate {
  gm_name: string;
  seasons_played: number;
  playoff_appearances: number;
  qualification_rate: number;
}

export interface FinalStandingsHeatmapEntry {
  gm_name: string;
  [year: string]: number | string | null;
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

export interface LeagueData {
  championshipTimeline: ChampionTimelineEntry[];
  careerLeaderboard: CareerStat[];
  leagueRecords: LeagueRecord[];
  finalStandingsHeatmap: FinalStandingsHeatmapEntry[];
  playoffQualificationRate: PlayoffAppearanceRate[];
  gmPlayoffPerformance: GMPlayoffPerformanceStat[];
}

// For Season Detail Page (e.g., 2023.json)
export interface SeasonStandingEntry {
  gmId: string;
  gmName: string;
  rank: number;
  wins: number;
  losses: number;
  ties: number;
  pointsFor: number;
  pointsAgainst: number;
  teamName: string;
}

export interface SeasonWeeklyMatchup {
  gm1Id: string;
  gm1Name: string;
  gm1Score: number;
  gm1TeamName?: string;
  gm2Id: string;
  gm2Name: string;
  gm2Score: number;
  gm2TeamName?: string;
  winnerId?: string; // gmId of winner, or 'tie' or undefined
}

export interface SeasonWeeklyScoresData {
  week: number;
  matchups: SeasonWeeklyMatchup[];
}

export interface SeasonTopPerformer {
  playerName: string;
  position: string;
  points: number;
  gmId?: string;
  gmName?: string;
  teamName?: string; // Player's NFL team
  week?: number; // For weekly top performers
}

export interface SeasonPlayoffBracketNode {
  matchupId: string;
  round: string; // e.g., "Quarterfinal 1", "Semifinal 2", "Championship"
  team1?: { gmId: string; gmName: string; score?: number; seed?: number; teamName?: string };
  team2?: { gmId: string; gmName: string; score?: number; seed?: number; teamName?: string };
  winnerId?: string; // gmId of the winner
  nextMatchupId?: string | null; // ID of the matchup this one feeds into
  isChampionship?: boolean;
}

export interface StrengthOfScheduleEntry {
  gmId: string;
  gmName: string;
  teamName?: string;
  sosValue: number; // Example: average opponent win percentage
  rank: number;
  description?: string;
}

export interface WaiverPickupEntry {
  week: number;
  gmId: string;
  gmName: string;
  playerAdded: string;
  playerDropped?: string;
  faabSpent?: number;
  pickupDate?: string;
}

export interface SeasonDetailData {
  seasonId: string;
  year: number;
  champion?: {
    gmId: string;
    gmName: string;
    teamName: string;
    roster?: string[];
  };
  summary?: string;
  standings: SeasonStandingEntry[];
  playoffBracket?: {
    type: string; // e.g., 'single-elimination-6-team'
    rounds: {
      roundName: string; // "Quarterfinals", "Semifinals", "Championship"
      matchups: SeasonPlayoffBracketNode[];
    }[];
  };
  weeklyScores?: SeasonWeeklyScoresData[];
  topPerformers?: {
    weekly?: SeasonTopPerformer[];
    seasonal?: SeasonTopPerformer[];
  };
  strengthOfScheduleData?: StrengthOfScheduleEntry[];
  waiverPickupsData?: WaiverPickupEntry[];
}

// For GM Career Page (e.g., Chris.json)
export interface GMCareerSeasonSummary {
  year: number;
  teamName: string;
  rank: number;
  wins: number;
  losses: number;
  ties: number;
  pointsFor: number;
  pointsAgainst: number;
  madePlayoffs: boolean;
  championshipResult?: string;
  notablePlayers?: string[];
  playoffRecord?: string;
}

export interface GMCareerAward {
  year: number;
  awardName: string;
  description?: string;
}

export interface GMCareerH2HSummary {
  opponentGmId: string;
  opponentGmName: string;
  wins: number;
  losses: number;
  ties: number;
  totalPointsFor: number;
  totalPointsAgainst: number;
}

export interface GMCareerDraftStat {
    totalPicks: number;
    avgPickPosition: number;
    bestPick?: { playerName: string; year: number; round: number; pick: number; value: string };
    worstBust?: { playerName: string; year: number; round: number; pick: number; description: string };
    roundBreakdown?: Array<{ round: number; numPicks: number; avgValue: string }>;
}

export interface GMCareerData {
  gmId: string;
  gmName: string;
  photoUrl?: string;
  bio?: string;
  careerSummary: {
    totalSeasons: number;
    championships: number;
    runnerUps?: number;
    playoffAppearances: number;
    regularSeasonWins: number;
    regularSeasonLosses: number;
    regularSeasonTies: number;
    regularSeasonWinPct: string;
    playoffWins?: number;
    playoffLosses?: number;
    playoffWinPct?: string;
    totalPointsFor: number;
    totalPointsAgainst: number;
    avgRegularSeasonFinish: number;
    avgFinalStanding: number;
  };
  seasonBySeason: GMCareerSeasonSummary[];
  awards?: GMCareerAward[];
  rivalries?: GMCareerH2HSummary[];
  draftHistorySummary?: GMCareerDraftStat;
}


// Old types - re-evaluate if still needed by other pages or can be removed
export interface Season {
  id: string;
  year: number;
  championId?: string;
  championName?: string;
  championTeamName?: string;
  championPhotoUrl?: string;
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
  originalOwnerGmId?: string;
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
  roundEfficiency: Array<{ round: number; avgPlayerPerformance: number }>;
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
    week: number | string;
    gm1Score: number;
    gm2Score: number;
    winnerId?: string;
  }>;
  playoffMeetings: Array<any>;
}

export interface LeagueHistoryForAI {
  seasons: Array<{
    year: number;
    champion: string;
    draftPicks: Array<{
      round: number;
      pick: number;
      player: string;
      gm: string;
    }>;
    finalStandings: Array<{
      gm: string;
      rank: number;
    }>;
  }>;
}

