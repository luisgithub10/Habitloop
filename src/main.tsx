import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Register Cache-First Service Worker for complete offline capabilities and iOS persistence
if ('serviceWorker' in navigator) {
  // Clear any service workers registered at the absolute root (e.g., https://luisgithub10.github.io/)
  // which might hijack pages in the /Habit-Tracker/ subdirectory.
  navigator.serviceWorker.getRegistrations().then((registrations) => {
    let rootSWFound = false;
    for (const reg of registrations) {
      const isRootScope = reg.scope === window.location.origin + '/' || reg.scope === window.location.origin;
      const onSubFolder = window.location.pathname.includes('/Habit-Tracker');
      
      if (isRootScope && onSubFolder) {
        console.log('Detected hijacking root-level service worker:', reg.scope);
        reg.unregister().then((unregistered) => {
          if (unregistered) {
            console.log('Unregistered root service worker successfully to restore subdirectory control.');
            rootSWFound = true;
          }
        });
      }
    }
    if (rootSWFound) {
      // Reload page after a brief delay to clear any intercepts and load the fresh scoped SW
      setTimeout(() => {
        window.location.reload();
      }, 500);
    }
  }).catch((err) => {
    console.warn('Error querying service worker registrations:', err);
  });

  window.addEventListener('load', () => {
    const isGitHubPages = window.location.hostname.includes('github.io') || window.location.pathname.includes('/Habit-Tracker');
    const swPath = isGitHubPages ? '/Habit-Tracker/sw.js' : './sw.js';
    const swScope = isGitHubPages ? '/Habit-Tracker/' : './';

    navigator.serviceWorker.register(swPath, { scope: swScope })
      .then((reg) => {
        console.log('Subdirectory Service Worker registered successfully:', reg.scope);
      })
      .catch((err) => {
        console.warn('Subdirectory Service worker registration failed, trying relative:', err);
        // Fallback to simpler relative registration
        navigator.serviceWorker.register('./sw.js')
          .then((r) => console.log('Fallback relative SW registered:', r.scope));
      });
  });
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

