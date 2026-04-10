import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { ClerkProvider } from '@clerk/clerk-react';
import App from './App.tsx';
import './index.css';

const CLERK_PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ClerkProvider 
      publishableKey={CLERK_PUBLISHABLE_KEY}
      appearance={{
        baseTheme: undefined,
        variables: {
          colorPrimary: '#7C3AED',
          colorBackground: '#0a0a0a',
          colorText: '#e5e5e5',
          colorInputBackground: '#171717',
          colorInputText: '#e5e5e5',
        },
        elements: {
          card: 'bg-chamber-panel border border-chamber-border rounded-2xl shadow-2xl',
          headerTitle: 'font-display text-xl font-bold',
          headerSubtitle: 'text-chamber-muted',
          formFieldLabel: 'text-chamber-muted text-sm',
          formFieldInput: 'bg-chamber-bg border-chamber-border text-chamber-ink rounded-lg',
          button: 'bg-white text-black hover:bg-white/90 rounded-xl font-bold',
          footerActionLink: 'text-chamber-muted hover:text-white',
          identityPreview: 'bg-chamber-bg border-chamber-border',
          formFieldErrorText: 'text-red-400 text-sm',
          alert: 'bg-red-500/10 border-red-500/30 text-red-400',
        }
      }}
    >
      <App />
    </ClerkProvider>
  </StrictMode>,
);
