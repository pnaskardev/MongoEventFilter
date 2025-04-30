import { MongoService } from "./services/dbService.ts";
import { RedisService } from "./services/cacheService.ts";
import TaskManager from "./managers/taskManager.ts";
import { RescueManager } from "./managers/rescueManager.ts";
import { ChangeStreamDocument, Document } from "mongodb";
import { TaskWorker } from "./workers/taskWorker.ts";
import process from "node:process";

const INSTANCE_ID = crypto.randomUUID();

const main = async () => {
  try {
    // const port = process.env.port || 3000;
    await MongoService.connect();
    const dbClient = MongoService.getClient();

    await RedisService.connect();
    console.log("HI Deno");

    await TaskManager.createConsumerGroups();

    console.log(`🚀 [${INSTANCE_ID}] EC2 ready!`);

    // custom pipeline
    const pipeline = [{ $addFields: { newField: "this is an added field!" } }];

    // listen to the collection
    const collection = dbClient.db("Stream").collection("stream-collection");
    const changeStream = collection.watch(pipeline);
    changeStream
      .on("change", async (next: ChangeStreamDocument<Document>) => {
        if (next.operationType === "insert") {
          await TaskManager.publishTask(next.fullDocument);
        }
      })
      .once("error", (error) => {
        // handle error
        console.log(error);
      });
    TaskWorker.start(INSTANCE_ID);
  } catch (error) {
    console.log(error);
    process.exit(1);
  }
};

if (import.meta.main) {
  main();
}

setInterval(function () {
  RescueManager.rescueTasks(INSTANCE_ID);
}, 60_000); // every 60 seconds
