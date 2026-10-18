export const config = {
  firebase: {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY as string | undefined,
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN as string | undefined,
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID as string | undefined,
    appId: import.meta.env.VITE_FIREBASE_APP_ID as string | undefined,
  },
  apiBaseUrl: import.meta.env.VITE_PANTRY_API_BASE_URL?.replace(/\/$/, "") as
    string | undefined,
};

export const isFirebaseConfigured = Object.values(config.firebase).every(
  Boolean,
);
