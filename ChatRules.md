# Chat Rules and Requirements

## 1. Chat Deletion

- Users can delete any chat from their view.
- When a user deletes a chat, it is removed from their interface but remains visible to the other participant.
- If both participants in a conversation delete the chat, the conversation and its messages are permanently deleted from the database.

## 2. Message Requests

- When a user initiates a conversation with someone not already connected to them, it enters a `pending` state (a "message request").
- The receiver sees a prompt to Accept or Decline.
- When the receiver accepts the request, the sender's view must update in real-time (via WebSocket) so they can immediately begin chatting without refreshing the page.

## 3. Conversation Participant Restrictions

- A conversation requires that the recipient's email exists in the database.
- **Restriction:** Buyers cannot initiate conversations with other Buyers.
- **Allowed Combinations:**
  - Buyer ↔ Realtor
  - Buyer ↔ Collaborator
  - Realtor ↔ Collaborator
  - Realtor ↔ Realtor
  - Collaborator ↔ Collaborator

## 4. Notifications and User Status

- **Unread Notifications:** A chat should only show an unread badge if there are messages from the other participant that the current user has not yet read (as recorded in the `message_read` table).
- **User Status (Active Now):** The online status displayed in the chat header must reflect the actual real-time connection status of the other participant. If they are not connected via WebSocket, it must not display "Active Now".
