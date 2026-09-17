import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App';
import './index.css';
window.onerror = function(message, source, lineno, colno, error) {
  document.body.innerHTML = '<div style="color: red; padding: 20px; font-family: monospace; z-index: 9999; position: absolute; background: white; width: 100%; height: 100%;">' + 
    '<h3>Runtime Error:</h3>' + 
    '<p>' + message + '</p>' + 
    '<pre>' + (error && error.stack ? error.stack : '') + '</pre>' + 
    '</div>';
};

import { registerSW } from 'virtual:pwa-register';

registerSW({ immediate: true });

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
