export interface DatabaseConfig {
  connectionString: string;
  databaseName: string;
  collection: string;
}

export interface RedisConfig {
  connectionString: string;
  connectionPort: number;
  username: string;
  password: string;
}

export interface AppConfig {
  environment: string;
  port: number;
  defaultKey: string;
  database: DatabaseConfig;
  cache: RedisConfig;
}
