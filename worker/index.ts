// Berean guestbook server (Cloudflare Worker).
//
// Only runs for the paths listed in wrangler.jsonc > assets.run_worker_first:
//   POST /api/guestbook   – a visitor signs the guestbook (saved as 'pending')
//   GET  /api/guestbook   – list approved entries (newest first)
//   GET  /admin           – review page (locked by Cloudflare Access)
//   POST /admin/approve   – approve an entry
//   POST /admin/delete    – delete an entry
// Everything else is handed back to the static site (env.ASSETS).
//
// Spam protection: Cloudflare Turnstile, a hidden honeypot field, a minimum fill time,
// length limits, no links, a daily limit per (hashed) IP, and nothing is public until approved.

// Minimal types so this file type-checks without adding @cloudflare/workers-types to the app.
interface D1Result<T> {
  results: T[];
}
interface D1PreparedStatement {
  bind(...values: unknown[]): D1PreparedStatement;
  first<T = Record<string, unknown>>(): Promise<T | null>;
  all<T = Record<string, unknown>>(): Promise<D1Result<T>>;
  run(): Promise<unknown>;
}
interface D1Database {
  prepare(query: string): D1PreparedStatement;
}
interface Env {
  DB: D1Database;
  ASSETS: { fetch(request: Request): Promise<Response> };
  TURNSTILE_SECRET: string;
}

interface EntryRow {
  id: number;
  name: string;
  city: string;
  note: string;
  status: string;
  created_at: number;
  approved_at: number | null;
}

const SITE_ORIGIN = 'https://bereanbible.live';
const LIMITS = { name: 40, city: 60, note: 200 };
const MIN_FILL_MS = 3000; // a person can't fill the form in under 3 seconds
const MAX_PER_IP_PER_DAY = 3;
const PUBLIC_LIST_SIZE = 100;

// Links, HTML and the usual spam markers. Entries with any of these are refused.
const BLOCKED = /(https?:|www\.|\[url|<|>|\.(com|net|org|info|biz|xyz|top|ru|cn|io|co|live|shop|site|online|click)\b)/i;

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    const path = url.pathname.replace(/\/+$/, '') || '/';

    try {
      if (path === '/api/guestbook') {
        if (request.method === 'GET') return listApproved(env);
        if (request.method === 'POST') return submitEntry(request, env);
        return json({ error: 'Method not allowed' }, 405);
      }
      if (path === '/admin' || path.startsWith('/admin/')) {
        return handleAdmin(request, env, path);
      }
    } catch (err) {
      console.error('guestbook error', err);
      return json({ error: 'Something went wrong. Please try again later.' }, 500);
    }

    // Not ours: serve the app as usual.
    return env.ASSETS.fetch(request);
  },
};

// ---------- Public API ----------

async function listApproved(env: Env): Promise<Response> {
  const { results } = await env.DB.prepare(
    `SELECT name, city, note, approved_at FROM entries
     WHERE status = 'approved' ORDER BY approved_at DESC LIMIT ?`,
  )
    .bind(PUBLIC_LIST_SIZE)
    .all<Pick<EntryRow, 'name' | 'city' | 'note' | 'approved_at'>>();
  return json({ entries: results }, 200, { 'Cache-Control': 'public, max-age=60' });
}

async function submitEntry(request: Request, env: Env): Promise<Response> {
  // Only accept submissions from our own site.
  if (request.headers.get('Origin') !== SITE_ORIGIN) {
    return json({ error: 'Not allowed.' }, 403);
  }

  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return json({ error: 'Bad request.' }, 400);
  }

  // Honeypot: a hidden field real visitors never see. Pretend success so bots don't learn.
  if (typeof body.website === 'string' && body.website.trim() !== '') {
    return json({ ok: true });
  }

  // Too fast to be a person. Also pretend success.
  const startedAt = Number(body.startedAt);
  if (!Number.isFinite(startedAt) || Date.now() - startedAt < MIN_FILL_MS) {
    return json({ ok: true });
  }

  const name = clean(body.name);
  const city = clean(body.city);
  const note = clean(body.note);

  if (!name || !city || !note) {
    return json({ error: 'Please fill in your name, city and a short note.' }, 400);
  }
  if (name.length > LIMITS.name || city.length > LIMITS.city || note.length > LIMITS.note) {
    return json(
      { error: `Please keep it short: name ${LIMITS.name}, city ${LIMITS.city}, note ${LIMITS.note} characters.` },
      400,
    );
  }
  if (BLOCKED.test(name) || BLOCKED.test(city) || BLOCKED.test(note)) {
    return json({ error: 'Links and web addresses are not allowed in the guestbook.' }, 400);
  }

  // Turnstile check (Cloudflare's bot check).
  const ip = request.headers.get('CF-Connecting-IP') ?? '';
  const token = typeof body.token === 'string' ? body.token : '';
  if (!token || !(await verifyTurnstile(token, ip, env))) {
    return json({ error: 'The bot check failed. Please refresh the page and try again.' }, 400);
  }

  // Daily limit per visitor. The IP is hashed with the secret as salt, so real IPs are never stored.
  const day = new Date().toISOString().slice(0, 10);
  const ipHash = await sha256(`${(env.TURNSTILE_SECRET ?? '').trim()}:${ip}`);
  await env.DB.prepare('DELETE FROM rate_limits WHERE day < ?').bind(day).run();
  const row = await env.DB.prepare('SELECT count FROM rate_limits WHERE ip_hash = ? AND day = ?')
    .bind(ipHash, day)
    .first<{ count: number }>();
  if (row && row.count >= MAX_PER_IP_PER_DAY) {
    return json({ error: 'Thanks! You have already signed today. Please come back tomorrow.' }, 429);
  }
  await env.DB.prepare(
    `INSERT INTO rate_limits (ip_hash, day, count) VALUES (?, ?, 1)
     ON CONFLICT (ip_hash, day) DO UPDATE SET count = count + 1`,
  )
    .bind(ipHash, day)
    .run();

  await env.DB.prepare(
    `INSERT INTO entries (name, city, note, status, created_at) VALUES (?, ?, ?, 'pending', ?)`,
  )
    .bind(name, city, note, Date.now())
    .run();

  return json({ ok: true });
}

async function verifyTurnstile(token: string, ip: string, env: Env): Promise<boolean> {
  const form = new FormData();
  // .trim() guards against a stray space or newline pasted in with the secret.
  form.append('secret', (env.TURNSTILE_SECRET ?? '').trim());
  form.append('response', token);
  if (ip) form.append('remoteip', ip);
  const res = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
    method: 'POST',
    body: form,
  });
  const data = (await res.json()) as {
    success?: boolean;
    hostname?: string;
    'error-codes'?: string[];
  };
  const ok = data.success === true && data.hostname === 'bereanbible.live';
  if (!ok) {
    // Shows in the Worker's logs (dashboard > berean > Logs), never to visitors.
    console.error('Turnstile failed', {
      success: data.success,
      hostname: data.hostname,
      errors: data['error-codes'],
      secretLength: (env.TURNSTILE_SECRET ?? '').length,
    });
  }
  return ok;
}

// ---------- Admin (behind Cloudflare Access) ----------

async function handleAdmin(request: Request, env: Env, path: string): Promise<Response> {
  // Safety net: Cloudflare Access adds this header after you log in. If Access isn't set up
  // (or is turned off by mistake), the admin area stays locked instead of open.
  const who = request.headers.get('Cf-Access-Authenticated-User-Email');
  if (!who) return new Response('Forbidden', { status: 403 });

  if (request.method === 'GET' && path === '/admin') {
    return adminPage(env, who);
  }

  if (request.method === 'POST' && (path === '/admin/approve' || path === '/admin/delete')) {
    // Only accept button clicks from our own admin page.
    if (request.headers.get('Origin') !== SITE_ORIGIN) {
      return new Response('Forbidden', { status: 403 });
    }
    // Read the form as plain text (React Native's FormData type has no .get()).
    const form = new URLSearchParams(await request.text());
    const id = Number(form.get('id'));
    if (Number.isInteger(id) && id > 0) {
      if (path === '/admin/approve') {
        await env.DB.prepare(
          `UPDATE entries SET status = 'approved', approved_at = ? WHERE id = ?`,
        )
          .bind(Date.now(), id)
          .run();
      } else {
        await env.DB.prepare('DELETE FROM entries WHERE id = ?').bind(id).run();
      }
    }
    return Response.redirect(`${SITE_ORIGIN}/admin`, 303);
  }

  return new Response('Not found', { status: 404 });
}

async function adminPage(env: Env, who: string): Promise<Response> {
  const pending = await env.DB.prepare(
    `SELECT * FROM entries WHERE status = 'pending' ORDER BY created_at ASC`,
  ).all<EntryRow>();
  const approved = await env.DB.prepare(
    `SELECT * FROM entries WHERE status = 'approved' ORDER BY approved_at DESC LIMIT 50`,
  ).all<EntryRow>();

  const row = (e: EntryRow, showApprove: boolean) => `
    <div class="entry">
      <div><strong>${esc(e.name)}</strong> — ${esc(e.city)} <span class="when">${new Date(e.created_at).toLocaleString('en-US', { timeZone: 'America/New_York' })}</span></div>
      <p>${esc(e.note)}</p>
      <div class="actions">
        ${showApprove ? `<form method="post" action="/admin/approve"><input type="hidden" name="id" value="${e.id}"><button class="ok">Approve</button></form>` : ''}
        <form method="post" action="/admin/delete" onsubmit="return confirm('Delete this entry?')"><input type="hidden" name="id" value="${e.id}"><button class="del">Delete</button></form>
      </div>
    </div>`;

  const html = `<!doctype html>
<html lang="en"><head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="robots" content="noindex">
<title>Berean Guestbook Admin</title>
<style>
  body { font-family: system-ui, sans-serif; max-width: 720px; margin: 24px auto; padding: 0 16px; color: #111; }
  h1 { color: #1f2a44; } h2 { margin-top: 32px; border-bottom: 2px solid #c9a227; padding-bottom: 4px; }
  .entry { border: 1px solid #ddd; border-radius: 8px; padding: 12px; margin: 12px 0; }
  .entry p { margin: 8px 0; white-space: pre-wrap; }
  .when { color: #777; font-size: 0.85em; margin-left: 6px; }
  .actions { display: flex; gap: 8px; }
  button { border: 0; border-radius: 6px; padding: 8px 14px; font-size: 1em; cursor: pointer; }
  .ok { background: #1f2a44; color: #fff; } .del { background: #eee; color: #a00; }
  .muted { color: #777; }
</style></head><body>
<h1>Guestbook Admin</h1>
<p class="muted">Signed in as ${esc(who)}</p>
<h2>Waiting for approval (${pending.results.length})</h2>
${pending.results.map((e) => row(e, true)).join('') || '<p class="muted">Nothing waiting.</p>'}
<h2>Approved (latest 50)</h2>
${approved.results.map((e) => row(e, false)).join('') || '<p class="muted">None yet.</p>'}
</body></html>`;

  return new Response(html, {
    headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store' },
  });
}

// ---------- Helpers ----------

/** Trim, collapse whitespace/newlines to single spaces, and strip control characters. */
function clean(value: unknown): string {
  if (typeof value !== 'string') return '';
  return value
    .replace(/[\u0000-\u001F\u007F]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function esc(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

async function sha256(text: string): Promise<string> {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

function json(data: unknown, status = 200, extraHeaders: Record<string, string> = {}): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8', ...extraHeaders },
  });
}
