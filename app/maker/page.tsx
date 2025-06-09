"use client";

import Image from "next/image";
import { useState, useEffect, useRef } from "react";

import { FaPlay, FaPause, FaSync } from "react-icons/fa";

import YouTube, { YouTubeProps } from 'react-youtube';


import supabase from "../utils/supabase";
export default function Home() {
  const [time, setTime] = useState(0.0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const [videoId, setVideoId] = useState("");

  const [currentVideoLength, setCurrentVideoLength] = useState(0);

  const [videoQueue, setVideoQueue] = useState<string[][]>([]);
  const [videoQueueIndex, setVideoQueueIndex] = useState<number | null>(null);

  
  const [sessionId, setSessionId] = useState<string | null>(null);


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
        .then(({ data, error }) => {
          console.log("Session data:", data);

          setVideoId(data?.videoID || "ip3AKeUOG-o");
        });
    }
  }, []);

  const startStopwatch = () => {
    if (timerRef.current) return; // Prevent multiple intervals
    timerRef.current = setInterval(() => {
      setTime((prev) => {
        if (prev < currentVideoLength) {
          return prev + 1;
        } else {
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

    const response = await fetch(url, {
      headers: {
        Accept: "application/json",
      },
    });
    const data = await response.json();
    return data.items[0]?.snippet?.title;
  }

  async function getVideoDuration(videoId: string) {
    const apiKey = process.env.NEXT_PUBLIC_YOUTUBE_API_KEY;
    const url = `https://www.googleapis.com/youtube/v3/videos?part=contentDetails&id=${videoId}&key=${apiKey}`;

    const response = await fetch(url, {
      headers: {
        Accept: "application/json",
      },
    });
    const data = await response.json();
    const durString = data.items[0]?.contentDetails?.duration;
    const splitparts = durString.split("PT")[1].split("M");
    const mins = parseInt(splitparts[0]);
    const secs = parseInt(splitparts[1].replace("S", ""));
    return mins * 60 + secs;
  }

  async function startPlay() {
    startStopwatch();
    const { error } = await supabase.from('relay-session').insert({ status: 1, master_time: time, videoID: videoId, session: sessionId });
  }


  async function playFromBeginning() {
    startStopwatch();
    const { error } = await supabase.from('relay-session').insert({ status: 1, master_time: 0, videoID: videoId, session: sessionId });
  }

  async function endPlay() {
    stopStopwatch();
    const { error } = await supabase.from('relay-session').insert({ status: 0, master_time: time, videoID: videoId, session: sessionId });
  }

  // Cleanup on unmount
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
      console.log("Session started with ID:", data.id);
    } else {
      console.error("Error starting session:", error);
    }
  }

  async function changeVideo() {
    
    let useIndex = (videoQueueIndex || 0) + 1;
    if (useIndex >= videoQueue.length) {
      useIndex = 0; // Loop back to start if at end
    }

    let splitID = videoQueue[useIndex][0].split("v=")[1] || videoQueue[useIndex][0];
    splitID = splitID.split("&")[0];

    setVideoQueueIndex((prevIndex) => {
      const nextIndex = (prevIndex || 0) + 1;
      return nextIndex < videoQueue.length ? nextIndex : 0; // Loop back to start if at end
    });

    setVideoId(splitID); // Extract video ID from URL
    stopStopwatch();

    setTime(0);


    const { error } = await supabase.from('sessions').update({ videoID: splitID }).eq('id', sessionId);

    const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
    setTime(0);
  }

  async function reSync() {
    endPlay();
    const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
    setTime(Math.floor(time));
    await sleep(500);
    startPlay();
  }

  useEffect(() => {
      const originalBg = document.body.style.backgroundColor;
      document.body.style.backgroundColor = "black";
      return () => {
          document.body.style.backgroundColor = originalBg;
      };
  }, []);


  return (
    <div className="flex flex-col min-h-screen p-2 pb-20 gap-16 sm:p-20 font-[family-name:var(--font-geist-sans)]">

      {sessionId ? (
          
        <div className="m-4 p-4 text-center">
            <div className="bg-gray-800 text-white p-6 rounded-lg m-4 flex flex-col items-center shadow-lg w-full max-w-xl mx-auto">
              <h1 className="text-2xl font-bold text-center mb-6 tracking-wide">
                Master Clock: <span className="font-mono">{Math.max(time - 1, 0).toFixed(2)}</span>
              </h1>
              <div className="w-full flex flex-col items-center">
                <input
                  type="range"
                  min={0}
                  max={currentVideoLength}
                  step={1}
                  value={time}
                  onChange={e => setTime(Number(e.target.value))}
                  onMouseUp={reSync}
                  onTouchEnd={reSync}
                  className="w-full h-3 bg-gray-600 rounded-lg appearance-none accent-cyan-400 transition-all outline-none focus:ring-2 focus:ring-cyan-400"
                  style={{
                    accentColor: "#06b6d4",
                  }}
                />
                <div className="flex justify-between w-full mt-2 text-xs text-gray-300 font-mono">
                  <span>{Math.floor(time / 60)}:{(time % 60).toString().padStart(2, "0")}</span>
                  <span>-{Math.floor((currentVideoLength-time) / 60)}:{((currentVideoLength-time) % 60).toString().padStart(2, "0")}</span>
                </div>
              </div>
            </div>

          <div className="bg-blue-400 text-white p-4 rounded m-4"
          onClick={() => {navigator.clipboard.writeText(window.location.href.replace("maker",""))}}>
            <h1 className="text-2xl text-center">Session ID: {sessionId}</h1>
          </div>


          <div className="flex justify-center my-8">
            <div className="bg-cyan-400 text-white p-4 rounded w-1/3 max-w-md flex flex-row justify-between">
              <button
                className="px-4 py-2 bg-blue-500 text-white rounded flex-1 mx-1"
                onClick={startPlay}
              >
                <FaPlay />
              </button>
              <button
                className="px-4 py-2 bg-red-500 text-white rounded flex-1 mx-1"
                onClick={endPlay}
              >
                <FaPause />
              </button>
              <button
                className="px-4 py-2 bg-green-500 text-white rounded flex-1 mx-1"
                onClick={reSync}
              >
                <FaSync />
              </button>
            </div>
          </div>


          <div className="bg-emerald-500 text-white p-4 rounded m-4">
            <h1 className="text-2xl text-center">{(videoQueue[videoQueueIndex || 0] ? videoQueue[videoQueueIndex || 0][1] || "No Video Playing" : "No Video Playing")}</h1>
          </div>

          <div className="flex flex-col gap-8 items-center w-full max-w-2xl mx-auto">

            {/* Video Queue */}
            {videoQueue.length > 0 && (
              <div className="bg-gray-800 text-white p-6 rounded-lg shadow-lg w-full">
                <h1 className="text-2xl font-semibold text-center mb-4">Video Queue</h1>
                <div className="flex flex-col gap-2">
                  {videoQueue.map((video, index) => (
                    <div
                      key={index}
                      className={`flex items-center justify-between px-4 py-2 rounded transition-colors ${
                        index === videoQueueIndex
                          ? "bg-green-500 text-white font-bold shadow"
                          : "bg-gray-700 text-gray-200"
                      }`}
                    >
                      <span className="truncate">{video[1]}</span>
                      {index === videoQueueIndex && (
                        <span className="ml-2 text-xs bg-white text-green-700 px-2 py-0.5 rounded">Now Playing</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Controls Row */}
            <div className="flex flex-wrap gap-4 justify-center w-full">
              <button
                className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded shadow transition"
                onClick={changeVideo}
              >
                Load Next Video
              </button>
              <a href={'/maker'}>
                <button className="px-6 py-2 bg-red-500 hover:bg-red-600 text-white rounded shadow transition">
                  New Session
                </button>
              </a>
            </div>

            <form
              className="flex flex-col sm:flex-row gap-4 w-full max-w-lg"
              onSubmit={async e => {
                e.preventDefault();
                if (videoId) {
                  let splitID = videoId.split("v=")[1] || videoId;
                  splitID = splitID.split("&")[0];
                  let videoTitle = await getVideoTitle(splitID);
                  let videoDuration = await getVideoDuration(splitID);
                  setCurrentVideoLength(videoDuration);
                  videoTitle = videoTitle; // + videoDuration;
                  setVideoQueue([...videoQueue, [splitID,videoTitle]]);
                  setVideoId("");
                }
              }}
            >
              <input
                type="text"
                placeholder="Enter Video ID or URL"
                value={videoId}
                onChange={(e) => setVideoId(e.target.value)}
                className="flex-1 px-4 py-2 border border-gray-600 rounded text-white"
              />
              <button
                type="submit"
                className="px-6 py-2 bg-green-500 hover:bg-green-600 text-white rounded shadow transition"
              >
                Add to Queue
              </button>
            </form>
          </div>
          
        </div>
      ) : (
        <div className="flex gap-4">
          <input
            type="text"
            placeholder="Enter Video ID"
            value={videoId}
            onChange={(e) => setVideoId(e.target.value)}
            className="px-4 py-2 border rounded"
          />
          <button
            className="px-4 py-2 bg-blue-500 text-white rounded"
            onClick={startSession}
          >
            Start Session
          </button>
        </div>
      )}
    </div>
  );
}
