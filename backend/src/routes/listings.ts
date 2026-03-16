import { Router } from "express";
import { getPool } from "../db.js";
import { createListingSchema, updateListingSchema } from "../validation.js";

const router = Router();

router.get("/", async (_req, res) => {
  const pool = getPool();
  if (!pool) return res.status(503).json({ message: "Database unavailable." });

  try {
    const { rows } = await pool.query(
      `SELECT listing_id, address_line1, city, state, zip, price,
              beds, baths, sqft, description, image, status,
              created_at, created_by_user_id
       FROM listing
       ORDER BY created_at DESC`,
    );

    const listings = rows.map((r) => ({
      id: r.listing_id,
      title: `${r.address_line1}`,
      price: `$${Number(r.price).toLocaleString()}`,
      address: `${r.address_line1}, ${r.city}`,
      beds: r.beds ?? 0,
      baths: r.baths ?? 0,
      sqft: r.sqft ?? 0,
      image: r.image ?? "/images/listing-placeholder.jpg",
      description: r.description ?? "",
      status: r.status.charAt(0).toUpperCase() + r.status.slice(1),
    }));

    return res.json(listings);
  } catch (error) {
    console.error("[listings] Error fetching listings:", error);
    return res.status(500).json({ message: "Unable to load listings." });
  }
});

router.get("/:id", async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id <= 0) {
    return res.status(400).json({ message: "Invalid listing ID." });
  }

  const pool = getPool();
  if (!pool) return res.status(503).json({ message: "Database unavailable." });

  try {
    const { rows } = await pool.query(
      `SELECT listing_id, address_line1, city, state, zip, price,
              beds, baths, sqft, description, image, status,
              created_at, created_by_user_id
       FROM listing WHERE listing_id = $1`,
      [id],
    );

    if (rows.length === 0) {
      return res.status(404).json({ message: "Listing not found." });
    }

    const r = rows[0];
    return res.json({
      id: r.listing_id,
      title: r.address_line1,
      price: `$${Number(r.price).toLocaleString()}`,
      address: `${r.address_line1}, ${r.city}`,
      beds: r.beds ?? 0,
      baths: r.baths ?? 0,
      sqft: r.sqft ?? 0,
      image: r.image ?? "/images/listing-placeholder.jpg",
      description: r.description ?? "",
      status: r.status.charAt(0).toUpperCase() + r.status.slice(1),
    });
  } catch (error) {
    console.error("[listings] Error fetching listing:", error);
    return res.status(500).json({ message: "Unable to load listing." });
  }
});

router.post("/", async (req, res) => {
  const parsed = createListingSchema.safeParse(req.body);
  if (!parsed.success) {
    const msg = parsed.error.errors.map((e) => e.message).join(", ");
    return res.status(400).json({ message: msg });
  }

  const pool = getPool();
  if (!pool) return res.status(503).json({ message: "Database unavailable." });

  const { addressLine1, city, state, zip, price, beds, baths, sqft, description, image, status } =
    parsed.data;
  const userId = req.user?.userId ?? null;

  try {
    const { rows } = await pool.query(
      `INSERT INTO listing (address_line1, city, state, zip, price, beds, baths, sqft, description, image, status, created_by_user_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
       RETURNING listing_id`,
      [addressLine1, city, state, zip, price, beds ?? 0, baths ?? 0, sqft ?? 0, description ?? null, image ?? null, status, userId],
    );

    return res.status(201).json({ id: rows[0].listing_id, message: "Listing created." });
  } catch (error) {
    console.error("[listings] Error creating listing:", error);
    return res.status(500).json({ message: "Unable to create listing." });
  }
});

router.patch("/:id", async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id <= 0) {
    return res.status(400).json({ message: "Invalid listing ID." });
  }

  const parsed = updateListingSchema.safeParse(req.body);
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
    addressLine1: "address_line1",
    city: "city",
    state: "state",
    zip: "zip",
    price: "price",
    beds: "beds",
    baths: "baths",
    sqft: "sqft",
    description: "description",
    image: "image",
    status: "status",
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
      `UPDATE listing SET ${setClauses.join(", ")} WHERE listing_id = $${idx} RETURNING listing_id`,
      values,
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ message: "Listing not found." });
    }
    return res.json({ message: "Listing updated." });
  } catch (error) {
    console.error("[listings] Error updating listing:", error);
    return res.status(500).json({ message: "Unable to update listing." });
  }
});

router.delete("/:id", async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id <= 0) {
    return res.status(400).json({ message: "Invalid listing ID." });
  }

  const pool = getPool();
  if (!pool) return res.status(503).json({ message: "Database unavailable." });

  try {
    const result = await pool.query(
      `UPDATE listing SET status = 'off_market', updated_at = NOW() WHERE listing_id = $1 RETURNING listing_id`,
      [id],
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ message: "Listing not found." });
    }
    return res.json({ message: "Listing removed." });
  } catch (error) {
    console.error("[listings] Error deleting listing:", error);
    return res.status(500).json({ message: "Unable to remove listing." });
  }
});

export default router;
