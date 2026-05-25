import { io } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';

let socket = null;

export const initSocket = () => {
  if (!socket) {
    console.log(`[Socket Client] Initializing WebSocket connection to ${SOCKET_URL}...`);
    socket = io(SOCKET_URL, {
      autoConnect: false, // Don't connect until needed (e.g., when clicking Live Listening)
      reconnectionAttempts: 5,
      timeout: 10000,
    });

    socket.on('connect', () => {
      console.log(`[Socket Client] Connected successfully with ID: ${socket.id}`);
    });

    socket.on('disconnect', (reason) => {
      console.log(`[Socket Client] Disconnected. Reason: ${reason}`);
    });

    socket.on('connect_error', (error) => {
      console.error('[Socket Client] Connection error:', error.message);
    });
  }
  return socket;
};

export const getSocket = () => {
  return socket || initSocket();
};

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
    console.log('[Socket Client] Socket disconnected and destroyed.');
  }
};
