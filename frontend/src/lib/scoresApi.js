const BASE = '/api/scores';

async function post(path, body) {
  const res = await fetch(`${BASE}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error ?? `Request failed: ${res.status}`);
  return data;
}

async function get(path) {
  const res = await fetch(`${BASE}${path}`);
  const data = await res.json();
  if (!res.ok) throw new Error(data.error ?? `Request failed: ${res.status}`);
  return data;
}

export async function fetchScores(userEmail, gameMode = null) {
  const params = new URLSearchParams();
  if (userEmail) params.set('userEmail', userEmail);
  if (gameMode) params.set('gameMode', gameMode);
  return get(`?${params.toString()}`);
}

export async function upsertScore(payload) {
  return post('/upsert', payload);
}
