import TaskManager from "./taskManager.ts";

class TaskProcessor {
  static async process(taskId: string, instanceId: string) {
    console.log(`⚙️ [${instanceId}] Processing task ${taskId}`);

    // Simulate doing some work
    await new Promise((resolve) => setTimeout(resolve, 2000));

    console.log(`✅ [${instanceId}] Completed task ${taskId}`);
    await TaskManager.markDone(taskId);
  }
}

export default TaskProcessor;
