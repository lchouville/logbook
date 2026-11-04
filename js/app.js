import { onAuthChange, signIn, signOut } from './auth.js';

const signInButton = document.getElementById('sign-in');
const signOutButton = document.getElementById('sign-out');
const authStatus = document.getElementById('auth-status');

signInButton.addEventListener('click', signIn);
signOutButton.addEventListener('click', signOut);

onAuthChange((token) => {
  const connected = Boolean(token);
  signInButton.hidden = connected;
  signOutButton.hidden = !connected;
  authStatus.textContent = connected ? 'Connecté à Google Drive.' : 'Non connecté.';
});
