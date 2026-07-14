# Product Context

## Project Goal

pagetext.io — a free web-page-to-Markdown converter powered by Jina Reader API. Target audience: developers and AI users who need clean text from web pages for LLMs/ChatGPT. ~260 words of content, new site.

## Key Features

*   URL to Markdown conversion (Jina Reader powered)
*   HTML to Markdown converter
*   Web page text extractor
*   Markdown to HTML converter
*   Markdown converter (general)
*   API documentation page
*   Dark theme, responsive design

## Overall Architecture

*   **Frontend**: Static HTML/CSS/JS (6 HTML pages)
*   **Backend**: Jina Reader API (r.jina.ai) for URL-to-Markdown
*   **Hosting**: Cloudflare Pages (pagetext.io domain)
*   **DNS**: Cloudflare
*   **Deployment**: git push → CF Pages auto-deploy
*   **Analytics**: GA (G-ESF1YX8CCR) + GSC
*   **SEO**: JSON-LD structured data, meta tags, canonical URLs
