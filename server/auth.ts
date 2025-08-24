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
      'https://www.googleapis.com/auth/photospicker.mediaitems.readonly',
      'profile',
      'email'
    ]
  }, async (accessToken, refreshToken, profile, done) => {
    try {
      console.log('OAuth callback - Google profile ID:', profile.id, 'Name:', profile.displayName);
      
      // Check if user exists
      let user = await storage.getUserByGoogleId(profile.id);

      if (!user) {
        console.log('Creating new user for Google ID:', profile.id);
        // Create new user
        user = await storage.createUser({
          username: profile.displayName || profile.emails?.[0]?.value || 'Google User',
          password: 'google-oauth', // Not used for OAuth users
          profileImage: profile.photos?.[0]?.value,
          googleId: profile.id,
          googleAccessToken: accessToken,
          googleRefreshToken: refreshToken
        });
        console.log('Created user:', user.id, user.username);
      } else {
        console.log('Updating tokens for existing user:', user.id);
        // Update existing user's tokens
        await storage.updateUserTokens(user.id, accessToken, refreshToken);
      }

      console.log('OAuth callback success, user:', user.id);
      return done(null, user);
    } catch (error) {
      console.error('OAuth callback error:', error);
      return done(error, null);
    }
  }));
} else {
  console.log('Google OAuth not configured - using demo mode');
}

// Serialize user for session
passport.serializeUser((user: any, done) => {
  console.log('Serializing user:', user.id, user.username);
  done(null, user.id);
});

// Deserialize user from session
passport.deserializeUser(async (id: string, done) => {
  console.log('Deserializing user ID:', id);
  try {
    const user = await storage.getUser(id);
    console.log('Deserialized user:', user?.username);
    done(null, user);
  } catch (error) {
    console.error('Deserialize error:', error);
    done(error, null);
  }
});

export default passport;