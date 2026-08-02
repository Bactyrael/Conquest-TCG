// Utility to determine the correct backend URL based on the environment
export const getBackendUrl = () => {
  // If the app is running via Vite dev server, the hostname is usually localhost or 127.0.0.1
  // and the backend is running on port 3001.
  if (import.meta.env.DEV) {
    return 'http://localhost:3001';
  }
  
  // In production (when built and served by the Express server),
  // the backend is on the same origin as the frontend.
  // This allows ngrok tunnels or IP addresses to work seamlessly.
  return window.location.origin;
};

// Similar utility for WebSockets
export const getSocketUrl = () => {
  if (import.meta.env.DEV) {
    return 'http://localhost:3001';
  }
  
  return window.location.origin;
};
