import { Router } from "express";
import { getPool } from "../db.js";
import { sendMessageSchema, createConversationSchema } from "../validation.js";
import { getIO } from "../socket.js";

const router = Router();

router.get("/", async (req, res) => {
  const pool = getPool();
  if (!pool) return res.status(503).json({ message: "Database unavailable." });

  const userId = req.user!.userId;

  try {
    const { rows } = await pool.query(
      `SELECT c.conversation_id, c.listing_id, c.last_message_at, c.created_at,
              c.status, c.requested_by_user_id,
              u.user_id, u.first_name, u.last_name, u.email, u.user_type,
              (SELECT m.message_text FROM message m
               WHERE m.conversation_id = c.conversation_id AND m.is_deleted = false
               ORDER BY m.sent_at DESC LIMIT 1) AS last_message,
              (SELECT COUNT(*) FROM message m
               WHERE m.conversation_id = c.conversation_id
               AND m.sender_user_id != $1
               AND m.is_deleted = false) AS unread_count,
              (SELECT COUNT(*) FROM conversation_pin cp 
               WHERE cp.conversation_id = c.conversation_id AND cp.user_id = $1) AS is_pinned
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
      name: r.first_name + ' ' + r.last_name,
      role: r.user_type.charAt(0).toUpperCase() + r.user_type.slice(1),
      avatar: "",
      lastMessage: r.last_message ?? "No messages yet",
      time: r.last_message_at
        ? new Date(r.last_message_at).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })
        : "",
      unread: Number(r.unread_count) > 0,
      pinned: Number(r.is_pinned) > 0,
      category: "Professionals",
      status: r.status,
      requestedBy: Number(r.requested_by_user_id),
      isRequester: Number(r.requested_by_user_id) === userId
    }));

    return res.json(conversations);
  } catch (error) {
    console.error("[chats] Error fetching conversations:", error);
    return res.status(500).json({ message: "Unable to load conversations." });
  }
});

router.get("/search", async (req, res) => {
  const pool = getPool();
  if (!pool) return res.status(503).json({ message: "Database unavailable." });

  const userId = req.user!.userId;
  const q = req.query.q as string;
  if (!q) return res.json([]);

  try {
    const { rows } = await pool.query(
      `SELECT c.conversation_id, m.message_id, m.message_text, m.sent_at,
              u.first_name, u.last_name
       FROM message m
       JOIN conversation c ON c.conversation_id = m.conversation_id
       LEFT JOIN buyer b ON c.buyer_id = b.buyer_id
       LEFT JOIN realtor r ON c.realtor_id = r.realtor_id
       JOIN app_user u ON u.user_id = CASE
         WHEN b.user_id = $1 THEN r.user_id
         WHEN r.user_id = $1 THEN b.user_id
         ELSE COALESCE(r.user_id, b.user_id)
       END
       WHERE (b.user_id = $1 OR r.user_id = $1)
       AND m.message_text ILIKE $2
       AND m.is_deleted = false
       ORDER BY m.sent_at DESC
       LIMIT 50`,
      [userId, `%${q}%`],
    );

    const results = rows.map(r => ({
      conversationId: r.conversation_id,
      messageId: r.message_id,
      text: r.message_text,
      sentAt: r.sent_at,
      name: r.first_name + ' ' + r.last_name
    }));

    return res.json(results);
  } catch (error) {
    console.error("[chats] Error searching messages:", error);
    return res.status(500).json({ message: "Unable to search messages." });
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
              m.message_type, m.message_payload,
              u.first_name, u.last_name, u.email AS sender_email
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
      senderName: r.first_name + ' ' + r.last_name,
      text: r.message_text,
      messageType: r.message_type ?? "text",
      payload: r.message_payload ?? null,
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
  const messageType =
    parsed.data.messageType === "listing_share" ? "listing_share" : "text";
  const payload =
    parsed.data.messageType === "listing_share" ? parsed.data.payload : null;

  try {
    const { rows } = await pool.query(
      `WITH inserted AS (
         INSERT INTO message (conversation_id, sender_user_id, message_text, message_type, message_payload)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING message_id, sender_user_id, message_text, message_type, message_payload, sent_at
       )
       SELECT i.message_id, i.sender_user_id, i.message_text, i.message_type, i.message_payload, i.sent_at, u.first_name, u.last_name, u.email AS sender_email
       FROM inserted i
       JOIN app_user u ON u.user_id = i.sender_user_id`,
      [conversationId, userId, parsed.data.messageText, messageType, payload],
    );

    await pool.query(
      `UPDATE conversation SET last_message_at = NOW() WHERE conversation_id = $1`,
      [conversationId],
    );

    const m = rows[0];
    const messageResponse = {
      id: m.message_id,
      senderUserId: userId,
      senderName: m.first_name + ' ' + m.last_name,
      text: m.message_text,
      messageType: m.message_type ?? "text",
      payload: m.message_payload ?? null,
      sentAt: m.sent_at,
      isOwn: true,
    };

    try {
      getIO().to(`conversation:${conversationId}`).emit("new_message", { ...messageResponse, isOwn: false });
    } catch (e) {
      console.error("[chats] socket emit failed:", e);
    }

    return res.status(201).json(messageResponse);
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
      `INSERT INTO conversation (listing_id, buyer_id, realtor_id, last_message_at, status, requested_by_user_id)
       VALUES ($1, $2, $3, NOW(), 'pending', $4)
       RETURNING conversation_id`,
      [listingId ?? null, buyerId, realtorId, userId],
    );

    return res.status(201).json({ id: rows[0].conversation_id });
  } catch (error) {
    console.error("[chats] Error creating conversation:", error);
    return res.status(500).json({ message: "Unable to create conversation." });
  }
});

router.post("/:id/pin", async (req, res) => {
  const conversationId = Number(req.params.id);
  const userId = req.user!.userId;
  const pool = getPool();
  if (!pool) return res.status(503).json({ message: "Database unavailable." });

  try {
    await pool.query(
      `INSERT INTO conversation_pin (user_id, conversation_id) VALUES ($1, $2) ON CONFLICT DO NOTHING`,
      [userId, conversationId]
    );
    return res.status(204).send();
  } catch (error) {
    console.error("[chats] Error pinning chat:", error);
    return res.status(500).json({ message: "Error pinning chat." });
  }
});

router.delete("/:id/pin", async (req, res) => {
  const conversationId = Number(req.params.id);
  const userId = req.user!.userId;
  const pool = getPool();
  if (!pool) return res.status(503).json({ message: "Database unavailable." });

  try {
    await pool.query(
      `DELETE FROM conversation_pin WHERE user_id = $1 AND conversation_id = $2`,
      [userId, conversationId]
    );
    return res.status(204).send();
  } catch (error) {
    console.error("[chats] Error unpinning chat:", error);
    return res.status(500).json({ message: "Error unpinning chat." });
  }
});

router.post("/:id/read-all", async (req, res) => {
  const conversationId = Number(req.params.id);
  const userId = req.user!.userId;
  const pool = getPool();
  if (!pool) return res.status(503).json({ message: "Database unavailable." });

  try {
    await pool.query(
      `INSERT INTO message_read (message_id, user_id)
       SELECT m.message_id, $1 FROM message m
       WHERE m.conversation_id = $2 AND m.sender_user_id != $1
       ON CONFLICT DO NOTHING`,
      [userId, conversationId]
    );
    return res.status(204).send();
  } catch (error) {
    console.error("[chats] Error marking messages read:", error);
    return res.status(500).json({ message: "Error marking messages read." });
  }
});

router.post("/request", async (req, res) => {
  const { email, messageText } = req.body;
  if (!email) return res.status(400).json({ message: "Email is required." });
  if (!messageText) return res.status(400).json({ message: "An initial message is required." });
  
  const pool = getPool();
  if (!pool) return res.status(503).json({ message: "Database unavailable." });

  const userId = req.user!.userId;

  try {
    const requestedUser = await pool.query(
      `SELECT user_id, user_type FROM app_user WHERE email = $1`,
      [email]
    );

    if (requestedUser.rows.length === 0) {
      return res.status(404).json({ message: "User not found with that email." });
    }

    const participantUserId = requestedUser.rows[0].user_id;

    if (userId === participantUserId) {
      return res.status(400).json({ message: "Cannot start a conversation with yourself." });
    }

    const currentUser = await pool.query(
      `SELECT user_type FROM app_user WHERE user_id = $1`,
      [userId]
    );

    if (currentUser.rows[0].user_type === requestedUser.rows[0].user_type) {
      return res.status(400).json({ message: "Conversations can only be started between a Buyer and a Professional." });
    }

    const buyerUserId = currentUser.rows[0].user_type === "buyer" ? userId : participantUserId;
    const realtorUserId = currentUser.rows[0].user_type === "realtor" ? userId : participantUserId;

    const buyerRow = await pool.query(`SELECT buyer_id FROM buyer WHERE user_id = $1`, [buyerUserId]);
    const realtorRow = await pool.query(`SELECT realtor_id FROM realtor WHERE user_id = $1`, [realtorUserId]);

    const buyerId = buyerRow.rows[0]?.buyer_id ?? null;
    const realtorId = realtorRow.rows[0]?.realtor_id ?? null;

    if (!buyerId || !realtorId) {
      return res.status(400).json({ message: "One of the users has an incomplete profile (missing buyer or realtor data) and cannot chat." });
    }

    const existing = await pool.query(
      `SELECT conversation_id FROM conversation WHERE buyer_id = $1 AND realtor_id = $2`,
      [buyerId, realtorId]
    );
    
    if (existing.rows.length > 0) {
       return res.status(200).json({ id: existing.rows[0].conversation_id, message: "Conversation already exists." });
    }

    const { rows } = await pool.query(
      `WITH inserted_conv AS (
         INSERT INTO conversation (buyer_id, realtor_id, last_message_at, status, requested_by_user_id)
         VALUES ($1, $2, NOW(), 'pending', $3)
         RETURNING conversation_id
       ),
       inserted_msg AS (
         INSERT INTO message (conversation_id, sender_user_id, message_text, message_type)
         SELECT conversation_id, $3, $4, 'text' FROM inserted_conv
         RETURNING message_id, message_text, sent_at
       )
       SELECT c.conversation_id, m.message_id, m.message_text, m.sent_at 
       FROM inserted_conv c, inserted_msg m`,
      [buyerId, realtorId, userId, messageText]
    );

    const convId = rows[0].conversation_id;

    // Fire socket event so recipient sees it
    try {
      getIO().to(`user:${participantUserId}`).emit("new_request", { conversationId: convId });
    } catch (e) {}

    return res.status(201).json({ id: convId });
  } catch (error) {
    console.error("[chats] Error creating request:", error);
    return res.status(500).json({ message: "Unable to create conversation request." });
  }
});

router.patch("/:id/accept", async (req, res) => {
  const conversationId = Number(req.params.id);
  const pool = getPool();
  if (!pool) return res.status(503).json({ message: "Database unavailable." });

  try {
    await pool.query(
      `UPDATE conversation SET status = 'accepted' WHERE conversation_id = $1`,
      [conversationId]
    );
    return res.status(204).send();
  } catch (error) {
    return res.status(500).json({ message: "Error accepting request." });
  }
});

router.patch("/:id/decline", async (req, res) => {
  const conversationId = Number(req.params.id);
  const pool = getPool();
  if (!pool) return res.status(503).json({ message: "Database unavailable." });

  try {
    await pool.query(
      `UPDATE conversation SET status = 'declined' WHERE conversation_id = $1`,
      [conversationId]
    );
    return res.status(204).send();
  } catch (error) {
    return res.status(500).json({ message: "Error declining request." });
  }
});

export default router;
