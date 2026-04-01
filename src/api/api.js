const BASE_URL = import.meta.env.VITE_API_BASE_URL || `http://${window.location.hostname}:5000/api/v4`;

async function handleResponse(resp) {
  if (!resp.ok) {
    const text = await resp.text();
    throw new Error(`${resp.status} ${resp.statusText}: ${text.slice(0, 200)}`);
  }
  return resp.json();
}

export async function login(aLogin, aPasswordHash) {
  const resp = await fetch(`${BASE_URL}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ aLogin, aPasswordHash }),
    credentials: "include"
  });
  return resp.json();
}

export async function checkSession() {
  const resp = await fetch(`${BASE_URL}/auth/session`, {
    credentials: "include"
  });
  return resp.json();
}

export async function logout() {
  const resp = await fetch(`${BASE_URL}/auth/logout`, {
    method: "POST",
    credentials: "include"
  });
  return resp.json();
}

export async function getDashboard() {
  const resp = await fetch(`${BASE_URL}/members/dashboard`, {
    credentials: "include"
  });
  return resp.json();
}

export async function getSkaterOverview() {
  const resp = await fetch(`${BASE_URL}/members/skater_overview`, { credentials: "include" });
  return resp.json();
}

export async function getEquipment() {
  const resp = await fetch(`${BASE_URL}/members/equipment`, { credentials: "include" });
  return resp.json();
}

export async function getMaintenance() {
  const resp = await fetch(`${BASE_URL}/members/maintenance`, { credentials: "include" });
  return resp.json();
}

export async function addMaintenance(payload) {
  const resp = await fetch(`${BASE_URL}/members/maintenance`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(payload),
  });
  return handleResponse(resp);
}

export async function getIceTime({ monthsBack = 0, window = 12 } = {}) {
  const params = new URLSearchParams();
  if (monthsBack) params.set("months_back", monthsBack);
  if (window !== 12) params.set("window", window);
  const qs = params.toString();
  const resp = await fetch(`${BASE_URL}/members/ice_time${qs ? `?${qs}` : ""}`, { credentials: "include" });
  return resp.json();
}

export async function submitIceTime(data) {
  const resp = await fetch(`${BASE_URL}/submit/add_icetime`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(data),
  });
  return handleResponse(resp);
}

export async function getRinks() {
  const resp = await fetch(`${BASE_URL}/public/rinks`, { credentials: "include" });
  return handleResponse(resp);
}

export async function getCoaches() {
  const resp = await fetch(`${BASE_URL}/lookup/coaches`, { credentials: "include" });
  return handleResponse(resp);
}

export async function getIceTypes() {
  const resp = await fetch(`${BASE_URL}/lookup/ice_types`, { credentials: "include" });
  return handleResponse(resp);
}

export async function getEvents(category) {
  const params = category ? `?category=${encodeURIComponent(category)}` : "";
  const resp = await fetch(`${BASE_URL}/events${params}`, { credentials: "include" });
  return handleResponse(resp);
}

export async function getEventDetail(eventId) {
  const resp = await fetch(`${BASE_URL}/events/${eventId}`, { credentials: "include" });
  return handleResponse(resp);
}

export async function createEvent(payload) {
  const resp = await fetch(`${BASE_URL}/events`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(payload),
  });
  return handleResponse(resp);
}

export async function addEventEntry(eventId, payload) {
  const resp = await fetch(`${BASE_URL}/events/${eventId}/entries`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(payload),
  });
  return handleResponse(resp);
}

// ── Music Library ──

export async function getTracks() {
  const resp = await fetch(`${BASE_URL}/music/tracks`, { credentials: "include" });
  return handleResponse(resp);
}

export async function uploadTrack(formData) {
  const resp = await fetch(`${BASE_URL}/music/tracks`, {
    method: "POST",
    credentials: "include",
    body: formData,
  });
  return handleResponse(resp);
}

export async function deleteTrack(trackId) {
  const resp = await fetch(`${BASE_URL}/music/tracks/${trackId}`, {
    method: "DELETE",
    credentials: "include",
  });
  return handleResponse(resp);
}

export async function getPlaylists() {
  const resp = await fetch(`${BASE_URL}/music/playlists`, { credentials: "include" });
  return handleResponse(resp);
}

export async function createPlaylist(payload) {
  const resp = await fetch(`${BASE_URL}/music/playlists`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(payload),
  });
  return handleResponse(resp);
}

export async function updatePlaylist(playlistId, payload) {
  const resp = await fetch(`${BASE_URL}/music/playlists/${playlistId}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(payload),
  });
  return handleResponse(resp);
}

export async function deletePlaylist(playlistId) {
  const resp = await fetch(`${BASE_URL}/music/playlists/${playlistId}`, {
    method: "DELETE",
    credentials: "include",
  });
  return handleResponse(resp);
}

export async function updatePlaylistTracks(playlistId, trackIds) {
  const resp = await fetch(`${BASE_URL}/music/playlists/${playlistId}/tracks`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ track_ids: trackIds }),
  });
  return handleResponse(resp);
}

export async function sharePlaylist(playlistId) {
  const resp = await fetch(`${BASE_URL}/music/playlists/${playlistId}/share`, {
    method: "POST",
    credentials: "include",
  });
  return handleResponse(resp);
}

export async function unsharePlaylist(playlistId) {
  const resp = await fetch(`${BASE_URL}/music/playlists/${playlistId}/share`, {
    method: "DELETE",
    credentials: "include",
  });
  return handleResponse(resp);
}

export async function getSharedPlaylist(shareToken) {
  const resp = await fetch(`${BASE_URL}/music/shared/${shareToken}`);
  return handleResponse(resp);
}

// ── Skater Card ──

export async function getSkaterCard() {
  const resp = await fetch(`${BASE_URL}/members/skater_card`, { credentials: "include" });
  return handleResponse(resp);
}

export async function shareSkaterCard() {
  const resp = await fetch(`${BASE_URL}/members/skater_card/share`, {
    method: "POST",
    credentials: "include",
  });
  return handleResponse(resp);
}

export async function unshareSkaterCard() {
  const resp = await fetch(`${BASE_URL}/members/skater_card/share`, {
    method: "DELETE",
    credentials: "include",
  });
  return handleResponse(resp);
}

export async function getSharedCard(shareToken) {
  const resp = await fetch(`${BASE_URL}/members/shared_card/${shareToken}`);
  return handleResponse(resp);
}

export async function updateContactPreference(pref) {
  const resp = await fetch(`${BASE_URL}/members/contact_preference`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ contact_preference: pref }),
  });
  return handleResponse(resp);
}