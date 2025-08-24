import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { storage } from './storage';
import type { User } from '@shared/schema';

// Only configure Google OAuth strategy if credentials are provided
if (process.env.GOOGLE_CLIENT_ID && 
    process.env.GOOGLE_CLIENT_SECRET && 
    process.env.GOOGLE_CLIENT_ID !== 'demo_client_id') {
  
  console.log('Configuring Google OAuth strategy...');
  
  passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: process.env.GOOGLE_REDIRECT_URI!,
    scope: [
      'https://www.googleapis.com/auth/photoslibrary.readonly',
      'https://www.googleapis.com/auth/photoslibrary.appendonly',
      'https://www.googleapis.com/auth/photoslibrary.sharing',
      'profile',
      'email'
    ]
  }, async (accessToken, refreshToken, profile, done) => {
    try {
      // Check if user exists
      let user = await storage.getUserByGoogleId(profile.id);

      if (!user) {
        // Create new user
        user = await storage.createUser({
          username: profile.displayName || profile.emails?.[0]?.value || 'Google User',
          password: 'google-oauth', // Not used for OAuth users
          profileImage: profile.photos?.[0]?.value,
          googleId: profile.id,
          googleAccessToken: accessToken,
          googleRefreshToken: refreshToken
        });
      } else {
        // Update existing user's tokens
        await storage.updateUserTokens(user.id, accessToken, refreshToken);
      }

      return done(null, user);
    } catch (error) {
      return done(error, null);
    }
  }));
} else {
  console.log('Google OAuth not configured - using demo mode');
}

// Serialize user for session
passport.serializeUser((user: any, done) => {
  done(null, user.id);
});

// Deserialize user from session
passport.deserializeUser(async (id: string, done) => {
  try {
    const user = await storage.getUser(id);
    done(null, user);
  } catch (error) {
    done(error, null);
  }
});

export default passport;