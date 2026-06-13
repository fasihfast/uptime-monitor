import { Queue } from 'bullmq';
import { redis } from '../config/redis';

// Create the queue — Redis is the storage backend
// BullMQ stores all job data in Redis automatically
export const pingQueue = new Queue('ping-queue', {
  connection: redis,
  defaultJobOptions: {
    removeOnComplete: 100,  // keep only last 100 completed jobs in Redis
    removeOnFail: 50,       // keep last 50 failed jobs for debugging
  },
});


// ── Schedule a repeating ping job for a site ─────────────────────────────────
// Called when a user ADDS a new site to monitor
export const schedulePingJob = async (
  siteId: string,
  url: string
): Promise<void> => {
  await pingQueue.add(
    'ping-site',            // job name (label only, for your visibility)
    { siteId, url },        // job DATA — this is what the worker receives
    {
      repeat: {
        every: 60_000,      // run every 60 seconds (60,000 milliseconds)
      },
      jobId: `ping-${siteId}`, // CRITICAL: unique ID prevents duplicate jobs
                               // if user re-saves site, BullMQ replaces existing job
    }
  );
  console.log(`Ping job scheduled for: ${url}`);
};


// ── Remove a repeating ping job ───────────────────────────────────────────────
// Called when a user DELETES a site — stops wasting pings on removed sites
export const removePingJob = async (siteId: string): Promise<void> => {
  // We must pass the exact same jobId we used when creating the job
  await pingQueue.removeRepeatable('ping-site', {
    every: 60_000,
    jobId: `ping-${siteId}`,
  });
  console.log(`Ping job removed for site: ${siteId}`);
};