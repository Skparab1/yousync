"use client";

import React from 'react';

import { useEffect, useState } from "react";

import supabase from "./../utils/supabase";

import { Button } from "@/components/ui/button";

import YouTube, { YouTubeProps } from 'react-youtube';
type VideoPlayerProps = {
    videoID: string;
    sessionID: string;
    simple: boolean;
    volume: number;
};

export default function VideoPlayer({ videoID, sessionID, simple, volume }: VideoPlayerProps) {

    const playerRef = React.useRef<any>(null);
    const sessionIDRef = React.useRef<string>(sessionID);

    // Keep sessionIDRef up to date if sessionID prop changes
    useEffect(() => {
        sessionIDRef.current = sessionID;
    }, [sessionID]);


    const [status, setStatus] = useState<string>('');

    const opts: YouTubeProps['opts'] = {
        height: '390',
        width: '640',
        playerVars: {
            // https://developers.google.com/youtube/player_parameters
            autoplay: 1,
        },
    };

    const onPlayerReady: YouTubeProps['onReady'] = async (event) => {
        playerRef.current = event.target;
        event.target.pauseVideo();
        playVideo();
        pauseVideo();
        await sleep(1000);
        pauseVideo();
        playerRef.current.seekTo(0);
    };

    function playVideo() {
        setStatus("Playing video at " + (new Date()).toLocaleTimeString() + "." + (new Date()).getMilliseconds().toString().padStart(3, '0'));
        if (playerRef.current) {
            playerRef.current.playVideo();
        }
    }

    function pauseVideo() {
        if (playerRef.current) {
            playerRef.current.pauseVideo();
        }
    }



    const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

    const videoIDRef = React.useRef(videoID);
    useEffect(() => {
        videoIDRef.current = videoID;
    }, [videoID]);

    useEffect(() => {
        const channel = supabase
            .channel("realtimestream:relay-stream")
            .on(
                "postgres_changes",
                {
                    event: "INSERT",
                    schema: "public",
                    table: "relay-session"
                },
                async (payload: any) => {
                    console.log("Session ID:", sessionIDRef.current, "Payload Session ID:", payload.new.session);
                    if (String(payload.new.session) !== sessionIDRef.current) {
                        return;
                    }

                    // alert("got matching trigger");

                    let createdAt = new Date(payload.new.created_at);

                    let waitUntil = createdAt.getTime() + 1000;

                    if (payload.new.status === 0) {
                        waitUntil = createdAt.getTime() + 200;
                    } else if (payload.new.master_time === 0) {
                        const oldVolume = playerRef.current.getVolume();
                        playerRef.current.playVideo();
                        playerRef.current.setVolume(0);
                        await sleep(500);
                        playerRef.current.seekTo(payload.new.master_time);
                        pauseVideo();
                        playerRef.current.seekTo(payload.new.master_time);
                        playerRef.current.setVolume(oldVolume);
                    } else {
                        playerRef.current.seekTo(payload.new.master_time);
                        const oldVolume = playerRef.current.getVolume();
                        playerRef.current.playVideo();
                        playerRef.current.setVolume(0);
                        await sleep(400);
                        playerRef.current.seekTo(payload.new.master_time);
                        pauseVideo();
                        playerRef.current.seekTo(payload.new.master_time);
                        playerRef.current.setVolume(oldVolume);
                        waitUntil = createdAt.getTime() + 750;
                    }

                    console.log("Waiting until:", new Date(waitUntil).toISOString() + " (" + waitUntil + " ms)");

                    while (Date.now() < waitUntil) {
                        // DO NOTHING
                    }

                    if (payload.new.status === 0) {
                        pauseVideo();
                    } else {
                        playVideo();
                    }
                }
            )
            .subscribe();

        return () => {
            channel.unsubscribe();
        };

    }, []);


    // listen for changes to the session
    useEffect(() => {
        const channel = supabase
            .channel("realtimestream:session-stream")
            .on(
                "postgres_changes",
                {
                    event: "UPDATE",
                    schema: "public",
                    table: "sessions"
                },
                async (payload: any) => {
                    console.log("I got a payload:", payload);
                    console.log("Current session ID:", videoIDRef.current, "Payload session ID:", payload.new.videoID);
                    if (videoIDRef.current !== payload.new.videoID) {
                        location.reload();
                    }
                }
            )
            .subscribe();

        return () => {
            channel.unsubscribe();
        };

    }, []);

    useEffect(() => {
        const originalBg = document.body.style.backgroundColor;
        document.body.style.backgroundColor = "black";
        return () => {
            document.body.style.backgroundColor = originalBg;
        };
    }, []);

    useEffect(() => {
        if (playerRef.current) {
            playerRef.current.setVolume(volume);
        }
    }, [volume]);

    
    return (
        <div className="fixed inset-0 flex flex-col items-center justify-center bg-black z-50">
            {!simple ? (
            <>
                <div className="bg-gray-700 text-white p-4 rounded mb-4">
                <h1 className="text-2xl ">Session: {sessionID}</h1>
                </div>
                <div className="bg-gray-700 text-white p-4 rounded mb-4">
                <h1 className="text-2xl ">Video: {videoID}</h1>
                </div>
                <div className="flex-1 w-full flex items-center justify-center">
                    <YouTube videoId={videoID} opts={{ ...opts, playerVars: { ...opts.playerVars, controls: 0 } }} onReady={(event) => {
                        onPlayerReady(event);
                        event.target.setVolume(volume);
                    }} />
                </div>
            </>
            ) : (
            <div className="fixed inset-0 flex items-center justify-center bg-black z-50">
                <YouTube
                    videoId={videoID}
                    opts={{
                        ...opts,
                        width: "100%",
                        height: "100%",
                        playerVars: { ...opts.playerVars, controls: 0 }
                    }}
                    className="w-screen h-screen"
                    onReady={(event) => {
                        onPlayerReady(event);
                        event.target.setVolume(volume);
                    }}
                />
            </div>
            )}
        </div>
    );
}