import { RedisClientType } from "redis";
import { RedisService } from "../services/cacheService.ts";

const RESCUE_TIMEOUT_MS = 5 * 60 * 1000;

export class RescueManager {
  static async rescueTasks() {
    const redisClient: RedisClientType = RedisService.getClient();

    const pickupKeys = await redisClient.keys("task:pickup:*");

    for (const key of pickupKeys) {
      const taskId = key.split(":")[2];
      const isDone = await redisClient.exists(`task:done:${taskId}`);

      //   task is done do nothing
      if (isDone) continue;

      const data = await redisClient.get(key);

      //   no data available do nothing
      if (!data) continue;

      if (data === null || data === undefined) {
        continue;
      }
      const { pickedAt } = JSON.parse(data);
      const timeSincePickup = Date.now() - pickedAt;

      if (timeSincePickup > RESCUE_TIMEOUT_MS) {
        console.log(`🛟 Rescuing stuck task ${taskId}`);

        await redisClient.del(key);
        await redisClient.del(`task:enqueued:${taskId}`);
        await redisClient.rPush("task_queue", taskId);
      }
    }
  }
}
