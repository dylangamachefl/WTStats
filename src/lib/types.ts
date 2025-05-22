
export interface GM {
  id: string; // This is the string ID used for the dropdown, e.g., "chris"
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
  acquisitions?: number;
  avgRegularSeasonFinish?: number;
  avgFinalStanding?: number;
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

export interface WeeklyScoresData {
  teams: string[];
  scores: (number | null)[][];
  results: (string | null)[][];
}


export interface StrengthOfScheduleEntry {
  team: string;
  owner: string;
  leagueAvgPpg?: number;
  differential?: number;
  actualOpponentsPpg?: number;
  rank: number;
  rating?: string;
}

export interface WaiverPickupEntry {
  player: string;
  position: string;
  team: string;
  pickedUpBy?: string | null;
  week?: number | null;
  totalPoints?: number;
  rank?: number;
}

export interface TopPerformerPlayer {
  player: string;
  team: string; // NFL Team
  fantasyTeam?: string | null; // GM's team name
  totalPoints: number;
  ppg: number; // Points per game
  bestGame?: {
    week: number;
    points: number;
  };
}

export interface PositionalTopPerformersData {
  QB?: TopPerformerPlayer[];
  RB?: TopPerformerPlayer[];
  WR?: TopPerformerPlayer[];
  TE?: TopPerformerPlayer[];
  K?: TopPerformerPlayer[];
  DST?: TopPerformerPlayer[];
  DEF?: TopPerformerPlayer[]; // Adding DEF as it's sometimes used
  [key: string]: TopPerformerPlayer[] | undefined;
}

export interface SeasonBestOverallGameEntry {
  rank: number;
  player: string;
  position: string;
  team: string; // NFL Team
  fantasyTeam?: string | null; // GM's team name
  week: number;
  points: number;
}

export interface SeasonDetailData {
  seasonData: SeasonBaseData;
  standingsData: SeasonStandingEntry[];
  playoffData?: PlayoffData;
  weeklyScoresData?: WeeklyScoresData;
  strengthOfScheduleData?: StrengthOfScheduleEntry[];
  waiverPickupsData?: WaiverPickupEntry[];
  topPerformersData?: PositionalTopPerformersData;
  bestOverallGamesData?: SeasonBestOverallGameEntry[];
}


// For GM Career Page (e.g., Chris.json - overall career)
export interface GMInfo {
  id: number; // Numeric ID, e.g., 11
  name: string;
  slug: string; // e.g., "chris"
  yearsActive: string;
  championshipYears: number[];
  photoUrl?: string;
  bio?: string;
}

export interface GMCareerStats { // Renamed from CareerStats to avoid conflict
  wins: number;
  losses: number;
  ties: number;
  winPct: number;
  totalPointsFor: number;
  totalPointsAgainst: number;
  avgPointsPerGame: number;
  playoffAppearances: number;
  totalSeasons: number;
  playoffWins: number;
  playoffLosses: number;
}

export interface ExtremeGameDetail {
  value: number;
  season: number;
  week: string;
  opponentName?: string;
}

export interface ExtremeSeasonDetail {
  wins: number;
  losses: number;
  season: number;
  isChampion: boolean;
}

export interface CareerExtremes {
  highs: {
    mostPointsGame: ExtremeGameDetail;
    biggestWinMargin: ExtremeGameDetail;
    bestSeasonRecord: ExtremeSeasonDetail;
  };
  lows: {
    fewestPointsGame: ExtremeGameDetail;
    worstLossMargin: ExtremeGameDetail;
    worstSeasonRecord: ExtremeSeasonDetail;
  };
}

export interface SeasonProgressionEntry {
  year: number;
  finalStanding: number;
  pointsForRank: number;
  madePlayoffs: boolean;
  isChampion: boolean;
}

export interface PositionStrengthEntry {
  position: string;
  value: number;
}

export interface FranchisePlayerEntry {
  playerId: number;
  name: string;
  position: string;
  seasonsWithGm: number[];
  totalPointsForGm: number;
  gamesStartedForGm: number;
}

export interface RivalryPerformanceEntry {
  opponentId: number;
  opponentName: string;
  wins: number;
  losses: number;
  avgPointsFor: number;
  avgPointsAgainst: number;
}

export interface GMCareerData {
  gmInfo: GMInfo;
  careerStats: GMCareerStats;
  careerExtremes: CareerExtremes;
  seasonProgression: SeasonProgressionEntry[];
  positionStrength: PositionStrengthEntry[];
  franchisePlayers: FranchisePlayerEntry[];
  rivalryPerformance: RivalryPerformanceEntry[];
}

// For individual GM Season Detail (e.g., gm_career_GMID_YEAR.json)
export interface GMSeasonPerformance {
  wins: number;
  losses: number;
  ties: number;
  pointsFor: number;
  pointsAgainst: number;
  avgPointsPerGame: number;
  avgPointsAgainstPerGame: number;
  regularSeasonFinish: number;
  finalStanding: number;
  sosDifferential?: number; 
  sosRating?: string; 
}

export interface GMGameByGame {
  week: number;
  opponent: string;
  points: number;
  opponent_points: number;
  result: 'W' | 'L' | 'T';
  difference: number;
}

export interface GMSeasonSummary {
  seasonPerformance: GMSeasonPerformance;
  gameByGame: GMGameByGame[];
}

export interface GMPositionContribution {
  name: string; 
  startedPoints: number;
}

export interface GMLeagueAvgPositionData {
  name: string; 
  leagueAvg: number;
}

export interface GMRosterPlayer {
  id: number;
  name: string;
  position: string;
  finish: string; 
  gamesStarted: number;
  totalPoints: number;
}

export interface GMRosterBreakdown {
  positionContributionData: GMPositionContribution[];
  leagueAvgPositionData: GMLeagueAvgPositionData[];
  rosterPlayerData: GMRosterPlayer[];
}

export interface GMPlayerSummaryPerformance {
  playerId: number;
  name: string;
  position: string;
  avgActual: number;
  avgProjected: number;
  avgDifference: number;
  percentBeatProjection: number;
  boomWeeks: number;
  bustWeeks: number;
}

export interface GMPlayerPerformanceData {
  playerSummaryPerformance: GMPlayerSummaryPerformance[];
  overPerformer: { name: string; avgDifference: number };
  underPerformer: { name: string; avgDifference: number };
}

export interface GMLineupOptimizationWeekly {
  week: number;
  optimal: number | null;
  actual: number | null;
  efficiency: number | null;
  pointsLeft: number | null;
  correctDecisions: number | null;
  totalDecisions: number | null;
}

export interface GMLineupOptimizationFeelingItDetail {
  week: number;
  starterName: string;
  starterActual: number | null;
  starterProjected: number | null;
  benchName: string;
  benchActual: number | null;
  benchProjected: number | null;
  pointsDifference: number | null;
  projectionDifference: number | null;
}

export interface GMLineupOptimizationData {
  weeklyOptimization: GMLineupOptimizationWeekly[];
  feelingItSummary: {
    totalStarts: number | null;
    successRate: number | null;
    avgPointsGainedLost: number | null;
    avgProjectionDifference: number | null;
    details: GMLineupOptimizationFeelingItDetail[];
  };
}

export interface GMPositionalAdvantageWeeklyEntry {
  week: number | string; 
  QB?: number | null;
  RB?: number | null;
  WR?: number | null;
  TE?: number | null;
  FLEX?: number | null;
  K?: number | null;
  DST?: number | null;
  total_diff?: number | null;
}

export interface GMPositionalAdvantageCumulativeDataPoint {
  week: number;
  value: number;
}

export interface GMPositionalAdvantageCumulative {
  position: string;
  data: GMPositionalAdvantageCumulativeDataPoint[];
}

export interface GMPositionalAdvantageData {
  weeklyPositionalAdvantage: GMPositionalAdvantageWeeklyEntry[];
  cumulativeWeeklyPositionalAdvantage: GMPositionalAdvantageCumulative[];
}

export interface GMStreamingSummaryEntry {
  position: string;
  status: string;
  uniqueStarters: number | null;
  streamedStartsCount: number | null;
  avgPtsGm: number | null;
  avgPtsLeague: number | null;
  netPtsVsAvg: number | null;
  hitRate: number | null;
}

export interface GMStreamingWeeklyPerformanceEntry {
  week: number;
  gmStarterPts: number | null;
  leagueAvgPts: number | null;
  playerName: string;
}

export interface GMStreamingSuccessData {
  streamingSummary: GMStreamingSummaryEntry[];
  streamingWeeklyPerformance: {
    [position: string]: GMStreamingWeeklyPerformanceEntry[];
  };
}

export interface GMIndividualSeasonDetailData {
  seasonSummary: GMSeasonSummary;
  rosterBreakdown: GMRosterBreakdown;
  playerPerformance?: GMPlayerPerformanceData; 
  lineupOptimization?: GMLineupOptimizationData; 
  positionalAdvantage?: GMPositionalAdvantageData; 
  streamingSuccess?: GMStreamingSuccessData; 
}

// For Draft History Overview - uses field names from gm_season_performance_grid.json
export interface GMDraftSeasonPerformance {
  season_id: number;
  gm_id: number;
  gm_name: string;
  first_round_draft_position?: number;
  total_picks?: number;
  avg_pvdre?: number; // This is the POE metric
  total_pvdre?: number;
  pvdre_hit_rate?: number;
  avg_value_vs_adp?: number;
}


// For Draft History -> Season View (e.g., /draft-history/season/[seasonId])
export interface DraftPickDetail {
  season_id: number;
  pick_overall: number;
  draft_id: number;
  round: number;
  pick_in_round: number;
  player_id: number;
  player_name: string;
  player_position: string;
  nfl_team_id: string;
  nfl_team_name: string;
  fantasy_team_id: number;
  fantasy_team_name: string;
  gm_id: number;
  gm_name: string;
  league_positional_draft_rank?: number | null;
  overall_adp_rank?: number | null;
  market_positional_adp_rank?: number | null;
  overall_reach_steal_value?: number | null;
  actual_total_fantasy_points_season?: number | null;
  fantasy_points_per_game_season?: number | null;
  actual_positional_finish_rank?: number | null;
  expected_points_for_league_draft_rank_smoothed?: number | null;
  pvdre_points_vs_league_draft_rank_exp?: number | null;
  rank_diff_vs_league_draft_rank?: number | null;
  raw_stats_season?: Record<string, any>; // Or a more specific type if known
}

export type SeasonDraftBoardData = DraftPickDetail[];


// Old types - re-evaluate if still needed by other pages or can be removed
export interface Season {
  id: string;
  year: number;
  championId?: string;
  championName?: string;
  championTeamName?: string;
  championPhotoUrl?: string;
}

// Renamed old DraftPick to OldDraftPick to avoid conflict if still used elsewhere.
export interface OldDraftPick {
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

// Renamed old SeasonDraftData to OldSeasonDraftData
export interface OldSeasonDraftData {
  seasonYear: number;
  draftPicks: OldDraftPick[];
  draftGrades?: Array<{ gmId: string; gmName: string; grade: string; analysis: string }>;
  topSteals?: OldDraftPick[];
  topBusts?: OldDraftPick[];
}

export interface GMDraftHistoryData {
  gmId: string;
  gmName: string;
  careerDraftSummary: {
    totalPicks: number;
    avgPickPosition: number;
  };
  bestPicks: OldDraftPick[]; // Using OldDraftPick here
  worstPicks: OldDraftPick[]; // Using OldDraftPick here
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
  }>;
}

    