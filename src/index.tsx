import { render } from 'preact';
import { App } from './components/App';
import './index.css';

render(<App />, document.getElementById('app')!);

// Register service worker for PWA
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => {
      // Service worker registration failed - app still works
    });
  });
}
