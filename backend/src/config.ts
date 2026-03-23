export interface ZillowConfig {
  apiKey: string;
  host: string;
}

export interface AppConfig {
  zillow?: ZillowConfig;
}

function getEnv(name: string): string | undefined {
  const value = process.env[name]?.trim();
  return value ? value : undefined;
}

export function getConfig(): AppConfig {
  const apiKey = getEnv("ZILLOW_API_KEY");
  const host = getEnv("ZILLOW_API_HOST");

  const zillow: ZillowConfig | undefined =
    apiKey && host
      ? {
          apiKey,
          host,
        }
      : undefined;

  return {
    zillow,
  };
}

