import admin from 'firebase-admin';

interface FirebaseAdmin {
  app: admin.app.App;
  messaging: admin.messaging.Messaging;
}

let instance: FirebaseAdmin | undefined;

function getFirebaseAdminServiceAccount(): admin.ServiceAccount {
  // Try loading from env vars first (safer for production)
  if (process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
    try {
      return JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);
    } catch {
      // fall through
    }
  }

  // Fall back to individual env vars
  return {
    projectId: process.env.FIREBASE_PROJECT_ID || 'sisarasa-65427',
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL || 'firebase-adminsdk-fbsvc@sisarasa-65427.iam.gserviceaccount.com',
    privateKey: (process.env.FIREBASE_PRIVATE_KEY || '').replace(/\\n/g, '\n'),
  };
}

/** Get the Firebase Admin SDK instance (singleton) */
export function getFirebaseAdmin(): FirebaseAdmin {
  if (instance) return instance;

  const serviceAccount = getFirebaseAdminServiceAccount();

  const app = admin.apps.length === 0
    ? admin.initializeApp({ credential: admin.credential.cert(serviceAccount) })
    : admin.apps[0]!;

  instance = { app, messaging: app.messaging() };
  return instance;
}

/** Send a push notification via FCM */
export async function sendPushNotification(params: {
  token: string;
  title: string;
  body: string;
  data?: Record<string, string>;
}): Promise<string | null> {
  try {
    const { messaging } = getFirebaseAdmin();
    const message: admin.messaging.TokenMessage = {
      token: params.token,
      notification: { title: params.title, body: params.body },
      data: params.data,
    };
    const response = await messaging.send(message);
    return response;
  } catch (err) {
    console.error('[FCM Admin] Failed to send push notification:', err);
    return null;
  }
}

/** Send push notification to multiple tokens (batch) */
export async function sendMulticastPushNotification(params: {
  tokens: string[];
  title: string;
  body: string;
  data?: Record<string, string>;
}): Promise<{ successCount: number; failureCount: number }> {
  try {
    const { messaging } = getFirebaseAdmin();
    const message: admin.messaging.MulticastMessage = {
      tokens: params.tokens,
      notification: { title: params.title, body: params.body },
      data: params.data,
    };
    const response = await messaging.sendEachForMulticast(message);
    return {
      successCount: response.successCount,
      failureCount: response.failureCount,
    };
  } catch (err) {
    console.error('[FCM Admin] Failed to send multicast push notification:', err);
    return { successCount: 0, failureCount: params.tokens.length };
  }
}

export type { FirebaseAdmin };
