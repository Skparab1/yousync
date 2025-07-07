"use client";
"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var __spreadArrays = (this && this.__spreadArrays) || function () {
    for (var s = 0, i = 0, il = arguments.length; i < il; i++) s += arguments[i].length;
    for (var r = Array(s), k = 0, i = 0; i < il; i++)
        for (var a = arguments[i], j = 0, jl = a.length; j < jl; j++, k++)
            r[k] = a[j];
    return r;
};
exports.__esModule = true;
var react_1 = require("react");
var fa_1 = require("react-icons/fa");
var supabase_1 = require("../utils/supabase");
function Home() {
    var _this = this;
    var _a = react_1.useState(0.0), time = _a[0], setTime = _a[1];
    var timerRef = react_1.useRef(null);
    var _b = react_1.useState(""), videoId = _b[0], setVideoId = _b[1];
    var _c = react_1.useState(0), currentVideoLength = _c[0], setCurrentVideoLength = _c[1];
    var _d = react_1.useState([]), videoQueue = _d[0], setVideoQueue = _d[1];
    var _e = react_1.useState(null), videoQueueIndex = _e[0], setVideoQueueIndex = _e[1];
    var _f = react_1.useState(null), sessionId = _f[0], setSessionId = _f[1];
    var _g = react_1.useState("Not Playing"), videoStatus = _g[0], setVideoStatus = _g[1];
    var videoStatusRef = react_1.useRef(videoStatus);
    react_1.useEffect(function () {
        videoStatusRef.current = videoStatus;
    }, [videoStatus]);
    react_1.useEffect(function () {
        var params = new URLSearchParams(window.location.search);
        var session = params.get("session");
        setSessionId(session);
        if (session) {
            supabase_1["default"]
                .from('sessions')
                .select('*')
                .eq('id', session)
                .single()
                .then(function (_a) {
                var data = _a.data;
                setVideoId((data === null || data === void 0 ? void 0 : data.videoID) || "ip3AKeUOG-o");
            });
        }
    }, []);
    var startStopwatch = function () {
        if (timerRef.current)
            return;
        timerRef.current = setInterval(function () {
            setTime(function (prev) {
                if (prev < currentVideoLength) {
                    return prev + 1;
                }
                else {
                    stopStopwatch();
                    return prev;
                }
            });
        }, 997);
    };
    var stopStopwatch = function () {
        if (timerRef.current) {
            clearInterval(timerRef.current);
            timerRef.current = null;
        }
    };
    function getVideoTitle(videoId) {
        var _a, _b, _c, _d, _e, _f;
        return __awaiter(this, void 0, void 0, function () {
            var apiKey, url, response, data;
            return __generator(this, function (_g) {
                switch (_g.label) {
                    case 0:
                        apiKey = process.env.NEXT_PUBLIC_YOUTUBE_API_KEY;
                        url = "https://www.googleapis.com/youtube/v3/videos?part=snippet&id=" + videoId + "&key=" + apiKey;
                        return [4 /*yield*/, fetch(url, { headers: { Accept: "application/json" } })];
                    case 1:
                        response = _g.sent();
                        return [4 /*yield*/, response.json()];
                    case 2:
                        data = _g.sent();
                        return [2 /*return*/, [(_b = (_a = data.items[0]) === null || _a === void 0 ? void 0 : _a.snippet) === null || _b === void 0 ? void 0 : _b.title, ((_f = (_e = (_d = (_c = data.items[0]) === null || _c === void 0 ? void 0 : _c.snippet) === null || _d === void 0 ? void 0 : _d.thumbnails) === null || _e === void 0 ? void 0 : _e.standard) === null || _f === void 0 ? void 0 : _f.url) || ""]];
                }
            });
        });
    }
    function getVideoDuration(videoId) {
        var _a, _b;
        return __awaiter(this, void 0, void 0, function () {
            var apiKey, url, response, data, durString, splitparts, mins, secs;
            return __generator(this, function (_c) {
                switch (_c.label) {
                    case 0:
                        apiKey = process.env.NEXT_PUBLIC_YOUTUBE_API_KEY;
                        url = "https://www.googleapis.com/youtube/v3/videos?part=contentDetails&id=" + videoId + "&key=" + apiKey;
                        return [4 /*yield*/, fetch(url, { headers: { Accept: "application/json" } })];
                    case 1:
                        response = _c.sent();
                        return [4 /*yield*/, response.json()];
                    case 2:
                        data = _c.sent();
                        durString = (_b = (_a = data.items[0]) === null || _a === void 0 ? void 0 : _a.contentDetails) === null || _b === void 0 ? void 0 : _b.duration;
                        splitparts = durString.split("PT")[1].split("M");
                        mins = parseInt(splitparts[0]);
                        secs = parseInt(splitparts[1].replace("S", ""));
                        return [2 /*return*/, mins * 60 + secs];
                }
            });
        });
    }
    function startPlay() {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        setVideoStatus("Playing");
                        startStopwatch();
                        return [4 /*yield*/, supabase_1["default"].from('relay-session').insert({ status: 1, master_time: time, videoID: videoId, session: sessionId })];
                    case 1:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        });
    }
    // async function playFromBeginning() {
    //   setVideoStatus("Playing");
    //   startStopwatch();
    //   await supabase.from('relay-session').insert({ status: 1, master_time: 0, videoID: videoId, session: sessionId });
    // }
    function endPlay() {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        setVideoStatus("Paused");
                        stopStopwatch();
                        return [4 /*yield*/, supabase_1["default"].from('relay-session').insert({ status: 0, master_time: time, videoID: videoId, session: sessionId })];
                    case 1:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        });
    }
    react_1.useEffect(function () {
        return function () {
            if (timerRef.current) {
                clearInterval(timerRef.current);
            }
        };
    }, []);
    function startSession() {
        return __awaiter(this, void 0, void 0, function () {
            var splitID, _a, data, error;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        splitID = videoId.split("v=")[1] || videoId;
                        splitID = splitID.split("&")[0];
                        return [4 /*yield*/, supabase_1["default"].from('sessions').insert({ videoID: splitID }).select('id').single()];
                    case 1:
                        _a = _b.sent(), data = _a.data, error = _a.error;
                        if (data) {
                            setSessionId(data.id);
                            window.location.href = "/maker?session=" + data.id;
                        }
                        return [2 /*return*/];
                }
            });
        });
    }
    function changeVideo() {
        return __awaiter(this, void 0, void 0, function () {
            var nextIndex, splitID;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        // If queue is empty, do nothing
                        if (videoQueue.length === 0)
                            return [2 /*return*/];
                        nextIndex = videoQueueIndex === null ? 0 : videoQueueIndex + 1;
                        if (nextIndex >= videoQueue.length)
                            nextIndex = 0;
                        // Update queue index first
                        setVideoQueueIndex(nextIndex);
                        splitID = videoQueue[nextIndex][0].split("v=")[1] || videoQueue[nextIndex][0];
                        splitID = splitID.split("&")[0];
                        setVideoId(splitID);
                        stopStopwatch();
                        setTime(0);
                        return [4 /*yield*/, supabase_1["default"].from('sessions').update({ videoID: splitID }).eq('id', sessionId)];
                    case 1:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        });
    }
    function reSync() {
        return __awaiter(this, void 0, void 0, function () {
            var sleep;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        endPlay();
                        sleep = function (ms) { return new Promise(function (resolve) { return setTimeout(resolve, ms); }); };
                        setTime(Math.floor(time));
                        return [4 /*yield*/, sleep(500)];
                    case 1:
                        _a.sent();
                        startPlay();
                        return [2 /*return*/];
                }
            });
        });
    }
    react_1.useEffect(function () {
        var originalBg = document.body.style.backgroundColor;
        document.body.style.backgroundColor = "#10141a";
        return function () {
            document.body.style.backgroundColor = originalBg;
        };
    }, []);
    return (React.createElement("div", { className: "flex flex-col min-h-screen p-4 sm:p-10 bg-[#10141a] text-white font-sans gap-8" },
        sessionId ? (React.createElement("div", { className: "w-full max-w-3xl mx-auto flex flex-col gap-8" },
            React.createElement("div", { className: "flex flex-col gap-4 items-center bg-[#181f2a] rounded-xl shadow-lg p-6 mb-2" },
                React.createElement("div", { className: "flex gap-4 w-full justify-center" },
                    React.createElement("a", { href: "/maker", className: "w-full sm:w-auto" },
                        React.createElement("button", { className: "w-full sm:w-auto px-8 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg shadow text-lg transition" }, "New Session")),
                    React.createElement("button", { className: "w-full sm:w-auto px-6 py-2 bg-cyan-700 hover:bg-cyan-600 rounded-lg text-white text-base font-mono shadow transition", onClick: function () { return navigator.clipboard.writeText(window.location.href.replace("maker", "")); } }, "Copy Session Link")),
                React.createElement("div", { className: "flex flex-col items-center mt-2" },
                    React.createElement("span", { className: "text-xs text-gray-400" },
                        "Session ID:",
                        " ",
                        React.createElement("span", { className: "text-[11px] text-gray-500 mt-1 select-all" }, sessionId)))),
            React.createElement("div", { className: "bg-[#181f2a] rounded-xl shadow-lg p-6 flex flex-col gap-4 items-center" },
                React.createElement("h2", { className: "text-xl font-semibold mb-2" }, "Master Clock"),
                React.createElement("div", { className: "flex items-center gap-4" },
                    React.createElement("span", { className: "text-4xl font-mono text-cyan-400" }, Math.max(time - 1, 0).toFixed(2)),
                    React.createElement("span", { className: "text-gray-400 text-sm" },
                        "/ ",
                        currentVideoLength,
                        "s")),
                React.createElement("input", { type: "range", min: 0, max: currentVideoLength, step: 1, value: time, onChange: function (e) { return setTime(Number(e.target.value)); }, onMouseUp: reSync, onTouchEnd: reSync, className: "w-full h-2 accent-cyan-400 rounded-lg", style: { accentColor: "#06b6d4" } }),
                React.createElement("div", { className: "flex justify-between w-full text-xs text-gray-400 font-mono" },
                    React.createElement("span", null,
                        Math.floor(time / 60),
                        ":",
                        (time % 60).toString().padStart(2, "0")),
                    React.createElement("span", null,
                        "-",
                        Math.floor((currentVideoLength - time) / 60),
                        ":",
                        ((currentVideoLength - time) % 60).toString().padStart(2, "0")))),
            React.createElement("div", { className: "bg-[#181f2a] rounded-xl shadow-lg p-6 flex flex-col gap-4 items-center" },
                React.createElement("h2", { className: "text-lg font-semibold mb-2" }, "Playback Controls"),
                React.createElement("div", { className: "flex gap-4 w-full justify-center" },
                    React.createElement("button", { className: "flex items-center gap-2 px-6 py-2 bg-cyan-600 hover:bg-cyan-500 rounded-lg shadow text-lg", onClick: startPlay, title: "Play" },
                        React.createElement(fa_1.FaPlay, null),
                        " Play"),
                    React.createElement("button", { className: "flex items-center gap-2 px-6 py-2 bg-red-600 hover:bg-red-500 rounded-lg shadow text-lg", onClick: endPlay, title: "Pause" },
                        React.createElement(fa_1.FaPause, null),
                        " Pause"),
                    React.createElement("button", { className: "flex items-center gap-2 px-6 py-2 bg-emerald-600 hover:bg-emerald-500 rounded-lg shadow text-lg", onClick: reSync, title: "Resync" },
                        React.createElement(fa_1.FaSync, null),
                        " Resync"))),
            React.createElement("div", { className: "bg-[#181f2a] rounded-xl shadow-lg p-6 flex flex-col gap-4" },
                React.createElement("div", { className: "flex items-center justify-between mb-2" },
                    React.createElement("h2", { className: "text-lg font-semibold" }, "Video Queue"),
                    React.createElement("button", { className: "px-4 py-1 bg-blue-600 hover:bg-blue-700 rounded text-white text-sm shadow", onClick: changeVideo }, "Next Video")),
                React.createElement("div", { className: "flex flex-col gap-2" },
                    videoQueue.length === 0 && (React.createElement("div", { className: "text-gray-400 text-center py-4" }, "No videos in queue.")),
                    videoQueue.map(function (video, index) { return (React.createElement("div", { key: index, className: "flex items-center gap-4 px-4 py-3 rounded-lg border-2 transition-all " + (((index === (videoQueueIndex !== null && videoQueueIndex !== void 0 ? videoQueueIndex : 0)) && videoQueueIndex)
                            ? "border-cyan-400 bg-cyan-950/60 shadow-lg"
                            : "border-transparent bg-[#232b3a]") },
                        React.createElement("img", __assign({ src: video[2], alt: video[1] }, index === (videoQueueIndex !== null && videoQueueIndex !== void 0 ? videoQueueIndex : 0) && videoStatusRef.current !== "Now Playing" && (React.createElement("span", { className: "flex items-center gap-1 text-cyan-400 font-semibold text-xs" },
                            React.createElement(fa_1.FaCheckCircle, { className: "text-cyan-400" }),
                            " ",
                            videoStatusRef.current,
                            "Jabari")))),
                        "div> ))}")); })),
                React.createElement("form", { className: "bg-[#181f2a] rounded-xl shadow-lg p-6 flex flex-col sm:flex-row gap-4 items-center", onSubmit: function (e) { return __awaiter(_this, void 0, void 0, function () {
                        var splitID, vidDetails, videoTitle, videoThumbnail, videoDuration;
                        return __generator(this, function (_a) {
                            switch (_a.label) {
                                case 0:
                                    e.preventDefault();
                                    if (!videoId) return [3 /*break*/, 3];
                                    splitID = videoId.split("v=")[1] || videoId;
                                    splitID = splitID.split("&")[0];
                                    return [4 /*yield*/, getVideoTitle(splitID)];
                                case 1:
                                    vidDetails = _a.sent();
                                    videoTitle = vidDetails[0];
                                    videoThumbnail = vidDetails[1];
                                    return [4 /*yield*/, getVideoDuration(splitID)];
                                case 2:
                                    videoDuration = _a.sent();
                                    setCurrentVideoLength(videoDuration);
                                    setVideoQueue(__spreadArrays(videoQueue, [[splitID, videoTitle, videoThumbnail]]));
                                    setVideoId("");
                                    _a.label = 3;
                                case 3: return [2 /*return*/];
                            }
                        });
                    }); } },
                    React.createElement("input", { type: "text", placeholder: "Enter Video ID or URL", value: videoId, onChange: function (e) { return setVideoId(e.target.value); }, className: "flex-1 px-4 py-2 border border-gray-700 rounded bg-[#232b3a] text-white" }),
                    React.createElement("button", { type: "submit", className: "px-6 py-2 bg-green-600 hover:bg-green-700 text-white rounded shadow transition" }, "Add to Queue")),
                React.createElement("div", { className: "bg-[#181f2a] rounded-xl shadow-lg p-4 text-center flex flex-col gap-4 items-center" },
                    React.createElement("div", { className: "flex flex-row items-center justify-between w-full mb-2" },
                        React.createElement("h2", { className: "text-xl font-semibold -mt-4" }, "Client Emulator"),
                        React.createElement("button", { className: "flex items-center gap-2 px-4 py-1 bg-cyan-600 hover:bg-cyan-500 rounded-lg shadow text-base", onClick: function () {
                                var iframe = document.getElementById("client-emulator-iframe");
                                if (iframe)
                                    iframe.src = iframe.src;
                            } }, "Reload")),
                    React.createElement("iframe", { id: "client-emulator-iframe", src: "/simpleclient?session=" + sessionId, title: "Embedded Test Route", className: "w-full h-96 rounded shadow-lg border-2 border-gray-700", style: { background: "white" } }))),
            ") : (",
            React.createElement("div", { className: "flex flex-col sm:flex-row gap-4 items-center justify-center min-h-[60vh]" },
                React.createElement("input", { type: "text", placeholder: "Enter Video ID", value: videoId, onChange: function (e) { return setVideoId(e.target.value); }, className: "px-4 py-2 border border-gray-700 rounded bg-[#232b3a] text-white" }),
                React.createElement("button", { className: "px-6 py-2 bg-cyan-600 hover:bg-cyan-700 text-white rounded shadow", onClick: startSession }, "Start Session")),
            ")}")) : ,
        "; }"));
}
exports["default"] = Home;
