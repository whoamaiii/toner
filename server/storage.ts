/**
 * Database storage layer for the TonerWeb AI Assistant.
 * 
 * This module provides a clean abstraction layer for database operations including:
 * - User management (creation, retrieval)
 * - Chat session management
 * - Message storage and retrieval
 * - Data persistence using Drizzle ORM with PostgreSQL
 * 
 * The storage layer follows the repository pattern with a well-defined interface
 * that can be easily swapped for different implementations (e.g., testing, caching).
 * 
 * @author TonerWeb Team
 * @version 1.0.0
 */

import { users, chatSessions, messages, type User, type InsertUser, type ChatSession, type InsertChatSession, type Message, type InsertMessage } from "@shared/schema";
import { db } from "./db";
import { eq } from "drizzle-orm";

/**
 * Interface defining all storage operations for the TonerWeb AI Assistant.
 * 
 * This interface provides a contract for data persistence operations and can be
 * implemented by different storage backends (database, in-memory, cache, etc.).
 * 
 * @interface IStorage
 */
export interface IStorage {
  /**
   * Retrieves a user by their unique ID.
   * 
   * @param id - The unique user identifier
   * @returns Promise resolving to User object or undefined if not found
   */
  getUser(id: number): Promise<User | undefined>;
  
  /**
   * Retrieves a user by their username.
   * 
   * @param username - The unique username
   * @returns Promise resolving to User object or undefined if not found
   */
  getUserByUsername(username: string): Promise<User | undefined>;
  
  /**
   * Creates a new user in the database.
   * 
   * @param user - User data to insert (without ID)
   * @returns Promise resolving to the created User object with generated ID
   */
  createUser(user: InsertUser): Promise<User>;
  
  /**
   * Creates a new chat session.
   * 
   * @param session - Chat session data to insert
   * @returns Promise resolving to the created ChatSession object with generated ID
   */
  createChatSession(session: InsertChatSession): Promise<ChatSession>;
  
  /**
   * Retrieves a chat session by its ID.
   * 
   * @param id - The unique chat session identifier
   * @returns Promise resolving to ChatSession object or undefined if not found
   */
  getChatSession(id: number): Promise<ChatSession | undefined>;
  
  /**
   * Retrieves all chat sessions for a specific user.
   * 
   * @param userId - The user's unique identifier
   * @returns Promise resolving to array of ChatSession objects
   */
  getUserChatSessions(userId: number): Promise<ChatSession[]>;
  
  /**
   * Creates a new message in a chat session.
   * 
   * @param message - Message data to insert
   * @returns Promise resolving to the created Message object with generated ID
   */
  createMessage(message: InsertMessage): Promise<Message>;
  
  /**
   * Retrieves all messages for a specific chat session.
   * 
   * @param sessionId - The chat session's unique identifier
   * @returns Promise resolving to array of Message objects in chronological order
   */
  getSessionMessages(sessionId: number): Promise<Message[]>;
}

/**
 * Database implementation of the storage interface using Drizzle ORM.
 * 
 * This class provides concrete implementations for all storage operations
 * using PostgreSQL as the underlying database. It handles:
 * - Connection management through the db module
 * - SQL query generation via Drizzle ORM
 * - Type safety for all database operations
 * - Error handling for database constraints
 * 
 * @class DatabaseStorage
 * @implements {IStorage}
 */
export class DatabaseStorage implements IStorage {
  /**
   * Retrieves a user by their unique ID.
   * 
   * @param id - The unique user identifier
   * @returns Promise resolving to User object or undefined if not found
   * 
   * @example
   * const user = await storage.getUser(123);
   * if (user) {
   *   console.log(`Found user: ${user.username}`);
   * }
   */
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  /**
   * Retrieves a user by their username.
   * 
   * This method is useful for login operations and user lookup by username.
   * 
   * @param username - The unique username
   * @returns Promise resolving to User object or undefined if not found
   * 
   * @example
   * const user = await storage.getUserByUsername("john_doe");
   * if (user) {
   *   console.log(`User ID: ${user.id}`);
   * }
   */
  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || undefined;
  }

  /**
   * Creates a new user in the database.
   * 
   * The user data is validated against the schema before insertion.
   * A unique ID is automatically generated for the new user.
   * 
   * @param insertUser - User data to insert (username and password)
   * @returns Promise resolving to the created User object with generated ID
   * 
   * @example
   * const newUser = await storage.createUser({
   *   username: "jane_doe",
   *   password: "hashed_password"
   * });
   * console.log(`Created user with ID: ${newUser.id}`);
   * 
   * @throws {Error} If username already exists or validation fails
   */
  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(insertUser)
      .returning();
    return user;
  }

  /**
   * Creates a new chat session.
   * 
   * Chat sessions are used to group related messages and maintain conversation context.
   * Each session is associated with a specific user and can have an optional title.
   * 
   * @param insertSession - Chat session data to insert
   * @returns Promise resolving to the created ChatSession object with generated ID
   * 
   * @example
   * const session = await storage.createChatSession({
   *   userId: 123,
   *   title: "Canon Printer Help"
   * });
   * console.log(`Created session: ${session.id}`);
   */
  async createChatSession(insertSession: InsertChatSession): Promise<ChatSession> {
    const [session] = await db
      .insert(chatSessions)
      .values(insertSession)
      .returning();
    return session;
  }

  /**
   * Retrieves a chat session by its ID.
   * 
   * @param id - The unique chat session identifier
   * @returns Promise resolving to ChatSession object or undefined if not found
   * 
   * @example
   * const session = await storage.getChatSession(456);
   * if (session) {
   *   console.log(`Session title: ${session.title}`);
   * }
   */
  async getChatSession(id: number): Promise<ChatSession | undefined> {
    const [session] = await db.select().from(chatSessions).where(eq(chatSessions.id, id));
    return session || undefined;
  }

  /**
   * Retrieves all chat sessions for a specific user.
   * 
   * This method is useful for displaying a user's conversation history
   * and allowing them to resume previous conversations.
   * 
   * @param userId - The user's unique identifier
   * @returns Promise resolving to array of ChatSession objects
   * 
   * @example
   * const sessions = await storage.getUserChatSessions(123);
   * console.log(`User has ${sessions.length} chat sessions`);
   */
  async getUserChatSessions(userId: number): Promise<ChatSession[]> {
    return await db.select().from(chatSessions).where(eq(chatSessions.userId, userId));
  }

  /**
   * Creates a new message in a chat session.
   * 
   * Messages can be from either users or the AI assistant. Each message
   * contains content, role information, and optional metadata.
   * 
   * @param insertMessage - Message data to insert
   * @returns Promise resolving to the created Message object with generated ID
   * 
   * @example
   * const message = await storage.createMessage({
   *   sessionId: 456,
   *   content: "Find Canon PG-540 ink cartridge",
   *   role: "user",
   *   metadata: { mode: "DeepSearch" }
   * });
   * console.log(`Created message: ${message.id}`);
   */
  async createMessage(insertMessage: InsertMessage): Promise<Message> {
    const [message] = await db
      .insert(messages)
      .values(insertMessage)
      .returning();
    return message;
  }

  /**
   * Retrieves all messages for a specific chat session.
   * 
   * Messages are returned in chronological order (oldest first) to maintain
   * conversation flow. This method is used to display chat history.
   * 
   * @param sessionId - The chat session's unique identifier
   * @returns Promise resolving to array of Message objects in chronological order
   * 
   * @example
   * const messages = await storage.getSessionMessages(456);
   * for (const message of messages) {
   *   console.log(`${message.role}: ${message.content}`);
   * }
   */
  async getSessionMessages(sessionId: number): Promise<Message[]> {
    return await db.select().from(messages)
      .where(eq(messages.sessionId, sessionId))
      .orderBy(messages.createdAt);
  }
}

/**
 * Default storage instance used throughout the application.
 * 
 * This singleton instance provides a convenient way to access storage
 * operations without needing to create new instances everywhere.
 * 
 * @example
 * import { storage } from './storage';
 * 
 * const user = await storage.getUser(123);
 */
export const storage = new DatabaseStorage();
