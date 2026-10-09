const WebSocket = require("ws");

const createYjsServer = (server) => {
  const wss = new WebSocket.Server({ noServer: true });

  server.on("upgrade", (request, socket, head) => {
    if (request.url.startsWith("/yjs")) {
      wss.handleUpgrade(request, socket, head, (ws) => {
        wss.emit("connection", ws, request);
      });
    }
  });

  const rooms = new Map();

  wss.on("connection", (conn, req) => {
    const roomName = req.url.replace(/^\/yjs\//, "");

    if (!rooms.has(roomName)) rooms.set(roomName, new Set());
    rooms.get(roomName).add(conn);

    conn.on("message", (message) => {
      const roomClients = rooms.get(roomName);
      if (roomClients) {
        roomClients.forEach((client) => {
          if (client !== conn && client.readyState === WebSocket.OPEN) {
            client.send(message);
          }
        });
      }
    });

    conn.on("close", () => {
      const roomClients = rooms.get(roomName);
      if (roomClients) {
        roomClients.delete(conn);
        if (roomClients.size === 0) rooms.delete(roomName);
      }
    });
  });

  console.log("✅ Yjs WebSocket server attached");
};

module.exports = createYjsServer;