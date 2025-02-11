import { createClient, RedisClientType } from "redis";
import { logger } from "../config/observability.ts";
import { RedisConfig } from "../config/appConfig.ts";

export class RedisService {
  private static _instance: RedisService | null = null;
  private static client: RedisClientType | null = null;

  private constructor() {
    // Private constructor to prevent direct instantiation
  }

  public static getInstance(): RedisService {
    if (!this._instance) {
      this._instance = new RedisService();
    }
    return this._instance;
  }

  public static async connect(): Promise<RedisClientType> {
    if (this.client) {
      logger.info(
        "Redis Client already exists; no need to create a new client."
      );
      return this.client;
    }

    try {
      logger.info("Creating a new Redis client...");

      // Fetch Redis config from environment variables
      const redisConnectionString = Deno.env.get("REDIS_CONNECTION_STRING");
      const redisPort = Deno.env.get("REDIS_PORT");
      const redisUsername = Deno.env.get("REDIS_USERNAME");
      const redisPassword = Deno.env.get("REDIS_PASSWORD");

      if (
        !redisConnectionString ||
        !redisPort ||
        !redisUsername ||
        !redisPassword
      ) {
        throw new Error(
          "Redis configuration is missing in environment variables."
        );
      }

      const redisConfig: RedisConfig = {
        connectionString: redisConnectionString,
        connectionPort: parseInt(redisPort, 10) || 6379, // Default to 6379
        username: redisUsername,
        password: redisPassword,
      };

      // Create a new Redis client instance
      this.client = createClient({
        url: `redis://${redisConfig.username}:${redisConfig.password}@${redisConfig.connectionString}:${redisConfig.connectionPort}`,
        socket: {
          reconnectStrategy: (retries) => {
            if (retries > 20) {
              logger.error(
                "Too many attempts to reconnect. Redis connection terminated."
              );
              return new Error("Too many retries.");
            }
            return retries * 500; // Exponential backoff strategy
          },
        },
      });

      // Handle Redis connection errors
      this.client.on("error", (error) => {
        logger.error("Redis client error:", error);
      });

      // Connect to Redis
      await this.client.connect();
      logger.info("Redis client connected successfully.");

      return this.client;
    } catch (error) {
      logger.error("Error while connecting to Redis:", error);
      throw error;
    }
  }

  public static getClient(): RedisClientType {
    if (!this.client) {
      throw new Error(
        "Redis client is not connected. Call RedisService.connect() first."
      );
    }
    return this.client;
  }

  public static async disconnect(): Promise<void> {
    if (this.client) {
      await this.client.quit();
      this.client = null;
      logger.info("Redis client disconnected.");
    }
  }
}
