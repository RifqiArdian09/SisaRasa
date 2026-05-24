/**
 * Validate and export environment variables with type safety.
 */

export const env = {
  // Supabase
  supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL!,
  supabaseAnonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,

  // Firebase (client-side)
  firebaseApiKey: 'AIzaSyB5Dwei_QwnIUn3bTfZf06yRWKoRhDpUjM',
  firebaseAuthDomain: 'sisarasa-65427.firebaseapp.com',
  firebaseProjectId: 'sisarasa-65427',
  firebaseStorageBucket: 'sisarasa-65427.firebasestorage.app',
  firebaseMessagingSenderId: '250510547682',
  firebaseAppId: '1:250510547682:web:05688c1f2c52e5f4621cbb',
  firebaseMeasurementId: 'G-ELV0G3201R',
  firebaseVapidKey:
    'BLcsrZf7AV7Shk9w8DB2JEuY-MedUg18JSyXBfED9jZRZMeHk5FYve9ITrOfLY_7-Jk0LerobciW6NuVwtf-cFk',

  // Firebase Admin (server-side only)
  firebaseProjectIdAdmin: process.env.FIREBASE_PROJECT_ID || 'sisarasa-65427',
  firebaseClientEmail: process.env.FIREBASE_CLIENT_EMAIL,
  firebasePrivateKey: process.env.FIREBASE_PRIVATE_KEY,

  // Admin
  adminEmail: process.env.NEXT_PUBLIC_ADMIN_EMAIL,
} as const;
