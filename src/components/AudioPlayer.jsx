import React, { useState, useRef, useEffect, useCallback } from "react";
import { Button } from "react-bootstrap";

function formatTime(seconds) {
  if (!seconds || isNaN(seconds)) return "0:00";
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

/**
 * Reusable audio player with Media Session API support for lock screen controls.
 *
 * Props:
 *   tracks     - array of { id, title, artist, src } where src is an audio URL
 *   startIndex - index to begin playback from (default 0)
 *   shuffle    - boolean, shuffle mode
 *   onTrackChange(index) - called when active track changes
 */
export default function AudioPlayer({ tracks = [], startIndex = 0, shuffle = false, onTrackChange }) {
  const audioRef = useRef(null);
  const [currentIndex, setCurrentIndex] = useState(startIndex);
  const [playing, setPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);

  const track = tracks[currentIndex] || null;

  const play = useCallback(() => {
    audioRef.current?.play().catch(() => {});
    setPlaying(true);
  }, []);

  const pause = useCallback(() => {
    audioRef.current?.pause();
    setPlaying(false);
  }, []);

  const goTo = useCallback((idx) => {
    const next = Math.max(0, Math.min(idx, tracks.length - 1));
    setCurrentIndex(next);
    setCurrentTime(0);
    onTrackChange?.(next);
  }, [tracks.length, onTrackChange]);

  const next = useCallback(() => {
    if (tracks.length === 0) return;
    if (shuffle) {
      let r;
      do { r = Math.floor(Math.random() * tracks.length); } while (r === currentIndex && tracks.length > 1);
      goTo(r);
    } else {
      goTo((currentIndex + 1) % tracks.length);
    }
  }, [tracks.length, currentIndex, shuffle, goTo]);

  const prev = useCallback(() => {
    if (tracks.length === 0) return;
    if (audioRef.current && audioRef.current.currentTime > 3) {
      audioRef.current.currentTime = 0;
    } else {
      goTo((currentIndex - 1 + tracks.length) % tracks.length);
    }
  }, [tracks.length, currentIndex, goTo]);

  useEffect(() => {
    setCurrentIndex(startIndex);
  }, [startIndex]);

  useEffect(() => {
    if (!track || !audioRef.current) return;
    audioRef.current.load();
    if (playing) play();
  }, [currentIndex, track?.src]);

  useEffect(() => {
    if (audioRef.current) audioRef.current.volume = volume;
  }, [volume]);

  // Media Session API for lock screen controls
  useEffect(() => {
    if (!("mediaSession" in navigator) || !track) return;

    navigator.mediaSession.metadata = new MediaMetadata({
      title: track.title || "Unknown Track",
      artist: track.artist || "",
      album: "Skatetrax",
    });

    navigator.mediaSession.setActionHandler("play", play);
    navigator.mediaSession.setActionHandler("pause", pause);
    navigator.mediaSession.setActionHandler("previoustrack", prev);
    navigator.mediaSession.setActionHandler("nexttrack", next);

    return () => {
      ["play", "pause", "previoustrack", "nexttrack"].forEach(a =>
        navigator.mediaSession.setActionHandler(a, null)
      );
    };
  }, [track, play, pause, prev, next]);

  const handleTimeUpdate = () => {
    if (audioRef.current) setCurrentTime(audioRef.current.currentTime);
  };

  const handleLoadedMetadata = () => {
    if (audioRef.current) setDuration(audioRef.current.duration);
  };

  const handleSeek = (e) => {
    if (!audioRef.current || !duration) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const pct = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    audioRef.current.currentTime = pct * duration;
  };

  if (!track) {
    return (
      <div style={{ color: "#a1a1aa", textAlign: "center", padding: "1rem" }}>
        No tracks to play.
      </div>
    );
  }

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div style={{
      background: "#f8f9fa",
      borderRadius: "0.5rem",
      padding: "0.75rem 1rem",
      border: "1px solid #dee2e6",
    }}>
      <audio
        ref={audioRef}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onEnded={next}
      >
        <source src={track.src} />
      </audio>

      {/* Track info */}
      <div style={{ marginBottom: 8 }}>
        <div style={{ fontWeight: 600, fontSize: "0.95rem" }}>{track.title}</div>
        {track.artist && <div style={{ color: "#6b7280", fontSize: "0.85rem" }}>{track.artist}</div>}
      </div>

      {/* Progress bar */}
      <div
        onClick={handleSeek}
        style={{
          height: 6,
          background: "#dee2e6",
          borderRadius: 3,
          cursor: "pointer",
          marginBottom: 6,
          position: "relative",
        }}
      >
        <div style={{
          height: "100%",
          width: `${progress}%`,
          background: "#a78bfa",
          borderRadius: 3,
          transition: "width 0.1s linear",
        }} />
      </div>

      {/* Time + controls */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <span style={{ fontSize: "0.75rem", color: "#6b7280", minWidth: 80 }}>
          {formatTime(currentTime)} / {formatTime(duration)}
        </span>

        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <Button
            variant="link"
            size="sm"
            style={{ color: "#374151", padding: 0, fontSize: "1.1rem", textDecoration: "none" }}
            onClick={prev}
            title="Previous"
          >
            &#9198;
          </Button>
          <Button
            variant="link"
            size="sm"
            style={{ color: "#374151", padding: 0, fontSize: "1.4rem", textDecoration: "none" }}
            onClick={playing ? pause : play}
            title={playing ? "Pause" : "Play"}
          >
            {playing ? "\u23F8" : "\u25B6"}
          </Button>
          <Button
            variant="link"
            size="sm"
            style={{ color: "#374151", padding: 0, fontSize: "1.1rem", textDecoration: "none" }}
            onClick={next}
            title="Next"
          >
            &#9197;
          </Button>
        </div>

        {/* Volume */}
        <input
          type="range"
          min="0"
          max="1"
          step="0.05"
          value={volume}
          onChange={e => setVolume(parseFloat(e.target.value))}
          style={{ width: 70, accentColor: "#a78bfa" }}
          title="Volume"
        />
      </div>
    </div>
  );
}
