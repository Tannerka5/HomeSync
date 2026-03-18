import { z } from "zod";

export const signupSchema = z.object({
  firstName: z.string().trim().min(1, "First name is required").max(100),
  lastName: z.string().trim().min(1, "Last name is required").max(100),
  email: z.string().email("Invalid email address").max(255).transform((v) => v.toLowerCase()),
  password: z.string().min(8, "Password must be at least 8 characters").max(128),
  userType: z.enum(["buyer", "realtor", "collaborator"]),
});

export const loginSchema = z.object({
  email: z.string().email("Invalid email address").max(255).transform((v) => v.toLowerCase()),
  password: z.string().min(1, "Password is required").max(128),
  rememberMe: z.boolean().optional().default(false),
});

export const createListingSchema = z.object({
  addressLine1: z.string().min(1).max(255),
  city: z.string().min(1).max(120),
  state: z.string().length(2),
  zip: z.string().min(5).max(10),
  price: z.number().positive(),
  beds: z.number().int().min(0).optional(),
  baths: z.number().int().min(0).optional(),
  sqft: z.number().int().min(0).optional(),
  description: z.string().max(2000).optional(),
  image: z.string().url().max(500).optional(),
  status: z.enum(["active", "pending", "sold", "off_market"]).default("active"),
});

export const updateListingSchema = createListingSchema.partial();

export const createBoardItemSchema = z.object({
  listingId: z.number().int().positive().optional(),
  itemType: z.enum(["task", "note", "document"]),
  title: z.string().min(1).max(255),
  bodyText: z.string().max(5000).optional(),
  status: z.enum(["todo", "in_progress", "done"]).default("todo"),
  dueDate: z.string().datetime().optional(),
});

export const updateBoardItemSchema = z.object({
  title: z.string().min(1).max(255).optional(),
  bodyText: z.string().max(5000).optional(),
  status: z.enum(["todo", "in_progress", "done"]).optional(),
  dueDate: z.string().datetime().nullable().optional(),
});

export const sendMessageSchema = z.object({
  messageText: z.string().min(1, "Message cannot be empty").max(5000),
});

export const createConversationSchema = z.object({
  listingId: z.number().int().positive().optional(),
  participantUserId: z.number().int().positive(),
});
