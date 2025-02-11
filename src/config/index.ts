import { AppConfig, DatabaseConfig, RedisConfig } from "./appConfig.ts";
import dotenv from "dotenv";
import config, { IConfig } from "config";
import { logger } from "./observability.ts";
import process from "node:process";

export const getConfig: () => Promise<AppConfig> = async () => {
  // Load any ENV vars from local .env file
  if (process.env.NODE_ENV !== "production") {
    dotenv.config();
  }

  // Load configuration after Azure KeyVault population is complete
  // eslint-disable-next-line @typescript-eslint/no-var-requires

  const portConfig: number = config.get<number>("port");
  const defaultKeyConfig: string = config.get<string>("defaultKey");
  const environmentConfig: string = config.get<string>("environment");
  const databaseConfig: DatabaseConfig = config.get<DatabaseConfig>("database");
  const redisConfig: RedisConfig = config.get<RedisConfig>("cache");

  if (!databaseConfig.connectionString) {
    logger.warn(
      "database.connectionString is required but has not been set. Ensure environment variable 'DB_CONNECTION_STRING' has been set"
    );
  }

  return {
    environment: environmentConfig,
    port: portConfig,
    defaultKey: defaultKeyConfig,
    database: {
      connectionString: databaseConfig.connectionString,
      databaseName: databaseConfig.databaseName,
      collection: databaseConfig.collection,
    },
    cache: {
      connectionString: redisConfig.connectionString,
      connectionPort: redisConfig.connectionPort,
      username: redisConfig.username,
      password: redisConfig.password,
    },
  };
};
