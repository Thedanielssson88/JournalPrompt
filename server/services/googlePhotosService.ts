// Google Photos Service Mock
// In production, this would integrate with actual Google Photos API
// For now, we'll use mock data and unsplash images as placeholders

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
}

class GooglePhotosService {
  private mockPhotos: GooglePhoto[] = [
    {
      id: "photo-1",
      mediaItemId: "mock-media-1",
      baseUrl: "https://images.unsplash.com/photo-1606787366850-de6330128bfc",
      filename: "food-breakfast.jpg",
      mimeType: "image/jpeg",
      creationTime: new Date('2024-08-24'),
      width: 1920,
      height: 1080,
      description: "Frukost"
    },
    {
      id: "photo-2",
      mediaItemId: "mock-media-2",
      baseUrl: "https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba",
      filename: "cat-pet.jpg",
      mimeType: "image/jpeg",
      creationTime: new Date('2024-08-24'),
      width: 1920,
      height: 1280,
      description: "Katten"
    },
    {
      id: "photo-3",
      mediaItemId: "mock-media-3",
      baseUrl: "https://images.unsplash.com/photo-1566479360739-a7e0b7a1c5ff",
      filename: "sports-soccer.jpg",
      mimeType: "image/jpeg",
      creationTime: new Date('2024-08-23'),
      width: 1920,
      height: 1280,
      description: "Fotbollsträning"
    },
    {
      id: "photo-4",
      mediaItemId: "mock-media-4",
      baseUrl: "https://images.unsplash.com/photo-1511895426328-dc8714191300",
      filename: "family-park.jpg",
      mimeType: "image/jpeg",
      creationTime: new Date('2024-08-23'),
      width: 1920,
      height: 1280,
      description: "Familj i parken"
    },
    {
      id: "photo-5",
      mediaItemId: "mock-media-5",
      baseUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d",
      filename: "portrait-dad.jpg",
      mimeType: "image/jpeg",
      creationTime: new Date('2024-08-22'),
      width: 1920,
      height: 1920,
      description: "Pappa"
    },
    {
      id: "photo-6",
      mediaItemId: "mock-media-6",
      baseUrl: "https://images.unsplash.com/photo-1544005313-94ddf0286df2",
      filename: "portrait-mom.jpg",
      mimeType: "image/jpeg",
      creationTime: new Date('2024-08-22'),
      width: 1920,
      height: 1920,
      description: "Mamma"
    },
    {
      id: "photo-7",
      mediaItemId: "mock-media-7",
      baseUrl: "https://images.unsplash.com/photo-1503023345310-bd7c1de61c7d",
      filename: "sunset-beach.jpg",
      mimeType: "image/jpeg",
      creationTime: new Date('2024-08-20'),
      width: 1920,
      height: 1080,
      description: "Solnedgång vid stranden"
    },
    {
      id: "photo-8",
      mediaItemId: "mock-media-8",
      baseUrl: "https://images.unsplash.com/photo-1472214103451-9374bd1c798e",
      filename: "nature-landscape.jpg",
      mimeType: "image/jpeg",
      creationTime: new Date('2024-08-20'),
      width: 1920,
      height: 1080,
      description: "Naturlandskap"
    }
  ];

  private mockAlbums: GoogleAlbum[] = [
    {
      id: "album-1",
      title: "Sommar 2024",
      productUrl: "https://photos.google.com/album/mock-1",
      coverPhotoBaseUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d",
      mediaItemsCount: 150
    },
    {
      id: "album-2",
      title: "Familjeaktiviteter",
      productUrl: "https://photos.google.com/album/mock-2",
      coverPhotoBaseUrl: "https://images.unsplash.com/photo-1511895426328-dc8714191300",
      mediaItemsCount: 89
    },
    {
      id: "album-3",
      title: "Sport och träning",
      productUrl: "https://photos.google.com/album/mock-3",
      coverPhotoBaseUrl: "https://images.unsplash.com/photo-1566479360739-a7e0b7a1c5ff",
      mediaItemsCount: 45
    }
  ];

  // Get photos by date
  async getPhotosByDate(date: Date): Promise<GooglePhoto[]> {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    return this.mockPhotos.filter(photo => {
      const photoDate = new Date(photo.creationTime);
      return photoDate >= startOfDay && photoDate <= endOfDay;
    });
  }

  // Get photos in date range
  async getPhotosInRange(startDate: Date, endDate: Date): Promise<GooglePhoto[]> {
    return this.mockPhotos.filter(photo => {
      const photoDate = new Date(photo.creationTime);
      return photoDate >= startDate && photoDate <= endDate;
    });
  }

  // Get specific photo with different resolutions
  async getPhotoUrl(mediaItemId: string, options: {
    width?: number;
    height?: number;
    thumbnail?: boolean;
  } = {}): Promise<string> {
    const photo = this.mockPhotos.find(p => p.mediaItemId === mediaItemId);
    if (!photo) {
      throw new Error('Photo not found');
    }

    const { width = 200, height = 200, thumbnail = true } = options;
    
    // For mock data, we'll append dimensions to Unsplash URLs
    // In production, this would use Google Photos URL parameters
    const baseUrl = photo.baseUrl;
    
    // Unsplash supports dynamic image sizing
    if (baseUrl.includes('unsplash.com')) {
      const separator = baseUrl.includes('?') ? '&' : '?';
      if (thumbnail) {
        return `${baseUrl}${separator}w=${width}&h=${height}&fit=crop&crop=faces`;
      }
      return `${baseUrl}${separator}w=${width}&h=${height}&fit=contain`;
    }
    
    return baseUrl;
  }

  // Get user's albums
  async getAlbums(): Promise<GoogleAlbum[]> {
    return this.mockAlbums;
  }

  // Get photos from a specific album
  async getAlbumPhotos(albumId: string): Promise<GooglePhoto[]> {
    // For mock data, return a subset of photos
    if (albumId === 'album-3') {
      return this.mockPhotos.filter(p => p.description?.toLowerCase().includes('sport') || 
                                         p.description?.toLowerCase().includes('fotboll'));
    }
    return this.mockPhotos.slice(0, 4);
  }

  // Search photos by text
  async searchPhotos(query: string): Promise<GooglePhoto[]> {
    const lowerQuery = query.toLowerCase();
    return this.mockPhotos.filter(photo => 
      photo.filename.toLowerCase().includes(lowerQuery) ||
      photo.description?.toLowerCase().includes(lowerQuery)
    );
  }

  // Get suggested photos for a journal entry based on date and content
  async getSuggestedPhotos(date: Date, content?: string): Promise<GooglePhoto[]> {
    // Get photos from the same day
    const dayPhotos = await this.getPhotosByDate(date);
    
    // If we have content, try to find relevant photos
    if (content) {
      const keywords = content.toLowerCase().split(' ');
      const relevantPhotos = this.mockPhotos.filter(photo => {
        const photoText = `${photo.filename} ${photo.description || ''}`.toLowerCase();
        return keywords.some(keyword => photoText.includes(keyword));
      });
      
      // Combine and deduplicate
      const combined = [...dayPhotos, ...relevantPhotos];
      return Array.from(new Map(combined.map(p => [p.id, p])).values());
    }
    
    return dayPhotos;
  }
}

export const googlePhotosService = new GooglePhotosService();