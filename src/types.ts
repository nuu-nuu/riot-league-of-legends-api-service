// Shared Riot API response / domain types.

export interface RiotAccount {
  puuid: string;
}

export interface SpectatorParticipant {
  puuid: string;
  championId: number;
}

export interface SpectatorGame {
  gameMode: string;
  gameStartTime: number;
  participants: SpectatorParticipant[];
}

export interface MatchParticipant {
  puuid: string;
  championId: number;
  kills: number;
  deaths: number;
  assists: number;
  win: boolean;
}

export interface Match {
  info: {
    gameMode: string;
    participants: MatchParticipant[];
  };
}

export interface RankEntry {
  queueType: string;
  tier: string;
  rank: string;
  leaguePoints: number;
  wins: number;
  losses: number;
}

export interface MasteryEntry {
  championId: number;
  championLevel: number;
  championPoints: number;
}

export interface LiveGameStatus {
  inGame: boolean;
  mode?: string;
  championId?: number | null;
  startedAt?: number;
}

export interface RecentMatchSummary {
  championId: number;
  kills: number;
  deaths: number;
  assists: number;
  win: boolean;
  mode: string;
}

export interface LeagueOfLegendsVersion {
  currVers: string;
}

export interface Champion {
  name: string;
}