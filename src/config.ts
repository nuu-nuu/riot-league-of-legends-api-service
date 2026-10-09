// Reads and derives all configuration from environment variables.
// Centralized here so the rest of the app never touches process.env directly,
// which also makes it trivial to re-derive config under different env vars
// in tests without re-importing every module.

import "dotenv/config";

export const REGIONS = {
  americas: ["na1", "br1", "la1", "la2", "oc1"],
  asia: ["kr", "jp1"],
  sea: ["ph2", "sg2", "th2", "tw2", "vn2"], // Riot moved these under a 4th cluster, "sea", as of 2023
  europe: ["euw1", "eun1", "tr1", "ru"],
} as const;

export const ALL_REGIONS: string[] = Object.values(REGIONS).flat();

export interface AppConfig {
  key: string | undefined;
  port: number;
  allowedOrigins: string[];
}

// Riot's match/account endpoints live on a continent-level cluster rather
// than the per-platform region, so derive it from the configured platform.
export function clusterFor(platform: string): "americas" | "asia" | "europe" {
  if (["na1", "br1", "la1", "la2", "oc1"].includes(platform)) return "americas";
  if (["kr", "jp1", "ph2", "sg2", "th2", "tw2", "vn2"].includes(platform)) return "asia";
  return "europe";
}

export function loadConfig(): AppConfig {
  const key = process.env.RIOT_API_KEY;
  const port = Number(process.env.PORT ?? 4322);
  const allowedOrigins = (process.env.ALLOWED_ORIGIN ?? "*")
    .split(",")
    .map((o) => o.trim());

  return {
    key,
    port,
    allowedOrigins,
  };
}
