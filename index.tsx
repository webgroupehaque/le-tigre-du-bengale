import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { VisitTracker } from '@kit';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    {/* Mesure d'audience anonyme Rekvo (sans cookie) → app Rekvo, Site → Statistiques. */}
    <VisitTracker />
    <App />
  </React.StrictMode>
);