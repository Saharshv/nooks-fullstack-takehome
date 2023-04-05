import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import bodyParser from "body-parser";
import http from "http";
import { Server } from "socket.io";
import { createSession, getSessionDetails } from "./create_db";
import { SessionDetails, SessionDetailsUsers } from "../types";

dotenv.config();

const port = process.env.SERVER_PORT;
// initialize an express app
const app = express();
// initialize a simple http server
const server = http.createServer(app);
// initialize the Socket.io server instance
const io = new Server(server, {
  cors: {
    origin: "*",
  },
});

// parse application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: false }));
// parse application/json
app.use(bodyParser.json());
app.use(cors());

// Keeps track of each session Ids details
const sessionUsers = new Map<string, SessionDetailsUsers>();

app.post("/session/:sessionId", (req, res) => {
  createSession(req.params.sessionId, req.body.youtubeUrl);
  sessionUsers.set(req.params.sessionId, {
    youtubeUrl: req.body.youtubeUrl,
    playedSeconds: 0,
    paused: true,
    users: 0,
  });
  res.status(200);
  res.send();
});

app.get("/session/:sessionId", (req, res) => {
  getSessionDetails(req.params.sessionId).then((sessionDetails) => {
    let session = sessionUsers.get(req.params.sessionId);
    if (session) {
      sessionUsers.set(req.params.sessionId, {
        ...sessionDetails,
        users: session.users + 1,
      });
    }
    res.status(201);
    res.send(sessionDetails);
  });
});

// this block will run when the client connects
io.on("connection", (socket) => {
  socket.on("joinSession", (sessionId) => {
    socket.join(sessionId);

    let session = sessionUsers.get(sessionId);
    if (session) {
      socket.emit("sessionDetails", session);
    } else {
      // Error
    }
  });

  // Listen for actions
  socket.on("action", (sessionId: string, sessionDetails: SessionDetails, action: string) => {
    let session = sessionUsers.get(sessionId);
    if (session) {
      sessionUsers.set(sessionId, {
        ...sessionDetails,
        users: session.users,
      });
      socket.to(sessionId).emit("sessionDetails", {
        ...sessionDetails,
      });
    } else {
      // Error
    }
  });

  // Listen for video progress
  socket.on("progress", (sessionId: string, sessionDetails: SessionDetails) => {
    let session = sessionUsers.get(sessionId);
    if (session) {
      sessionUsers.set(sessionId, {
        ...sessionDetails,
        users: session.users,
      });
    } else {
      // Error
    }
  });

  // Runs when client disconnects
  socket.on("disconnect", (sessionId) => {
    let session = sessionUsers.get(sessionId);
    if (session) {
      sessionUsers.set(sessionId, { ...session, users: session.users - 1 });
    } else {
      // Error
    }
    io.to(sessionId).emit("message", `One user has left the room`);
  });
});

server.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});
