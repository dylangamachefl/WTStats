
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
  acquisitions?: number; // Made optional as it's not in all provided JSONs
  avgRegularSeasonFinish?: number; // Made optional
  avgFinalStanding?: number; // Made optional
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

// For Season Detail Page (e.g., 2009.json)
export interface SeasonBaseData {
  year: number;
  championName: string;
  runnerUp?: string;
  teams?: number;
  regularSeasonWeeks?: number;
  // Retaining champion details here if they might be present in some season files,
  // though 2009.json has championName at this level.
  gmId?: string; // Champion's GM ID
  teamName?: string; // Champion's Team Name
  roster?: string[]; // Champion's Roster
}

export interface SeasonStandingEntry {
  season_id: number;
  owner_name: string;
  wt_team_name: string;
  regular_season_wins: number;
  regular_season_losses: number;
  regular_season_ties: number;
  regular_season_points_for: number;
  regular_season_points_against: number;
  regular_season_finish: number;
  lastFive?: number[];
  playoffSeed?: number | null;
  // Mapping to existing usage in page.tsx; can be refined.
  // These were from the old SeasonStandingEntry, adapt if needed or remove if wt_team_name etc. are always used.
  gmId?: string;
  gmName?: string;
  rank?: number;
  wins?: number;
  losses?: number;
  ties?: number;
  pointsFor?: number;
  pointsAgainst?: number;
  teamName?: string;
}

export interface PlayoffMatchupTeam {
  seed: number;
  name: string;
  owner: string;
  score: number;
}

export interface PlayoffMatchup {
  home: PlayoffMatchupTeam;
  away: PlayoffMatchupTeam;
}

export interface PlayoffData {
  quarterFinals?: PlayoffMatchup[];
  semiFinals?: PlayoffMatchup[];
  championship?: PlayoffMatchup[];
}

export interface WeeklyScoresMatrixData {
  teams: string[]; // Team names, matches order in scores/results
  scores: number[][]; // scores[week_idx][team_idx]
  results: string[][]; // results[week_idx][team_idx] (W/L/T)
}


export interface StrengthOfScheduleEntry {
  team: string;
  owner: string;
  leagueAvgPpg?: number;
  differential?: number;
  actualOpponentsPpg?: number;
  rank: number;
  rating?: string;
  // For consistency with old type, can be removed if not used:
  gmId?: string;
  gmName?: string;
  teamName?: string;
  sosValue?: number;
  description?: string;
}

export interface WaiverPickupEntry {
  player: string;
  position: string;
  team: string; // NFL Team
  pickedUpBy?: string | null; // GM Name or null
  week?: number | null;
  totalPoints?: number; // Seems like season total points for this player
  rank?: number;
  // For consistency with old type:
  gmId?: string;
  gmName?: string;
  playerAdded?: string; // Redundant with 'player'
  playerDropped?: string;
  faabSpent?: number;
  pickupDate?: string;
}

export interface TopPerformerPlayerGame {
  week: number;
  points: number;
}

export interface TopPerformerPlayer {
  player: string;
  team: string; // NFL Team
  fantasyTeam?: string | null; // GM/Fantasy Team Name
  totalPoints: number;
  ppg: number;
  bestGame?: TopPerformerPlayerGame;
}

export interface PositionalTopPerformersData {
  QB?: TopPerformerPlayer[];
  RB?: TopPerformerPlayer[];
  WR?: TopPerformerPlayer[];
  TE?: TopPerformerPlayer[];
  K?: TopPerformerPlayer[];
  DST?: TopPerformerPlayer[];
  // Potentially other positions
  [key: string]: TopPerformerPlayer[] | undefined;
}

export interface BestOverallGameEntry {
  rank: number;
  player: string;
  position: string;
  team: string; // NFL Team
  fantasyTeam?: string | null;
  week: number;
  points: number;
}

export interface SeasonDetailData {
  seasonData: SeasonBaseData;
  standingsData: SeasonStandingEntry[];
  playoffData?: PlayoffData;
  weeklyScoresData?: WeeklyScoresMatrixData;
  strengthOfScheduleData?: StrengthOfScheduleEntry[];
  waiverPickupsData?: WaiverPickupEntry[];
  topPerformersData?: PositionalTopPerformersData;
  bestOverallGamesData?: BestOverallGameEntry[];
  // Deprecated fields from older SeasonDetailData structure, if needed for backward compat with some files:
  // seasonId?: string;
  // year?: number;
  // champion?: { gmId: string; gmName: string; teamName: string; roster?: string[]; };
  // summary?: string;
  // standings?: SeasonStandingEntry[]; // old structure
  // playoffBracket?: { type: string; rounds: { roundName: string; matchups: any[] }[] }; // old structure
  // weeklyScores?: any[]; // old structure
  // topPerformers?: { weekly?: any[]; seasonal?: any[]; }; // old structure
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

    