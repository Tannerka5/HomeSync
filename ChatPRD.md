---

## Database Schema Changes

### 1. Add `status` and `requested_by_user_id` to `conversation`
```sql
ALTER TABLE conversation
  ADD COLUMN status VARCHAR(20) NOT NULL DEFAULT 'accepted'
    CHECK (status IN ('pending', 'accepted', 'declined')),
  ADD COLUMN requested_by_user_id INT REFERENCES app_user(user_id);
```

### 2. New `conversation_pin` table (per-user pinning)
```sql
CREATE TABLE conversation_pin (
  user_id         INT NOT NULL REFERENCES app_user(user_id) ON DELETE CASCADE,
  conversation_id INT NOT NULL REFERENCES conversation(conversation_id) ON DELETE CASCADE,
  pinned_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_id, conversation_id)
);
```

### 3. New `message_read` table (true read receipts)
```sql
CREATE TABLE message_read (
  message_id INT NOT NULL REFERENCES message(message_id) ON DELETE CASCADE,
  user_id    INT NOT NULL REFERENCES app_user(user_id) ON DELETE CASCADE,
  read_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (message_id, user_id)
);
```

### 4. Extend `message_type` to support `file` and `image`
```sql
ALTER TABLE message DROP CONSTRAINT message_message_type_check;
ALTER TABLE message ADD CONSTRAINT message_message_type_check
  CHECK (message_type IN ('text', 'listing_share', 'image', 'file'));
```

### 5. `message_payload` schema for file/image messages
```json
{
  "s3_key":     "chat/uploads/uuid.pdf",
  "cdn_url":    "https://cdn.homesync.com/chat/uploads/uuid.pdf",
  "filename":   "inspection-report.pdf",
  "mime_type":  "application/pdf",
  "size_bytes": 204800
}
```

---

## Feature Requirements

### F-1 · Remove Unused UI Elements

**Scope:** Frontend only

- Remove `Phone`, `Video`, and `MoreVertical` (3-dot) icon buttons from the chat header
- Remove placeholder `Paperclip` and `Smile` buttons — replace with real implementations
  per F-6 and F-7
- No backend changes needed

---

### F-2 · Name Display from Database

**Scope:** Backend

The current implementation derives display names by parsing the email string
(`email.split("@")[0]`). Replace with `first_name` and `last_name` from `app_user`.

- Update `GET /api/chats` SQL to `SELECT u.first_name, u.last_name` and map
  `name: r.first_name + ' ' + r.last_name`
- Apply the same fix to `GET /api/chats/:id/messages` for `senderName`
- No frontend type changes needed — `name` and `senderName` remain strings

---

### F-3 · Real-Time Messaging (WebSocket)

**Scope:** Backend + Frontend

- Add **`socket.io`** to the backend alongside the existing Express HTTP server
- On socket connection, client authenticates via cookie/token and joins room
  `conversation:{id}`
- When `POST /api/chats/:id/messages` inserts a message, emit `new_message` to
  the conversation room
- Frontend subscribes to `new_message` and appends to local `messages` state
- **Typing indicators:** Emit `typing_start` / `typing_stop` from client;
  debounce on `onKeyDown`; display "User is typing…" below the message list

**Nginx update required:**

```nginx
proxy_set_header Upgrade $http_upgrade;
proxy_set_header Connection "upgrade";
```

---

### F-4 · Search Bar Functionality

**Scope:** Frontend (client-side filtering)

- On input change, filter `chats` state by `chat.name` and `chat.lastMessage`
  (case-insensitive)
- Clear (×) button appears when input is non-empty
- No new backend endpoint required for V2
- **Future (V3):** Full message body search via `GET /api/chats/search?q=`

---

### F-5 · Pin Chat Functionality

**Scope:** Backend + Frontend

**Backend:**

- `POST /api/chats/:id/pin` — insert into `conversation_pin` for current user
- `DELETE /api/chats/:id/pin` — remove from `conversation_pin` for current user
- Update `GET /api/chats` to LEFT JOIN `conversation_pin` and return
  `pinned: boolean` per user

**Frontend:**

- Long-press or right-click context menu on a conversation row reveals
  "Pin" / "Unpin"
- Toggling pin calls the appropriate endpoint and optimistically updates local state
- Pinned tab now backed by real data
- Pinned conversations render the filled Pin icon (already styled in V1)

---

### F-6 · Emoji Picker

**Scope:** Frontend only

- Install `@emoji-mart/react` and `@emoji-mart/data`
- Clicking the `Smile` button renders a floating `<Picker>` anchored above
  the message input
- Selecting an emoji appends it to `messageInput` state
- Picker dismisses on outside click via `useEffect` with a `mousedown` listener
- No backend changes needed

---

### F-7 · File & Image Attachment

**Scope:** Backend + Frontend

**Backend — new endpoint:**

- `POST /api/chats/upload/presign`
  - Accepts `{ filename, mimeType, conversationId }`
  - Validates auth and MIME type against allowlist
  - Returns `{ presignedUrl, cdnUrl, s3Key }` (expires in 5 min)
  - Install `@aws-sdk/client-s3` and `@aws-sdk/s3-request-presigner`

**Frontend — upload flow:**

1. Hidden `<input type="file">` triggered by Paperclip button
2. Call `POST /api/chats/upload/presign` on file select
3. Browser `PUT`s file directly to returned `presignedUrl`
4. On S3 `200 OK`, call `POST /api/chats/:id/messages` with `messageType`
   and payload

**Frontend — rendering:**

- `image` type: renders `<img>` inline in the chat bubble
- `file` type: renders a file card with filename, formatted size, and download link

**Constraints:**

- Max 25 MB per file
- Allowed types: `image/*`, `application/pdf`, `application/msword`,
  `application/vnd.openxmlformats-officedocument.*`

---

### F-8 · Read Receipts

**Scope:** Backend + Frontend

**Backend:**

- `POST /api/chats/:id/read-all` — upserts `message_read` for all messages
  in the conversation not sent by current user; called on conversation open
- `POST /api/chats/:id/messages/:msgId/read` — mark a single message as read
- Update `GET /api/chats/:id/messages` to JOIN `message_read` and return
  `readBy: { userId, readAt }[]` per message

**Frontend:**

- Fire `POST /api/chats/:id/read-all` when a conversation is selected
- Dynamic checkmark logic:
  - Single gray check → sent (exists in DB)
  - Double gray check → delivered (received by server)
  - Double primary-color check → read (entry in `message_read` for recipient)
- Emit `message_read` WebSocket event so sender sees receipt updates in real-time

---

### F-9 · Tabs / Filter Categories

**Scope:** Backend + Frontend

Replace 4 hardcoded client-side filters with 6 server-driven ones:

| Tab           | Filter Logic                                             |
| ------------- | -------------------------------------------------------- |
| All           | All `accepted` conversations                             |
| Unread        | `accepted` + unread messages exist                       |
| Pinned        | `accepted` + pinned by current user                      |
| Professionals | `accepted` + other party `user_type = 'realtor'`         |
| Collaborators | `accepted` + other party `user_type = 'collaborator'`    |
| Requests      | `status = 'pending'` where current user is the recipient |

- Pass filter as query param: `GET /api/chats?filter=requests`
- Requests tab shows a numeric badge of pending count
- `pending` conversations never appear in any tab other than Requests

---

### F-10 · New Conversation Modal & Message Requests

**Scope:** Backend + Frontend

**Trigger:** `+` button in sidebar header opens a modal

**Sender Flow:**

1. Email address input (validated format client-side)
2. Optional initial message text area
3. Submit → `POST /api/chats/request` with `{ recipientEmail, initialMessage }`
4. Backend: looks up user by email (`404` if not found); checks for duplicate
   `pending`/`accepted` conversation (`409` if exists); creates `conversation`
   with `status: 'pending'`; inserts initial message
5. Sender sees conversation in Requests tab with input disabled and
   "Waiting for acceptance…" state

**Recipient Flow (Requests Tab):**

- Each request card shows sender full name, role badge, and initial message preview
- **Accept** → `PATCH /api/chats/:id/accept` sets `status: 'accepted'`;
  conversation moves to appropriate tab
- **Decline** → `PATCH /api/chats/:id/decline` sets `status: 'declined'`;
  conversation hidden for both parties

**Constraints:**

- `pending` conversations excluded from all tabs except Requests
- Sender cannot send additional messages until accepted
- Declined conversations are soft-deleted (not purged from DB)

---

## New API Endpoints Summary

| Method   | Path                                  | Description                               |
| -------- | ------------------------------------- | ----------------------------------------- |
| `POST`   | `/api/chats/request`                  | Create a message request                  |
| `PATCH`  | `/api/chats/:id/accept`               | Accept a message request                  |
| `PATCH`  | `/api/chats/:id/decline`              | Decline a message request                 |
| `POST`   | `/api/chats/:id/pin`                  | Pin a conversation for current user       |
| `DELETE` | `/api/chats/:id/pin`                  | Unpin a conversation for current user     |
| `POST`   | `/api/chats/upload/presign`           | Get S3 presigned upload URL               |
| `POST`   | `/api/chats/:id/messages/:msgId/read` | Mark a single message as read             |
| `POST`   | `/api/chats/:id/read-all`             | Mark all messages in conversation as read |

---

## New Dependencies

| Package                         | Side     | Purpose                  |
| ------------------------------- | -------- | ------------------------ |
| `socket.io`                     | Backend  | WebSocket server         |
| `socket.io-client`              | Frontend | WebSocket client         |
| `@aws-sdk/client-s3`            | Backend  | S3 integration           |
| `@aws-sdk/s3-request-presigner` | Backend  | Presigned URL generation |
| `@emoji-mart/react`             | Frontend | Emoji picker component   |
| `@emoji-mart/data`              | Frontend | Emoji dataset            |

---

## Out of Scope (V2)

- Group conversations (schema supports 1-on-1 only)
- Push / browser notifications
- Message editing or reactions
- Voice / video calling (buttons removed per F-1)
- Full message body search (deferred to V3)
