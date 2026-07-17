import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { env } from './env';

export const isFirebaseConfigured = Boolean(
  env.firebase.apiKey && env.firebase.authDomain && env.firebase.projectId && env.firebase.appId,
);

const app = initializeApp(isFirebaseConfigured ? env.firebase : {
  apiKey: 'not-configured',
  authDomain: 'localhost',
  projectId: 'not-configured',
  appId: 'not-configured',
});

export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });
