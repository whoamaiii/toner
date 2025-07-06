/**
 * Database connection configuration for the TonerWeb AI Assistant.
 * 
 * This module sets up the database connection using Neon (serverless PostgreSQL)
 * and Drizzle ORM for type-safe database operations.
 * 
 * Features:
 * - Serverless PostgreSQL connection via Neon
 * - HTTP-based connection for edge-compatible deployments
 * - Environment variable validation
 * - Connection reuse and pooling
 * - Graceful error handling
 * 
 * @author TonerWeb Team
 * @version 1.0.0
 */

import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";

/**
 * Validates database configuration and environment variables.
 * 
 * This function performs validation checks for database connectivity
 * and provides clear error messages for configuration issues.
 * 
 * @returns {string} The validated DATABASE_URL
 * @throws {Error} If DATABASE_URL environment variable is not set
 */
function validateDatabaseConfig(): string {
  const databaseUrl = process.env.DATABASE_URL;
  
  if (!databaseUrl) {
    throw new Error(
      "DATABASE_URL must be set. Did you forget to provision a database?"
    );
  }
  
  // Additional validation could be added here
  // e.g., URL format validation, connection testing, etc.
  
  return databaseUrl;
}

/**
 * Creates a database connection with proper error handling.
 * 
 * This function initializes the database connection and provides
 * fallback handling for cases where the database is not available.
 * 
 * @returns {object} Database connection object
 * @throws {Error} If database connection cannot be established
 */
function createDatabaseConnection() {
  try {
    const databaseUrl = validateDatabaseConfig();
    
    /**
     * Neon serverless PostgreSQL connection instance.
     * 
     * This creates an HTTP-based connection to the PostgreSQL database
     * that works in serverless environments.
     */
    const sql = neon(databaseUrl);
    
    /**
     * Drizzle ORM database instance.
     * 
     * This is the main database instance used throughout the application.
     * It provides type-safe database operations using Drizzle ORM with
     * the Neon serverless connection.
     */
    const database = drizzle(sql);
    
    return database;
  } catch (error) {
    console.error('Database connection error:', error);
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
    await db.execute('SELECT 1');
    return true;
  } catch (error) {
    console.error('Database health check failed:', error);
    return false;
  }
}
