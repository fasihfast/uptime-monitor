import { Worker } from 'bullmq';
import { redis } from '../config/redis';
import { PingLog } from '../models/PingLog';

export const logCleanupWorker = new Worker(
  'log-cleanup-queue',
  async () => {
    // 30 minutes = 30 * 60 * 1000 ms
    const MINUTES_TO_KEEP = 30;
    const msToKeep = MINUTES_TO_KEEP * 60 * 1000;
    
    const threshold = new Date(Date.now() - msToKeep);

    try {
      const result = await PingLog.deleteMany({
        checkedAt: { $lt: threshold }
      });
      
      console.log(`🧹 DB Cleanup: Kept only the last 30 mins. Deleted ${result.deletedCount} logs.`);
    } catch (err) {
      console.error("❌ DB Cleanup Error:", err);
      throw err;
    }
  },
  { connection: redis }
);