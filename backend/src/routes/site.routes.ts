import { Router, Request, Response } from 'express';
import { Site } from '../models/Site';
import { PingLog } from '../models/PingLog';
import { protect } from '../middleware/auth.middleware';
import { rateLimiter } from '../middleware/rateLimiter.middleware';
import { schedulePingJob, removePingJob } from '../queues/ping.queue';



const router = Router();

// Apply protect to ALL routes in this file
// Every request must have a valid JWT token
router.use(protect);

// ── GET /api/sites ───────────────────────────────────────────────────────────
// Returns all sites belonging to the logged-in user
router.get('/', async (req: any, res: Response): Promise<void> => {
  try {

    // if (!req.user) {
    //    res.status(401).json({ message: 'Unauthorized User'  });
    //    return;
    // }

    const sites = await Site.find({ owner: req.user!.id });
    res.json(sites);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch sites' });
  }  
});


// ── POST /api/sites ──────────────────────────────────────────────────────────
// Add a new site to monitor. Rate limited to prevent spam.
router.post('/', rateLimiter, async (req: any, res: Response): Promise<void> => {
  try {

    // 1. Explicit Guard Clause
    // if (!req.user) {
    //   res.status(401).json({ message: 'Authentication required' });
    //   return;
    // }

    const { name, url } = req.body;

    if (!name || !url) {
      res.status(400).json({ message: 'Name and URL are required' });
      return;
    }

    // Create the site in MongoDB
    const site = await Site.create({
      owner: req.user!.id,
      name,
      url,
    });

    // Start a repeating BullMQ job for this site
    await schedulePingJob(site.id, site.url);

    res.status(201).json(site);
  } catch (error) {
    res.status(500).json({ message: 'Failed to add site' });
  }
});


// ── DELETE /api/sites/:id ────────────────────────────────────────────────────
// Remove a site and stop its ping job
router.delete('/:id', async (req: any, res: Response): Promise<void> => {
  try {
    // 1. Explicit Guard Clause
    // if (!req.user) {
    //   res.status(401).json({ message: 'Authentication required' });
    //   return;
    // }

    const site = await Site.findOne({
      _id: req.params.id,
      owner: req.user!.id,    // ensure user can only delete their own sites
    });

    if (!site) {
      res.status(404).json({ message: 'Site not found' });
      return;
    }

    // Stop the BullMQ repeating job for this site
    await removePingJob(site.id);

    // Delete site and its ping history
    await Site.findByIdAndDelete(site.id);
    await PingLog.deleteMany({ siteId: site.id });

    res.json({ message: 'Site removed successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to delete site' });
  }
});



// ── GET /api/sites/:id/logs ──────────────────────────────────────────────────
// Returns last 50 ping logs for a site (used for uptime history charts)
router.get('/:id/logs', async (req: any, res: Response): Promise<void> => {
  try {

      // 1. Explicit Guard Clause
    // if (!req.user) {
    //   res.status(401).json({ message: 'Authentication required' });
    //   return;
    // }

    const site = await Site.findOne({
      _id: req.params.id,
      owner: req.user!.id,
    });

    if (!site) {
      res.status(404).json({ message: 'Site not found' });
      return;
    }

    const logs = await PingLog.find({ siteId: site.id })
      .sort({ checkedAt: -1 })   // newest first
      .limit(50);

    res.json(logs);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch logs' });
  }
});


export default router;

