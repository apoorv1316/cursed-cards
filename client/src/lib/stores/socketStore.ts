import { writable } from 'svelte/store';
import { io, type Socket } from 'socket.io-client';
import { SERVER_URL } from '../game/constants';

export const socket = writable<Socket | null>(null);
export const connected = writable(false);
export const socketError = writable<string | null>(null);

let socketInstance: Socket | null = null;

export function connectSocket(): Socket {
  // Reuse existing socket if it exists (connected or connecting)
  if (socketInstance) {
    if (socketInstance.disconnected) {
      socketInstance.connect();
    }
    return socketInstance;
  }

  socketInstance = io(SERVER_URL, {
    transports: ['websocket', 'polling'],
    autoConnect: true,
  });

  socketInstance.on('connect', () => {
    connected.set(true);
    socketError.set(null);
  });

  socketInstance.on('disconnect', () => {
    connected.set(false);
  });

  socketInstance.on('connect_error', () => {
    socketError.set('Connection failed. Is the server running?');
    connected.set(false);
  });

  socketInstance.on('error', (data: { message: string }) => {
    socketError.set(data.message);
    setTimeout(() => socketError.set(null), 3000);
  });

  socket.set(socketInstance);
  return socketInstance;
}

export function getSocket(): Socket | null {
  return socketInstance;
}

export function disconnectSocket(): void {
  if (socketInstance) {
    socketInstance.removeAllListeners();
    socketInstance.disconnect();
    socketInstance = null;
  }
  socket.set(null);
  connected.set(false);
}
