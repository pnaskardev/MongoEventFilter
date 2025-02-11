import { DatabaseConfig } from "../config/appConfig.ts";
import { logger } from "../config/observability.ts";
import { MongoClient, ServerApiVersion } from "mongodb";

export class MongoService {
  private static _instance: MongoService | null = null;
  private static client: MongoClient | null = null;

  private constructor() {
    // Private constructor to prevent direct instantiation
  }

  public static getInstance(): MongoService {
    if (!this._instance) {
      this._instance = new MongoService();
    }
    return this._instance;
  }

  private static async createClient(config: DatabaseConfig): Promise<void> {
    if (!this.client) {
      try {
        this.client = new MongoClient(config.connectionString, {
          serverApi: {
            version: ServerApiVersion.v1,
            strict: true,
            deprecationErrors: true,
          },
        });

        await this.client.connect();
        await this.client.db(config.databaseName).command({ ping: 1 });

        logger.info("Successfully connected to MongoDB.");
      } catch (error) {
        logger.error("Error connecting to MongoDB:", error);
        throw error;
      }
    }
  }

  public static async connect(): Promise<void> {
    try {
      logger.info("Connecting to MongoDB...");
      const connectionString = Deno.env.get("DB_CONNECTION_STRING");
      const databaseName = Deno.env.get("DB_NAME");

      if (!connectionString || !databaseName) {
        throw new Error(
          "Database configuration is missing in environment variables."
        );
      }

      const config: DatabaseConfig = {
        connectionString,
        databaseName,
        collection: Deno.env.get("DB_COLLECTION") || "", // Collection name is optional
      };

      await this.createClient(config);
    } catch (error) {
      logger.error("MongoDB connection failed:", error);
      throw error;
    }
  }

  public static getClient(): MongoClient {
    if (!this.client) {
      throw new Error("MongoClient not initialized. Call `connect` first.");
    }
    return this.client;
  }

  public static async disconnect(): Promise<void> {
    if (this.client) {
      await this.client.close();
      this.client = null;
      logger.info("MongoDB client disconnected.");
    }
  }
}
