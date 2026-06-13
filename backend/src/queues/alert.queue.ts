// A separate queue just for sending email alerts. Keeping it separate means email failures never block ping jobs.


import { Queue } from 'bullmq';
import { redis } from '../config/redis';

export const alertQueue = new Queue('alert-queue', {
  connection: redis,
  defaultJobOptions: {
    attempts: 3,            // retry failed email sends up to 3 times
    backoff: {
      type: 'exponential',  // wait 5s, then 10s, then 20s between retries
      delay: 5000,
    },
    removeOnComplete: 50,
    removeOnFail: 50,
  },
});
