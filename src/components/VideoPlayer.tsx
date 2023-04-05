import { Box, Button, Card, IconButton, Stack } from "@mui/material";
import React, { useEffect, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import ReactPlayer from "react-player";
import io, { Socket } from "socket.io-client";

interface VideoPlayerProps {
  url: string;
  hideControls?: boolean;
}

const VideoPlayer: React.FC<VideoPlayerProps> = ({ url, hideControls }) => {
  const { sessionId } = useParams();
  const [hasJoined, setHasJoined] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const player = useRef<ReactPlayer>(null);
  const [socket, setSocket] = useState<Socket | null>(null);
  const [paused, setPaused] = useState<boolean>(true);

  useEffect(() => {
    const newSocket = io(`http://localhost:8080`);
    setSocket(newSocket);
    return () => {
      newSocket.close();
    };
  }, [setSocket]);

  useEffect(() => {
    if (socket) {
      const sessionDetailsListener = (sessionDetails: {
        youtubeUrl: string;
        playedSeconds: number;
        paused: boolean;
      }) => {
        if (paused !== sessionDetails.paused) setPaused(sessionDetails.paused);
        if (
          player.current &&
          Math.abs(player.current.getCurrentTime() - sessionDetails.playedSeconds) > 1
        )
          player.current?.seekTo(sessionDetails.playedSeconds);
        console.log("got detaisl");
      };

      socket.on("sessionDetails", sessionDetailsListener);

      return () => {
        socket.off("sessionDetails", sessionDetailsListener);
      };
    }
  }, [paused, socket]);

  // Emits action to the server
  const emitAction = (action: string, paused: boolean) => {
    socket?.emit(
      "action",
      sessionId,
      {
        youtubeUrl: url,
        playedSeconds: player.current?.getCurrentTime(),
        paused,
      },
      action
    );
  };

  // Emits progress to the server
  const emitProgress = (playedSeconds: number) => {
    socket?.emit("progress", sessionId, {
      youtubeUrl: url,
      paused,
      playedSeconds: playedSeconds,
    });
  };

  const handleReady = () => {
    setIsReady(true);
  };

  const handleEnd = () => {
    console.log("Video ended");
  };

  const handleSeek = (seconds: number) => {
    // Ideally, the seek event would be fired whenever the user moves the built in Youtube video slider to a new timestamp.
    // However, the youtube API no longer supports seek events (https://github.com/cookpete/react-player/issues/356), so this no longer works

    // You'll need to find a different way to detect seeks (or just write your own seek slider and replace the built in Youtube one.)
    // Note that when you move the slider, you still get play, pause, buffer, and progress events, can you use those?

    console.log("This never prints because seek decetion doesn't work: ", seconds);
  };

  const handlePlay = () => {
    console.log("User played video at time: ", player.current?.getCurrentTime());
    setPaused(false);
    emitAction("play", false);
  };

  const handlePause = () => {
    console.log("User paused video at time: ", player.current?.getCurrentTime());
    setPaused(true);
    emitAction("pause", true);
  };

  const handleBuffer = () => {
    console.log("Video buffered");
  };

  const handleProgress = (state: {
    played: number;
    playedSeconds: number;
    loaded: number;
    loadedSeconds: number;
  }) => {
    console.log("Video progress: ", state);
    emitProgress(state.playedSeconds);
  };

  return (
    <Box
      width="100%"
      height="100%"
      display="flex"
      alignItems="center"
      justifyContent="center"
      flexDirection="column"
    >
      <Box width="100%" height="100%" display={hasJoined ? "flex" : "none"} flexDirection="column">
        <ReactPlayer
          ref={player}
          url={url}
          playing={!paused}
          controls={!hideControls}
          onReady={handleReady}
          onEnded={handleEnd}
          onSeek={handleSeek}
          onPlay={handlePlay}
          onPause={handlePause}
          onBuffer={handleBuffer}
          onProgress={handleProgress}
          width="100%"
          height="100%"
          style={{ pointerEvents: hideControls ? "none" : "auto" }}
        />
      </Box>
      {!hasJoined && isReady && (
        // Youtube doesn't allow autoplay unless you've interacted with the page already
        // So we make the user click "Join Session" button and then start playing the video immediately after
        // This is necessary so that when people join a session, they can seek to the same timestamp and start watching the video with everyone else
        <Button
          variant="contained"
          size="large"
          onClick={() => {
            if (socket) {
              setHasJoined(true);
              console.log("emitted joinsession");
              socket.emit("joinSession", sessionId);
            }
          }}
        >
          Watch Session
        </Button>
      )}
    </Box>
  );
};

export default VideoPlayer;
