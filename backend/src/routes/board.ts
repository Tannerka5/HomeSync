import { Router } from "express";
import { getPool } from "../db.js";
import { createBoardItemSchema, updateBoardItemSchema } from "../validation.js";

const router = Router();

type DbTaskStatus = "todo" | "in_progress" | "done";
type UiTaskStatus = "To Do" | "In Progress" | "Done";

function mapDbStatusToUi(status: DbTaskStatus): UiTaskStatus {
  if (status === "done") return "Done";
  if (status === "in_progress") return "In Progress";
  return "To Do";
}

function formatDate(value: string | null): string {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

router.get("/items", async (req, res) => {
  const pool = getPool();
  if (!pool) return res.status(503).json({ message: "Database unavailable." });

  const listingId = req.query.listingId ? Number(req.query.listingId) : undefined;
  const itemType = req.query.type as string | undefined;

  try {
    let query = `SELECT collab_item_id, listing_id, item_type, title, body_text, status, due_date, created_at
                 FROM collab_item WHERE 1=1`;
    const params: unknown[] = [];
    let idx = 1;

    if (listingId) {
      query += ` AND listing_id = $${idx++}`;
      params.push(listingId);
    }
    if (itemType && ["task", "note", "document"].includes(itemType)) {
      query += ` AND item_type = $${idx++}`;
      params.push(itemType);
    }

    query += ` ORDER BY created_at DESC`;

    const { rows } = await pool.query(query, params);

    const items = rows.map((r) => ({
      id: `${r.item_type}-${r.collab_item_id}`,
      numericId: r.collab_item_id,
      type: r.item_type,
      title: r.title,
      content: r.body_text ?? "",
      status: mapDbStatusToUi(r.status as DbTaskStatus),
      date: formatDate(r.due_date),
    }));

    return res.json(items);
  } catch (error) {
    console.error("[board] Error fetching items:", error);
    return res.status(500).json({ message: "Unable to load board items." });
  }
});

router.get("/tasks", async (_req, res) => {
  const pool = getPool();
  if (!pool) return res.status(503).json({ message: "Database unavailable." });

  try {
    const { rows } = await pool.query(
      `SELECT collab_item_id, title, status, due_date
       FROM collab_item WHERE item_type = 'task'
       ORDER BY collab_item_id ASC`,
    );

    return res.json(
      rows.map((r) => ({
        id: `task-${r.collab_item_id}`,
        title: r.title,
        status: mapDbStatusToUi(r.status as DbTaskStatus),
        date: formatDate(r.due_date),
      })),
    );
  } catch (error) {
    console.error("[board] Error fetching tasks:", error);
    return res.status(500).json({ message: "Unable to load tasks." });
  }
});

router.post("/items", async (req, res) => {
  const parsed = createBoardItemSchema.safeParse(req.body);
  if (!parsed.success) {
    const msg = parsed.error.errors.map((e) => e.message).join(", ");
    return res.status(400).json({ message: msg });
  }

  const pool = getPool();
  if (!pool) return res.status(503).json({ message: "Database unavailable." });

  const { listingId, itemType, title, bodyText, status, dueDate } = parsed.data;
  const userId = req.user?.userId ?? null;

  try {
    const { rows } = await pool.query(
      `INSERT INTO collab_item (listing_id, created_by_user_id, item_type, title, body_text, status, due_date)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING collab_item_id, item_type, title, body_text, status, due_date`,
      [listingId ?? null, userId, itemType, title, bodyText ?? null, status, dueDate ?? null],
    );

    const r = rows[0];
    return res.status(201).json({
      id: `${r.item_type}-${r.collab_item_id}`,
      numericId: r.collab_item_id,
      type: r.item_type,
      title: r.title,
      content: r.body_text ?? "",
      status: mapDbStatusToUi(r.status as DbTaskStatus),
      date: formatDate(r.due_date),
    });
  } catch (error) {
    console.error("[board] Error creating item:", error);
    return res.status(500).json({ message: "Unable to create item." });
  }
});

router.patch("/items/:id", async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id <= 0) {
    return res.status(400).json({ message: "Invalid item ID." });
  }

  const parsed = updateBoardItemSchema.safeParse(req.body);
  if (!parsed.success) {
    const msg = parsed.error.errors.map((e) => e.message).join(", ");
    return res.status(400).json({ message: msg });
  }

  const pool = getPool();
  if (!pool) return res.status(503).json({ message: "Database unavailable." });

  const fields = parsed.data;
  const setClauses: string[] = [];
  const values: unknown[] = [];
  let idx = 1;

  const columnMap: Record<string, string> = {
    title: "title",
    bodyText: "body_text",
    status: "status",
    dueDate: "due_date",
  };

  for (const [key, col] of Object.entries(columnMap)) {
    if ((fields as Record<string, unknown>)[key] !== undefined) {
      setClauses.push(`${col} = $${idx++}`);
      values.push((fields as Record<string, unknown>)[key]);
    }
  }

  if (setClauses.length === 0) {
    return res.status(400).json({ message: "No fields to update." });
  }

  setClauses.push(`updated_at = NOW()`);
  values.push(id);

  try {
    const result = await pool.query(
      `UPDATE collab_item SET ${setClauses.join(", ")}
       WHERE collab_item_id = $${idx}
       RETURNING collab_item_id, item_type, title, body_text, status, due_date`,
      values,
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ message: "Item not found." });
    }

    const r = result.rows[0];
    return res.json({
      id: `${r.item_type}-${r.collab_item_id}`,
      numericId: r.collab_item_id,
      type: r.item_type,
      title: r.title,
      content: r.body_text ?? "",
      status: mapDbStatusToUi(r.status as DbTaskStatus),
      date: formatDate(r.due_date),
    });
  } catch (error) {
    console.error("[board] Error updating item:", error);
    return res.status(500).json({ message: "Unable to update item." });
  }
});

router.patch("/items/:id/toggle", async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id <= 0) {
    return res.status(400).json({ message: "Invalid item ID." });
  }

  const pool = getPool();
  if (!pool) return res.status(503).json({ message: "Database unavailable." });

  try {
    const result = await pool.query(
      `UPDATE collab_item
       SET status = CASE WHEN status = 'done' THEN 'todo' ELSE 'done' END,
           updated_at = NOW()
       WHERE collab_item_id = $1 AND item_type = 'task'
       RETURNING collab_item_id, title, status, due_date`,
      [id],
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ message: "Task not found." });
    }

    const r = result.rows[0];
    return res.json({
      id: `task-${r.collab_item_id}`,
      title: r.title,
      status: mapDbStatusToUi(r.status as DbTaskStatus),
      date: formatDate(r.due_date),
    });
  } catch (error) {
    console.error("[board] Error toggling task:", error);
    return res.status(500).json({ message: "Unable to toggle task." });
  }
});

router.delete("/items/:id", async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id <= 0) {
    return res.status(400).json({ message: "Invalid item ID." });
  }

  const pool = getPool();
  if (!pool) return res.status(503).json({ message: "Database unavailable." });

  try {
    const result = await pool.query(
      `DELETE FROM collab_item WHERE collab_item_id = $1`,
      [id],
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ message: "Item not found." });
    }
    return res.json({ message: "Item deleted." });
  } catch (error) {
    console.error("[board] Error deleting item:", error);
    return res.status(500).json({ message: "Unable to delete item." });
  }
});

export default router;
