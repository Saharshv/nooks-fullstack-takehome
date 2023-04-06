import { useEffect, useRef, useState } from "react";
import VideoPlayer from "../components/VideoPlayer";
import { useNavigate, useParams } from "react-router-dom";
import { Box, Button, TextField, Tooltip, Typography } from "@mui/material";
import LinkIcon from "@mui/icons-material/Link";
import axios from "axios";
import { GetActionsResponse, VideoPlayerRef } from "../../types";

const ReplaySession: React.FC = () => {
  const navigate = useNavigate();
  const { sessionId } = useParams();
  const [url, setUrl] = useState<string | null>(null);

  const [linkCopied, setLinkCopied] = useState(false);
  const [actions, setActions] = useState<GetActionsResponse[]>([]);
  const [paused, setPaused] = useState<boolean>(true);
  const videoPlayer = useRef<VideoPlayerRef>(null);

  useEffect(() => {
    // load video by session ID -- right now we just hardcode a constant video but you should be able to load the video associated with the session
    if (sessionId) {
      axios
        .get(`http://localhost:8080/session/${sessionId}`)
        .then(function (response) {
          setUrl(response.data.youtubeUrl);
        })
        .catch(function (error) {
          console.log(error);
        });
      axios
        .get(`http://localhost:8080/session/${sessionId}/actions`)
        .then(function (response) {
          console.log("actions", response.data.actions);
          setActions(response.data.actions);
        })
        .catch(function (error) {
          console.log(error);
        });
    } else {
      navigate(`/create`);
    }

    // if session ID doesn't exist, you'll probably want to redirect back to the home / create session page
  }, [navigate, sessionId]);

  const onJoin = () => {
    setPaused(false);
    onReplayStart(0);
  };

  const onReplayStart = (index: number) => {
    if (actions) {
      let currAction = actions[index].action;
      for (let i = index; i < actions.length; i++) {
        if (currAction !== actions[i].action) {
          setTimeout(() => {
            if (
              videoPlayer.current &&
              Math.abs(videoPlayer.current.getCurrentTime() - actions[i].playedSeconds) > 1
            ) {
              videoPlayer.current?.seekTo(actions[i].playedSeconds);
              if (actions[i].action === "play") {
                setPaused(false);
              }
            } else {
              setPaused(actions[i].action === "pause");
            }
            onReplayStart(i);
          }, actions[i].timestamp - actions[index].timestamp);
          break;
        }
      }
    }
  };

  if (!!url) {
    return (
      <>
        <Box width="100%" maxWidth={1000} display="flex" gap={1} marginTop={1} alignItems="center">
          <TextField
            label="Youtube URL"
            variant="outlined"
            value={url}
            inputProps={{
              readOnly: true,
              disabled: true,
            }}
            fullWidth
          />
          <Tooltip title={linkCopied ? "Link copied" : "Copy replay link to share"}>
            <Button
              onClick={() => {
                navigator.clipboard.writeText(window.location.href);
                setLinkCopied(true);
                setTimeout(() => setLinkCopied(false), 2000);
              }}
              disabled={linkCopied}
              variant="contained"
              sx={{ whiteSpace: "nowrap", minWidth: "max-content" }}
            >
              <LinkIcon />
            </Button>
          </Tooltip>
        </Box>
        <VideoPlayer
          url={url}
          ref={videoPlayer}
          paused={paused}
          emitJoin={onJoin}
          setPaused={setPaused}
          hideControls
        />
      </>
    );
  }

  return null;
};

export default ReplaySession;
