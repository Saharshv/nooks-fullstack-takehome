export type SessionDetailsUsers = {
  youtubeUrl: string;
  playedSeconds: number;
  paused: boolean;
  users: number;
};

export type SessionDetails = {
  youtubeUrl: string;
  playedSeconds: number;
  paused: boolean;
};

export type GetSessionDetailsRow = {
  youtube_url: string;
  played_seconds: number;
  paused: number;
};

export type GetAllActionsRow = {
  action: string;
  played_seconds: number;
  timestamp: string;
};

export type GetAllActionsResponse = {
  action: string;
  playedSeconds: number;
  timestamp: string;
};

export type GetActionsResponse = {
  action: string;
  playedSeconds: number;
  timestamp: number;
};

export type VideoPlayerRef = {
  getCurrentTime: () => number;
  seekTo: (seconds: number) => void;
};
