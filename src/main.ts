import { MongoService } from "./services/dbService.ts";
import { RedisService } from "./services/cacheService.ts";
const main = async () => {
  try {
    // const port = process.env.port || 3000;
    await MongoService.connect();
    const dbClient = MongoService.getClient();

    await RedisService.connect();

    console.log("HI Deno");

    // custom pipeline
    const pipeline = [{ $addFields: { newField: "this is an added field!" } }];

    // listen to the collection
    const collection = dbClient.db("Stream").collection("stream-collection");
    const changeStream = collection.watch(pipeline);
    changeStream
      .on("change", (next) => {
        if (next.operationType === "insert") {
          console.log("Change Stream has been triggered", next.fullDocument);
        }
      })
      .once("error", (error) => {
        // handle error
        console.log(error);
      });
  } catch (error) {
    console.log(error);
  }
};

if (import.meta.main) {
  main();
}
