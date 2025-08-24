import type { Express } from "express";
import { createServer, type Server } from "http";
import passport from "./auth";
import { storage } from "./storage";
import { insertJournalEntrySchema, insertPhotoSchema } from "@shared/schema";
import { googlePhotosService } from "./services/googlePhotosService";
import { realGooglePhotosService } from "./services/realGooglePhotosService";
import { z } from "zod";

// Middleware to ensure user is authenticated
const requireAuth = (req: any, res: any, next: any) => {
  if (req.isAuthenticated()) {
    return next();
  }
  res.status(401).json({ message: "Authentication required" });
};

// Middleware to setup Google Photos service with user tokens
const setupGooglePhotos = async (req: any, res: any, next: any) => {
  if (req.user && req.user.googleAccessToken) {
    try {
      realGooglePhotosService.setCredentials({
        access_token: req.user.googleAccessToken,
        refresh_token: req.user.googleRefreshToken
      });
      
      // Try to refresh token if needed
      const now = Date.now();
      const tokenAge = now - new Date(req.user.updatedAt).getTime();
      
      // Refresh if token is older than 50 minutes (Google tokens expire in 60 minutes)
      if (tokenAge > 50 * 60 * 1000) {
        try {
          const newTokens = await realGooglePhotosService.refreshTokens();
          await storage.updateUserTokens(req.user.id, newTokens.access_token, newTokens.refresh_token);
          req.user.googleAccessToken = newTokens.access_token;
          req.user.googleRefreshToken = newTokens.refresh_token;
        } catch (tokenError) {
          console.error("Token refresh failed:", tokenError);
        }
      }
      
      req.googlePhotosService = realGooglePhotosService;
    } catch (error) {
      console.error("Error setting up Google Photos service:", error);
      // Fall back to mock service
      req.googlePhotosService = googlePhotosService;
    }
  } else {
    // Use mock service for unauthenticated users or users without Google tokens
    req.googlePhotosService = googlePhotosService;
  }
  next();
};

export async function registerRoutes(app: Express): Promise<Server> {
  // Check if Google OAuth is properly configured
  const isGoogleOAuthConfigured = process.env.GOOGLE_CLIENT_ID && 
                                  process.env.GOOGLE_CLIENT_SECRET && 
                                  process.env.GOOGLE_CLIENT_ID !== 'demo_client_id';

  // Authentication routes
  app.get('/auth/google', (req, res) => {
    if (!isGoogleOAuthConfigured) {
      return res.status(400).json({ 
        error: 'Google OAuth not configured', 
        message: 'Please configure GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET in your .env file. See GOOGLE_PHOTOS_SETUP.md for instructions.' 
      });
    }
    passport.authenticate('google')(req, res);
  });
  
  app.get('/auth/google/callback', 
    passport.authenticate('google', { 
      failureRedirect: '/?error=login_failed',
      successRedirect: '/',
      session: true 
    })
  );
  
  app.post('/auth/logout', (req, res) => {
    req.logout(() => {
      res.json({ message: 'Logged out successfully' });
    });
  });

  // Get current user
  app.get("/api/user", async (req: any, res) => {
    console.log('User endpoint - authenticated:', req.isAuthenticated(), 'user:', req.user?.username);
    
    if (req.isAuthenticated() && req.user) {
      res.json({ ...req.user, isAuthenticated: true });
    } else {
      // For demo purposes, still return default user if not authenticated
      const user = await storage.getUser("default-user");
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      res.json({ ...user, isAuthenticated: false });
    }
  });

  // Get all journal entries for current user
  app.get("/api/journal-entries", async (req, res) => {
    try {
      const entries = await storage.getJournalEntries("default-user");
      res.json(entries);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch journal entries" });
    }
  });

  // Get single journal entry
  app.get("/api/journal-entries/:id", async (req, res) => {
    try {
      const entry = await storage.getJournalEntry(req.params.id);
      if (!entry) {
        return res.status(404).json({ message: "Journal entry not found" });
      }
      res.json(entry);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch journal entry" });
    }
  });

  // Create new journal entry with enhanced features
  app.post("/api/journal-entries", async (req, res) => {
    try {
      const validatedData = insertJournalEntrySchema.parse(req.body);
      
      // Parse photos if provided
      let photos = undefined;
      if (req.body.photos && Array.isArray(req.body.photos)) {
        photos = req.body.photos.map((photo: any) => insertPhotoSchema.parse(photo));
      }
      
      const entry = await storage.createJournalEntry({
        ...validatedData,
        userId: "default-user",
        photos
      });
      
      res.status(201).json(entry);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid journal entry data", errors: error.errors });
      } else {
        res.status(400).json({ message: "Failed to create journal entry" });
      }
    }
  });

  // Update journal entry
  app.put("/api/journal-entries/:id", async (req, res) => {
    try {
      const validatedData = insertJournalEntrySchema.partial().parse(req.body);
      
      // Parse photos if provided
      let photos = undefined;
      if (req.body.photos !== undefined) {
        photos = req.body.photos.map((photo: any) => insertPhotoSchema.parse(photo));
      }
      
      const entry = await storage.updateJournalEntry(req.params.id, {
        ...validatedData,
        photos
      });
      
      res.json(entry);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid journal entry data", errors: error.errors });
      } else {
        res.status(400).json({ message: "Failed to update journal entry" });
      }
    }
  });

  // Delete journal entry
  app.delete("/api/journal-entries/:id", async (req, res) => {
    try {
      await storage.deleteJournalEntry(req.params.id);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete journal entry" });
    }
  });

  // Search journal entries
  app.get("/api/journal-entries/search", async (req, res) => {
    try {
      const query = req.query.q as string;
      if (!query) {
        return res.status(400).json({ message: "Search query required" });
      }
      
      const entries = await storage.searchEntries("default-user", query);
      res.json(entries);
    } catch (error) {
      res.status(500).json({ message: "Search failed" });
    }
  });

  // Get entries by category
  app.get("/api/journal-entries/category/:category", async (req, res) => {
    try {
      const entries = await storage.getEntriesByCategory("default-user", req.params.category);
      res.json(entries);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch entries by category" });
    }
  });

  // Google Photos endpoints (real and mock implementation)
  app.get("/api/photos/by-date", setupGooglePhotos, async (req: any, res) => {
    try {
      const date = req.query.date ? new Date(req.query.date as string) : new Date();
      const photos = await req.googlePhotosService.getPhotosByDate(date);
      res.json(photos);
    } catch (error) {
      console.error("Error fetching photos by date:", error);
      res.status(500).json({ message: "Failed to fetch photos" });
    }
  });

  app.get("/api/photos/suggested", setupGooglePhotos, async (req: any, res) => {
    try {
      const date = req.query.date ? new Date(req.query.date as string) : new Date();
      const content = req.query.content as string;
      const photos = await req.googlePhotosService.getSuggestedPhotos(date, content);
      res.json(photos);
    } catch (error) {
      console.error("Error fetching suggested photos:", error);
      res.status(500).json({ message: "Failed to fetch suggested photos" });
    }
  });

  app.get("/api/photos/albums", setupGooglePhotos, async (req: any, res) => {
    try {
      const albums = await req.googlePhotosService.getAlbums();
      res.json(albums);
    } catch (error) {
      console.error("Error fetching albums:", error);
      res.status(500).json({ message: "Failed to fetch albums" });
    }
  });

  app.get("/api/photos/search", setupGooglePhotos, async (req: any, res) => {
    try {
      const query = req.query.q as string;
      if (!query) {
        return res.status(400).json({ message: "Search query required" });
      }
      
      const photos = await req.googlePhotosService.searchPhotos(query);
      res.json(photos);
    } catch (error) {
      console.error("Error searching photos:", error);
      res.status(500).json({ message: "Failed to search photos" });
    }
  });

  // Google Photos Picker API endpoints
  app.post("/api/photos/picker/session", setupGooglePhotos, async (req: any, res) => {
    try {
      if (req.googlePhotosService === googlePhotosService) {
        // Mock implementation for demo
        const sessionId = 'mock-session-' + Date.now();
        res.json({
          id: sessionId,
          pickerUri: `https://photos.google.com/share/${sessionId}`,
          mediaItemsSet: false,
          pollingConfig: { timeoutMs: 120000, intervalMs: 1000 }
        });
        return;
      }

      const session = await req.googlePhotosService.createPickerSession();
      res.json(session);
    } catch (error) {
      console.error("Error creating picker session:", error);
      res.status(500).json({ message: "Failed to create picker session" });
    }
  });

  app.get("/api/photos/picker/session/:sessionId", setupGooglePhotos, async (req: any, res) => {
    try {
      const sessionId = req.params.sessionId;
      
      if (req.googlePhotosService === googlePhotosService) {
        // Mock implementation - simulate completion after 5 seconds
        const isComplete = Math.random() > 0.7; // Random completion for demo
        res.json({
          id: sessionId,
          pickerUri: `https://photos.google.com/share/${sessionId}`,
          mediaItemsSet: isComplete,
          pollingConfig: { timeoutMs: 120000, intervalMs: 1000 }
        });
        return;
      }

      const session = await req.googlePhotosService.pollPickerSession(sessionId);
      res.json(session);
    } catch (error) {
      console.error("Error polling picker session:", error);
      res.status(500).json({ message: "Failed to poll picker session" });
    }
  });

  app.get("/api/photos/picker/session/:sessionId/photos", setupGooglePhotos, async (req: any, res) => {
    try {
      const sessionId = req.params.sessionId;
      
      if (req.googlePhotosService === googlePhotosService) {
        // Mock implementation - return some sample photos
        const samplePhotos = await req.googlePhotosService.getRecentPhotos?.(5) || [];
        res.json(samplePhotos);
        return;
      }

      const photos = await req.googlePhotosService.listPickerPhotos(sessionId);
      res.json(photos);
    } catch (error) {
      console.error("Error listing picker photos:", error);
      res.status(500).json({ message: "Failed to list picker photos" });
    }
  });

  // OAuth configuration status endpoint
  app.get("/api/oauth-config", (req, res) => {
    const isConfigured = !!(
      process.env.GOOGLE_CLIENT_ID && 
      process.env.GOOGLE_CLIENT_SECRET && 
      process.env.GOOGLE_CLIENT_ID !== 'demo_client_id'
    );
    res.json({ isConfigured });
  });

  // People/contacts endpoints
  app.get("/api/people", async (req, res) => {
    try {
      const people = await storage.getPeople("default-user");
      res.json(people);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch people" });
    }
  });

  app.post("/api/people", async (req, res) => {
    try {
      const person = await storage.createPerson({
        ...req.body,
        userId: "default-user"
      });
      res.status(201).json(person);
    } catch (error) {
      res.status(400).json({ message: "Failed to create person" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}