import { RedisService } from "../services/cacheService.ts";
import {
  STREAM_KEY,
  CONSUMER_GROUP,
  TASK_BLOCK_TIME_MS,
} from "../config/constants.ts";
import { commandOptions, RedisClientType } from "redis";
import TaskProcessor from "../managers/taskProcessor.ts";
import TaskManager from "../managers/taskManager.ts";

export class TaskWorker {
  private static get redisClient(): RedisClientType {
    return RedisService.getClient();
  }
  static async start(instanceId: string) {
    console.log(`🚀 [${instanceId}] Worker Started`);
    while (true) {
      const response = await this.redisClient.xReadGroup(
        commandOptions({ isolated: true }),
        CONSUMER_GROUP,
        instanceId,
        [
          {
            key: STREAM_KEY,
            id: ">",
          },
        ],
        {
          COUNT: 1,
          BLOCK: TASK_BLOCK_TIME_MS,
        }
      );

      if (response) {
        for (const stream of response) {
          //   Stream data type
          // const stream: {
          //     name: string;
          //     messages: {
          //         id: string;
          //         message: {
          //             [x: string]: string;
          //         };
          //     }[];
          // }

          for (const message of stream.messages) {
            const taskId: string = message.id;
            const payload: { [key: string]: string } = message.message;

            await TaskProcessor.process(taskId, instanceId, payload);
            await TaskManager.ackTask(taskId);
          }
        }
      } else {
        console.log("No new entries yet.");
      }
    }
  }
}
