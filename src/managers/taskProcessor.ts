class TaskProcessor {
  static async process(taskId: string, instanceId: string, payload: object) {
    console.log(`⚙️ [${instanceId}] Processing task ${taskId}`);

    // Simulate doing some work
    await new Promise((resolve) => setTimeout(resolve, 20000));

    console.log(`✅ [${instanceId}] Completed task ${taskId}`);
  }
}

export default TaskProcessor;
