import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App'

window.onerror = function(message) {
  alert("JS Crash: " + message);
  return false;
};

createRoot(document.getElementById('root')!).render(
    <App />
)
