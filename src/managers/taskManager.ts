import { RedisClientType } from "redis";
import { RedisService } from "../services/cacheService.ts";
import { CONSUMER_GROUP, STREAM_KEY } from "../config/constants.ts";

class TaskManager {
  private static get redisClient(): RedisClientType {
    return RedisService.getClient();
  }

  static async createConsumerGroups() {
    try {
      await this.redisClient.xGroupCreate(STREAM_KEY, CONSUMER_GROUP, "$", {
        MKSTREAM: true,
      });
    } catch (error) {
      if (error instanceof Error && error.message.includes("BUSYGROUP")) {
        console.log("BUSYGROUP Consumer Group name already exists");
        return;
      }
      throw Error(`Error creating Consumer Group - ${error}`);
    }
  }

  static async publishTask(payload: object) {
    const taskKey = `task:${JSON.stringify(payload)}`; // Create a unique key based on payload
    // const wasSet = await this.redisClient.set(taskKey, "1", {
    //   NX: true,
    //   EX: 60, // Optional: expire after 60 seconds to prevent forever blocking
    // });

    const wasSet = await this.redisClient.setNX(taskKey, "1");

    if (!wasSet) {
      console.log("Task already exists, skipping publish.");
      return;
    }
    const entryId = await this.redisClient.xAdd(
      STREAM_KEY,
      "*", // Let Redis set the entry ID
      {
        payload: JSON.stringify(payload),
      }
    );
    console.log(`Added as ${entryId}`);
  }

  static async ackTask(taskId: string) {
    try {
      const response = await this.redisClient.xAck(
        STREAM_KEY,
        CONSUMER_GROUP,
        taskId
      );
      console.log(`Acknowledged processing of entry ${taskId}.`);
    } catch (error) {
      console.log(`Error in task acknowledge ${taskId}`);
    }
  }
}

export default TaskManager;
