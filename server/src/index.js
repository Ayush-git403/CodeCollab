require("dotenv").config();
const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");

const roomRoutes = require("./routes/room");
const executeRoutes = require("./routes/execute");
const aiRoutes = require("./routes/ai");
const authRoutes = require("./routes/auth");
const chatRoutes = require("./routes/chat");
const roomHandler = require("./socket/roomHandler");
const createYjsServer = require("./socket/yjsServer");

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: [
      "http://localhost:5173",
      "https://code-collab-seven-lake.vercel.app",
    ],
    methods: ["GET", "POST"],
  },
});

app.use(
  cors({
    origin: [
      "http://localhost:5173",
      "https://code-collab-seven-lake.vercel.app",
      // add your actual Vercel URL here after deployment
    ],
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true,
  }),
);
app.use(express.json());

// Required for WebContainers
app.use((req, res, next) => {
  res.setHeader("Cross-Origin-Embedder-Policy", "require-corp");
  res.setHeader("Cross-Origin-Opener-Policy", "same-origin");
  next();
});

app.use("/api/room", roomRoutes);
app.use("/api/execute", executeRoutes);
app.use("/api/ai", aiRoutes);
app.use("/api/auth", require("./routes/oauth"));
app.use("/api/auth", authRoutes);
app.use("/api/chat", chatRoutes);

roomHandler(io);
createYjsServer(server);

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(` Server running on port ${PORT}`));
