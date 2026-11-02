// /api/reader?url=<encoded>&format=markdown|text|html
//
// Same-origin proxy for Jina Reader. Browsers cannot call r.jina.ai directly
// any more: anonymous cross-origin requests come back HTTP 401, which silently
// broke every URL-based tool on pagetext.io. Fetching from the edge has no
// Origin restriction, so this proxy keeps the tools working.
//
// If Jina is unreachable/rate limited we fall back to fetching the page
// ourselves and converting the HTML locally (headings, lists, links, paragraphs
// preserved). `x-reader-src` tells which path produced the body.

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

const ENTITIES = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ', mdash: '—', ndash: '–', hellip: '…', rsquo: '’', lsquo: '‘', ldquo: '“', rdquo: '”', copy: '©', reg: '®', trade: '™' };

function decodeEntities(s) {
  return s.replace(/&(#\d+|#x[0-9a-f]+|[a-z][a-z0-9]*);/gi, (m, e) => {
    if (e[0] === '#') {
      const code = e[1] === 'x' || e[1] === 'X' ? parseInt(e.slice(2), 16) : parseInt(e.slice(1), 10);
      return Number.isFinite(code) && code > 0 && code < 0x110000 ? String.fromCodePoint(code) : m;
    }
    return ENTITIES[e.toLowerCase()] ?? m;
  });
}

function clean(md) {
  return md
    .replace(/[ \t\u00a0]+/g, ' ')
    .split('\n')
    .map((l) => l.replace(/^[ \t]+|[ \t]+$/g, ''))
    .join('\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

// Lightweight HTML -> Markdown. Good enough for article-style pages; Jina
// handles the hard cases whenever it is available.
function htmlToMarkdown(html) {
  let s = html
    .replace(/<!--[\s\S]*?-->/g, ' ')
    .replace(/<(script|style|noscript|svg|iframe|nav|footer|aside|form)\b[\s\S]*?<\/\1>/gi, ' ')
    .replace(/<head\b[\s\S]*?<\/head>/gi, ' ');

  s = s.replace(/<a\b[^>]*href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi, (m, href, text) => {
    const t = text.replace(/<[^>]+>/g, '').trim();
    if (!t || href.startsWith('#')) return t;
    if (href.startsWith('/')) return '[' + t + '](https://' + (html.match(/https?:\/\/([^\/"'\s]+)/) || [, ''])[1] + href + ')';
    return /^https?:/i.test(href) ? `[${t}](${href})` : t;
  });

  s = s
    .replace(/<h([1-6])\b[^>]*>([\s\S]*?)<\/h\1>/gi, (m, n, t) => '\n\n' + '#'.repeat(+n) + ' ' + t.replace(/<[^>]+>/g, '').trim() + '\n\n')
    .replace(/<li\b[^>]*>([\s\S]*?)<\/li>/gi, (m, t) => '\n- ' + t.replace(/<[^>]+>/g, '').trim())
    .replace(/<blockquote\b[^>]*>([\s\S]*?)<\/blockquote>/gi, (m, t) => '\n\n> ' + t.replace(/<[^>]+>/g, '').trim() + '\n\n')
    .replace(/<pre\b[^>]*>([\s\S]*?)<\/pre>/gi, (m, t) => '\n\n```\n' + t.replace(/<[^>]+>/g, '') + '\n```\n\n')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/(p|div|section|article|main|tr|table|ul|ol|header)>/gi, '\n\n')
    .replace(/<(td|th)\b[^>]*>/gi, ' | ');

  s = decodeEntities(s.replace(/<[^>]+>/g, ' '));
  return clean(s);
}

function toPlainText(md) {
  return clean(
    md
      .replace(/^#{1,6}\s*/gm, '')
      .replace(/```[\s\S]*?```/g, (m) => m.replace(/```/g, '').trim())
      .replace(/`([^`]+)`/g, '$1')
      .replace(/!\[([^\]]*)\]\([^)]+\)/g, '$1')
      .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
      .replace(/\*{1,3}([^*]+)\*{1,3}/g, '$1')
      .replace(/^>\s?/gm, '')
      .replace(/^[-*+]\s+/gm, '')
      .replace(/^\d+\.\s+/gm, '')
      .replace(/^---+$/gm, ''),
  );
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

// Chrome we drop before converting: real navigation/menus/boilerplate. Done with
// HTMLRewriter so nested elements are removed correctly (a regex cannot).
const JUNK_SELECTOR = [
  'script', 'style', 'noscript', 'svg', 'iframe', 'form', 'button', 'select',
  'nav', 'header', 'footer', 'aside', 'dialog',
  '[role="navigation"]', '[role="banner"]', '[role="contentinfo"]', '[role="complementary"]',
  '[class*="sidebar" i]', '[id*="sidebar" i]', '[class*="menu" i]', '[id*="menu" i]',
  '[class*="cookie" i]', '[class*="banner" i]',
  '[class*="breadcrumb" i]', '[class*="comment" i]', '[class*="share" i]',
  '[class*="social" i]', '[class*="advert" i]', '[class*="promo" i]',
  '[class*="newsletter" i]', '[class*="subscribe" i]', '[aria-hidden="true"]',
].join(', ');

async function stripChrome(response) {
  const rewriter = new HTMLRewriter().on(JUNK_SELECTOR, {
    element(el) {
      el.remove();
    },
  });
  return rewriter.transform(response).text();
}

async function direct(url, format, dbg) {
  const res = await fetch(url, {
    headers: { 'User-Agent': UA, Accept: 'text/html,application/xhtml+xml' },
    redirect: 'follow',
  });
  if (dbg) dbg.status = res.status;
  if (!res.ok) return null;
  const type = res.headers.get('content-type') || '';
  if (!type.includes('html')) return await res.text();
  if (format === 'html') return await res.text();

  let cleaned;
  try {
    cleaned = await stripChrome(res);
    if (dbg) dbg.cleanedLen = cleaned.length;
  } catch (e) {
    if (dbg) dbg.err = String(e && e.message ? e.message : e);
    cleaned = await (await fetch(url, { headers: { 'User-Agent': UA } })).text();
    if (dbg) dbg.cleanedLen = cleaned.length;
  }
  const md = htmlToMarkdown(cleaned);
  return format === 'text' ? toPlainText(md) : md;
}

export async function onRequestGet(ctx) {
  try {
    return await handle(ctx);
  } catch (e) {
    return bad(502, 'reader failed: ' + String(e && e.message ? e.message : e));
  }
}

async function handle({ request }) {
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
  const dbg = params.get('debug') ? {} : null;
  let body = null;
  let src = 'jina';
  try {
    body = await viaJina(target.toString(), format);
    if (body !== null && !body.trim()) body = null;
  } catch (e) {
    if (dbg) dbg.jinaErr = String(e && e.message ? e.message : e);
    body = null;
  }
  if (body === null) {
    src = 'direct';
    try {
      body = await direct(target.toString(), format, dbg);
      if (body !== null && !body.trim()) body = null;
    } catch (e) {
      if (dbg) dbg.directErr = String(e && e.message ? e.message : e);
      body = null;
    }
  }
  if (body === null || !body.trim()) return bad(502, 'could not read ' + target.toString());

  if (dbg) {
    return new Response(JSON.stringify({ src, len: body.length, ...dbg, head: body.slice(0, 200) }, null, 1), {
      headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store', ...CORS },
    });
  }

  return new Response(body, {
    headers: {
      'content-type': format === 'html' ? 'text/html; charset=utf-8' : 'text/plain; charset=utf-8',
      'cache-control': 'public, max-age=300',
      'x-reader-src': src,
      ...CORS,
    },
  });
}

export async function onRequestOptions() {
  return new Response(null, { status: 204, headers: CORS });
}
