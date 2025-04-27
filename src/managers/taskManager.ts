import { RedisClientType } from "redis";
import { RedisService } from "../services/cacheService.ts";

class TaskManager {
  private static get redisClient(): RedisClientType {
    return RedisService.getClient();
  }

  static async tryPickup({
    taskId,
    instanceId,
  }: {
    taskId: string;
    instanceId: string;
  }) {
    const pickupKey: string = `task:pickup:${taskId}`;
    const result = await this.redisClient.setNX(
      pickupKey,
      JSON.stringify({ instanceId, pickedAt: Date.now() })
    );

    // LOCK was acquired
    if (result === true) {
      return true;
    }
    // LOCK was not acquired
    else {
      return false;
    }
  }

  static async markDone(taskId: string) {
    await this.redisClient.set(`task:done:${taskId}`, "true");
    await this.redisClient.del(`task:enqueued:${taskId}`);
  }
}

export default TaskManager;
