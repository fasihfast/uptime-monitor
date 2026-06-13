//Fetches the failed site details from alert queue and builds email to send to owner(site owner)

import { Worker, Job } from 'bullmq';
import nodemailer from 'nodemailer';
import { redis } from '../config/redis';
import { Site } from '../models/Site';
import { User } from '../models/User';

interface AlertJobData {
  siteId: string;
  url: string;
  type: 'UP' | 'DOWN'; // Added type
}

if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
  throw new Error("Email credentials missing from environment variables!");
}

// ── Email transporter setup ───────────────────────────────────────────────────
// This is created once and reused for all emails
// Uses your Gmail credentials from .env
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,   // this is your Gmail App Password, NOT login password
  },
});


console.log("Checking Redis connection...");
redis.ping()
  .then(() => console.log("✅ Redis is ALIVE and reachable"))
  .catch(e => console.error("❌ Redis is DEAD or unreachable:", e));

export const alertWorker = new Worker<AlertJobData>(
  'alert-queue',          // must match alert queue name exactly
  async (job: Job<AlertJobData>) => {
    console.log(`Processing job ${job.id} for site: ${job.data.url}`);
    const { siteId, url , type } = job.data;

    // ── Step 1: Fetch site and its owner from database ────────────────────
    const site = await Site.findById(siteId).populate<{
      owner: { email: string; name: string };
    }>('owner');           // .populate() replaces the owner ID with the actual User object

    if (!site) {
      console.log(`Alert skipped — site ${siteId} no longer exists`);
      return;
    }

    const ownerEmail = site.owner.email;
    const ownerName = site.owner.name;



     // ── Step 2: Build the email ────────────────────────────────────────────

    const isRecovery = type === 'UP';
    
    const mailOptions = {
      from: `"Uptime Monitor" <${process.env.EMAIL_USER}>`,
      to: site.owner.email,
      subject: isRecovery ? `Resolved: ${site.name} is back UP` : `Site down: ${site.name}`,
      html: `
        <div style="font-family: sans-serif; max-width: 500px; border-top: 4px solid ${isRecovery ? '#48bb78' : '#e53e3e'}; padding-top: 20px;">
          <h2 style="color: ${isRecovery ? '#48bb78' : '#e53e3e'};">
            ${isRecovery ? 'Back Online' : 'Your site is down'}
          </h2>
          <p>Hi ${site.owner.name},</p>
          <p>
            The monitor for <strong>${site.name}</strong> is now reporting a status of <strong>${type}</strong>.
          </p>
          <p>
            <strong>URL:</strong> <a href="${url}">${url}</a><br/>
            <strong>Time:</strong> ${new Date().toUTCString()}
          </p>
          ${isRecovery ? '<p>No further action is required.</p>' : '<p>We will notify you again when your site recovers.</p>'}
          <hr/>
          <small style="color: #888;">Uptime Monitor — your project</small>
        </div>
      `,
    };


       // ── Step 3: Send the email ─────────────────────────────────────────────
    // If this throws, BullMQ catches the error and retries (up to 3 times)
    // await transporter.sendMail(mailOptions);
    try {
  await transporter.sendMail(mailOptions);
  console.log(`✅ Success! Email sent to ${ownerEmail}`);
} catch (error:any) {
  console.error("❌ Nodemailer Error:", error.message);
  throw error; // Re-throw so BullMQ knows to retry
}

    console.log(`Alert email sent to ${ownerEmail} for site: ${url}`);
  },
  { connection: redis }
);

alertWorker.on('completed', (job) => {
  console.log(`Alert job ${job.id} completed — email sent`);
});

alertWorker.on('failed', (job, err) => {
  console.error(`Alert job ${job?.id} failed:`, err.message);
});

// 2. ADD LISTENERS HERE (After worker definition)
alertWorker.on('ready', () => {
  console.log('🚀 Worker is ready and listening for jobs on "alert-queue"');
});

alertWorker.on('active', (job) => {
  console.log(`🏃 Job ${job.id} has started processing`);
});

alertWorker.on('error', (err) => {
  console.error('🔥 Worker Connection Error:', err);
});