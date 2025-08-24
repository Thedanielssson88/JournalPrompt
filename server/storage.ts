import { type User, type InsertUser, type JournalEntry, type InsertJournalEntry } from "@shared/schema";
import { randomUUID } from "crypto";

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  getJournalEntries(userId: string): Promise<JournalEntry[]>;
  getJournalEntry(id: string): Promise<JournalEntry | undefined>;
  createJournalEntry(entry: InsertJournalEntry & { userId: string }): Promise<JournalEntry>;
}

export class MemStorage implements IStorage {
  private users: Map<string, User>;
  private journalEntries: Map<string, JournalEntry>;

  constructor() {
    this.users = new Map();
    this.journalEntries = new Map();
    
    // Create a default user and some mock entries
    const defaultUser: User = {
      id: "default-user",
      username: "familjen",
      password: "password",
      profileImage: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=100&h=100"
    };
    
    this.users.set(defaultUser.id, defaultUser);
    
    // Add some sample journal entries
    const entries: JournalEntry[] = [
      {
        id: "entry-1",
        userId: "default-user",
        title: "Alicias första fotbollsträning",
        content: "Idag var Alicias första fotbollsträning. Hon var så entusiastisk och glad!",
        date: new Date('2024-08-24'),
        photos: [
          "https://images.unsplash.com/photo-1551698618-1dfe5d97d256?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=400&h=300",
          "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=200&h=145",
          "https://images.unsplash.com/photo-1578662996442-48f60103fc96?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=200&h=145"
        ],
        category: "sport"
      },
      {
        id: "entry-2",
        userId: "default-user",
        title: "Ed Sheeran",
        content: "Lyssnade på Ed Sheeran tillsammans med familjen idag.",
        date: new Date('2024-08-24'),
        photos: [],
        category: "musik"
      },
      {
        id: "entry-3",
        userId: "default-user",
        title: "Familjedag i parken",
        content: "Härlig dag i parken med hela familjen.",
        date: new Date('2024-08-22'),
        photos: [],
        category: "familj"
      },
      {
        id: "entry-4",
        userId: "default-user",
        title: "Sommarutflykt till stranden",
        content: "Underbar dag vid stranden.",
        date: new Date('2024-08-20'),
        photos: [],
        category: "utflykt"
      }
    ];
    
    entries.forEach(entry => {
      this.journalEntries.set(entry.id, entry);
    });
  }

  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = randomUUID();
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  async getJournalEntries(userId: string): Promise<JournalEntry[]> {
    return Array.from(this.journalEntries.values())
      .filter(entry => entry.userId === userId)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }

  async getJournalEntry(id: string): Promise<JournalEntry | undefined> {
    return this.journalEntries.get(id);
  }

  async createJournalEntry(entryData: InsertJournalEntry & { userId: string }): Promise<JournalEntry> {
    const id = randomUUID();
    const entry: JournalEntry = {
      id,
      date: new Date(),
      ...entryData,
    };
    this.journalEntries.set(id, entry);
    return entry;
  }
}

export const storage = new MemStorage();
