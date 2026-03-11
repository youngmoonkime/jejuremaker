// Polyfills must be imported first
import './utils/polyfills';

import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

import { RootProvider } from './contexts';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <RootProvider>
      <App />
    </RootProvider>
  </React.StrictMode>
);