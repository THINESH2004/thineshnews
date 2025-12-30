import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import ErrorBoundary from "./ErrorBoundary";

console.log('main.tsx executing');

// Global handlers to surface errors clearly
window.addEventListener('error', (ev) => {
  console.error('Global error', ev.error || ev.message);
  const root = document.getElementById('root');
  if (root) root.innerHTML = `<pre style="color: red; padding: 1rem; background: #fff;">Global error:\n${String(ev.error || ev.message)}</pre>`;
});
window.addEventListener('unhandledrejection', (ev) => {
  console.error('Unhandled rejection', ev.reason);
  const root = document.getElementById('root');
  if (root) root.innerHTML = `<pre style="color: red; padding: 1rem; background: #fff;">Unhandled rejection:\n${String(ev.reason)}</pre>`;
});

try {
  createRoot(document.getElementById("root")!).render(
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  );
  console.log('React render succeeded');
} catch (err) {
  console.error('React render error', err);
  const root = document.getElementById('root');
  if (root) {
    root.innerHTML = `<pre style="color: red; padding: 1rem; background: #fff;">React render error:\n${String(err)}</pre>`;
  }
  throw err;
}
