"use client";
import Image from "next/image";

import VideoPlayer from "../components/VideoPlayer";

import CustomPlayer from "../components/CustomPlayer";

import { HiSpeakerWave } from "react-icons/hi2";

import { useEffect, useState } from "react";

import supabase from "../utils/supabase";

export default function Home() {

  const [sessionId, setSessionId] = useState<string | null>(null);

  const [videoId, setVideoId] = useState("ip3AKeUOG-o");

  const [volume, setVolume] = useState(50);

  const [showSlider, setShowSlider] = useState(false);

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

  return (
    <>
      <div className="fixed inset-0 flex flex-col items-center justify-center bg-black">
        {videoId.includes("psduayspkuspczikkyli") ? (
           <CustomPlayer
            videoID={videoId}
            sessionID={sessionId ?? ""}
            simple={true}
            volume={volume}
          />
        ) : (
          <VideoPlayer
            videoID={videoId}
            sessionID={sessionId ?? ""}
            simple={true}
            volume={volume}
          />
        )}
      </div>
      <div className="fixed bottom-4 left-4 z-50">
        <div
          className={`relative bg-gray-800 rounded-full shadow-lg transition-all duration-300 flex items-center justify-center ${volume !== null ? "w-12 h-12" : ""}`}
          onMouseEnter={() => setShowSlider(true)}
          onMouseLeave={() => setShowSlider(false)}
        >
          <span className="text-white text-2xl pointer-events-none">
        <HiSpeakerWave className="size-6" />
          </span>
          <div
        className={`absolute left-14 top-1/2 -translate-y-1/2 transition-all duration-300 w-44 ${
          showSlider ? "opacity-100 visible" : "opacity-0 invisible"
        }`}
          >
        <input
          type="range"
          min="0"
          max="100"
          value={volume}
          onChange={(e) => setVolume(Number(e.target.value))}
          className="w-full"
        />
          </div>
        </div>
      </div>
    </>
  );
}
