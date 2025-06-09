"use client";
import Image from "next/image";

import VideoPlayer from "./components/VideoPlayer";

import { useEffect, useState } from "react";

import supabase from "./utils/supabase";

export default function Home() {

  const [sessionId, setSessionId] = useState<string | null>(null);

  const [videoId, setVideoId] = useState("ip3AKeUOG-o"); // Default video ID

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
    <div className="grid grid-rows-[20px_1fr_20px] items-center justify-items-center min-h-screen p-8 pb-20 gap-16 sm:p-20 font-[family-name:var(--font-geist-sans)]">
      <main className="flex flex-col gap-[32px] row-start-2 items-center sm:items-start">
        
        <VideoPlayer videoID={videoId} sessionID={sessionId ?? ""}  />

      </main>
    </div>
  );
}
