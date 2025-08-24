import { db, users, journalEntries, journalPhotos, people, entryPeople } from "./db";
import { eq, desc, and, gte, lte, sql, inArray } from "drizzle-orm";
import type { InsertJournalEntry, InsertUser, JournalEntry, User, JournalPhoto } from "@shared/schema";
import { insertPhotoSchema } from "@shared/schema";
import { z } from "zod";

export const storage = {
  // User operations
  async getUser(userId: string): Promise<User | undefined> {
    try {
      const result = await db.select().from(users).where(eq(users.id, userId)).limit(1);
      return result[0];
    } catch (error) {
      console.error("Error fetching user:", error);
      
      // For demo/development, create a default user if not exists
      if (userId === "default-user") {
        const newUser = await db.insert(users).values({
          id: "default-user",
          username: "Demo User",
          password: "demo123", // In production, this should be hashed
          profileImage: "https://api.dicebear.com/7.x/avataaars/svg?seed=demo"
        }).returning();
        return newUser[0];
      }
      return undefined;
    }
  },

  async createUser(data: InsertUser): Promise<User> {
    const result = await db.insert(users).values(data).returning();
    return result[0];
  },

  async getUserByGoogleId(googleId: string): Promise<User | undefined> {
    try {
      const result = await db.select().from(users).where(eq(users.googleId, googleId)).limit(1);
      return result[0];
    } catch (error) {
      console.error("Error fetching user by Google ID:", error);
      return undefined;
    }
  },

  async updateUserTokens(userId: string, accessToken: string, refreshToken: string): Promise<User> {
    const result = await db
      .update(users)
      .set({
        googleAccessToken: accessToken,
        googleRefreshToken: refreshToken,
        updatedAt: new Date()
      })
      .where(eq(users.id, userId))
      .returning();
    return result[0];
  },

  // Journal entry operations
  async getJournalEntries(userId: string): Promise<Array<JournalEntry & { photos?: JournalPhoto[] }>> {
    try {
      // Get entries with their photos
      const entries = await db
        .select()
        .from(journalEntries)
        .where(eq(journalEntries.userId, userId))
        .orderBy(desc(journalEntries.date));

      // Get photos for all entries
      const entryIds = entries.map(e => e.id);
      const photos = entryIds.length > 0 
        ? await db
            .select()
            .from(journalPhotos)
            .where(inArray(journalPhotos.entryId, entryIds))
            .orderBy(journalPhotos.position)
        : [];

      // Group photos by entry
      const photosByEntry = photos.reduce((acc, photo) => {
        if (!acc[photo.entryId]) acc[photo.entryId] = [];
        acc[photo.entryId].push(photo);
        return acc;
      }, {} as Record<string, JournalPhoto[]>);

      // Combine entries with their photos
      return entries.map(entry => ({
        ...entry,
        photos: photosByEntry[entry.id] || []
      }));
    } catch (error) {
      console.error("Error fetching journal entries:", error);
      return [];
    }
  },

  async getJournalEntry(entryId: string): Promise<(JournalEntry & { photos?: JournalPhoto[] }) | undefined> {
    try {
      const entryResult = await db
        .select()
        .from(journalEntries)
        .where(eq(journalEntries.id, entryId))
        .limit(1);
      
      if (!entryResult[0]) return undefined;

      const photos = await db
        .select()
        .from(journalPhotos)
        .where(eq(journalPhotos.entryId, entryId))
        .orderBy(journalPhotos.position);

      return {
        ...entryResult[0],
        photos
      };
    } catch (error) {
      console.error("Error fetching journal entry:", error);
      return undefined;
    }
  },

  async createJournalEntry(data: InsertJournalEntry & { 
    userId: string, 
    photos?: z.infer<typeof insertPhotoSchema>[] 
  }): Promise<JournalEntry> {
    try {
      // Calculate stats
      const wordCount = data.content ? data.content.split(/\s+/).length : 0;
      const readingTime = Math.ceil(wordCount / 200) * 60; // seconds

      // Create the entry
      const [entry] = await db.insert(journalEntries).values({
        ...data,
        stats: { wordCount, readingTime },
        date: data.date || new Date(),
        updatedAt: new Date()
      }).returning();

      // Add photos if provided
      if (data.photos && data.photos.length > 0) {
        await db.insert(journalPhotos).values(
          data.photos.map((photo, index) => ({
            ...photo,
            entryId: entry.id,
            position: photo.position ?? index
          }))
        );
      }

      return entry;
    } catch (error) {
      console.error("Error creating journal entry:", error);
      throw error;
    }
  },

  async updateJournalEntry(
    entryId: string, 
    data: Partial<InsertJournalEntry> & { photos?: z.infer<typeof insertPhotoSchema>[] }
  ): Promise<JournalEntry> {
    try {
      // Calculate stats if content is being updated
      let stats = undefined;
      if (data.content !== undefined) {
        const wordCount = data.content ? data.content.split(/\s+/).length : 0;
        const readingTime = Math.ceil(wordCount / 200) * 60;
        stats = { wordCount, readingTime };
      }

      // Update the entry
      const [entry] = await db
        .update(journalEntries)
        .set({
          ...data,
          ...(stats && { stats }),
          updatedAt: new Date()
        })
        .where(eq(journalEntries.id, entryId))
        .returning();

      // Update photos if provided
      if (data.photos !== undefined) {
        // Delete existing photos
        await db.delete(journalPhotos).where(eq(journalPhotos.entryId, entryId));
        
        // Insert new photos
        if (data.photos.length > 0) {
          await db.insert(journalPhotos).values(
            data.photos.map((photo, index) => ({
              ...photo,
              entryId: entry.id,
              position: photo.position ?? index
            }))
          );
        }
      }

      return entry;
    } catch (error) {
      console.error("Error updating journal entry:", error);
      throw error;
    }
  },

  async deleteJournalEntry(entryId: string): Promise<void> {
    try {
      await db.delete(journalEntries).where(eq(journalEntries.id, entryId));
    } catch (error) {
      console.error("Error deleting journal entry:", error);
      throw error;
    }
  },

  // Search and filter operations
  async searchEntries(userId: string, query: string): Promise<JournalEntry[]> {
    try {
      return await db
        .select()
        .from(journalEntries)
        .where(
          and(
            eq(journalEntries.userId, userId),
            sql`${journalEntries.title} ILIKE ${'%' + query + '%'} OR ${journalEntries.content} ILIKE ${'%' + query + '%'}`
          )
        )
        .orderBy(desc(journalEntries.date));
    } catch (error) {
      console.error("Error searching entries:", error);
      return [];
    }
  },

  async getEntriesByDateRange(userId: string, startDate: Date, endDate: Date): Promise<JournalEntry[]> {
    try {
      return await db
        .select()
        .from(journalEntries)
        .where(
          and(
            eq(journalEntries.userId, userId),
            gte(journalEntries.date, startDate),
            lte(journalEntries.date, endDate)
          )
        )
        .orderBy(desc(journalEntries.date));
    } catch (error) {
      console.error("Error fetching entries by date range:", error);
      return [];
    }
  },

  async getEntriesByCategory(userId: string, category: string): Promise<JournalEntry[]> {
    try {
      return await db
        .select()
        .from(journalEntries)
        .where(
          and(
            eq(journalEntries.userId, userId),
            eq(journalEntries.category, category)
          )
        )
        .orderBy(desc(journalEntries.date));
    } catch (error) {
      console.error("Error fetching entries by category:", error);
      return [];
    }
  },

  // People operations
  async getPeople(userId: string): Promise<typeof people.$inferSelect[]> {
    try {
      return await db
        .select()
        .from(people)
        .where(eq(people.userId, userId))
        .orderBy(people.name);
    } catch (error) {
      console.error("Error fetching people:", error);
      return [];
    }
  },

  async createPerson(data: {
    userId: string;
    name: string;
    googleContactId?: string;
    avatar?: string;
    relationship?: string;
  }): Promise<typeof people.$inferSelect> {
    try {
      const [person] = await db.insert(people).values(data).returning();
      return person;
    } catch (error) {
      console.error("Error creating person:", error);
      throw error;
    }
  }
};