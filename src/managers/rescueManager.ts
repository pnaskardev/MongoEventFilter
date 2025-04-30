import { RedisService } from "../services/cacheService.ts";
import { CONSUMER_GROUP, STREAM_KEY } from "../config/constants.ts";
import TaskProcessor from "./taskProcessor.ts";
import TaskManager from "./taskManager.ts";
import { commandOptions } from "redis";

export class RescueManager {
  static async rescueTasks(instanceId: string) {
    try {
      const redisClient = RedisService.getClient();

      let cursor = "0-0";
      const IDLE_TIMEOUT = 60_000; // 1 minute
      const BATCH_SIZE = 10;

      while (true) {
        // const result = await redisClient.xAutoClaim(
        // commandOptions({ isolated: true }),
        //   STREAM_KEY,
        //   CONSUMER_GROUP,
        //   "60_000",
        //   0,
        //   "0-0"
        // ); // >>> ['1692629925790-0', [('1692629925789-0', {'rider': 'Royce'})]]
        // console.log(result.nextId, result.messages);

        // THis will get 10 pending messages from the start and will get the next cursor id as well
        const result = await redisClient.xAutoClaim(
          commandOptions({ isolated: true }),
          STREAM_KEY,
          CONSUMER_GROUP,
          instanceId,
          IDLE_TIMEOUT,
          cursor,
          { COUNT: BATCH_SIZE }
        );

        console.log(`Pending Messages ${instanceId} - ${result.messages}`);
        if (result.messages.length === 0) break;

        // Process the items

        result.messages.forEach(async (pendingMessage) => {
          if (pendingMessage === null || pendingMessage === undefined) return;
          const { id, message } = pendingMessage;

          try {
            await TaskProcessor.process(id, instanceId, message);
            await TaskManager.ackTask(id);
          } catch (error) {
            console.log(`Error occured while rescuing the task ${id}-${error}`);
          }
        });

        // change the cursor to the nect cursor
        cursor = result.nextId;
      }
    } catch (error) {
      console.log(`Error while rescuing tasks ${error}`);
    }
  }
}
