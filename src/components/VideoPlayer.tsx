import { Box, Button, Card, IconButton, Stack } from "@mui/material";
import React, { forwardRef, useEffect, useImperativeHandle, useRef, useState } from "react";
import ReactPlayer from "react-player";
import { Socket } from "socket.io-client";
import { VideoPlayerRef } from "../../types";

interface VideoPlayerProps {
  url: string;
  paused?: boolean;
  hideControls?: boolean;
  socket?: Socket | null;
  emitAction?: (action: string, paused: boolean) => void;
  emitProgress?: (playedSeconds: number) => void;
  emitJoin?: () => void;
  setPaused?: React.Dispatch<React.SetStateAction<boolean>>;
}

const VideoPlayer = forwardRef<VideoPlayerRef, VideoPlayerProps>(
  (
    { url, hideControls, paused, socket, emitAction, emitProgress, emitJoin, setPaused },
    forwardedRef
  ) => {
    const [hasJoined, setHasJoined] = useState(false);
    const [isReady, setIsReady] = useState(false);
    const player = useRef<ReactPlayer>(null);

    useImperativeHandle(
      forwardedRef,
      () => {
        return {
          getCurrentTime() {
            if (player.current) {
              return player.current.getCurrentTime();
            }
            return 0;
          },
          seekTo(seconds: number) {
            player.current?.seekTo(seconds);
          },
        };
      },
      []
    );

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
      if (setPaused && emitAction) {
        setPaused(false);
        emitAction("play", false);
      }
    };

    const handlePause = () => {
      console.log("User paused video at time: ", player.current?.getCurrentTime());

      if (setPaused && emitAction) {
        setPaused(true);
        emitAction("pause", true);
      }
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
      if (emitProgress) {
        emitProgress(state.playedSeconds);
      }
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
              setHasJoined(true);
              if (emitJoin) {
                emitJoin();
              }
            }}
          >
            Watch Session
          </Button>
        )}
      </Box>
    );
  }
);

export default VideoPlayer;
