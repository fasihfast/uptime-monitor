import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

// 1. MUST LOAD ENV FIRST
dotenv.config(); 

import { connectDB } from './config/db';
import { redis } from './config/redis'; // Ensure you import your redis instance
import authRoutes from './routes/auth.routes';
import siteRoutes from './routes/site.routes';
import { Queue } from 'bullmq';

const app = express();

// Middleware
app.use(cors({ 
  origin: 'http://localhost:5173', 
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  credentials: true 
}));
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/sites', siteRoutes);

app.get('/', (_req, res) => {
  res.json({ message: 'Uptime Monitor API is running' });
});

const cleanupQueue = new Queue('log-cleanup-queue', { connection: redis });


const startCleanupCron = async () => {
  await cleanupQueue.add(
    'short-term-cleanup',
    {},
    {
      repeat: {
        pattern: '*/30 * * * *', // Runs every 30 minutes
      },
    }
  );
  console.log("📅 Log cleanup scheduled: Every 30 minutes");
};

const start = async () => {
  try {
    // 2. CONNECT DATABASE
    await connectDB();
    console.log("MongoDB connected successfully");

    // // 3. CLEAN UP REDIS (Crucial for clearing those "ghost" jobs)
    // await redis.flushall();
    // console.log("🧹 Redis wiped clean of old jobs");

    // 4. NOW START WORKERS (Importing them here ensures they see process.env)
    // Using require or dynamic import ensures dotenv is already finished
    require('./workers/ping.worker');
    require('./workers/alert.worker');
    require('./workers/logCleanup.worker');

    const PORT = process.env.PORT || 5000;
    app.listen(PORT, () => {
      console.log(`Server started successfully on port ${PORT}`);
      console.log(`Ping worker listening on ping-queue`);
      console.log(`Alert worker listening on alert-queue`);
    });

    startCleanupCron();

    
  } catch (error) {
    console.error("Failed to start application:", error);
    process.exit(1);
  }
}

start();