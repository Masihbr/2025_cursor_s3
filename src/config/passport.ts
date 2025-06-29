import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { User } from '../models/User';
import { generateToken } from '../utils/auth';

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      callbackURL: process.env.GOOGLE_CALLBACK_URL!,
      scope: ['profile', 'email']
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        // Check if user already exists
        let user = await User.findOne({ googleId: profile.id });

        if (user) {
          // Update user information if needed
          if (user.name !== profile.displayName || user.picture !== profile.photos?.[0]?.value) {
            user.name = profile.displayName;
            user.picture = profile.photos?.[0]?.value;
            await user.save();
          }
          return done(null, user);
        }

        // Create new user
        const email = profile.emails?.[0]?.value;
        if (!email) {
          return done(new Error('Email not provided by Google'), undefined);
        }

        user = new User({
          googleId: profile.id,
          email: email,
          name: profile.displayName,
          picture: profile.photos?.[0]?.value
        });

        await user.save();
        return done(null, user);
      } catch (error) {
        return done(error, undefined);
      }
    }
  )
);

// Serialize user for the session
passport.serializeUser((user: any, done) => {
  done(null, user.id);
});

// Deserialize user from the session
passport.deserializeUser(async (id: string, done) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (error) {
    done(error, undefined);
  }
});

export default passport; 