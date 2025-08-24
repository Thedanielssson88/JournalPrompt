import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, jsonb, integer, boolean, index } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  profileImage: text("profile_image"),
  googleId: text("google_id").unique(),
  googleAccessToken: text("google_access_token"),
  googleRefreshToken: text("google_refresh_token"),
  preferences: jsonb("preferences").$type<UserPreferences>().default({
    defaultCategories: [
      'Aktuella händelser',
      'Träning', 
      'Familj',
      'Ekonomi',
      'Mat',
      'Vänner',
      'Hälsa',
      'Husdjur',
      'Fritidsaktiviteter',
      'Relationer',
      'Skola'
    ],
    customCategories: [],
    googlePhotos: {
      autoSuggestPhotos: true,
      syncAlbums: [],
      thumbnailQuality: 'medium'
    },
    ui: {
      theme: 'dark',
      defaultView: 'week'
    }
  }),
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
  updatedAt: timestamp("updated_at").notNull().default(sql`now()`)
});

export const journalEntries = pgTable("journal_entries", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  title: text("title").notNull(),
  content: text("content"),
  date: timestamp("date").notNull().default(sql`now()`),
  
  // Enhanced metadata
  mood: jsonb("mood").$type<{
    emoji: string;
    value: number;
  }>(),
  
  category: text("category").default("general"),
  tags: jsonb("tags").$type<string[]>().default([]),
  people: jsonb("people").$type<Person[]>().default([]),
  
  // Location data
  location: jsonb("location").$type<{
    name: string;
    coordinates?: {
      lat: number;
      lng: number;
    };
    googlePlaceId?: string;
  }>(),
  
  // Stats
  stats: jsonb("stats").$type<{
    wordCount: number;
    readingTime: number;
  }>().default({ wordCount: 0, readingTime: 0 }),
  
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
  updatedAt: timestamp("updated_at").notNull().default(sql`now()`)
}, (table) => ({
  dateIdx: index("date_idx").on(table.date),
  userDateIdx: index("user_date_idx").on(table.userId, table.date)
}));

// Google Photos references table
export const journalPhotos = pgTable("journal_photos", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  entryId: varchar("entry_id").notNull().references(() => journalEntries.id, { onDelete: "cascade" }),
  
  // Google Photos data
  googlePhotoId: text("google_photo_id").notNull(),
  mediaItemId: text("media_item_id"),
  baseUrl: text("base_url"), // Cached base URL
  thumbnailUrl: text("thumbnail_url"), // Generated thumbnail URL
  filename: text("filename"),
  mimeType: text("mime_type"),
  
  // Photo metadata
  width: integer("width"),
  height: integer("height"),
  creationTime: timestamp("creation_time"),
  
  // Position in entry
  position: integer("position").notNull().default(0),
  caption: text("caption"),
  
  createdAt: timestamp("created_at").notNull().default(sql`now()`)
}, (table) => ({
  entryPositionIdx: index("entry_position_idx").on(table.entryId, table.position)
}));

// People/Contacts table
export const people = pgTable("people", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  name: text("name").notNull(),
  googleContactId: text("google_contact_id"),
  avatar: text("avatar"),
  relationship: text("relationship"), // 'family', 'friend', 'colleague', etc.
  createdAt: timestamp("created_at").notNull().default(sql`now()`)
});

// Many-to-many relation between entries and people
export const entryPeople = pgTable("entry_people", {
  entryId: varchar("entry_id").notNull().references(() => journalEntries.id, { onDelete: "cascade" }),
  personId: varchar("person_id").notNull().references(() => people.id, { onDelete: "cascade" }),
}, (table) => ({
  pk: index("entry_people_pk").on(table.entryId, table.personId)
}));

// Types
interface UserPreferences {
  defaultCategories: string[];
  customCategories: string[];
  googlePhotos: {
    autoSuggestPhotos: boolean;
    syncAlbums: string[];
    thumbnailQuality: 'low' | 'medium' | 'high';
  };
  ui: {
    theme: 'dark' | 'light' | 'auto';
    defaultView: 'week' | 'month' | 'timeline';
  };
}

interface Person {
  id?: string;
  name: string;
  googleContactId?: string;
}

// Zod schemas
export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  profileImage: true,
  googleId: true,
  preferences: true
});

export const insertJournalEntrySchema = z.object({
  title: z.string(),
  content: z.string().optional(),
  date: z.date().optional(),
  mood: z.object({
    emoji: z.string(),
    value: z.number().min(1).max(5)
  }).optional(),
  category: z.string().optional(),
  tags: z.array(z.string()).optional(),
  people: z.array(z.object({
    id: z.string().optional(),
    name: z.string(),
    googleContactId: z.string().optional()
  })).optional(),
  location: z.object({
    name: z.string(),
    coordinates: z.object({
      lat: z.number(),
      lng: z.number()
    }).optional(),
    googlePlaceId: z.string().optional()
  }).optional()
});

export const insertPhotoSchema = z.object({
  googlePhotoId: z.string(),
  mediaItemId: z.string().optional(),
  baseUrl: z.string().optional(),
  thumbnailUrl: z.string().optional(),
  filename: z.string().optional(),
  mimeType: z.string().optional(),
  width: z.number().optional(),
  height: z.number().optional(),
  creationTime: z.date().optional(),
  position: z.number(),
  caption: z.string().optional()
});

// Export types
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type InsertJournalEntry = z.infer<typeof insertJournalEntrySchema>;
export type JournalEntry = typeof journalEntries.$inferSelect;
export type JournalPhoto = typeof journalPhotos.$inferSelect;
export type Person = typeof people.$inferSelect;