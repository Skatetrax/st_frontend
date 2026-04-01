import React, { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { useParams } from "react-router-dom";
import useMusicCache from "../hooks/useMusicCache";
import { getSharedPlaylist } from "../api/api";

function fmt(s) {
  if (!s || isNaN(s)) return "0:00";
  return `${Math.floor(s / 60)}:${Math.floor(s % 60).toString().padStart(2, "0")}`;
}

export default function SharedPlaylistPage() {
  const { shareToken } = useParams();
  const [playlist, setPlaylist] = useState(null);
  const [tracks, setTracks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    getSharedPlaylist(shareToken)
      .then((data) => {
        setPlaylist(data);
        setTracks(data.tracks || []);
      })
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  }, [shareToken]);

  const trackUrls = useMemo(() => tracks.map(t => t.src).filter(Boolean), [tracks]);
  const { cacheTrack, uncacheTrack, cacheAll, isCached, isLoading } = useMusicCache(trackUrls);

  const audioRef = useRef(null);
  const [currentIndex, setCurrentIndex] = useState(null);
  const [playing, setPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  const track = currentIndex != null ? tracks[currentIndex] : null;

  const play = useCallback(() => { audioRef.current?.play().catch(() => {}); setPlaying(true); }, []);
  const pause = useCallback(() => { audioRef.current?.pause(); setPlaying(false); }, []);

  const goTo = useCallback((idx) => {
    setCurrentIndex(Math.max(0, Math.min(idx, tracks.length - 1)));
    setCurrentTime(0);
  }, [tracks.length]);

  const next = useCallback(() => {
    if (tracks.length === 0) return;
    goTo(((currentIndex ?? -1) + 1) % tracks.length);
  }, [tracks.length, currentIndex, goTo]);

  const prev = useCallback(() => {
    if (tracks.length === 0) return;
    if (audioRef.current && audioRef.current.currentTime > 3) {
      audioRef.current.currentTime = 0;
    } else {
      goTo(((currentIndex ?? 0) - 1 + tracks.length) % tracks.length);
    }
  }, [tracks.length, currentIndex, goTo]);

  const selectTrack = (idx) => {
    if (currentIndex === idx) {
      playing ? pause() : play();
    } else {
      goTo(idx);
    }
  };

  // Load + autoplay on track change
  useEffect(() => {
    if (track && audioRef.current) {
      audioRef.current.load();
      audioRef.current.play().then(() => setPlaying(true)).catch(() => {});
    }
  }, [currentIndex, track?.src]);

  // Media Session API
  useEffect(() => {
    if (!("mediaSession" in navigator) || !track) return;
    navigator.mediaSession.metadata = new MediaMetadata({
      title: track.title, artist: track.artist, album: playlist?.name || "Skatetrax",
    });
    navigator.mediaSession.setActionHandler("play", play);
    navigator.mediaSession.setActionHandler("pause", pause);
    navigator.mediaSession.setActionHandler("previoustrack", prev);
    navigator.mediaSession.setActionHandler("nexttrack", next);
    return () => {
      ["play", "pause", "previoustrack", "nexttrack"].forEach(a =>
        navigator.mediaSession.setActionHandler(a, null));
    };
  }, [track, play, pause, prev, next, playlist?.name]);

  const handleSeek = (e) => {
    if (!audioRef.current || !duration) return;
    const rect = e.currentTarget.getBoundingClientRect();
    audioRef.current.currentTime = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width)) * duration;
  };

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  if (loading) {
    return (
      <div style={styles.page}>
        <div style={{ textAlign: "center", padding: "4rem 1rem", color: "#a1a1aa" }}>Loading...</div>
      </div>
    );
  }

  if (notFound || !playlist) {
    return (
      <div style={styles.page}>
        <div style={{ textAlign: "center", padding: "4rem 1rem" }}>
          <h2 style={{ color: "#fff", marginBottom: 8 }}>Playlist Not Found</h2>
          <p style={{ color: "#a1a1aa" }}>This link may have expired or been unshared.</p>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.page}>
      <audio
        ref={audioRef}
        onTimeUpdate={() => audioRef.current && setCurrentTime(audioRef.current.currentTime)}
        onLoadedMetadata={() => audioRef.current && setDuration(audioRef.current.duration)}
        onEnded={next}
      >
        {track && <source src={track.src} />}
      </audio>

      {/* Header */}
      <div style={styles.header}>
        <div style={{ fontSize: "0.75rem", color: "#a78bfa", fontWeight: 600, letterSpacing: 1, textTransform: "uppercase" }}>
          Skatetrax
        </div>
        <h1 style={styles.title}>{playlist.name}</h1>
        {playlist.description && (
          <p style={styles.subtitle}>{playlist.description}</p>
        )}
        <div style={{ color: "#6b7280", fontSize: "0.85rem", marginBottom: 10 }}>
          {playlist.owner ? `Shared by ${playlist.owner}` : "Shared playlist"} &middot; {tracks.length} tracks &middot; {fmt(tracks.reduce((s, t) => s + (t.duration_seconds || 0), 0))}
        </div>
        <button
          onClick={() => cacheAll(trackUrls)}
          style={{
            background: "rgba(167, 139, 250, 0.15)",
            border: "1px solid #a78bfa",
            color: "#c4b5fd",
            borderRadius: 6,
            padding: "6px 14px",
            fontSize: "0.82rem",
            cursor: "pointer",
          }}
        >
          &#8615; Save All for Offline
        </button>
      </div>

      {/* Track list */}
      <div style={styles.trackList}>
        {tracks.map((t, idx) => {
          const isActive = currentIndex === idx;
          return (
            <div
              key={t.id}
              onClick={() => selectTrack(idx)}
              style={{
                ...styles.trackRow,
                background: isActive ? "rgba(167, 139, 250, 0.12)" : "transparent",
              }}
            >
              <div style={styles.trackNumber}>
                {isActive && playing ? (
                  <span style={{ color: "#a78bfa", fontSize: "0.9rem" }}>&#9646;&#9646;</span>
                ) : isActive ? (
                  <span style={{ color: "#a78bfa" }}>&#9654;</span>
                ) : (
                  <span style={{ color: "#6b7280" }}>{idx + 1}</span>
                )}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{
                  fontWeight: isActive ? 600 : 400,
                  color: isActive ? "#a78bfa" : "#f3f4f6",
                  whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
                }}>
                  {t.title}
                </div>
                <div style={{
                  fontSize: "0.8rem",
                  color: isActive ? "#c4b5fd" : "#6b7280",
                  whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
                }}>
                  {t.artist}
                </div>
              </div>
              <div style={{ color: "#6b7280", fontSize: "0.8rem", flexShrink: 0, marginLeft: 12 }}>
                {fmt(t.duration_seconds)}
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  isCached(t.src) ? uncacheTrack(t.src) : cacheTrack(t.src);
                }}
                style={{
                  background: "none", border: "none", cursor: "pointer",
                  padding: "0 0 0 10px", fontSize: "0.85rem", flexShrink: 0, lineHeight: 1,
                  color: isLoading(t.src) ? "#eab308" : isCached(t.src) ? "#22c55e" : "#4b5563",
                }}
                title={isLoading(t.src) ? "Saving..." : isCached(t.src) ? "Saved offline (tap to remove)" : "Save for offline"}
              >
                {isLoading(t.src) ? "⏳" : isCached(t.src) ? "✓" : "↓"}
              </button>
            </div>
          );
        })}
      </div>

      {/* Spacer so track list isn't hidden behind sticky player */}
      <div style={{ height: 100 }} />

      {/* Sticky bottom player */}
      {track && (
        <div style={styles.stickyPlayer}>
          {/* Progress bar */}
          <div onClick={handleSeek} style={styles.progressBar}>
            <div style={{ ...styles.progressFill, width: `${progress}%` }} />
          </div>

          <div style={styles.playerInner}>
            {/* Track info */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={styles.playerTitle}>{track.title}</div>
              <div style={styles.playerArtist}>{track.artist}</div>
            </div>

            {/* Controls */}
            <div style={styles.controls}>
              <button onClick={prev} style={styles.controlBtn} aria-label="Previous">&#9198;</button>
              <button onClick={playing ? pause : play} style={styles.playBtn} aria-label={playing ? "Pause" : "Play"}>
                {playing ? "\u23F8" : "\u25B6"}
              </button>
              <button onClick={next} style={styles.controlBtn} aria-label="Next">&#9197;</button>
            </div>

            {/* Time */}
            <div style={{ color: "#6b7280", fontSize: "0.72rem", flexShrink: 0, textAlign: "right", minWidth: 70 }}>
              {fmt(currentTime)} / {fmt(duration)}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Styles ──

const styles = {
  page: {
    minHeight: "100vh",
    background: "#18181b",
    color: "#f3f4f6",
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
    paddingBottom: 0,
  },
  header: {
    padding: "2rem 1.25rem 1rem",
    borderBottom: "1px solid #27272a",
  },
  title: {
    fontSize: "1.5rem",
    fontWeight: 700,
    margin: "4px 0",
    color: "#fff",
  },
  subtitle: {
    color: "#a1a1aa",
    fontSize: "0.9rem",
    margin: "4px 0 8px",
  },
  trackList: {
    padding: "0.5rem 0",
  },
  trackRow: {
    display: "flex",
    alignItems: "center",
    padding: "10px 1.25rem",
    cursor: "pointer",
    transition: "background 0.15s",
    borderBottom: "1px solid #27272a",
  },
  trackNumber: {
    width: 28,
    textAlign: "center",
    fontSize: "0.85rem",
    flexShrink: 0,
    marginRight: 12,
  },
  stickyPlayer: {
    position: "fixed",
    bottom: 0,
    left: 0,
    right: 0,
    background: "#27272a",
    borderTop: "1px solid #3f3f46",
    zIndex: 1000,
  },
  progressBar: {
    height: 3,
    background: "#3f3f46",
    cursor: "pointer",
    position: "relative",
  },
  progressFill: {
    height: "100%",
    background: "#a78bfa",
    transition: "width 0.15s linear",
  },
  playerInner: {
    display: "flex",
    alignItems: "center",
    padding: "8px 1rem",
    gap: 12,
  },
  playerTitle: {
    fontWeight: 600,
    fontSize: "0.9rem",
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
  },
  playerArtist: {
    fontSize: "0.75rem",
    color: "#a1a1aa",
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
  },
  controls: {
    display: "flex",
    alignItems: "center",
    gap: 16,
    flexShrink: 0,
  },
  controlBtn: {
    background: "none",
    border: "none",
    color: "#d4d4d8",
    fontSize: "1.1rem",
    cursor: "pointer",
    padding: 0,
    lineHeight: 1,
  },
  playBtn: {
    background: "none",
    border: "none",
    color: "#fff",
    fontSize: "1.5rem",
    cursor: "pointer",
    padding: 0,
    lineHeight: 1,
  },
};
