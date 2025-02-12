import "jsr:@std/dotenv/load";
import { MongoService } from "./services/dbService.ts";
import { RedisService } from "./services/cacheService.ts";
const main = async () => {
  try {
    // const port = process.env.port || 3000;
    await MongoService.connect();
    const dbClient = MongoService.getClient();

    await RedisService.connect();

    // listen to the collection
    const collection = dbClient.db("Stream").collection("stream-collection");
    const changeStream = collection.watch();
    changeStream.on("create", (change) => {
      // process next document
      console.log("Change Stream has been triggered");
    });
  } catch (error) {
    console.log(error);
  }
};

main();
