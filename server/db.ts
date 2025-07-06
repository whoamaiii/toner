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
 * 
 * @author TonerWeb Team
 * @version 1.0.0
 */

import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";

/**
 * Environment variable validation for database connection.
 * 
 * Ensures that the DATABASE_URL environment variable is set before
 * attempting to establish a database connection. This prevents
 * runtime errors and provides clear error messages for configuration issues.
 * 
 * @throws {Error} If DATABASE_URL environment variable is not set
 */
if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?"
  );
}

/**
 * Neon serverless PostgreSQL connection instance.
 * 
 * This creates an HTTP-based connection to the PostgreSQL database
 * that works in serverless environments. The connection is configured
 * to use the DATABASE_URL environment variable for connection details.
 * 
 * @type {import('@neondatabase/serverless').NeonQueryFunction}
 */
const sql = neon(process.env.DATABASE_URL);

/**
 * Drizzle ORM database instance.
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
export const db = drizzle(sql);
