// @ts-nocheck
import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './app';

const container = document.getElementById('root');
if (!container) throw new Error('Root container missing');
const root = createRoot(container);
// @ts-ignore: ignore TS2345 type mismatch
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);