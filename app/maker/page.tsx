"use client";

import { useState, useEffect, useRef } from "react";
import { FaPlay, FaPause, FaSync, FaCheckCircle, FaRegDotCircle, FaStepBackward } from "react-icons/fa";
import { IoMdSkipForward } from "react-icons/io";
import supabase from "../utils/supabase";

export default function Home() {
  const [time, setTime] = useState(0.0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const [videoId, setVideoId] = useState("");
  const [currentVideoLength, setCurrentVideoLength] = useState(0);
  const [videoQueue, setVideoQueue] = useState<string[][]>([]);
  const [videoQueueIndex, setVideoQueueIndex] = useState<number | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [videoStatus, setVideoStatus] = useState<string>("Loaded");
  const [autoPlay, setAutoPlay] = useState<boolean>(false);

  const [isUploading, setIsUploading] = useState<boolean>(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const session = params.get("session");
    setSessionId(session);

    if (session) {
      supabase
        .from('sessions')
        .select('*')
        .eq('id', session)
        .single()
        .then(({ data }) => {
          setVideoId(data?.videoID || "ip3AKeUOG-o");

          const fetchQueue = async () => {
            const queue = data?.videoQueue || [];
            const details = await Promise.all(
              queue.map(async (vidID: string) => {
                if (vidID.includes("psduayspkuspczikkyli")) {
                  const rawName = vidID.split("psduayspkuspczikkyli.supabase.co/storage/v1/object/public/videos/")[1];
                  const fileName = rawName
                    ? rawName
                      .split("_")
                      .slice(0, -1)
                      .join("_")
                    : "";
                  const videoTitle = decodeURIComponent(fileName);

                  let videoThumbnail = "";
                  if (
                  fileName &&
                  (
                    fileName.toLowerCase().endsWith(".mp4") ||
                    fileName.toLowerCase().endsWith(".mov") ||
                    fileName.toLowerCase().endsWith(".webm") ||
                    fileName.toLowerCase().endsWith(".mkv")
                  )
                  ) {
                    videoThumbnail = "https://media.istockphoto.com/id/1419998212/vector/video-tape-isolated-vector-icon.jpg?s=612x612&w=0&k=20&c=HUInrych-9LyGRWVFzj08ELVgeE__rwa2IIrd7AaW_4=";
                  } else {
                    videoThumbnail = "https://www.creativefabrica.com/wp-content/uploads/2020/03/16/CD-icon-vector-Graphics-3664529-1.jpg";
                  }
                  return [vidID, videoTitle, videoThumbnail];
                } else {
                  const [title, thumbnail] = await getVideoTitle(vidID);
                  return [vidID, title, thumbnail];
                }
              })
            );
            setVideoQueue(details);
            };
          fetchQueue();

          for (let i = 0; i < data?.videoQueue.length; i++) {
            if (data.videoQueue[i] == data.videoID) {
              setVideoQueueIndex(i);
              getVideoDuration(data.videoID).then((duration) => {
                setCurrentVideoLength(duration);
              });
            }
          }
        });
    }
  }, []);

  const startStopwatch = () => {
    if (timerRef.current) return;
    timerRef.current = setInterval(() => {
      setTime((prev) => {
        if (prev < currentVideoLength) {
          return prev + 1;
        } else {
          if (currentVideoLength){
            onSongFinish();
          }
          stopStopwatch();
          return prev;
        }
      });
    }, 997);
  };

  const stopStopwatch = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current as NodeJS.Timeout);
      timerRef.current = null;
    }
  };

  const YOUTUBE_API_KEY = process.env.NEXT_PUBLIC_YOUTUBE_API_KEY as string;

  async function getVideoTitle(videoId: string) {
    const apiKey = YOUTUBE_API_KEY;
    if (!apiKey) {
      return ["Unknown Title", ""];
    }
    const url = `https://www.googleapis.com/youtube/v3/videos?part=snippet&id=${videoId}&key=${apiKey}`;
    const response = await fetch(url, { headers: { Accept: "application/json" } });
    const data = await response.json();
    return [data.items?.[0]?.snippet?.title ?? "Unknown Title", data.items?.[0]?.snippet?.thumbnails?.standard?.url || ""];
  }

  async function getVideoDuration(videoId: string) {
    const apiKey = YOUTUBE_API_KEY;
    if (!apiKey) {
      return 0;
    }
    const url = `https://www.googleapis.com/youtube/v3/videos?part=contentDetails&id=${videoId}&key=${apiKey}`;
    const response = await fetch(url, { headers: { Accept: "application/json" } });
    const data = await response.json();
    const durString = data.items?.[0]?.contentDetails?.duration;
    if (!durString) return 0;
    // Parse ISO 8601 duration (e.g., PT2M10S)
    const match = durString.match(/PT(?:(\d+)M)?(?:(\d+)S)?/);
    const mins = match && match[1] ? parseInt(match[1]) : 0;
    const secs = match && match[2] ? parseInt(match[2]) : 0;
    return mins * 60 + secs;
  }

  async function startPlay() {
    if (time >= currentVideoLength) {
      setTime(0);
    }
    setVideoStatus("Playing");
    startStopwatch();
    await supabase.from('relay-session').insert({ status: 1, master_time: time, videoID: videoId, session: sessionId });
  }

  async function endPlay() {
    setVideoStatus("Paused");
    stopStopwatch();
    await supabase.from('relay-session').insert({ status: 0, master_time: time, videoID: videoId, session: sessionId });
  }

  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current as NodeJS.Timeout);
      }
    };
  }, []);

  async function startSession() {
    let splitID = videoId.split("v=")[1] || videoId;
    splitID = splitID.split("&")[0];
    const { data } = await supabase.from('sessions').insert({ videoID: splitID, videoQueue: [splitID] }).select('id').single();
    if (data) {
      setSessionId(data.id);
      window.location.href = `/maker?session=${data.id}`;
    }
  }

  async function changeVideo() {
    if (videoQueue.length === 0) return;
    let nextIndex = videoQueueIndex === null ? 0 : videoQueueIndex + 1;
    if (nextIndex >= videoQueue.length) nextIndex = 0;
    setVideoQueueIndex(nextIndex);
    setVideoStatus("Loaded");
    let splitID = videoQueue[nextIndex][0].split("v=")[1] || videoQueue[nextIndex][0];
    splitID = splitID.split("&")[0];
    let videoDuration = await getVideoDuration(splitID);
    setCurrentVideoLength(videoDuration);
    setVideoId(splitID);
    stopStopwatch();
    setTime(0);
    await supabase.from('sessions').update({ videoID: splitID, numDevices: 0 }).eq('id', sessionId);
  }

  async function prevVideo() {
    if (videoQueue.length === 0) return;
    let nextIndex = videoQueueIndex === null ? 0 : videoQueueIndex - 1;
    if (nextIndex < 0) nextIndex = videoQueue.length - 1;
    setVideoQueueIndex(nextIndex);
    setVideoStatus("Loaded");
    let splitID = videoQueue[nextIndex][0].split("v=")[1] || videoQueue[nextIndex][0];
    splitID = splitID.split("&")[0];
    let videoDuration = await getVideoDuration(splitID);
    setCurrentVideoLength(videoDuration);
    setVideoId(splitID);
    stopStopwatch();
    setTime(0);
    await supabase.from('sessions').update({ videoID: splitID }).eq('id', sessionId);
  }

  async function onSongFinish() {
    setVideoStatus("Not Playing");
    stopStopwatch();
    setTime(0);
    if (autoPlay) {
      const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
      await changeVideo();
      await sleep(5000);
      startPlay();
    }
  }

  async function reSync() {
    setVideoStatus("Resyncing");
    stopStopwatch();
    await supabase.from('relay-session').insert({ status: 0, master_time: time, videoID: videoId, session: sessionId });
    const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
    setTime(Math.floor(time));
    await sleep(500);
    await supabase.from('relay-session').insert({ status: 1, master_time: time, videoID: videoId, session: sessionId });
    setVideoStatus("Playing");
    startStopwatch();
  }

  useEffect(() => {
    const originalBg = document.body.style.backgroundColor;
    document.body.style.backgroundColor = "rgba(255, 236, 200, 0.9)";
    return () => {
      document.body.style.backgroundColor = originalBg;
    };
  }, []);

  const colors = {
    bg: "rgba(15, 25, 35, 0.98)", // deep ultramarine/greenish-black
    card: "rgba(30, 45, 60, 0.92)", // dark ultramarine/green
    cardBorder: "rgba(60, 120, 100, 0.35)", // greenish border
    cardShadow: "0 4px 24px 0 rgba(60, 120, 100, 0.10)",
    accent: "#3ddad7", // ultramarine-green accent
    accentDark: "#1e7f7c",
    accentLight: "#2e3a4e",
    accentTrans: "rgba(61, 218, 215, 0.15)",
    text: "#e0f7fa", // light text for dark bg
    textLight: "#b2ebf2",
    textMuted: "#7ec8c8",
    inputBg: "rgba(25, 40, 50, 0.95)",
    inputBorder: "#3ddad7",
    inputText: "#e0f7fa",
    btn: "#3ddad7",
    btnHover: "#23bdb8",
    btnDanger: "#e57373",
    btnDangerHover: "#ef5350",
    btnSecondary: "#2e3a4e",
    btnSecondaryHover: "#22304a",
    btnText: "#e0f7fa",
    btnTextLight: "#fff",
    slider: "#3ddad7",
    sliderBg: "#2e3a4e",
    queueActive: "rgba(61, 218, 215, 0.13)",
    queueInactive: "rgba(25, 40, 50, 0.7)",
    queueBorder: "#3ddad7",
    queueRemove: "#e57373",
    queueRemoveHover: "#ef5350",
    statusLoaded: "#3ddad7",
    statusPlaying: "#43a047",
    statusPaused: "#fbc02d",
    statusResync: "#ab47bc",
    statusNotPlaying: "#bdbdbd",
  };

  return (
    <div
      className="flex flex-col min-h-screen p-4 sm:p-10 font-sans gap-8"
      style={{
        background: colors.bg,
        color: colors.text,
        minHeight: "100vh",
        fontFamily: "Inter, sans-serif",
      }}
    >
      <style>{`
        ::selection { background: #ffe0b2; }
        input[type="range"]::-webkit-slider-thumb {
          background: ${colors.slider};
        }
        input[type="range"]::-moz-range-thumb {
          background: ${colors.slider};
        }
        input[type="range"]::-ms-thumb {
          background: ${colors.slider};
        }
      `}</style>
      {sessionId ? (
        <div className="w-full max-w-3xl mx-auto flex flex-col gap-8">
          <div
            className="flex flex-col gap-4 items-center rounded-xl shadow-lg p-6 mb-2"
            style={{
              background: colors.card,
              border: `1.5px solid ${colors.cardBorder}`,
              boxShadow: colors.cardShadow,
              color: colors.text,
            }}
          >
            <div className="flex gap-4 w-full justify-center">
              <a href="/maker" className="w-full sm:w-auto">
                <button
                  className="w-full sm:w-auto px-8 py-2 rounded-lg shadow text-lg transition"
                  style={{
                    background: colors.btnDanger,
                    color: colors.btnTextLight,
                    border: "none",
                  }}
                >
                  New Session
                </button>
              </a>
              <button
                className="w-full sm:w-auto px-6 py-2 rounded-lg text-base font-mono shadow transition"
                style={{
                  background: colors.btnSecondary,
                  color: colors.btnText,
                  border: "none",
                }}
                onClick={() =>
                  navigator.clipboard.writeText(
                    window.location.href.replace("maker", "simpleclient")
                  )
                }
              >
                Copy Session Link
              </button>
            </div>
            <div className="flex flex-col items-center mt-2">
              <span className="text-xs" style={{ color: colors.textMuted }}>
                Session ID:{" "}
                <span
                  className="text-[11px] mt-1 select-all"
                  style={{ color: colors.textLight }}
                >
                  {sessionId}
                </span>
              </span>
            </div>
          </div>

          <div
            className="rounded-xl shadow-lg p-6 flex flex-col gap-4 items-center"
            style={{
              background: colors.card,
              border: `1.5px solid ${colors.cardBorder}`,
              boxShadow: colors.cardShadow,
              color: colors.text,
            }}
          >
            <h2 className="text-xl font-semibold mb-2" style={{ color: colors.text }}>
              Master Clock
            </h2>
            <div className="flex items-center gap-4">
              <span
                className="text-4xl font-mono"
                style={{ color: colors.accentDark, fontWeight: 700 }}
              >
                {Math.max(time, 0).toFixed(2)}
              </span>
              <span className="text-sm" style={{ color: colors.textMuted }}>
                / {currentVideoLength}s
              </span>
            </div>
            <input
              type="range"
              min={0}
              max={currentVideoLength}
              step={1}
              value={time}
              onChange={e => setTime(Number(e.target.value))}
              onMouseUp={reSync}
              onTouchEnd={reSync}
              className="w-full h-2 rounded-lg"
              style={{
                accentColor: colors.slider,
                background: colors.sliderBg,
              }}
            />
            <div className="flex justify-between w-full text-xs font-mono">
              <span style={{ color: colors.textMuted }}>
                {Math.floor(time / 60)}:{(time % 60).toString().padStart(2, "0")}
              </span>
              <span style={{ color: colors.textMuted }}>
                -{Math.floor((currentVideoLength - time) / 60)}:
                {((currentVideoLength - time) % 60).toString().padStart(2, "0")}
              </span>
            </div>
          </div>

          <div
            className="rounded-xl shadow-lg p-6 flex flex-col gap-4 items-center"
            style={{
              background: colors.card,
              border: `1.5px solid ${colors.cardBorder}`,
              boxShadow: colors.cardShadow,
              color: colors.text,
            }}
          >
            <div className="flex gap-4 w-full justify-center">
              <button
                className="flex items-center gap-2 px-6 py-2 rounded-lg shadow text-lg transition-colors"
                onClick={prevVideo}
                title="Previous Video"
                style={{
                  background: colors.btnSecondary,
                  color: colors.btnText,
                  border: "none",
                }}
              >
                <FaStepBackward />
              </button>
              <button
                className="flex items-center gap-2 px-6 py-2 rounded-lg shadow text-lg transition-colors"
                onClick={startPlay}
                title="Play"
                style={{
                  background: colors.btn,
                  color: colors.btnTextLight,
                  border: "none",
                }}
              >
                <FaPlay />
              </button>
              <button
                className="flex items-center gap-2 px-6 py-2 rounded-lg shadow text-lg transition-colors"
                onClick={endPlay}
                title="Pause"
                style={{
                  background: colors.btnDanger,
                  color: colors.btnTextLight,
                  border: "none",
                }}
              >
                <FaPause />
              </button>
              <button
                className="flex items-center gap-2 px-6 py-2 rounded-lg shadow text-lg transition-colors"
                onClick={reSync}
                title="Resync"
                style={{
                  background: colors.statusResync,
                  color: "#fff",
                  border: "none",
                }}
              >
                <FaSync />
              </button>
              <button
                className="flex items-center gap-2 px-6 py-2 rounded-lg shadow text-lg transition-colors"
                onClick={changeVideo}
                title="Next Video"
                style={{
                  background: colors.btnSecondary,
                  color: colors.btnText,
                  border: "none",
                }}
              >
                <IoMdSkipForward />
              </button>
            </div>
          </div>

          <div
            className="rounded-xl shadow-lg p-6 flex flex-col gap-4"
            style={{
              background: colors.card,
              border: `1.5px solid ${colors.cardBorder}`,
              boxShadow: colors.cardShadow,
              color: colors.text,
            }}
          >
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-lg font-semibold" style={{ color: colors.text }}>
                Video Queue
              </h2>
              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <span className="text-sm" style={{ color: colors.textLight }}>
                    Autoplay
                  </span>
                  <input
                    type="checkbox"
                    checked={autoPlay}
                    onChange={e => setAutoPlay(e.target.checked)}
                    className="w-4 h-4"
                    style={{
                      accentColor: colors.accent,
                    }}
                  />
                </label>
              </div>
            </div>

            <div className="flex flex-col gap-2">
              {videoQueue.length === 0 && (
                <div
                  className="text-center py-4"
                  style={{ color: colors.textMuted }}
                >
                  No videos in queue.
                </div>
              )}
              {videoQueue.map((video, index) => (
                <div
                  key={index}
                  onClick={async () => {
                    setVideoQueueIndex(index);
                    setVideoStatus("Loaded");
                    if (video[0].includes("psduayspkuspczikkyli")) {
                      const media = document.createElement('video');
                      media.src = video[0];
                      media.preload = "metadata";
                      media.onloadedmetadata = () => {
                        setCurrentVideoLength(Math.round(media.duration) || 0);
                        setVideoId(video[0]);
                        stopStopwatch();
                        setTime(0);
                      };
                      await supabase.from('sessions').update({ videoID: video[0] }).eq('id', sessionId);
                    } else {
                      let splitID = videoQueue[index][0].split("v=")[1] || videoQueue[index][0];
                      splitID = splitID.split("&")[0];
                      let videoDuration = await getVideoDuration(splitID);
                      setCurrentVideoLength(videoDuration);
                      setVideoId(splitID);
                      stopStopwatch();
                      setTime(0);
                      await supabase.from('sessions').update({ videoID: splitID }).eq('id', sessionId);
                    }
                  }}
                  className={`flex items-center gap-4 px-4 py-3 rounded-lg border-2 transition-all cursor-pointer ${
                    (index === (videoQueueIndex ?? 0) && videoStatus !== "Not Playing")
                      ? ""
                      : ""
                  }`}
                  style={{
                    border:
                      (index === (videoQueueIndex ?? 0) && videoStatus !== "Not Playing")
                        ? `2px solid ${colors.queueBorder}`
                        : "2px solid transparent",
                    background:
                      (index === (videoQueueIndex ?? 0) && videoStatus !== "Not Playing")
                        ? colors.queueActive
                        : colors.queueInactive,
                    boxShadow:
                      (index === (videoQueueIndex ?? 0) && videoStatus !== "Not Playing")
                        ? "0 2px 12px 0 rgba(255,152,0,0.10)"
                        : "none",
                  }}
                >
                  <img
                    src={video[2]}
                    alt={video[1]}
                    className="w-16 h-10 object-cover rounded shadow"
                    style={{
                      border: `1px solid ${colors.queueBorder}`,
                      background: "#fff",
                    }}
                  />
                  <span
                    className={`flex-1 truncate ${
                      (index === (videoQueueIndex ?? 0) && videoStatus !== "Not Playing")
                        ? "font-bold"
                        : ""
                    }`}
                    style={{
                      color:
                        (index === (videoQueueIndex ?? 0) && videoStatus !== "Not Playing")
                          ? colors.accentDark
                          : colors.text,
                    }}
                  >
                    {video[1]}
                  </span>
                  {index !== (videoQueueIndex ?? 0) && (
                    <button
                      className="ml-2 px-2 py-1 rounded text-xs"
                      title="Remove from queue"
                      style={{
                        background: colors.queueRemove,
                        color: "#fff",
                        border: "none",
                        transition: "background 0.2s",
                      }}
                      onClick={e => {
                        e.stopPropagation();
                        setVideoQueue(prev => prev.filter((_, i) => i !== index));
                        supabase
                          .from('sessions')
                          .update({ videoQueue: videoQueue.map(v => v[0]).filter((_, i) => i !== index) })
                          .eq('id', sessionId)
                          .then(() => {
                            // removed
                          });
                        setVideoQueueIndex(prev => {
                          if (prev === null) return null;
                          if (index < prev) return prev - 1;
                          if (index === prev) return null;
                          return prev;
                        });
                      }}
                    >
                      Remove
                    </button>
                  )}
                  {index === (videoQueueIndex ?? 0) && (
                    <>
                      {videoStatus === "Loaded" && (
                        <span
                          className="flex items-center gap-1 font-semibold text-xs"
                          style={{ color: colors.statusLoaded }}
                        >
                          <FaCheckCircle /> Loaded
                        </span>
                      )}
                      {videoStatus === "Playing" && (
                        <span
                          className="flex items-center gap-1 font-semibold text-xs"
                          style={{ color: colors.statusPlaying }}
                        >
                          <FaPlay /> Playing
                        </span>
                      )}
                      {videoStatus === "Paused" && (
                        <span
                          className="flex items-center gap-1 font-semibold text-xs"
                          style={{ color: colors.statusPaused }}
                        >
                          <FaPause /> Paused
                        </span>
                      )}
                      {videoStatus === "Resyncing" && (
                        <span
                          className="flex items-center gap-1 font-semibold text-xs"
                          style={{ color: colors.statusResync }}
                        >
                          <FaSync /> Resyncing
                        </span>
                      )}
                      {videoStatus === "Not Playing" && (
                        <span
                          className="flex items-center gap-1 font-semibold text-xs"
                          style={{ color: colors.statusNotPlaying }}
                        >
                          <FaRegDotCircle /> Not Playing
                        </span>
                      )}
                    </>
                  )}
                </div>
              ))}
            </div>
          </div>

          <form
            className="rounded-xl shadow-lg p-6 flex flex-col sm:flex-row gap-4 items-center"
            style={{
              background: colors.card,
              border: `1.5px solid ${colors.cardBorder}`,
              boxShadow: colors.cardShadow,
              color: colors.text,
            }}
            onSubmit={async e => {
              e.preventDefault();
              if (videoId) {
                if (videoId.includes("psduayspkuspczikkyli")){
                  const splitID = videoId;
                  const rawName = videoId.split("psduayspkuspczikkyli.supabase.co/storage/v1/object/public/videos/")[1];
                  const fileName = rawName
                    ? rawName
                      .split("_")
                      .slice(0, -1)
                      .join("_")
                    : "";
                  const videoTitle = decodeURIComponent(fileName);
                  let videoThumbnail = "";
                  if (
                  fileName &&
                  (
                    fileName.toLowerCase().endsWith(".mp4") ||
                    fileName.toLowerCase().endsWith(".mov") ||
                    fileName.toLowerCase().endsWith(".webm") ||
                    fileName.toLowerCase().endsWith(".mkv")
                  )
                  ) {
                    videoThumbnail = "https://media.istockphoto.com/id/1419998212/vector/video-tape-isolated-vector-icon.jpg?s=612x612&w=0&k=20&c=HUInrych-9LyGRWVFzj08ELVgeE__rwa2IIrd7AaW_4=";
                  } else {
                    videoThumbnail = "https://www.creativefabrica.com/wp-content/uploads/2020/03/16/CD-icon-vector-Graphics-3664529-1.jpg";
                  }      
                  setVideoQueue([...videoQueue, [splitID, videoTitle, videoThumbnail]]);
                  setVideoId("");
                  supabase
                    .from('sessions')
                    .update({ videoQueue: [...videoQueue.map(v => v[0]), splitID] })
                    .eq('id', sessionId)
                } else {
                  let splitID = videoId.split("v=")[1] || videoId;
                  splitID = splitID.split("&")[0];
                  const vidDetails = await getVideoTitle(splitID);
                  const videoTitle = vidDetails[0];
                  const videoThumbnail = vidDetails[1];
                  setVideoQueue([...videoQueue, [splitID, videoTitle, videoThumbnail]]);
                  setVideoId("");
                  supabase
                    .from('sessions')
                    .update({ videoQueue: [...videoQueue.map(v => v[0]), splitID] })
                    .eq('id', sessionId)
                }
              }
            }}
          >
            <input
              type="text"
              placeholder="Enter Video ID or URL"
              value={videoId}
              onChange={(e) => {setVideoId(e.target.value);}}
              className="flex-1 px-4 py-2 rounded"
              style={{
                background: colors.inputBg,
                border: `1.5px solid ${colors.inputBorder}`,
                color: colors.inputText,
                outline: "none",
              }}
            />
            <input
              type="file"
              accept="video/*,audio/*"
              className="flex-1 px-2 py-2 rounded"
              style={{
                background: colors.inputBg,
                border: `1.5px solid ${colors.inputBorder}`,
                color: colors.inputText,
                outline: "none",
              }}
              onChange={async (e) => {
                const file = e.target.files?.[0];
                if (!file) return;
                setIsUploading(true);
                const fileName = `${file.name}_${Date.now()}`;
                await supabase.storage
                  .from("videos")
                  .upload(
                    fileName,
                    file
                  );
                const { data: publicUrlData } = supabase.storage.from('public-bucket').getPublicUrl("videos/" + fileName);
                const fileURL = publicUrlData.publicUrl.replace("public-bucket/", "");
                setVideoId(fileURL);
                setIsUploading(false);
              }}
            />
            <button
              type="submit"
              className={`px-6 py-2 rounded shadow transition ${
                isUploading
                  ? ""
                  : ""
              }`}
              style={{
                background: isUploading ? colors.btnSecondary : colors.btn,
                color: isUploading ? colors.textMuted : colors.btnTextLight,
                cursor: isUploading ? "not-allowed" : "pointer",
                border: "none",
              }}
              disabled={isUploading}
            >
              Add to Queue
            </button>
          </form>

          <div
            className="rounded-xl shadow-lg p-4 text-center flex flex-col gap-4 items-center"
            style={{
              background: colors.card,
              border: `1.5px solid ${colors.cardBorder}`,
              boxShadow: colors.cardShadow,
              color: colors.text,
            }}
          >
            <div className="flex flex-row items-center justify-between w-full mb-2">
              <h2 className="text-xl font-semibold -mt-4" style={{ color: colors.text }}>
                Client Emulator
              </h2>
              <button
                className="flex items-center gap-2 px-4 py-1 rounded-lg shadow text-base"
                style={{
                  background: colors.btn,
                  color: colors.btnTextLight,
                  border: "none",
                }}
                onClick={() => {
                  const iframe = document.getElementById("client-emulator-iframe") as HTMLIFrameElement | null;
                  if (iframe) iframe.src = iframe.src;
                }}
              >
                Reload
              </button>
            </div>
            <iframe
              id="client-emulator-iframe"
              src={"/simpleclient?session=" + sessionId}
              title="Embedded Test Route"
              className="w-full h-96 rounded shadow-lg border-2"
              style={{
                background: "#fff",
                border: `2px solid ${colors.cardBorder}`,
              }}
            />
          </div>
        </div>
      ) : (
        <div className="flex flex-col sm:flex-row gap-4 items-center justify-center min-h-[60vh]">
          <input
            type="text"
            placeholder="Enter Video ID"
            value={videoId}
            onChange={(e) => setVideoId(e.target.value)}
            className="px-4 py-2 rounded"
            style={{
              background: colors.inputBg,
              border: `1.5px solid ${colors.inputBorder}`,
              color: colors.inputText,
              outline: "none",
            }}
          />
          <button
            className="px-6 py-2 rounded shadow"
            style={{
              background: colors.btn,
              color: colors.btnTextLight,
              border: "none",
            }}
            onClick={startSession}
          >
            Start Session
          </button>
        </div>
      )}
    </div>
  );
}
