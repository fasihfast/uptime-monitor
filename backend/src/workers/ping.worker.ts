import { Worker, Job } from 'bullmq';
import axios from 'axios';
import { redis } from '../config/redis';
import { Site } from '../models/Site';
import { PingLog } from '../models/PingLog';
import { alertQueue } from '../queues/alert.queue';

// The data shape we expect in every ping job
interface PingJobData {
  siteId: string;
  url: string;
}

export const pingWorker = new Worker<PingJobData>(
  'ping-queue',           // must match the queue name exactly
  async (job: Job<PingJobData>) => {
    const { siteId, url } = job.data;

    // ── Step 1: Attempt the HTTP request ──────────────────────────────────
    const start = Date.now();
    let isUp = false;
    let statusCode = 0;

    try {
      const response = await axios.get(url, {
        timeout: 5000,                    // give up after 5 seconds
        validateStatus: () => true,       // don't throw on 4xx/5xx — we want the status code
      });

      statusCode = response.status;
      isUp = statusCode >= 200 && statusCode < 400;

    } catch {
      // axios throws on timeout or "could not connect"
      // isUp stays false, statusCode stays 0
      isUp = false;
      statusCode = 0;
    }

    const responseTime = Date.now() - start;

    // ── Step 2: Check what the status WAS before this ping ────────────────
    // Redis cache holds the last known status as a string "UP" or "DOWN"
    // First ever ping returns null (site has never been checked)
    const previousStatus = await redis.get(`status:${siteId}`);

    // ── Step 3: Update Redis cache with new status ─────────────────────────
    // EX 120 means this key auto-deletes after 120 seconds
    // So if the worker crashes, stale data doesn't live forever
    await redis.set(
      `status:${siteId}`,
      isUp ? 'UP' : 'DOWN',
      'EX', 120
    );

    // ── Step 4: Update the Site document in MongoDB ───────────────────────
    await Site.findByIdAndUpdate(siteId, {
      isUp,
      lastChecked: new Date(),
    });

    // ── Step 5: Save this ping result to the log history ──────────────────
    await PingLog.create({
      siteId,
      isUp,
      statusCode,
      responseTime,
      checkedAt: new Date(),
    });

    // ── Step 6: Detect UP → DOWN transition and fire alert ────────────────
    // Only send alert on the EXACT moment site goes down
    // previousStatus === null means first check ever — no alert needed
    // const justWentDown = previousStatus === 'UP' && !isUp;

// ── Step 6: Detect State Changes (Alerts & Recoveries) ────────────────
    const isFirstCheck = previousStatus === null;
    const justWentDown = previousStatus === 'UP' && !isUp;
    const startedDown = isFirstCheck && !isUp; 
    const justRecovered = previousStatus === 'DOWN' && isUp;

    // Handle Downtime
    if (justWentDown || startedDown) {
      await alertQueue.add('send-alert', { 
        siteId, 
        url, 
        type: 'DOWN' 
      });
      console.log(`ALERT triggered: ${url} is DOWN`);
    }

    // Handle Recovery
    if (justRecovered) {
      await alertQueue.add('send-alert', { 
        siteId, 
        url, 
        type: 'UP' 
      });
      console.log(`RECOVERY triggered: ${url} is back UP`);
    }

    console.log(`Pinged ${url} — ${isUp ? 'UP' : 'DOWN'} (${responseTime}ms)`);
  },
  {
    connection: redis,
    concurrency: 5,         // process up to 5 ping jobs simultaneously
  }
);

// ── Worker event listeners ────────────────────────────────────────────────────
// These help you debug in the terminal during development
pingWorker.on('completed', (job) => {
  console.log(`Ping job ${job.id} completed`);
});

pingWorker.on('failed', (job, err) => {
  console.error(`Ping job ${job?.id} failed:`, err.message);
});