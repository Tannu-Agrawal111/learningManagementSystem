import { io } from 'socket.io-client';

const SOCKET_URL = `${window.API_BASE_URL || 'http://localhost:5000'}`;

export const socket = io(SOCKET_URL, {
  autoConnect: false,
  reconnectionAttempts: 5,
  reconnectionDelay: 2000
});

export const connectSocket = (userId) => {
  if (!socket.connected) {
    socket.connect();
  }
  socket.emit('join_user', userId);
  console.log(`Socket connected & registered for user: ${userId}`);
};

export const disconnectSocket = () => {
  if (socket.connected) {
    socket.disconnect();
    console.log('Socket disconnected');
  }
};
