# Decision Log

2026-07-14 - Memory Bank initialized.

## Decision

*   **Jina Reader API as backend** (2026)
*   **pagetext.io domain** (2026)
*   **Static HTML, no framework** (2026)
*   **CF Pages hosting** (2026)
*   **Adopt RooFlow Memory Bank** (2026-07-14)

## Rationale

*   Jina Reader: free, reliable, purpose-built for web-to-markdown
*   pagetext.io: descriptive, SEO-friendly
*   Static HTML: zero maintenance, instant load
*   CF Pages: free tier, global CDN
*   Memory Bank: project context persistence

## Implementation Details

*   6 standalone HTML pages in `public/`
*   API calls to `r.jina.ai` for URL fetching
*   GA tag injected in all pages
*   JSON-LD WebApplication schema on index
