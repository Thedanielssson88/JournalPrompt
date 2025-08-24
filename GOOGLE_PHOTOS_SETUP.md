# Google Photos API Integration Setup Guide

This guide will help you set up real Google Photos integration for your journal app.

## Prerequisites

1. A Google Cloud Platform (GCP) account
2. Access to your Google Photos library

## Step 1: Create a Google Cloud Project

1. Go to the [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Note down your Project ID

## Step 2: Enable Required APIs

1. In the Google Cloud Console, navigate to "APIs & Services" > "Library"
2. Search for and enable these APIs:
   - **Photos Library API** (for accessing user's Google Photos)
   - **Google+ API** (for user profile information)

## Step 3: Create OAuth 2.0 Credentials

1. Go to "APIs & Services" > "Credentials"
2. Click "Create Credentials" > "OAuth client ID"
3. If prompted, configure the OAuth consent screen:
   - Choose "External" user type
   - Fill in the required fields:
     - App name: "Family Journal"
     - User support email: your email
     - Developer contact information: your email
   - Add these scopes:
     - `https://www.googleapis.com/auth/photoslibrary.readonly`
     - `https://www.googleapis.com/auth/photoslibrary.appendonly`
     - `https://www.googleapis.com/auth/photoslibrary.sharing`
     - `openid`
     - `profile`
     - `email`

4. Create OAuth client ID:
   - Application type: "Web application"
   - Name: "Family Journal Web Client"
   - Authorized JavaScript origins:
     - `http://localhost:3001`
     - Add your production domain when ready
   - Authorized redirect URIs:
     - `http://localhost:3001/auth/google/callback`
     - Add your production callback URL when ready

5. Copy the Client ID and Client Secret

## Step 4: Update Environment Variables

Update your `.env` file with the real credentials:

```env
# Replace these with your actual Google OAuth credentials
GOOGLE_CLIENT_ID=your_actual_client_id_here
GOOGLE_CLIENT_SECRET=your_actual_client_secret_here
GOOGLE_REDIRECT_URI=http://localhost:3001/auth/google/callback
```

## Step 5: Test the Integration

1. Restart your development server: `npm run dev`
2. Open http://localhost:3001 in your browser
3. Click the "Logga in med Google" button in the header
4. Complete the OAuth flow
5. Try creating a new journal entry and selecting photos

## Features Available After Setup

### ✅ **Authentication**
- OAuth 2.0 login with Google
- Secure token storage and refresh
- User profile integration

### ✅ **Google Photos Access**
- Browse photos by date
- Get suggested photos based on journal entry date
- Search through your photo library
- Access your Google Photos albums

### ✅ **Photo Integration**
- Link photos to journal entries (no local storage)
- Dynamic photo resizing via Google's servers
- Thumbnail generation for performance
- Multiple photos per journal entry

### ✅ **Picker API Support**
- Google Photos Picker integration framework
- Session-based photo selection
- Polling mechanism for selection completion

## Important Notes

### **Security & Privacy**
- Photos are never stored on your server
- Only photo URLs and metadata are stored
- All access uses your Google OAuth tokens
- Users can revoke access at any time via Google Account settings

### **API Limitations**
- Google Photos API has rate limits
- Some advanced search features may be limited
- Picker API requires additional setup for production use

### **Production Deployment**
- Update redirect URIs for your production domain
- Use HTTPS for production OAuth callbacks
- Set secure session secrets
- Consider implementing token encryption

## Troubleshooting

### Common Issues

1. **"OAuth2Strategy requires a clientID option"**
   - Make sure your `.env` file has the correct Google credentials
   - Restart the server after updating environment variables

2. **"Access blocked: This app's request is invalid"**
   - Check that your redirect URI matches exactly what's configured in Google Cloud Console
   - Ensure the Photos Library API is enabled

3. **"insufficient_permissions" error**
   - Make sure you've added the required scopes to your OAuth consent screen
   - Re-authorize the application if you've changed scopes

4. **Photos not loading**
   - Check browser console for CORS errors
   - Verify that photo URLs are properly formatted
   - Ensure Google Photos URLs haven't expired

### Development vs Production

Currently the app works in demo mode without real Google Photos integration. When you configure the real credentials:

- **Demo Mode**: Uses mock photos from Unsplash
- **Production Mode**: Uses real Google Photos via API

## Next Steps

Once you have the basic integration working, you can:

1. **Implement real Picker API** for enhanced photo selection
2. **Add photo upload functionality** to Google Photos
3. **Implement advanced search** with filters and categories
4. **Add album management** features
5. **Implement photo editing** capabilities

## Support

If you encounter issues:
1. Check the Google Cloud Console logs
2. Review the browser developer tools
3. Ensure all APIs are properly enabled
4. Verify OAuth scope permissions

The app is designed to gracefully fall back to mock data when Google Photos isn't available, so you can develop and test even without the full setup.