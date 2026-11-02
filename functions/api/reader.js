// /api/reader?url=<encoded>&format=markdown|text|html
//
// Same-origin proxy for Jina Reader. Browsers cannot call r.jina.ai directly
// any more: anonymous cross-origin requests come back HTTP 401, which silently
// broke every URL-based tool on pagetext.io. Fetching from the edge worker has
// no Origin restriction, so this proxy keeps the tools working and lets us
// fall back to a direct fetch if Jina is rate limited or down.

const UA =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36';

const CORS = {
  'access-control-allow-origin': '*',
  'access-control-allow-methods': 'GET, OPTIONS',
  'access-control-allow-headers': 'content-type, accept',
};

function bad(status, message) {
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8', ...CORS },
  });
}

function decodeEntities(s) {
  const map = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ', '#39': "'" };
  return s.replace(/&(#\d+|#x[0-9a-f]+|[a-z]+\d*);/gi, (m, e) => {
    if (e[0] === '#') {
      const code = e[1] === 'x' || e[1] === 'X' ? parseInt(e.slice(2), 16) : parseInt(e.slice(1), 10);
      return Number.isFinite(code) && code > 0 && code < 0x110000 ? String.fromCodePoint(code) : m;
    }
    return map[e.toLowerCase()] ?? m;
  });
}

// Crude but dependency-free HTML -> text fallback.
function htmlToText(html) {
  let s = html
    .replace(/<!--[\s\S]*?-->/g, ' ')
    .replace(/<(script|style|noscript|svg|iframe)[\s\S]*?<\/\1>/gi, ' ')
    .replace(/<\/(p|div|section|article|header|footer|li|tr|h[1-6]|blockquote|pre)>/gi, '\n')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<li[^>]*>/gi, '- ')
    .replace(/<[^>]+>/g, '');
  s = decodeEntities(s);
  return s
    .split('\n')
    .map((l) => l.replace(/[ \t\u00a0]+/g, ' ').trim())
    .filter((l, i, arr) => l !== '' || (i > 0 && arr[i - 1] !== ''))
    .join('\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

async function viaJina(url, format) {
  const headers = { Accept: format === 'html' ? 'text/html' : 'text/plain', 'User-Agent': UA };
  if (format === 'markdown' || format === 'html') headers['X-Return-Format'] = format;
  const res = await fetch('https://r.jina.ai/' + encodeURIComponent(url), { headers });
  if (!res.ok) return null;
  const body = await res.text();
  if (!body || body.length < 20) return null;
  if (/^HTTP \d{3}/.test(body.slice(0, 20))) return null;
  return body;
}

async function direct(url, format) {
  const res = await fetch(url, {
    headers: { 'User-Agent': UA, Accept: 'text/html,application/xhtml+xml' },
    redirect: 'follow',
  });
  if (!res.ok) return null;
  const type = res.headers.get('content-type') || '';
  const raw = await res.text();
  if (format === 'html' || !type.includes('html')) return raw;
  return htmlToText(raw);
}

export async function onRequestGet({ request }) {
  const params = new URL(request.url).searchParams;
  const raw = params.get('url');
  if (!raw) return bad(400, 'missing url parameter');

  let target;
  try {
    target = new URL(raw.startsWith('http') ? raw : 'https://' + raw);
  } catch {
    return bad(400, 'invalid url');
  }
  if (target.protocol !== 'http:' && target.protocol !== 'https:') return bad(400, 'unsupported protocol');

  const format = (params.get('format') || 'markdown').toLowerCase();
  let body = null;
  try {
    body = await viaJina(target.toString(), format);
  } catch {
    body = null;
  }
  if (body === null) {
    try {
      body = await direct(target.toString(), format);
    } catch {
      body = null;
    }
  }
  if (body === null) return bad(502, 'could not read ' + target.toString());

  return new Response(body, {
    headers: {
      'content-type': format === 'html' ? 'text/html; charset=utf-8' : 'text/plain; charset=utf-8',
      'cache-control': 'public, max-age=300',
      ...CORS,
    },
  });
}

export async function onRequestOptions() {
  return new Response(null, { status: 204, headers: CORS });
}
