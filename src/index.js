import React from 'react';
import ReactDOM from 'react-dom/client';
import { HashRouter } from 'react-router-dom';
import App from './App';
// import * as serviceWorkerRegistration from './serviceWorkerRegistration';

import './index.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <HashRouter>
  </HashRouter>
);

// Ensure service worker is NOT registering a cached old build:
// If your project imports a service worker helper, call unregister here:
// serviceWorkerRegistration.unregister();