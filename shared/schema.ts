/**
 * Database schema definitions for the TonerWeb AI Assistant.
 * 
 * This module defines the complete database schema using Drizzle ORM including:
 * - Table definitions for users, chat sessions, and messages
 * - Validation schemas using Zod
 * - TypeScript type definitions for all entities
 * - Insert schemas for data validation
 * 
 * The schema is shared between server and client to ensure type consistency
 * across the entire application.
 * 
 * @author TonerWeb Team
 * @version 1.0.0
 */

import { pgTable, text, serial, timestamp, jsonb, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

/**
 * Users table definition.
 * 
 * Stores user authentication and profile information.
 * 
 * @table users
 * @column id - Auto-incrementing primary key
 * @column username - Unique username for login (required)
 * @column password - Hashed password for authentication (required)
 * 
 * @example
 * // Insert a new user
 * await db.insert(users).values({
 *   username: 'john_doe',
 *   password: 'hashed_password'
 * });
 */
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

/**
 * Chat sessions table definition.
 * 
 * Stores conversation sessions to group related messages and maintain context.
 * Each session belongs to a specific user and can have an optional title.
 * 
 * @table chat_sessions
 * @column id - Auto-incrementing primary key
 * @column userId - Foreign key reference to users.id (nullable for anonymous sessions)
 * @column title - Optional human-readable title for the session
 * @column createdAt - Timestamp when the session was created
 * @column updatedAt - Timestamp when the session was last updated
 * 
 * @example
 * // Create a new chat session
 * await db.insert(chatSessions).values({
 *   userId: 123,
 *   title: 'Canon Printer Help'
 * });
 */
export const chatSessions = pgTable("chat_sessions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id),
  title: text("title"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

/**
 * Messages table definition.
 * 
 * Stores individual messages within chat sessions. Messages can be from
 * users or AI assistants and include metadata for conversation context.
 * 
 * @table messages
 * @column id - Auto-incrementing primary key
 * @column sessionId - Foreign key reference to chat_sessions.id (nullable)
 * @column content - Message content/text (required)
 * @column role - Message role: 'user' or 'assistant' (required)
 * @column metadata - Additional data like search mode, sources, etc. (JSON)
 * @column createdAt - Timestamp when the message was created
 * 
 * @example
 * // Create a user message
 * await db.insert(messages).values({
 *   sessionId: 456,
 *   content: 'Find Canon PG-540 ink cartridge',
 *   role: 'user',
 *   metadata: { mode: 'DeepSearch' }
 * });
 * 
 * // Create an assistant message
 * await db.insert(messages).values({
 *   sessionId: 456,
 *   content: 'Found Canon PG-540 on tonerweb.no...',
 *   role: 'assistant',
 *   metadata: { sources: ['tonerweb.no'] }
 * });
 */
export const messages = pgTable("messages", {
  id: serial("id").primaryKey(),
  sessionId: integer("session_id").references(() => chatSessions.id),
  content: text("content").notNull(),
  role: text("role").notNull(), // 'user' or 'assistant'
  metadata: jsonb("metadata"), // For storing additional data like sources, mode, etc.
  createdAt: timestamp("created_at").defaultNow(),
});

/**
 * Zod validation schema for user insertion.
 * 
 * Validates user data before database insertion, ensuring required fields
 * are present and properly formatted.
 * 
 * @schema insertUserSchema
 * @field username - Required string for user identification
 * @field password - Required string for authentication (should be hashed)
 * 
 * @example
 * const userData = insertUserSchema.parse({
 *   username: 'john_doe',
 *   password: 'hashed_password'
 * });
 */
export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

/**
 * Zod validation schema for chat session insertion.
 * 
 * Validates chat session data before database insertion.
 * 
 * @schema insertChatSessionSchema
 * @field userId - Optional integer referencing the user who owns this session
 * @field title - Optional string for session identification
 * 
 * @example
 * const sessionData = insertChatSessionSchema.parse({
 *   userId: 123,
 *   title: 'Canon Printer Help'
 * });
 */
export const insertChatSessionSchema = createInsertSchema(chatSessions).pick({
  userId: true,
  title: true,
});

/**
 * Zod validation schema for message insertion.
 * 
 * Validates message data before database insertion, ensuring proper
 * role values and content requirements.
 * 
 * @schema insertMessageSchema
 * @field sessionId - Optional integer referencing the chat session
 * @field content - Required string containing the message text
 * @field role - Required string ('user' or 'assistant')
 * @field metadata - Optional JSON object for additional message data
 * 
 * @example
 * const messageData = insertMessageSchema.parse({
 *   sessionId: 456,
 *   content: 'Find Canon PG-540 ink cartridge',
 *   role: 'user',
 *   metadata: { mode: 'DeepSearch' }
 * });
 */
export const insertMessageSchema = createInsertSchema(messages).pick({
  sessionId: true,
  content: true,
  role: true,
  metadata: true,
});

/**
 * TypeScript type for user insertion operations.
 * 
 * Represents the shape of data required to create a new user.
 * 
 * @typedef InsertUser
 * @property username - Unique username for the user
 * @property password - Hashed password for authentication
 */
export type InsertUser = z.infer<typeof insertUserSchema>;

/**
 * TypeScript type for complete user records.
 * 
 * Represents the full user object as stored in the database,
 * including the auto-generated ID.
 * 
 * @typedef User
 * @property id - Auto-generated unique identifier
 * @property username - User's unique username
 * @property password - User's hashed password
 */
export type User = typeof users.$inferSelect;

/**
 * TypeScript type for chat session insertion operations.
 * 
 * Represents the shape of data required to create a new chat session.
 * 
 * @typedef InsertChatSession
 * @property userId - Optional ID of the user who owns this session
 * @property title - Optional title for the session
 */
export type InsertChatSession = z.infer<typeof insertChatSessionSchema>;

/**
 * TypeScript type for complete chat session records.
 * 
 * Represents the full chat session object as stored in the database,
 * including auto-generated fields.
 * 
 * @typedef ChatSession
 * @property id - Auto-generated unique identifier
 * @property userId - ID of the user who owns this session (nullable)
 * @property title - Optional title for the session
 * @property createdAt - Timestamp when the session was created
 * @property updatedAt - Timestamp when the session was last updated
 */
export type ChatSession = typeof chatSessions.$inferSelect;

/**
 * TypeScript type for message insertion operations.
 * 
 * Represents the shape of data required to create a new message.
 * 
 * @typedef InsertMessage
 * @property sessionId - Optional ID of the chat session this message belongs to
 * @property content - The message content/text
 * @property role - The message role ('user' or 'assistant')
 * @property metadata - Optional additional data about the message
 */
export type InsertMessage = z.infer<typeof insertMessageSchema>;

/**
 * TypeScript type for complete message records.
 * 
 * Represents the full message object as stored in the database,
 * including auto-generated fields.
 * 
 * @typedef Message
 * @property id - Auto-generated unique identifier
 * @property sessionId - ID of the chat session (nullable)
 * @property content - The message content/text
 * @property role - The message role ('user' or 'assistant')
 * @property metadata - Additional data about the message (JSON)
 * @property createdAt - Timestamp when the message was created
 */
export type Message = typeof messages.$inferSelect;
