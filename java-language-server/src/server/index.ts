import { WebSocketServer } from './ws-server';

const PORT = 3000;
const server = new WebSocketServer(PORT);
console.log(`WebSocket server is running on ws://localhost:${PORT}`);
