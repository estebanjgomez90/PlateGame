import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App'
import { HashRouter } from 'react-router-dom';

window.onerror = function(message, source, lineno, colno, error) {
  alert("JS Crash: " + message);
  return false;
};

createRoot(document.getElementById('root')!).render(
    <App />
)
