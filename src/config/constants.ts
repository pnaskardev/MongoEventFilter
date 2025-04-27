export const STREAM_KEY = "task-stream";
export const CONSUMER_GROUP = "task-consumer-group";
export const TASK_BLOCK_TIME_MS = 5000; // How long to wait for new messages
export const RESCUE_INTERVAL_MS = 60000; // Rescue stuck tasks every 60 sec
export const MAX_IDLE_TIME_MS = 120000; // If a task is unacked for > 2min, rescue it
