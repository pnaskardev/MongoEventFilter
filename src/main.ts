import { MongoService } from "./services/dbService.ts";
import { RedisService } from "./services/cacheService.ts";
import TaskManager from "./managers/taskManager.ts";
import TaskProcessor from "./managers/taskProcessor.ts";
import { RescueManager } from "./managers/rescueManager.ts";
import { ChangeStreamDocument, Document } from "mongodb";

const INSTANCE_ID = crypto.randomUUID();

const main = async () => {
  try {
    // const port = process.env.port || 3000;
    await MongoService.connect();
    const dbClient = MongoService.getClient();

    await RedisService.connect();
    const redisClient = RedisService.getClient();
    console.log("HI Deno");
    console.log(`🚀 [${INSTANCE_ID}] EC2 ready!`);

    // custom pipeline
    const pipeline = [{ $addFields: { newField: "this is an added field!" } }];

    // listen to the collection
    const collection = dbClient.db("Stream").collection("stream-collection");
    const changeStream = collection.watch(pipeline);
    changeStream
      .on("change", async (next: ChangeStreamDocument<Document>) => {
        if (next.operationType === "insert") {
          console.log("Change Stream has been triggered", next.fullDocument);
          const taskId = next.documentKey._id.toString();

          // try to enqueue the task to the redis
          const enqueued = await redisClient.setNX(
            `task:enqueued:${taskId}`,
            "true"
          );

          const data_packet = JSON.stringify(next);

          console.log("Data packet", data_packet);

          if (enqueued) {
            console.log(`📥 Enqueued task ${taskId}`);
            await redisClient.rPush(
              "task_queue",
              JSON.stringify(next.fullDocument)
            );
            console.log("Pushing to Task Queue");
          } else {
            console.log(`⚠️ Task ${taskId} already enqueued`);
          }
        }
      })
      .once("error", (error) => {
        // handle error
        console.log(error);
      });

    while (true) {
      const rawTask = await redisClient.lPop("task_queue");
      if (rawTask) {
        const change = JSON.parse(rawTask);
        const taskId = change._id;
        const picked = await TaskManager.tryPickup({
          taskId,
          instanceId: INSTANCE_ID,
        });

        if (picked) {
          await TaskProcessor.process(taskId, INSTANCE_ID);
        } else {
          console.log(`❌ [${INSTANCE_ID}] Someone else picked ${taskId}`);
        }
      } else {
        await new Promise((resolve) => setTimeout(resolve, 1000)); // No task, wait 1s
      }
    }
  } catch (error) {
    console.log(error);
  }
};

if (import.meta.main) {
  main();
}

setInterval(RescueManager.rescueTasks, 60_000); // every 60 seconds
