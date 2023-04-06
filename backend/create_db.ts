import sqlite3 from "sqlite3";
import { GetAllActionsResponse, GetAllActionsRow, GetSessionDetailsRow, SessionDetails } from "../types";

let db = new sqlite3.Database("watch_party.db", (err) => {
  if (err) {
    // Cannot open database
    console.error(err.message);
    throw err;
  } else {
    console.log("Connected to the SQLite database.");
    db.run(
      `
        create table sessions (
            session_id text primary key not null,
            youtube_url text not null,
            is_active integer not null,
            played_seconds real not null,
            paused integer not null
        );
            `,
      (err) => {
        if (err) {
          // Table already created
        }
      }
    );
    db.run(
      `
          create table actions (
              session_id text not null,
              action text not null,
              played_seconds real not null,
              timestamp datetime default current_timestamp
          );
              `,
      (err) => {
        if (err) {
          // Table already created
        }
      }
    );
  }
});

/**
 * Creates a session with the given session id in the sessions table
 * @param sessionId
 * @param youtubeUrl
 */
export function createSession(sessionId: string, youtubeUrl: string) {
  let query = db.prepare(
    `insert into sessions (session_id, youtube_url, is_active, played_seconds, paused) VALUES (?, ?, 1, 0, 1);`
  );
  query.run([sessionId, youtubeUrl]);
}

/**
 * Gets session details of the given session id from the sessions table
 * @param sessionId
 * @returns Promise
 */
export function getSessionDetails(sessionId: string): Promise<SessionDetails> {
  let query = db.prepare(
    `select youtube_url, played_seconds, paused from sessions where session_id=? and is_active=1;`
  );
  return new Promise((resolve, reject) => {
    query.get([sessionId], (err: Error, row: GetSessionDetailsRow) => {
      if (err) {
        reject(err.message);
      }
      if (row) {
        resolve({
          youtubeUrl: row.youtube_url,
          playedSeconds: row.played_seconds,
          paused: row.paused ? true : false,
        });
      }
    });
  });
}

/**
 * Adds an action with the given session id in the actions table
 * @param sessionId
 * @param youtubeUrl
 */
export function addAction(sessionId: string, action: string, playedSeconds: number) {
  let query = db.prepare(`insert into actions (session_id, action, played_seconds) VALUES (?, ?, ?);`);
  query.run([sessionId, action, playedSeconds]);
}

/**
 * Gets all actions of the given session id from the sessions table
 * @param sessionId
 * @returns Promise
 */
export function getAllActions(sessionId: string): Promise<GetAllActionsResponse[]> {
  let query = db.prepare(`select action, played_seconds, timestamp from actions where session_id=?;`);
  return new Promise((resolve, reject) => {
    query.all([sessionId], (err: Error, rows: GetAllActionsRow[]) => {
      if (err) {
        reject(err.message);
      }
      if (rows) {
        let res: GetAllActionsResponse[] = [];
        rows.forEach((row) => {
          res.push({ action: row.action, playedSeconds: row.played_seconds, timestamp: row.timestamp });
        });
        resolve(res);
      }
    });
  });
}
