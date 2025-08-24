import { google } from 'googleapis';
import { OAuth2Client } from 'google-auth-library';

// Google Photos API scopes
const SCOPES = [
  'https://www.googleapis.com/auth/photoslibrary.readonly',
  'https://www.googleapis.com/auth/photoslibrary.appendonly',
  'https://www.googleapis.com/auth/photoslibrary.sharing'
];

// Types matching Google Photos API
export interface GooglePhoto {
  id: string;
  mediaItemId: string;
  baseUrl: string;
  filename: string;
  mimeType: string;
  creationTime: Date;
  width: number;
  height: number;
  productUrl?: string;
  description?: string;
}

export interface GoogleAlbum {
  id: string;
  title: string;
  productUrl: string;
  coverPhotoBaseUrl?: string;
  mediaItemsCount: number;
  isWriteable?: boolean;
}

export interface PickerSession {
  id: string;
  pickerUri: string;
  mediaItemsSet: boolean;
  pollingConfig: {
    timeoutMs: number;
    intervalMs: number;
  };
}

class RealGooglePhotosService {
  private oauth2Client: OAuth2Client;

  constructor() {
    this.oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.GOOGLE_REDIRECT_URI
    );
  }

  // Get OAuth URL for user authentication
  getAuthUrl(): string {
    return this.oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: SCOPES,
      prompt: 'consent'
    });
  }

  // Exchange authorization code for tokens
  async getTokensFromCode(code: string): Promise<any> {
    const { tokens } = await this.oauth2Client.getAccessToken(code);
    this.oauth2Client.setCredentials(tokens);
    return tokens;
  }

  // Set credentials from stored tokens
  setCredentials(tokens: any) {
    this.oauth2Client.setCredentials(tokens);
  }

  // Refresh access token using refresh token
  async refreshTokens(): Promise<any> {
    const { credentials } = await this.oauth2Client.refreshAccessToken();
    this.oauth2Client.setCredentials(credentials);
    return credentials;
  }

  // Make authenticated request to Google Photos API
  private async makeRequest(endpoint: string, options: any = {}): Promise<any> {
    if (!this.oauth2Client.credentials.access_token) {
      throw new Error('No access token available');
    }

    const response = await fetch(`https://photoslibrary.googleapis.com/v1${endpoint}`, {
      method: options.method || 'GET',
      headers: {
        'Authorization': `Bearer ${this.oauth2Client.credentials.access_token}`,
        'Content-Type': 'application/json',
        ...options.headers
      },
      body: options.body ? JSON.stringify(options.body) : undefined
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Google Photos API error: ${response.status} - ${errorText}`);
    }

    return response.json();
  }

  // Get photos by date range
  async getPhotosByDate(date: Date): Promise<GooglePhoto[]> {
    try {
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);

      const data = await this.makeRequest('/mediaItems:search', {
        method: 'POST',
        body: {
          filters: {
            dateFilter: {
              ranges: [{
                startDate: {
                  year: startOfDay.getFullYear(),
                  month: startOfDay.getMonth() + 1,
                  day: startOfDay.getDate()
                },
                endDate: {
                  year: endOfDay.getFullYear(),
                  month: endOfDay.getMonth() + 1,
                  day: endOfDay.getDate()
                }
              }]
            }
          },
          pageSize: 100
        }
      });

      return this.transformMediaItems(data.mediaItems || []);
    } catch (error) {
      console.error('Error fetching photos by date:', error);
      // Return empty array on error to allow graceful fallback
      return [];
    }
  }

  // Get recent photos (last 30 days)
  async getRecentPhotos(limit: number = 50): Promise<GooglePhoto[]> {
    try {
      const data = await this.makeRequest('/mediaItems', {
        method: 'GET'
      });

      const photos = this.transformMediaItems(data.mediaItems || []);
      return photos.slice(0, limit);
    } catch (error) {
      console.error('Error fetching recent photos:', error);
      return [];
    }
  }

  // Get user's albums
  async getAlbums(): Promise<GoogleAlbum[]> {
    try {
      const data = await this.makeRequest('/albums');

      return (data.albums || []).map((album: any) => ({
        id: album.id,
        title: album.title,
        productUrl: album.productUrl,
        coverPhotoBaseUrl: album.coverPhotoBaseUrl,
        mediaItemsCount: parseInt(album.mediaItemsCount) || 0,
        isWriteable: album.isWriteable
      }));
    } catch (error) {
      console.error('Error fetching albums:', error);
      return [];
    }
  }

  // Get photos from a specific album
  async getAlbumPhotos(albumId: string): Promise<GooglePhoto[]> {
    try {
      const data = await this.makeRequest('/mediaItems:search', {
        method: 'POST',
        body: {
          albumId,
          pageSize: 100
        }
      });

      return this.transformMediaItems(data.mediaItems || []);
    } catch (error) {
      console.error('Error fetching album photos:', error);
      return [];
    }
  }

  // Search photos by text (limited functionality in Google Photos API)
  async searchPhotos(query: string): Promise<GooglePhoto[]> {
    try {
      // Google Photos API doesn't support text search directly
      // Get recent photos and filter client-side
      const recentPhotos = await this.getRecentPhotos(100);
      
      const lowerQuery = query.toLowerCase();
      return recentPhotos.filter(photo => 
        photo.filename.toLowerCase().includes(lowerQuery) ||
        photo.description?.toLowerCase().includes(lowerQuery)
      );
    } catch (error) {
      console.error('Error searching photos:', error);
      return [];
    }
  }

  // Mock Picker API functionality (Google Photos Picker API is separate)
  async createPickerSession(): Promise<PickerSession> {
    // This is a simplified mock - real Picker API requires separate setup
    const sessionId = 'real-session-' + Date.now();
    
    return {
      id: sessionId,
      pickerUri: `https://photos.google.com/picker/${sessionId}`, // This would be the real picker URL
      mediaItemsSet: false,
      pollingConfig: {
        timeoutMs: 120000,
        intervalMs: 1000
      }
    };
  }

  async pollPickerSession(sessionId: string): Promise<PickerSession> {
    // Mock implementation - in reality, you'd poll the Picker API
    return {
      id: sessionId,
      pickerUri: `https://photos.google.com/picker/${sessionId}`,
      mediaItemsSet: Math.random() > 0.5, // Random completion for demo
      pollingConfig: {
        timeoutMs: 120000,
        intervalMs: 1000
      }
    };
  }

  async listPickerPhotos(sessionId: string): Promise<GooglePhoto[]> {
    // Mock implementation - return some recent photos
    return this.getRecentPhotos(5);
  }

  // Get enhanced photo URL with specific dimensions
  getPhotoUrl(baseUrl: string, options: {
    width?: number;
    height?: number;
    crop?: boolean;
  } = {}): string {
    const { width = 200, height = 200, crop = false } = options;
    
    let params = `w${width}-h${height}`;
    if (crop) {
      params += '-c';
    }
    
    return `${baseUrl}=${params}`;
  }

  // Get suggested photos for a journal entry
  async getSuggestedPhotos(date: Date, content?: string): Promise<GooglePhoto[]> {
    try {
      // Get photos from the same day
      const dayPhotos = await this.getPhotosByDate(date);
      
      if (dayPhotos.length === 0) {
        const recentPhotos = await this.getRecentPhotos(10);
        return recentPhotos.slice(0, 5);
      }
      
      return dayPhotos;
    } catch (error) {
      console.error('Error getting suggested photos:', error);
      return [];
    }
  }

  // Transform Google Photos API media items to our format
  private transformMediaItems(mediaItems: any[]): GooglePhoto[] {
    return mediaItems.map((item: any) => ({
      id: item.id,
      mediaItemId: item.id,
      baseUrl: item.baseUrl,
      filename: item.filename || 'Unknown',
      mimeType: item.mimeType,
      creationTime: new Date(item.mediaMetadata?.creationTime || Date.now()),
      width: parseInt(item.mediaMetadata?.width) || 0,
      height: parseInt(item.mediaMetadata?.height) || 0,
      productUrl: item.productUrl,
      description: item.description
    }));
  }
}

export const realGooglePhotosService = new RealGooglePhotosService();