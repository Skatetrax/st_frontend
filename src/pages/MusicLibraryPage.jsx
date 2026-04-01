import React, { useState, useCallback, useMemo, useEffect } from "react";
import {
  Container, Row, Col, Card, Table, Button, Badge,
  Tabs, Tab, Modal, Form, OverlayTrigger, Tooltip,
} from "react-bootstrap";
import "../Dashboard.css";
import Navbar from "../components/Navbar";
import AudioPlayer from "../components/AudioPlayer";
import useMusicCache from "../hooks/useMusicCache";
import {
  getTracks, uploadTrack, deleteTrack as apiDeleteTrack,
  getPlaylists, createPlaylist as apiCreatePlaylist,
  updatePlaylistTracks, deletePlaylist as apiDeletePlaylist,
  sharePlaylist as apiSharePlaylist, unsharePlaylist as apiUnsharePlaylist,
} from "../api/api";

const CLEARANCE_BADGE = {
  not_required: { bg: "secondary", label: "N/A" },
  pending:      { bg: "warning",   label: "Pending" },
  cleared:      { bg: "success",   label: "Cleared" },
  denied:       { bg: "danger",    label: "Denied" },
};

function ClearanceBadge({ status }) {
  const cfg = CLEARANCE_BADGE[status] || CLEARANCE_BADGE.not_required;
  return <Badge bg={cfg.bg} style={{ fontSize: "0.72rem" }}>{cfg.label}</Badge>;
}

function formatDuration(seconds) {
  if (!seconds) return "—";
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export default function MusicLibraryPage() {
  const [activeTab, setActiveTab] = useState("library");
  const [tracks, setTracks] = useState([]);
  const [playlists, setPlaylists] = useState([]);
  const [loading, setLoading] = useState(true);
  const [playerTrackIndex, setPlayerTrackIndex] = useState(null);
  const [playerSource, setPlayerSource] = useState("library");
  const [showUpload, setShowUpload] = useState(false);
  const [showNewPlaylist, setShowNewPlaylist] = useState(false);
  const [newPlaylistName, setNewPlaylistName] = useState("");
  const [newPlaylistType, setNewPlaylistType] = useState("practice");
  const [newPlaylistDesc, setNewPlaylistDesc] = useState("");
  const [openPlaylistId, setOpenPlaylistId] = useState(null);
  const [showAddToPlaylist, setShowAddToPlaylist] = useState(false);
  const [shuffle, setShuffle] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [uploadFile, setUploadFile] = useState(null);
  const [uploadTitle, setUploadTitle] = useState("");
  const [uploadArtist, setUploadArtist] = useState("");
  const [uploadCut, setUploadCut] = useState(false);
  const [uploadClearance, setUploadClearance] = useState("not_required");
  const [uploadProvider, setUploadProvider] = useState("");
  const [uploadRef, setUploadRef] = useState("");
  const [uploadApple, setUploadApple] = useState("");
  const [uploadSpotify, setUploadSpotify] = useState("");
  const [uploadYoutube, setUploadYoutube] = useState("");
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const [loadError, setLoadError] = useState("");

  const resetUploadForm = () => {
    setUploadFile(null); setUploadTitle(""); setUploadArtist(""); setUploadCut(false);
    setUploadClearance("not_required"); setUploadProvider(""); setUploadRef("");
    setUploadApple(""); setUploadSpotify(""); setUploadYoutube(""); setUploadError("");
  };

  const handleUploadSubmit = async () => {
    if (!uploadFile || !uploadTitle.trim()) return;
    setUploading(true); setUploadError("");
    try {
      const fd = new FormData();
      fd.append("audio", uploadFile);
      fd.append("metadata", JSON.stringify({
        title: uploadTitle.trim(),
        artist: uploadArtist.trim() || null,
        is_performance_cut: uploadCut,
        clearance_status: uploadClearance,
        clearance_provider: uploadProvider || null,
        clearance_ref: uploadRef || null,
        apple_music_url: uploadApple || null,
        spotify_url: uploadSpotify || null,
        youtube_url: uploadYoutube || null,
      }));
      const track = await uploadTrack(fd);
      setTracks(prev => [track, ...prev]);
      resetUploadForm();
      setShowUpload(false);
    } catch (e) {
      setUploadError(e.message || "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  useEffect(() => {
    Promise.all([getTracks(), getPlaylists()])
      .then(([t, p]) => { setTracks(t); setPlaylists(p); })
      .catch((err) => { setLoadError(err.message || "Failed to load music library"); })
      .finally(() => setLoading(false));
  }, []);

  const allTrackUrls = useMemo(() => tracks.map(t => t.src).filter(Boolean), [tracks]);
  const { cacheTrack, uncacheTrack, cacheAll, isCached, isLoading } = useMusicCache(allTrackUrls);

  const toggleShare = async (playlistId) => {
    const pl = playlists.find(p => p.id === playlistId);
    if (!pl) return;
    try {
      if (pl.share_token) {
        await apiUnsharePlaylist(playlistId);
        setPlaylists(prev => prev.map(p => p.id === playlistId ? { ...p, share_token: null } : p));
      } else {
        const resp = await apiSharePlaylist(playlistId);
        setPlaylists(prev => prev.map(p => p.id === playlistId ? { ...p, share_token: resp.share_token } : p));
      }
    } catch { /* silent */ }
  };

  const copyShareLink = (token) => {
    const url = `${window.location.origin}/shared/playlist/${token}`;
    navigator.clipboard.writeText(url).then(() => {
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    }).catch(() => {});
  };

  const tracksById = Object.fromEntries(tracks.map(t => [t.id, t]));
  const openPlaylist = playlists.find(p => p.id === openPlaylistId) || null;

  const libraryPlayerTracks = tracks
    .filter(t => t.src)
    .map(t => ({ id: t.id, title: t.title, artist: t.artist, src: t.src }));

  const playlistPlayerTracks = openPlaylist
    ? openPlaylist.track_ids.map(id => tracksById[id]).filter(Boolean)
        .filter(t => t.src)
        .map(t => ({ id: t.id, title: t.title, artist: t.artist, src: t.src }))
    : [];

  const activePlayerTracks = playerSource === "playlist" ? playlistPlayerTracks : libraryPlayerTracks;

  const handleLibraryPlay = useCallback((trackId) => {
    const idx = libraryPlayerTracks.findIndex(t => t.id === trackId);
    if (idx >= 0) { setPlayerSource("library"); setPlayerTrackIndex(idx); }
  }, [libraryPlayerTracks]);

  const handlePlaylistPlay = useCallback((trackId) => {
    const idx = playlistPlayerTracks.findIndex(t => t.id === trackId);
    if (idx >= 0) { setPlayerSource("playlist"); setPlayerTrackIndex(idx); }
  }, [playlistPlayerTracks]);

  const handlePlayAll = useCallback(() => {
    if (playlistPlayerTracks.length > 0) {
      setPlayerSource("playlist");
      setPlayerTrackIndex(0);
    }
  }, [playlistPlayerTracks]);

  const moveTrack = async (playlistId, fromIdx, toIdx) => {
    const pl = playlists.find(p => p.id === playlistId);
    if (!pl) return;
    const ids = [...pl.track_ids];
    const [moved] = ids.splice(fromIdx, 1);
    ids.splice(toIdx, 0, moved);
    setPlaylists(prev => prev.map(p => p.id === playlistId ? { ...p, track_ids: ids } : p));
    try { await updatePlaylistTracks(playlistId, ids); } catch { /* silent */ }
  };

  const removeTrackFromPlaylist = async (playlistId, trackId) => {
    const pl = playlists.find(p => p.id === playlistId);
    if (!pl) return;
    const newIds = pl.track_ids.filter(id => id !== trackId);
    setPlaylists(prev => prev.map(p => p.id === playlistId ? { ...p, track_ids: newIds } : p));
    try { await updatePlaylistTracks(playlistId, newIds); } catch { /* silent */ }
  };

  const deletePlaylist = async (playlistId) => {
    try {
      await apiDeletePlaylist(playlistId);
      setPlaylists(prev => prev.filter(pl => pl.id !== playlistId));
      if (openPlaylistId === playlistId) {
        setOpenPlaylistId(null);
        setPlayerTrackIndex(null);
      }
    } catch { /* silent */ }
  };

  const addTrackToPlaylist = async (playlistId, trackId) => {
    const pl = playlists.find(p => p.id === playlistId);
    if (!pl || pl.track_ids.includes(trackId)) return;
    const newIds = [...pl.track_ids, trackId];
    try {
      await updatePlaylistTracks(playlistId, newIds);
      setPlaylists(prev => prev.map(p => p.id === playlistId ? { ...p, track_ids: newIds } : p));
    } catch { /* silent */ }
  };

  const handleDeleteTrack = async (trackId, title) => {
    if (!window.confirm(`Delete "${title}"? This will also remove it from all playlists.`)) return;
    try {
      await apiDeleteTrack(trackId);
      setTracks(prev => prev.filter(t => t.id !== trackId));
      setPlaylists(prev => prev.map(pl => ({
        ...pl,
        track_ids: pl.track_ids.filter(id => id !== trackId),
      })));
    } catch { /* silent */ }
  };

  const streamingIcon = (url, label) => {
    if (!url) return null;
    return (
      <OverlayTrigger overlay={<Tooltip>{label}</Tooltip>}>
        <a href={url} target="_blank" rel="noopener noreferrer"
          style={{ color: "#6b7280", fontSize: "0.8rem", marginRight: 6 }}>
          {label === "Apple Music" ? "🍎" : label === "Spotify" ? "🎵" : "▶"}
        </a>
      </OverlayTrigger>
    );
  };

  if (loading) {
    return (
      <div className="dashboard-bg">
        <Navbar />
        <Container fluid className="p-4">
          <div style={{ color: "#a1a1aa", textAlign: "center", paddingTop: 80 }}>Loading music library...</div>
        </Container>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="dashboard-bg">
        <Navbar />
        <Container fluid className="p-4">
          <div style={{ color: "#ef4444", textAlign: "center", paddingTop: 80 }}>
            Something went wrong loading your music library.
            <br />
            <span style={{ color: "#a1a1aa", fontSize: "0.85rem" }}>{loadError}</span>
          </div>
        </Container>
      </div>
    );
  }

  return (
    <div className="dashboard-bg">
      <Navbar />
      <Container fluid className="p-4">

        <Tabs activeKey={activeTab} onSelect={setActiveTab} className="mb-4"
          variant="pills" style={{ borderBottom: "none" }}>

          {/* ── Library Tab ── */}
          <Tab eventKey="library" title="Library">
            <Row className="mb-3">
              <Col>
                <div className="d-flex justify-content-between align-items-center">
                  <div>
                    <h5 style={{ margin: 0 }}>My Tracks</h5>
                    <span style={{ color: "#6b7280", fontSize: "0.85rem" }}>
                      {tracks.length} {tracks.length === 1 ? "track" : "tracks"} in your library
                    </span>
                  </div>
                  <Button variant="primary" size="sm" onClick={() => setShowUpload(true)}>
                    Upload Track
                  </Button>
                </div>
              </Col>
            </Row>

            <Row>
              <Col md={playerTrackIndex != null ? 8 : 12}>
                <Card className="dashboard-card" style={{ minHeight: "auto" }}>
                  <Card.Body style={{ padding: "0.5rem 0" }}>
                    {tracks.length === 0 ? (
                      <div style={{ color: "#a1a1aa", textAlign: "center", padding: "3rem 0" }}>
                        No tracks uploaded yet. Upload your first track to get started.
                      </div>
                    ) : (
                      <Table borderless hover variant="dark" responsive
                        className="dashboard-table align-middle mb-0">
                        <thead>
                          <tr>
                            <th style={{ width: 40 }}></th>
                            <th>Title</th>
                            <th>Artist</th>
                            <th style={{ width: "5rem" }}>Duration</th>
                            <th style={{ width: "5rem" }}>Type</th>
                            <th style={{ width: "5rem" }}>Clearance</th>
                            <th style={{ width: "5rem" }}>Links</th>
                            <th style={{ width: 50 }}>Offline</th>
                            <th style={{ width: 40 }}></th>
                          </tr>
                        </thead>
                        <tbody>
                          {tracks.map((t) => (
                            <tr key={t.id}>
                              <td>
                                <Button
                                  variant="link" size="sm"
                                  style={{ color: t.src ? "#a78bfa" : "#4b5563", padding: 0, fontSize: "1rem", textDecoration: "none" }}
                                  disabled={!t.src}
                                  onClick={() => handleLibraryPlay(t.id)}
                                  title={t.src ? "Play" : "No audio file"}
                                >
                                  ▶
                                </Button>
                              </td>
                              <td>
                                <div style={{ fontWeight: 500 }}>{t.title}</div>
                              </td>
                              <td style={{ color: "#a1a1aa" }}>{t.artist || "—"}</td>
                              <td style={{ color: "#a1a1aa", fontSize: "0.9rem" }}>
                                {formatDuration(t.is_performance_cut ? t.cut_duration_seconds : t.duration_seconds)}
                              </td>
                              <td>
                                {t.is_performance_cut ? (
                                  <Badge bg="info" style={{ fontSize: "0.72rem" }}>Cut</Badge>
                                ) : (
                                  <Badge bg="secondary" style={{ fontSize: "0.72rem" }}>Original</Badge>
                                )}
                              </td>
                              <td><ClearanceBadge status={t.clearance_status} /></td>
                              <td>
                                {streamingIcon(t.apple_music_url, "Apple Music")}
                                {streamingIcon(t.spotify_url, "Spotify")}
                                {streamingIcon(t.youtube_url, "YouTube")}
                                {!t.apple_music_url && !t.spotify_url && !t.youtube_url && (
                                  <span style={{ color: "#4b5563", fontSize: "0.8rem" }}>—</span>
                                )}
                              </td>
                              <td>
                                {t.src && (
                                  <Button
                                    variant="link" size="sm"
                                    style={{
                                      padding: 0, textDecoration: "none", fontSize: "0.9rem",
                                      color: isLoading(t.src) ? "#eab308" : isCached(t.src) ? "#22c55e" : "#6b7280",
                                    }}
                                    onClick={() => isCached(t.src) ? uncacheTrack(t.src) : cacheTrack(t.src)}
                                    title={isLoading(t.src) ? "Saving..." : isCached(t.src) ? "Saved offline (click to remove)" : "Save for offline"}
                                  >
                                    {isLoading(t.src) ? "⏳" : isCached(t.src) ? "✓" : "↓"}
                                  </Button>
                                )}
                              </td>
                              <td>
                                <Button
                                  variant="link" size="sm"
                                  style={{ color: "#6b7280", padding: 0, fontSize: "0.8rem", textDecoration: "none", lineHeight: 1 }}
                                  title="Delete track"
                                  onClick={() => handleDeleteTrack(t.id, t.title)}
                                >
                                  &#128465;
                                </Button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </Table>
                    )}
                  </Card.Body>
                </Card>
              </Col>

              {/* Side player */}
              {playerTrackIndex != null && (
                <Col md={4}>
                  <Card className="dashboard-card" style={{ minHeight: "auto" }}>
                    <Card.Body>
                      <div className="d-flex justify-content-between align-items-center mb-2">
                        <Card.Title style={{ fontSize: "0.95rem", margin: 0 }}>Now Playing</Card.Title>
                        <Button variant="link" size="sm"
                          style={{ color: "#6b7280", padding: 0, textDecoration: "none" }}
                          onClick={() => setPlayerTrackIndex(null)}
                        >
                          &times;
                        </Button>
                      </div>
                      <AudioPlayer
                        tracks={activePlayerTracks}
                        startIndex={playerTrackIndex}
                        shuffle={shuffle}
                        onTrackChange={setPlayerTrackIndex}
                      />
                    </Card.Body>
                  </Card>
                </Col>
              )}
            </Row>
          </Tab>

          {/* ── Playlists Tab ── */}
          <Tab eventKey="playlists" title="Playlists">
            {openPlaylist ? (
              /* ── Playlist Detail View ── */
              <>
                <div className="d-flex align-items-center mb-3" style={{ gap: 12 }}>
                  <Button variant="outline-secondary" size="sm"
                    onClick={() => { setOpenPlaylistId(null); setPlayerTrackIndex(null); }}>
                    &larr; All Playlists
                  </Button>
                  <h5 style={{ margin: 0 }}>{openPlaylist.name}</h5>
                  <Badge
                    bg={openPlaylist.playlist_type === "competition" ? "purple-badge" : "secondary"}
                    className={openPlaylist.playlist_type === "competition" ? "status-badge purple-badge" : ""}
                    style={{ fontSize: "0.72rem" }}
                  >
                    {openPlaylist.playlist_type === "competition" ? "Comp" : "Practice"}
                  </Badge>
                  {openPlaylist.share_token && (
                    <Badge bg="info" style={{ fontSize: "0.72rem" }}>Shared</Badge>
                  )}
                  <div style={{ marginLeft: "auto", display: "flex", gap: 8 }}>
                    {openPlaylist.share_token ? (
                      <>
                        <Button variant="outline-info" size="sm"
                          onClick={() => copyShareLink(openPlaylist.share_token)}>
                          {copiedLink ? "Copied!" : "Copy Link"}
                        </Button>
                        <Button variant="outline-secondary" size="sm"
                          onClick={() => toggleShare(openPlaylist.id)}>
                          Unshare
                        </Button>
                      </>
                    ) : (
                      <Button variant="outline-info" size="sm"
                        onClick={() => toggleShare(openPlaylist.id)}>
                        Share Playlist
                      </Button>
                    )}
                  </div>
                </div>
                {openPlaylist.description && (
                  <p style={{ color: "#a1a1aa", fontSize: "0.85rem", marginBottom: 16 }}>
                    {openPlaylist.description}
                  </p>
                )}

                <Row>
                  <Col md={playerTrackIndex != null && playerSource === "playlist" ? 8 : 12}>
                    {/* Playback controls bar */}
                    <div className="d-flex align-items-center mb-3" style={{ gap: 12 }}>
                      <Button variant="primary" size="sm"
                        disabled={playlistPlayerTracks.length === 0}
                        onClick={handlePlayAll}>
                        &#9654; Play All
                      </Button>
                      <Button
                        variant={shuffle ? "outline-warning" : "outline-secondary"} size="sm"
                        onClick={() => setShuffle(s => !s)}
                        title={shuffle ? "Shuffle On" : "Shuffle Off"}
                      >
                        &#128256; Shuffle {shuffle ? "On" : "Off"}
                      </Button>
                      <Button variant="outline-primary" size="sm"
                        onClick={() => setShowAddToPlaylist(true)}>
                        + Add Tracks
                      </Button>
                      <Button variant="outline-secondary" size="sm"
                        onClick={() => {
                          const urls = openPlaylist.track_ids
                            .map(id => tracksById[id]?.src).filter(Boolean);
                          cacheAll(urls);
                        }}
                        title="Download all tracks in this playlist for offline playback"
                      >
                        &#8615; Offline
                      </Button>
                      <span style={{ color: "#a1a1aa", fontSize: "0.85rem", marginLeft: "auto" }}>
                        {openPlaylist.track_ids.length} {openPlaylist.track_ids.length === 1 ? "track" : "tracks"}
                        {openPlaylist.track_ids.length > 0 && (
                          <> &middot; {formatDuration(
                            openPlaylist.track_ids.reduce((sum, id) => {
                              const t = tracksById[id];
                              return sum + (t ? (t.is_performance_cut ? (t.cut_duration_seconds || t.duration_seconds) : t.duration_seconds) : 0);
                            }, 0)
                          )} total</>
                        )}
                      </span>
                    </div>

                    <Card className="dashboard-card" style={{ minHeight: "auto" }}>
                      <Card.Body style={{ padding: "0.5rem 0" }}>
                        {openPlaylist.track_ids.length === 0 ? (
                          <div style={{ color: "#a1a1aa", textAlign: "center", padding: "3rem 0" }}>
                            This playlist is empty. Add tracks from your library.
                          </div>
                        ) : (
                          <Table borderless hover variant="dark" responsive
                            className="dashboard-table align-middle mb-0">
                            <thead>
                              <tr>
                                <th style={{ width: 30 }}>#</th>
                                <th style={{ width: 40 }}></th>
                                <th>Title</th>
                                <th>Artist</th>
                                <th style={{ width: "5rem" }}>Duration</th>
                                <th style={{ width: "5rem" }}>Type</th>
                                {openPlaylist.playlist_type === "competition" && (
                                  <th style={{ width: "5rem" }}>Clearance</th>
                                )}
                                <th style={{ width: "5rem" }}>Order</th>
                                <th style={{ width: 40 }}></th>
                              </tr>
                            </thead>
                            <tbody>
                              {openPlaylist.track_ids.map((tid, idx) => {
                                const t = tracksById[tid];
                                if (!t) return null;
                                return (
                                  <tr key={`${tid}-${idx}`}>
                                    <td style={{ color: "#6b7280", fontSize: "0.85rem" }}>{idx + 1}</td>
                                    <td>
                                      <Button
                                        variant="link" size="sm"
                                        style={{ color: t.src ? "#a78bfa" : "#4b5563", padding: 0, fontSize: "1rem", textDecoration: "none" }}
                                        disabled={!t.src}
                                        onClick={() => handlePlaylistPlay(t.id)}
                                        title={t.src ? "Play" : "No audio file"}
                                      >
                                        &#9654;
                                      </Button>
                                    </td>
                                    <td style={{ fontWeight: 500 }}>
                                      {t.title}
                                      {openPlaylist.playlist_type === "competition" && t.clearance_status === "denied" && (
                                        <span style={{ color: "#ef4444", fontSize: "0.75rem", marginLeft: 6 }}>
                                          &#9888; Denied
                                        </span>
                                      )}
                                      {openPlaylist.playlist_type === "competition" && t.clearance_status === "pending" && (
                                        <span style={{ color: "#eab308", fontSize: "0.75rem", marginLeft: 6 }}>
                                          &#9679; Pending
                                        </span>
                                      )}
                                    </td>
                                    <td style={{ color: "#a1a1aa" }}>{t.artist || "—"}</td>
                                    <td style={{ color: "#a1a1aa", fontSize: "0.9rem" }}>
                                      {formatDuration(t.is_performance_cut ? t.cut_duration_seconds : t.duration_seconds)}
                                    </td>
                                    <td>
                                      {t.is_performance_cut ? (
                                        <Badge bg="info" style={{ fontSize: "0.72rem" }}>Cut</Badge>
                                      ) : (
                                        <Badge bg="secondary" style={{ fontSize: "0.72rem" }}>Original</Badge>
                                      )}
                                    </td>
                                    {openPlaylist.playlist_type === "competition" && (
                                      <td><ClearanceBadge status={t.clearance_status} /></td>
                                    )}
                                    <td>
                                      <div style={{ display: "flex", gap: 4 }}>
                                        <Button variant="link" size="sm"
                                          style={{ color: "#6b7280", padding: 0, fontSize: "0.8rem", textDecoration: "none" }}
                                          disabled={idx === 0}
                                          onClick={() => moveTrack(openPlaylist.id, idx, idx - 1)}
                                          title="Move up"
                                        >&#9650;</Button>
                                        <Button variant="link" size="sm"
                                          style={{ color: "#6b7280", padding: 0, fontSize: "0.8rem", textDecoration: "none" }}
                                          disabled={idx === openPlaylist.track_ids.length - 1}
                                          onClick={() => moveTrack(openPlaylist.id, idx, idx + 1)}
                                          title="Move down"
                                        >&#9660;</Button>
                                      </div>
                                    </td>
                                    <td>
                                      <Button variant="link" size="sm"
                                        style={{ color: "#ef4444", padding: 0, fontSize: "0.85rem", textDecoration: "none" }}
                                        onClick={() => removeTrackFromPlaylist(openPlaylist.id, tid)}
                                        title="Remove from playlist"
                                      >&times;</Button>
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </Table>
                        )}
                      </Card.Body>
                    </Card>
                  </Col>

                  {/* Side player for playlist */}
                  {playerTrackIndex != null && playerSource === "playlist" && (
                    <Col md={4}>
                      <Card className="dashboard-card" style={{ minHeight: "auto" }}>
                        <Card.Body>
                          <div className="d-flex justify-content-between align-items-center mb-2">
                            <Card.Title style={{ fontSize: "0.95rem", margin: 0 }}>Now Playing</Card.Title>
                            <Button variant="link" size="sm"
                              style={{ color: "#6b7280", padding: 0, textDecoration: "none" }}
                              onClick={() => setPlayerTrackIndex(null)}
                            >&times;</Button>
                          </div>
                          <AudioPlayer
                            tracks={activePlayerTracks}
                            startIndex={playerTrackIndex}
                            shuffle={shuffle}
                            onTrackChange={setPlayerTrackIndex}
                          />
                        </Card.Body>
                      </Card>
                    </Col>
                  )}
                </Row>
              </>
            ) : (
              /* ── Playlist Grid ── */
              <>
                <Row className="mb-3">
                  <Col>
                    <div className="d-flex justify-content-between align-items-center">
                      <div>
                        <h5 style={{ margin: 0 }}>My Playlists</h5>
                        <span style={{ color: "#6b7280", fontSize: "0.85rem" }}>
                          {playlists.length} {playlists.length === 1 ? "playlist" : "playlists"}
                        </span>
                      </div>
                      <Button variant="primary" size="sm" onClick={() => setShowNewPlaylist(true)}>
                        New Playlist
                      </Button>
                    </div>
                  </Col>
                </Row>

                {playlists.length === 0 ? (
                  <Card className="dashboard-card" style={{ minHeight: "auto" }}>
                    <Card.Body>
                      <div style={{ color: "#a1a1aa", textAlign: "center", padding: "3rem 0" }}>
                        No playlists yet. Create one to start organizing your tracks.
                      </div>
                    </Card.Body>
                  </Card>
                ) : (
                  <Row>
                    {playlists.map(pl => (
                      <Col md={6} lg={4} key={pl.id} className="mb-3">
                        <Card className="dashboard-card"
                          style={{ minHeight: "auto", cursor: "pointer" }}
                          onClick={() => setOpenPlaylistId(pl.id)}
                        >
                          <Card.Header className="d-flex justify-content-between align-items-center"
                            style={{ padding: "0.5rem 0.75rem", background: "transparent", borderBottom: "1px solid #333" }}
                          >
                            <span style={{ fontWeight: 600, fontSize: "1rem", color: "#f3f4f6" }}>{pl.name}</span>
                            <Button
                              variant="link" size="sm"
                              style={{ color: "#6b7280", padding: 0, fontSize: "0.8rem", textDecoration: "none", lineHeight: 1 }}
                              title="Delete playlist"
                              onClick={(e) => {
                                e.stopPropagation();
                                if (window.confirm(`Delete "${pl.name}"?`)) deletePlaylist(pl.id);
                              }}
                            >
                              &#128465;
                            </Button>
                          </Card.Header>
                          <Card.Body style={{ padding: "0.6rem 0.75rem" }}>
                            {pl.description && (
                              <div style={{ color: "#a1a1aa", fontSize: "0.85rem", marginBottom: 8 }}>
                                {pl.description}
                              </div>
                            )}
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                              <span style={{ color: "#a1a1aa", fontSize: "0.85rem" }}>
                                {pl.track_ids.length} {pl.track_ids.length === 1 ? "track" : "tracks"}
                              </span>
                              <div style={{ display: "flex", gap: 8 }}>
                                <Badge
                                  bg={pl.playlist_type === "competition" ? "purple-badge" : "secondary"}
                                  className={pl.playlist_type === "competition" ? "status-badge purple-badge" : ""}
                                  style={{ fontSize: "0.72rem" }}
                                >
                                  {pl.playlist_type === "competition" ? "Comp" : "Practice"}
                                </Badge>
                                {pl.share_token && (
                                  <Badge bg="info" style={{ fontSize: "0.72rem" }}>Shared</Badge>
                                )}
                              </div>
                            </div>
                          </Card.Body>
                        </Card>
                      </Col>
                    ))}
                  </Row>
                )}
              </>
            )}
          </Tab>
        </Tabs>

      </Container>

      {/* Upload Track Modal */}
      <Modal show={showUpload} onHide={() => { setShowUpload(false); resetUploadForm(); }} centered>
        <Modal.Header closeButton
          style={{ background: '#a78bfa', borderTopLeftRadius: '0.3rem', borderTopRightRadius: '0.3rem' }}>
          <Modal.Title style={{ color: '#fff', fontWeight: 700 }}>Upload Track</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group className="mb-3">
              <Form.Label>Audio File</Form.Label>
              <Form.Control type="file" accept="audio/*"
                onChange={e => setUploadFile(e.target.files?.[0] || null)} />
              <Form.Text className="text-muted">MP3, AAC, WAV -- max 5 minutes</Form.Text>
            </Form.Group>
            <Row>
              <Col sm={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Title</Form.Label>
                  <Form.Control type="text" placeholder="Track title"
                    value={uploadTitle} onChange={e => setUploadTitle(e.target.value)} />
                </Form.Group>
              </Col>
              <Col sm={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Artist</Form.Label>
                  <Form.Control type="text" placeholder="Artist name"
                    value={uploadArtist} onChange={e => setUploadArtist(e.target.value)} />
                </Form.Group>
              </Col>
            </Row>
            <Form.Group className="mb-3">
              <Form.Check type="checkbox" label="This is a performance cut (edited for competition length)"
                checked={uploadCut} onChange={e => setUploadCut(e.target.checked)} />
            </Form.Group>

            <hr />
            <div style={{ color: "#6b7280", fontSize: "0.85rem", fontWeight: 600, marginBottom: 8 }}>
              Streaming References (optional)
            </div>
            <Form.Group className="mb-2">
              <Form.Control size="sm" type="url" placeholder="Apple Music URL"
                value={uploadApple} onChange={e => setUploadApple(e.target.value)} />
            </Form.Group>
            <Form.Group className="mb-2">
              <Form.Control size="sm" type="url" placeholder="Spotify URL"
                value={uploadSpotify} onChange={e => setUploadSpotify(e.target.value)} />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Control size="sm" type="url" placeholder="YouTube URL"
                value={uploadYoutube} onChange={e => setUploadYoutube(e.target.value)} />
            </Form.Group>

            <hr />
            <div style={{ color: "#6b7280", fontSize: "0.85rem", fontWeight: 600, marginBottom: 8 }}>
              Licensing & Clearance
            </div>
            <Row>
              <Col sm={4}>
                <Form.Group className="mb-3">
                  <Form.Label style={{ fontSize: "0.85rem" }}>Status</Form.Label>
                  <Form.Select size="sm" value={uploadClearance} onChange={e => setUploadClearance(e.target.value)}>
                    <option value="not_required">Not Required</option>
                    <option value="pending">Pending</option>
                    <option value="cleared">Cleared</option>
                    <option value="denied">Denied</option>
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col sm={4}>
                <Form.Group className="mb-3">
                  <Form.Label style={{ fontSize: "0.85rem" }}>Provider</Form.Label>
                  <Form.Select size="sm" value={uploadProvider} onChange={e => setUploadProvider(e.target.value)}>
                    <option value="">None</option>
                    <option value="ClicknClear">ClicknClear</option>
                    <option value="ASCAP">ASCAP</option>
                    <option value="BMI">BMI</option>
                    <option value="Other">Other</option>
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col sm={4}>
                <Form.Group className="mb-3">
                  <Form.Label style={{ fontSize: "0.85rem" }}>Reference #</Form.Label>
                  <Form.Control size="sm" type="text" placeholder="License ID"
                    value={uploadRef} onChange={e => setUploadRef(e.target.value)} />
                </Form.Group>
              </Col>
            </Row>

            {uploadError && (
              <div style={{ color: "red", fontSize: "0.85rem", marginBottom: 8 }}>{uploadError}</div>
            )}
            <div className="d-flex justify-content-end">
              <Button variant="primary" disabled={!uploadFile || !uploadTitle.trim() || uploading}
                onClick={handleUploadSubmit}>
                {uploading ? "Uploading..." : "Upload"}
              </Button>
            </div>
          </Form>
        </Modal.Body>
      </Modal>

      {/* Add Tracks to Playlist Modal */}
      <Modal show={showAddToPlaylist} onHide={() => setShowAddToPlaylist(false)} centered size="lg">
        <Modal.Header closeButton
          style={{ background: '#a78bfa', borderTopLeftRadius: '0.3rem', borderTopRightRadius: '0.3rem' }}>
          <Modal.Title style={{ color: '#fff', fontWeight: 700 }}>Add Tracks</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {openPlaylist && (
            <>
              <p style={{ color: '#6b7280', fontSize: '0.85rem', marginBottom: 12 }}>
                Select tracks to add to <strong>{openPlaylist.name}</strong>.
              </p>
              {tracks.length === 0 ? (
                <div style={{ color: "#a1a1aa", textAlign: "center", padding: "2rem 0" }}>
                  No tracks in your library. Upload some first.
                </div>
              ) : (
                <Table borderless hover size="sm" responsive className="align-middle mb-0">
                  <thead>
                    <tr>
                      <th>Title</th>
                      <th>Artist</th>
                      <th style={{ width: "5rem" }}>Duration</th>
                      <th style={{ width: 80 }}></th>
                    </tr>
                  </thead>
                  <tbody>
                    {tracks.map(t => {
                      const inPlaylist = openPlaylist.track_ids.includes(t.id);
                      return (
                        <tr key={t.id} style={{ opacity: inPlaylist ? 0.5 : 1 }}>
                          <td style={{ fontWeight: 500 }}>{t.title}</td>
                          <td style={{ color: "#6b7280" }}>{t.artist || "—"}</td>
                          <td style={{ color: "#6b7280", fontSize: "0.9rem" }}>
                            {formatDuration(t.duration_seconds)}
                          </td>
                          <td>
                            {inPlaylist ? (
                              <Badge bg="secondary" style={{ fontSize: "0.72rem" }}>Added</Badge>
                            ) : (
                              <Button size="sm" variant="outline-primary"
                                onClick={() => addTrackToPlaylist(openPlaylist.id, t.id)}>
                                + Add
                              </Button>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </Table>
              )}
            </>
          )}
        </Modal.Body>
      </Modal>

      {/* New Playlist Modal */}
      <Modal show={showNewPlaylist} onHide={() => setShowNewPlaylist(false)} centered>
        <Modal.Header closeButton
          style={{ background: '#a78bfa', borderTopLeftRadius: '0.3rem', borderTopRightRadius: '0.3rem' }}>
          <Modal.Title style={{ color: '#fff', fontWeight: 700 }}>New Playlist</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group className="mb-3">
              <Form.Label>Playlist Name</Form.Label>
              <Form.Control
                type="text"
                placeholder="e.g. Competition Picks 2026"
                value={newPlaylistName}
                onChange={e => setNewPlaylistName(e.target.value)}
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Type</Form.Label>
              <Form.Select value={newPlaylistType} onChange={e => setNewPlaylistType(e.target.value)}>
                <option value="practice">Practice</option>
                <option value="competition">Competition</option>
                <option value="general">General</option>
              </Form.Select>
              {newPlaylistType === "competition" && (
                <Form.Text className="text-muted">
                  Tracks in competition playlists will show clearance status warnings.
                </Form.Text>
              )}
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Description (optional)</Form.Label>
              <Form.Control as="textarea" rows={2} placeholder="What's this playlist for?"
                value={newPlaylistDesc} onChange={e => setNewPlaylistDesc(e.target.value)} />
            </Form.Group>
            <div className="d-flex justify-content-end">
              <Button variant="primary" disabled={!newPlaylistName.trim()}
                onClick={async () => {
                  try {
                    const pl = await apiCreatePlaylist({
                      name: newPlaylistName.trim(),
                      playlist_type: newPlaylistType,
                      description: newPlaylistDesc.trim() || null,
                    });
                    setPlaylists(prev => [pl, ...prev]);
                    setNewPlaylistName(""); setNewPlaylistType("practice"); setNewPlaylistDesc("");
                    setShowNewPlaylist(false);
                  } catch { /* silent */ }
                }}>
                Create Playlist
              </Button>
            </div>
          </Form>
        </Modal.Body>
      </Modal>
    </div>
  );
}
