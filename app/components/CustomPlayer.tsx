"use client";

import React from 'react';

import { useEffect, useState } from "react";

import supabase from "./../utils/supabase";

import { Button } from "@/components/ui/button";

type CustomPlayerProps = {
    videoID: string;
    sessionID: string;
    simple: boolean;
    volume: number;
};

export default function CustomPlayer({ videoID, sessionID, simple, volume }: CustomPlayerProps) {

    const [mediaElement, setMediaElement] = useState<HTMLVideoElement | HTMLAudioElement | null>(null);
    const mediaElementRef = React.useRef<HTMLVideoElement | HTMLAudioElement | null>(null);
    const sessionIDRef = React.useRef<string>(sessionID);

    // Keep sessionIDRef up to date if sessionID prop changes
    useEffect(() => {
        sessionIDRef.current = sessionID;
    }, [sessionID]);

    useEffect(() => {
        mediaElementRef.current = mediaElement;
    }, [mediaElement]);

    const [status, setStatus] = useState<string>('');

    function playVideo() {
        setStatus("Playing video at " + (new Date()).toLocaleTimeString() + "." + (new Date()).getMilliseconds().toString().padStart(3, '0'));
        if (mediaElementRef.current) {
            mediaElementRef.current.play();
        }
    }

    function pauseVideo() {
        if (mediaElementRef.current) {
            mediaElementRef.current.pause();
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
                        const oldVolume = mediaElementRef.current?.volume || 0;
                        mediaElementRef.current?.play();
                        if (mediaElementRef.current) {
                            mediaElementRef.current.volume = 0;
                        }
                        await sleep(500);
                        if (mediaElementRef.current) {
                            mediaElementRef.current.currentTime = payload.new.master_time;
                            pauseVideo();
                            mediaElementRef.current.currentTime = payload.new.master_time;
                            mediaElementRef.current.volume = oldVolume;
                            mediaElementRef.current.currentTime = payload.new.master_time;
                        }

                    } else {
                        if (mediaElementRef.current) {
                            mediaElementRef.current.currentTime = payload.new.master_time;
                            const oldVolume = mediaElementRef.current.volume;
                            mediaElementRef.current.play();
                            mediaElementRef.current.volume = 0;
                            await sleep(400);
                            mediaElementRef.current.currentTime = payload.new.master_time;
                            pauseVideo();
                            mediaElementRef.current.currentTime = payload.new.master_time;
                            mediaElementRef.current.volume = oldVolume;
                        }
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
        if (mediaElementRef.current) {
            mediaElementRef.current.volume = volume / 100;
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
                {(() => {
                    const parts = videoID.split("_");
                    parts.pop();
                    const baseUrl = parts.join("_");
                    return (baseUrl.endsWith(".mp3") || baseUrl.endsWith(".wav"));
                })() ? (
                    <audio className="w-full max-w-xl">
                        <source src={videoID} />
                        Your browser does not support the audio element.
                    </audio>
                ) : (
                    <video className="w-full max-w-3xl" src={videoID} />
                )}
                </div>
            </>
            ) : (
            <div className="fixed inset-0 flex items-center justify-center bg-black z-50">
                {(() => {
                    const parts = videoID.split("_");
                    parts.pop();
                    const baseUrl = parts.join("_");
                    return (baseUrl.endsWith(".mp3") || baseUrl.endsWith(".wav"));
                })() ? (
                    <>
                        <audio
                            className="w-full max-w-xl"
                            src={videoID}
                            ref={audio => {
                                if (audio) audio.volume = volume / 100;
                                setMediaElement(audio);
                            }}
                        >
                            Your browser does not support the audio element.
                        </audio>
                        <div className="flex justify-center items-center w-full mt-8 pointer-events-none absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-10">
                            <img
                                src="https://www.creativefabrica.com/wp-content/uploads/2020/03/16/CD-icon-vector-Graphics-3664529-1.jpg"
                                alt="CD Icon"
                                className="w-100 h-100 object-contain"
                                style={{ pointerEvents: "none" }}
                            />
                        </div>
                    </>
                ) : (
                    <video
                        className="w-full max-w-3xl"
                        src={videoID}
                        ref={video => {
                            if (video) video.volume = volume / 100;
                            setMediaElement(video);
                        }}
                    />
                )}
            </div>
            )}
            <div className='w-1/2 h-1/2 fixed top-0 left-0 right-0 bottom-0 flex items-center justify-center bg-red'>
            </div>
        </div>
    );
}