import { drizzle } from "drizzle-orm/neon-http";
import { neon } from "@neondatabase/serverless";
import * as schema from "./shared/schema.js";
import { sql } from "drizzle-orm";

const DATABASE_URL = process.env.DATABASE_URL || "postgresql://neondb_owner:npg_X4sqbNnL0wPt@ep-bitter-queen-ad6w2s9c.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require";

async function pushSchema() {
  console.log("Connecting to database...");
  const client = neon(DATABASE_URL);
  const db = drizzle(client, { schema });

  try {
    // Drop existing tables if they exist (for fresh start)
    console.log("Dropping existing tables...");
    await db.execute(sql`DROP TABLE IF EXISTS entry_people CASCADE`);
    await db.execute(sql`DROP TABLE IF EXISTS journal_photos CASCADE`);
    await db.execute(sql`DROP TABLE IF EXISTS people CASCADE`);
    await db.execute(sql`DROP TABLE IF EXISTS journal_entries CASCADE`);
    await db.execute(sql`DROP TABLE IF EXISTS users CASCADE`);

    // Create users table
    console.log("Creating users table...");
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS users (
        id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
        username TEXT NOT NULL UNIQUE,
        password TEXT NOT NULL,
        profile_image TEXT,
        google_id TEXT UNIQUE,
        google_access_token TEXT,
        google_refresh_token TEXT,
        preferences JSONB DEFAULT '{"defaultCategories":["Aktuella händelser","Träning","Familj","Ekonomi","Mat","Vänner","Hälsa","Husdjur","Fritidsaktiviteter","Relationer","Skola"],"customCategories":[],"googlePhotos":{"autoSuggestPhotos":true,"syncAlbums":[],"thumbnailQuality":"medium"},"ui":{"theme":"dark","defaultView":"week"}}'::jsonb,
        created_at TIMESTAMP DEFAULT now() NOT NULL,
        updated_at TIMESTAMP DEFAULT now() NOT NULL
      )
    `);

    // Create journal_entries table
    console.log("Creating journal_entries table...");
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS journal_entries (
        id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id VARCHAR NOT NULL REFERENCES users(id),
        title TEXT NOT NULL,
        content TEXT,
        date TIMESTAMP DEFAULT now() NOT NULL,
        mood JSONB,
        category TEXT DEFAULT 'general',
        tags JSONB DEFAULT '[]'::jsonb,
        people JSONB DEFAULT '[]'::jsonb,
        location JSONB,
        stats JSONB DEFAULT '{"wordCount":0,"readingTime":0}'::jsonb,
        created_at TIMESTAMP DEFAULT now() NOT NULL,
        updated_at TIMESTAMP DEFAULT now() NOT NULL
      )
    `);

    // Create indexes for journal_entries
    await db.execute(sql`CREATE INDEX IF NOT EXISTS date_idx ON journal_entries(date)`);
    await db.execute(sql`CREATE INDEX IF NOT EXISTS user_date_idx ON journal_entries(user_id, date)`);

    // Create journal_photos table
    console.log("Creating journal_photos table...");
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS journal_photos (
        id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
        entry_id VARCHAR NOT NULL REFERENCES journal_entries(id) ON DELETE CASCADE,
        google_photo_id TEXT NOT NULL,
        media_item_id TEXT,
        base_url TEXT,
        thumbnail_url TEXT,
        filename TEXT,
        mime_type TEXT,
        width INTEGER,
        height INTEGER,
        creation_time TIMESTAMP,
        position INTEGER DEFAULT 0 NOT NULL,
        caption TEXT,
        created_at TIMESTAMP DEFAULT now() NOT NULL
      )
    `);

    // Create index for journal_photos
    await db.execute(sql`CREATE INDEX IF NOT EXISTS entry_position_idx ON journal_photos(entry_id, position)`);

    // Create people table
    console.log("Creating people table...");
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS people (
        id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id VARCHAR NOT NULL REFERENCES users(id),
        name TEXT NOT NULL,
        google_contact_id TEXT,
        avatar TEXT,
        relationship TEXT,
        created_at TIMESTAMP DEFAULT now() NOT NULL
      )
    `);

    // Create entry_people junction table
    console.log("Creating entry_people table...");
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS entry_people (
        entry_id VARCHAR NOT NULL REFERENCES journal_entries(id) ON DELETE CASCADE,
        person_id VARCHAR NOT NULL REFERENCES people(id) ON DELETE CASCADE
      )
    `);

    // Create index for entry_people
    await db.execute(sql`CREATE INDEX IF NOT EXISTS entry_people_pk ON entry_people(entry_id, person_id)`);

    // Create default user
    console.log("Creating default user...");
    await db.execute(sql`
      INSERT INTO users (id, username, password, profile_image)
      VALUES ('default-user', 'Demo User', 'demo123', 'https://api.dicebear.com/7.x/avataaars/svg?seed=demo')
      ON CONFLICT (id) DO NOTHING
    `);

    console.log("✅ Schema pushed successfully!");

    // Create some sample data
    console.log("Creating sample journal entries...");
    
    // Sample entry 1
    const entry1 = await db.execute(sql`
      INSERT INTO journal_entries (
        user_id, 
        title, 
        content, 
        date,
        mood,
        category,
        tags,
        stats
      )
      VALUES (
        'default-user',
        'Första dagboksinlägget',
        'Idag startade jag min nya digitala dagbok. Det känns spännande att kunna samla alla minnen på ett ställe!',
        NOW(),
        '{"emoji":"😊","value":5}'::jsonb,
        'Familj',
        '["start","dagbok","minnen"]'::jsonb,
        '{"wordCount":18,"readingTime":60}'::jsonb
      )
      RETURNING id
    `);

    console.log("✅ Sample data created!");
    
  } catch (error) {
    console.error("Error pushing schema:", error);
    process.exit(1);
  }
}

pushSchema();