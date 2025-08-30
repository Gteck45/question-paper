# Google OAuth Setup

This project uses Google OAuth for authentication. To set it up:

## 1. Create a Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the Google+ API

## 2. Create OAuth 2.0 Credentials

1. Go to "Credentials" in the Google Cloud Console
2. Click "Create Credentials" → "OAuth 2.0 Client IDs"
3. Configure the OAuth consent screen if prompted
4. Choose "Web application" as the application type
5. Add authorized redirect URIs:
   - For development: `http://localhost:3001/api/auth/google`
   - For production: `https://yourdomain.com/api/auth/google`

## 3. Configure Environment Variables

Copy `.env.example` to `.env` and fill in your credentials:

```
GOOGLE_CLIENT_ID=your_google_client_id_here
GOOGLE_CLIENT_SECRET=your_google_client_secret_here
NEXTAUTH_URL=http://localhost:3001  # Your app URL
NEXTAUTH_SECRET=wellcome_to_question_paper_here_you_can_do_anything
```

## 4. User Flow

The app supports both traditional email/password authentication and Google OAuth:

1. **Traditional Auth**: Users can sign up/login with email and password
2. **Google OAuth**: Users can sign up/login using their Google account
3. **JWT Tokens**: Both methods create JWT tokens stored in HTTP-only cookies
4. **Unified User Model**: Both auth methods use the same User model

## Notes

- OAuth users have `password: null` in the database
- JWT tokens are used instead of sessions for better scalability
- Tokens expire in 7 days
- All authentication is unified through the same context provider
