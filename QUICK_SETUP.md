# 🚀 Quick Google Photos Setup

The app is currently in **demo mode** using mock photos. To enable real Google Photos integration:

## Method 1: Quick Setup (5 minutes)

1. **Go to Google Cloud Console**: https://console.cloud.google.com/
2. **Create/Select Project**: Create new or use existing project
3. **Enable APIs**: 
   - Go to "APIs & Services" > "Library"
   - Enable "Photos Library API"
4. **Create OAuth Credentials**:
   - Go to "APIs & Services" > "Credentials"
   - Click "Create Credentials" > "OAuth client ID"
   - Choose "Web application"
   - Add authorized redirect URI: `http://localhost:3001/auth/google/callback`
5. **Copy credentials** to your `.env` file:
   ```env
   GOOGLE_CLIENT_ID=your_actual_client_id
   GOOGLE_CLIENT_SECRET=your_actual_client_secret
   ```
6. **Restart the server**: The app will automatically detect the real credentials

## Method 2: Skip OAuth (Use Demo Mode)

The app works perfectly in demo mode with:
- ✅ All journal functionality
- ✅ Mock Google Photos data  
- ✅ Full UI/UX experience
- ✅ Database persistence

Just dismiss the blue demo notice and continue using the app!

## What Changes After Setup

**Before (Demo Mode):**
- Mock photos from Unsplash
- No Google login required
- All other features work normally

**After (Google Photos Mode):**
- Your real Google Photos
- Secure OAuth login
- Live photo suggestions
- Access to your albums
- Real-time photo sync

## Troubleshooting

**White screen after clicking "Logga in med Google"?**
- This happens in demo mode (expected behavior)
- The app shows a helpful error message
- Set up real OAuth credentials to fix

**Need help?**
- See `GOOGLE_PHOTOS_SETUP.md` for detailed instructions
- The app gracefully handles missing OAuth configuration