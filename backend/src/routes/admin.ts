import { Router } from "express";
import { getPool } from "../db.js";

const router = Router();

router.get("/okr", async (_req, res) => {
  const pool = getPool();
  if (!pool) return res.status(503).json({ message: "Database unavailable." });

  try {
    const [activeListings, tasksCompleted, messagesSent] = await Promise.all([
      pool.query<{ count: number }>(
        `SELECT COUNT(*)::int AS count FROM listing WHERE status IN ('active', 'new')`
      ),
      pool.query<{ count: number }>(
        `SELECT COUNT(*)::int AS count FROM collab_item
         WHERE item_type = 'task'
           AND status = 'done'
           AND updated_at >= date_trunc('month', CURRENT_TIMESTAMP)`
      ),
      pool.query<{ count: number }>(
        `SELECT COUNT(*)::int AS count FROM message
         WHERE sent_at >= date_trunc('month', CURRENT_TIMESTAMP)
           AND is_deleted = false`
      ),
    ]);

    return res.json({
      objective: "Drive Active Household Collaboration",
      keyResults: [
        {
          label: "Active Listings",
          current: activeListings.rows[0].count,
          target: 50,
        },
        {
          label: "Tasks Completed This Month",
          current: tasksCompleted.rows[0].count,
          target: 100,
        },
        {
          label: "Messages Sent This Month",
          current: messagesSent.rows[0].count,
          target: 200,
        },
      ],
    });
  } catch (error) {
    console.error("[admin] Error fetching OKR data:", error);
    return res.status(500).json({ message: "Unable to load OKR data." });
  }
});

export default router;
