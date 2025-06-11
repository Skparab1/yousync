"use client";

import Image from "next/image";
import { useState, useEffect, useRef } from "react";
import { FaPlay, FaPause, FaSync, FaCheckCircle } from "react-icons/fa";
import supabase from "../utils/supabase";

export default function Home() {
  const [time, setTime] = useState(0.0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const [videoId, setVideoId] = useState("");
  const [currentVideoLength, setCurrentVideoLength] = useState(0);
  const [videoQueue, setVideoQueue] = useState<string[][]>([]);
  const [videoQueueIndex, setVideoQueueIndex] = useState<number | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [videoStatus, setVideoStatus] = useState<string>("Not Playing");
  const [autoPlay, setAutoPlay] = useState<boolean>(false);

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

  async function getVideoTitle(videoId: string) {
    const apiKey = process.env.NEXT_PUBLIC_YOUTUBE_API_KEY;
    const url = `https://www.googleapis.com/youtube/v3/videos?part=snippet&id=${videoId}&key=${apiKey}`;
    const response = await fetch(url, { headers: { Accept: "application/json" } });
    const data = await response.json();
    return [data.items[0]?.snippet?.title, data.items[0]?.snippet?.thumbnails?.standard?.url || ""];
  }

  async function getVideoDuration(videoId: string) {
    const apiKey = process.env.NEXT_PUBLIC_YOUTUBE_API_KEY;
    const url = `https://www.googleapis.com/youtube/v3/videos?part=contentDetails&id=${videoId}&key=${apiKey}`;
    const response = await fetch(url, { headers: { Accept: "application/json" } });
    const data = await response.json();
    const durString = data.items[0]?.contentDetails?.duration;
    const splitparts = durString.split("PT")[1].split("M");
    const mins = parseInt(splitparts[0]);
    const secs = parseInt(splitparts[1].replace("S", ""));
    // alert(`Video Duration: ${mins} minutes and ${secs} seconds`);
    if (isNaN(mins) && isNaN(secs)) {
      return 0;
    } else if (isNaN(mins)) {
      return secs;
    } else if (isNaN(secs)) {
      return mins * 60;
    }
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

  // async function playFromBeginning() {
  //   setVideoStatus("Playing");
  //   startStopwatch();
  //   await supabase.from('relay-session').insert({ status: 1, master_time: 0, videoID: videoId, session: sessionId });
  // }

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
    const { data, error } = await supabase.from('sessions').insert({ videoID: splitID }).select('id').single();
    if (data) {
      setSessionId(data.id);
      window.location.href = `/maker?session=${data.id}`;
    }
  }

  async function changeVideo() {
    // If queue is empty, do nothing
    if (videoQueue.length === 0) return;

    // Calculate next index (cycle through queue)
    let nextIndex = videoQueueIndex === null ? 0 : videoQueueIndex + 1;
    if (nextIndex >= videoQueue.length) nextIndex = 0;

    // Update queue index first
    setVideoQueueIndex(nextIndex);

    setVideoStatus("Loaded");

    // Get video ID from queue
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
    // alert("Video finished playing. Changing to next video in queue.");
    setVideoStatus("Not Playing");
    stopStopwatch();
    setTime(0);

    // If autoplay is enabled, change to next video
    if (autoPlay) {
      const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
      await changeVideo();
      await sleep(5000); // Wait for the video to load
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
    document.body.style.backgroundColor = "#10141a";
    return () => {
      document.body.style.backgroundColor = originalBg;
    };
  }, []);

  return (
    <div className="flex flex-col min-h-screen p-4 sm:p-10 bg-[#10141a] text-white font-sans gap-8">
      {sessionId ? (
        <div className="w-full max-w-3xl mx-auto flex flex-col gap-8">
            <div className="flex flex-col gap-4 items-center bg-[#181f2a] rounded-xl shadow-lg p-6 mb-2">
            <div className="flex gap-4 w-full justify-center">
              <a href="/maker" className="w-full sm:w-auto">
              <button className="w-full sm:w-auto px-8 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg shadow text-lg transition">
                New Session
              </button>
              </a>
              <button
              className="w-full sm:w-auto px-6 py-2 bg-cyan-700 hover:bg-cyan-600 rounded-lg text-white text-base font-mono shadow transition"
              onClick={() => navigator.clipboard.writeText(window.location.href.replace("maker", "simpleclient"))}
              >
              Copy Session Link
              </button>
            </div>
            <div className="flex flex-col items-center mt-2">
              <span className="text-xs text-gray-400">
                Session ID:{" "}
                <span className="text-[11px] text-gray-500 mt-1 select-all">
                  {sessionId}
                </span>
              </span>
            </div>
            </div>

          <div className="bg-[#181f2a] rounded-xl shadow-lg p-6 flex flex-col gap-4 items-center">
            <h2 className="text-xl font-semibold mb-2">Master Clock</h2>
            <div className="flex items-center gap-4">
              <span className="text-4xl font-mono text-cyan-400">{Math.max(time, 0).toFixed(2)}</span>
              <span className="text-gray-400 text-sm">/ {currentVideoLength}s</span>
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
              className="w-full h-2 accent-cyan-400 rounded-lg"
              style={{ accentColor: "#06b6d4" }}
            />
            <div className="flex justify-between w-full text-xs text-gray-400 font-mono">
              <span>{Math.floor(time / 60)}:{(time % 60).toString().padStart(2, "0")}</span>
              <span>-{Math.floor((currentVideoLength - time) / 60)}:{((currentVideoLength - time) % 60).toString().padStart(2, "0")}</span>
            </div>
          </div>

          <div className="bg-[#181f2a] rounded-xl shadow-lg p-6 flex flex-col gap-4 items-center">
            <h2 className="text-lg font-semibold mb-2">Playback Controls</h2>
            <div className="flex gap-4 w-full justify-center">
              <button
                className="flex items-center gap-2 px-6 py-2 bg-cyan-600 hover:bg-cyan-500 rounded-lg shadow text-lg"
                onClick={startPlay}
                title="Play"
              >
                <FaPlay /> Play
              </button>
              <button
                className="flex items-center gap-2 px-6 py-2 bg-red-600 hover:bg-red-500 rounded-lg shadow text-lg"
                onClick={endPlay}
                title="Pause"
              >
                <FaPause /> Pause
              </button>
              <button
                className="flex items-center gap-2 px-6 py-2 bg-emerald-600 hover:bg-emerald-500 rounded-lg shadow text-lg"
                onClick={reSync}
                title="Resync"
              >
                <FaSync /> Resync
              </button>
            </div>
          </div>

            <div className="bg-[#181f2a] rounded-xl shadow-lg p-6 flex flex-col gap-4">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-lg font-semibold">Video Queue</h2>
              <div className="flex items-center gap-4">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <span className="text-sm text-gray-300">Autoplay</span>
                <input
                type="checkbox"
                checked={autoPlay}
                onChange={e => setAutoPlay(e.target.checked)}
                className="accent-cyan-500 w-4 h-4"
                />
              </label>
              <button
                className="px-4 py-1 bg-blue-600 hover:bg-blue-700 rounded text-white text-sm shadow"
                onClick={changeVideo}
              >
                Next Video
              </button>
              </div>
            </div>

            <div className="flex flex-col gap-2">
              {videoQueue.length === 0 && (
                <div className="text-gray-400 text-center py-4">No videos in queue.</div>
              )}
                {videoQueue.map((video, index) => (
                <div
                  key={index}
                  onClick={async () => {
                    setVideoQueueIndex(index);
                    setVideoStatus("Loaded");

                    // Get video ID from queue
                    let splitID = videoQueue[index][0].split("v=")[1] || videoQueue[index][0];
                    splitID = splitID.split("&")[0];

                    let videoDuration = await getVideoDuration(splitID);
                    setCurrentVideoLength(videoDuration);

                    setVideoId(splitID);
                    stopStopwatch();
                    setTime(0);

                    await supabase.from('sessions').update({ videoID: splitID }).eq('id', sessionId);
                  }}
                  
                  className={`flex items-center gap-4 px-4 py-3 rounded-lg border-2 transition-all ${
                  (index === (videoQueueIndex ?? 0) && videoStatus !== "Not Playing") 
                    ? "border-cyan-400 bg-cyan-950/60 shadow-lg"
                    : "border-transparent bg-[#232b3a]"
                  }`}
                >
                  <img
                  src={video[2]}
                  alt={video[1]}
                  className="w-16 h-10 object-cover rounded shadow"
                  />
                  <span className={`flex-1 truncate ${(index === (videoQueueIndex ?? 0) && videoStatus !== "Not Playing") ? "font-bold text-cyan-200" : "text-gray-200"}`}>
                  {video[1]}
                  </span>
                  {index !== (videoQueueIndex ?? 0) && (
                    <button
                      className="ml-2 px-2 py-1 bg-red-500 hover:bg-red-600 text-white rounded text-xs"
                      title="Remove from queue"
                      onClick={() => {
                        setVideoQueue(prev => prev.filter((_, i) => i !== index));
                        // Adjust queue index if needed
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
                    <span className="flex items-center gap-1 text-blue-400 font-semibold text-xs">
                      <FaCheckCircle className="text-blue-400" /> Loaded
                    </span>
                    )}
                    {videoStatus === "Playing" && (
                    <span className="flex items-center gap-1 text-green-400 font-semibold text-xs">
                      <FaPlay className="text-green-400" /> Playing
                    </span>
                    )}
                    {videoStatus === "Paused" && (
                    <span className="flex items-center gap-1 text-yellow-400 font-semibold text-xs">
                      <FaPause className="text-yellow-400" /> Paused
                    </span>
                    )}
                    {videoStatus === "Resyncing" && (
                    <span className="flex items-center gap-1 text-yellow-400 font-semibold text-xs">
                      <FaSync className="text-purple-400" /> Resyncing
                    </span>
                    )}
                  </>
                  )}
                </div>
                ))}
            </div>
          </div>

          <form
            className="bg-[#181f2a] rounded-xl shadow-lg p-6 flex flex-col sm:flex-row gap-4 items-center"
            onSubmit={async e => {
              e.preventDefault();
              if (videoId) {
                let splitID = videoId.split("v=")[1] || videoId;
                splitID = splitID.split("&")[0];
                let vidDetails = await getVideoTitle(splitID);
                let videoTitle = vidDetails[0];
                let videoThumbnail = vidDetails[1];
                setVideoQueue([...videoQueue, [splitID, videoTitle, videoThumbnail]]);
                setVideoId("");
              }
            }}
          >
            <input
              type="text"
              placeholder="Enter Video ID or URL"
              value={videoId}
              onChange={(e) => setVideoId(e.target.value)}
              className="flex-1 px-4 py-2 border border-gray-700 rounded bg-[#232b3a] text-white"
            />
            <button
              type="submit"
              className="px-6 py-2 bg-green-600 hover:bg-green-700 text-white rounded shadow transition"
            >
              Add to Queue
            </button>
          </form>

            <div className="bg-[#181f2a] rounded-xl shadow-lg p-4 text-center flex flex-col gap-4 items-center">
            <div className="flex flex-row items-center justify-between w-full mb-2">
              <h2 className="text-xl font-semibold -mt-4">Client Emulator</h2>
              <button
                className="flex items-center gap-2 px-4 py-1 bg-cyan-600 hover:bg-cyan-500 rounded-lg shadow text-base"
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
              className="w-full h-96 rounded shadow-lg border-2 border-gray-700"
              style={{ background: "white" }}
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
            className="px-4 py-2 border border-gray-700 rounded bg-[#232b3a] text-white"
          />
          <button
            className="px-6 py-2 bg-cyan-600 hover:bg-cyan-700 text-white rounded shadow"
            onClick={startSession}
          >
            Start Session
          </button>
        </div>
      )}
    </div>
  );
}
