import sqlite3 from "sqlite3";
import { GetSessionDetailsRow, SessionDetails } from "../types";

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
    
        create table session_actions (
            session_id text primary key not null,
            action text not null,
            playedSeconds real not null,
            youtube_url text not null,
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
 * Creates a session with the given session id in the db
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
 * Gets session details of the given session id from the db
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
