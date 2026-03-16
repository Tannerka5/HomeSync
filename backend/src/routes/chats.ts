import { Router } from "express";
import { getPool } from "../db.js";
import { sendMessageSchema, createConversationSchema } from "../validation.js";

const router = Router();

router.get("/", async (req, res) => {
  const pool = getPool();
  if (!pool) return res.status(503).json({ message: "Database unavailable." });

  const userId = req.user!.userId;

  try {
    const { rows } = await pool.query(
      `SELECT c.conversation_id, c.listing_id, c.last_message_at, c.created_at,
              u.user_id, u.email, u.user_type,
              (SELECT m.message_text FROM message m
               WHERE m.conversation_id = c.conversation_id AND m.is_deleted = false
               ORDER BY m.sent_at DESC LIMIT 1) AS last_message,
              (SELECT COUNT(*) FROM message m
               WHERE m.conversation_id = c.conversation_id
               AND m.sender_user_id != $1
               AND m.is_deleted = false) AS unread_count
       FROM conversation c
       LEFT JOIN buyer b ON c.buyer_id = b.buyer_id
       LEFT JOIN realtor r ON c.realtor_id = r.realtor_id
       JOIN app_user u ON u.user_id = CASE
         WHEN b.user_id = $1 THEN r.user_id
         WHEN r.user_id = $1 THEN b.user_id
         ELSE COALESCE(r.user_id, b.user_id)
       END
       WHERE b.user_id = $1 OR r.user_id = $1
       ORDER BY c.last_message_at DESC NULLS LAST`,
      [userId],
    );

    const conversations = rows.map((r) => ({
      id: r.conversation_id,
      name: r.email.split("@")[0].replace(".", " ").replace(/\b\w/g, (c: string) => c.toUpperCase()),
      role: r.user_type.charAt(0).toUpperCase() + r.user_type.slice(1),
      avatar: "",
      lastMessage: r.last_message ?? "No messages yet",
      time: r.last_message_at
        ? new Date(r.last_message_at).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })
        : "",
      unread: Number(r.unread_count) > 0,
      pinned: false,
      category: "Professionals",
    }));

    return res.json(conversations);
  } catch (error) {
    console.error("[chats] Error fetching conversations:", error);
    return res.status(500).json({ message: "Unable to load conversations." });
  }
});

router.get("/:id/messages", async (req, res) => {
  const conversationId = Number(req.params.id);
  if (!Number.isInteger(conversationId) || conversationId <= 0) {
    return res.status(400).json({ message: "Invalid conversation ID." });
  }

  const pool = getPool();
  if (!pool) return res.status(503).json({ message: "Database unavailable." });

  const limit = Math.min(Number(req.query.limit) || 50, 100);
  const offset = Number(req.query.offset) || 0;

  try {
    const { rows } = await pool.query(
      `SELECT m.message_id, m.sender_user_id, m.message_text, m.sent_at,
              u.email AS sender_email, u.user_type AS sender_type
       FROM message m
       JOIN app_user u ON u.user_id = m.sender_user_id
       WHERE m.conversation_id = $1 AND m.is_deleted = false
       ORDER BY m.sent_at ASC
       LIMIT $2 OFFSET $3`,
      [conversationId, limit, offset],
    );

    const messages = rows.map((r) => ({
      id: r.message_id,
      senderUserId: r.sender_user_id,
      senderName: r.sender_email.split("@")[0],
      text: r.message_text,
      sentAt: r.sent_at,
      isOwn: r.sender_user_id === req.user!.userId,
    }));

    return res.json(messages);
  } catch (error) {
    console.error("[chats] Error fetching messages:", error);
    return res.status(500).json({ message: "Unable to load messages." });
  }
});

router.post("/:id/messages", async (req, res) => {
  const conversationId = Number(req.params.id);
  if (!Number.isInteger(conversationId) || conversationId <= 0) {
    return res.status(400).json({ message: "Invalid conversation ID." });
  }

  const parsed = sendMessageSchema.safeParse(req.body);
  if (!parsed.success) {
    const msg = parsed.error.errors.map((e) => e.message).join(", ");
    return res.status(400).json({ message: msg });
  }

  const pool = getPool();
  if (!pool) return res.status(503).json({ message: "Database unavailable." });

  const userId = req.user!.userId;

  try {
    const { rows } = await pool.query(
      `INSERT INTO message (conversation_id, sender_user_id, message_text)
       VALUES ($1, $2, $3)
       RETURNING message_id, message_text, sent_at`,
      [conversationId, userId, parsed.data.messageText],
    );

    await pool.query(
      `UPDATE conversation SET last_message_at = NOW() WHERE conversation_id = $1`,
      [conversationId],
    );

    const m = rows[0];
    return res.status(201).json({
      id: m.message_id,
      senderUserId: userId,
      text: m.message_text,
      sentAt: m.sent_at,
      isOwn: true,
    });
  } catch (error) {
    console.error("[chats] Error sending message:", error);
    return res.status(500).json({ message: "Unable to send message." });
  }
});

router.post("/", async (req, res) => {
  const parsed = createConversationSchema.safeParse(req.body);
  if (!parsed.success) {
    const msg = parsed.error.errors.map((e) => e.message).join(", ");
    return res.status(400).json({ message: msg });
  }

  const pool = getPool();
  if (!pool) return res.status(503).json({ message: "Database unavailable." });

  const userId = req.user!.userId;
  const { listingId, participantUserId } = parsed.data;

  try {
    const currentUser = await pool.query(
      `SELECT user_type FROM app_user WHERE user_id = $1`,
      [userId],
    );
    const participantUser = await pool.query(
      `SELECT user_type FROM app_user WHERE user_id = $1`,
      [participantUserId],
    );

    if (currentUser.rows.length === 0 || participantUser.rows.length === 0) {
      return res.status(404).json({ message: "User not found." });
    }

    const buyerUserId = currentUser.rows[0].user_type === "buyer" ? userId : participantUserId;
    const realtorUserId = currentUser.rows[0].user_type === "realtor" ? userId : participantUserId;

    const buyerRow = await pool.query(`SELECT buyer_id FROM buyer WHERE user_id = $1`, [buyerUserId]);
    const realtorRow = await pool.query(`SELECT realtor_id FROM realtor WHERE user_id = $1`, [realtorUserId]);

    const buyerId = buyerRow.rows[0]?.buyer_id ?? null;
    const realtorId = realtorRow.rows[0]?.realtor_id ?? null;

    const { rows } = await pool.query(
      `INSERT INTO conversation (listing_id, buyer_id, realtor_id, last_message_at)
       VALUES ($1, $2, $3, NOW())
       RETURNING conversation_id`,
      [listingId ?? null, buyerId, realtorId],
    );

    return res.status(201).json({ id: rows[0].conversation_id });
  } catch (error) {
    console.error("[chats] Error creating conversation:", error);
    return res.status(500).json({ message: "Unable to create conversation." });
  }
});

export default router;
