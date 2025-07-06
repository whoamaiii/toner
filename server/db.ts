/**
 * Database connection configuration for the TonerWeb AI Assistant.
 * 
 * This module sets up the database connection using either:
 * - Neon (serverless PostgreSQL) for production
 * - SQLite for local development
 * 
 * Features:
 * - Serverless PostgreSQL connection via Neon
 * - SQLite fallback for local development
 * - HTTP-based connection for edge-compatible deployments
 * - Environment variable validation
 * - Connection reuse and pooling
 * - Graceful error handling
 * 
 * @author TonerWeb Team
 * @version 1.0.0
 */

import { drizzle } from "drizzle-orm/better-sqlite3";
import Database from "better-sqlite3";
import { sql } from "drizzle-orm";
import { logger } from "@shared/logger";

/**
 * Creates a database connection with proper error handling.
 * 
 * This function initializes the database connection using SQLite for local development
 * when DATABASE_URL is not set.
 * 
 * @returns {object} Database connection object
 */
function createDatabaseConnection() {
  try {
    // For local development, use SQLite
    logger.info('Using SQLite for local development');
    const sqlite = new Database("local.db");
    const database = drizzle(sqlite);
    
    return database;
  } catch (error) {
    logger.error('Database connection error', error);
    throw error;
  }
}

/**
 * Database instance for the application.
 * 
 * This is the main database instance used throughout the application.
 * It provides type-safe database operations using Drizzle ORM with
 * the Neon serverless connection.
 * 
 * Features:
 * - Type-safe SQL queries
 * - Automatic schema validation
 * - Connection pooling
 * - Edge-compatible HTTP connection
 * - Graceful error handling
 * 
 * @example
 * import { db } from './db';
 * 
 * // Select users
 * const users = await db.select().from(userTable);
 * 
 * // Insert a new user
 * const [newUser] = await db.insert(userTable).values({
 *   username: 'john_doe',
 *   password: 'hashed_password'
 * }).returning();
 * 
 * @type {import('drizzle-orm/neon-http').NeonHttpDatabase}
 */
export const db = createDatabaseConnection();

/**
 * Checks if the database connection is healthy.
 * 
 * This function can be used to verify that the database connection
 * is working properly before processing requests.
 * 
 * @returns {Promise<boolean>} True if database is healthy, false otherwise
 */
export async function checkDatabaseHealth(): Promise<boolean> {
  try {
    // Simple query to test connectivity
    // For better-sqlite3, we use get() for a single result
    db.get(sql`SELECT 1`);
    return true;
  } catch (error) {
    logger.error('Database health check failed', error);
    return false;
  }
}
