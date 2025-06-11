"use client";
import Image from "next/image";

import VideoPlayer from "../components/VideoPlayer";

import { useEffect, useState } from "react";

import supabase from "../utils/supabase";

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
    <div className="fixed inset-0 flex items-center justify-center bg-black">
      <VideoPlayer videoID={videoId} sessionID={sessionId ?? ""} simple={true} />
    </div>
  );
}
