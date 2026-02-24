const BASE_URL = process.env.REACT_APP_API_BASE_URL || `http://${window.location.hostname}:5000/api/v4`;

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

export async function getIceTime() {
  const resp = await fetch(`${BASE_URL}/members/ice_time`, { credentials: "include" });
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