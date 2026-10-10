let currentMarkdown = '';
let service = null;

function initTurndown() {
  if (typeof TurndownService !== 'undefined' && !service) {
    service = new TurndownService({
      headingStyle: 'atx',
      codeBlockStyle: 'fenced',
      emDelimiter: '*',
      bulletListMarker: '-',
      linkStyle: 'inlined',
      linkReferenceStyle: 'full'
    });
    // Add table support
    service.addRule('tableCell', {
      filter: ['th', 'td'],
      replacement: function(content, node) {
        var cell = content.trim() || ' ';
        if (node.tagName === 'TH') {
          return cell;
        }
        return cell;
      }
    });
  }
  return service;
}

function switchTab(name) {
  document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
  document.querySelectorAll('.panel').forEach(p => p.classList.remove('active'));
  document.getElementById('tab' + name.charAt(0).toUpperCase() + name.slice(1)).classList.add('active');
  document.getElementById('panel' + name.charAt(0).toUpperCase() + name.slice(1)).classList.add('active');
  document.getElementById('resultArea').classList.remove('show');
  document.getElementById('status').className = 'status';
  document.getElementById('status').textContent = '';
}

function setStatus(msg, type) {
  var el = document.getElementById('status');
  el.className = 'status' + (type ? ' ' + type : '');
  el.textContent = msg;
}

function convertHtml() {
  var html = document.getElementById('htmlInput').value.trim();
  if (!html) { setStatus('Please paste some HTML code first.', 'error'); return; }

  var td = initTurndown();
  if (!td) { setStatus('Turndown library not loaded. Check your internet connection.', 'error'); return; }

  try {
    currentMarkdown = td.turndown(html);
    document.getElementById('resultContent').textContent = currentMarkdown;
    document.getElementById('resultTitle').textContent = 'Markdown Output (' + currentMarkdown.length + ' chars)';
    document.getElementById('resultArea').classList.add('show');
    setStatus('Conversion complete!', 'success');
  } catch (e) {
    setStatus('Error: ' + e.message, 'error');
  }
}

async function convertUrl() {
  var url = document.getElementById('urlInput').value.trim();
  if (!url) { setStatus('Please enter a URL.', 'error'); return; }
  if (!url.startsWith('http://') && !url.startsWith('https://')) { url = 'https://' + url; }

  setStatus('Fetching ' + url + ' ...', 'info');
  try {
    var response = await fetch('https://r.jina.ai/' + encodeURIComponent(url), {
      headers: { 'Accept': 'text/markdown', 'X-Return-Format': 'markdown' }
    });
    if (!response.ok) throw new Error('HTTP ' + response.status);
    var text = await response.text();

    // Jina already returns markdown, but let's also offer to convert raw HTML
    // For now, use the markdown text directly
    currentMarkdown = text;
    document.getElementById('resultContent').textContent = currentMarkdown;
    document.getElementById('resultTitle').textContent = 'Markdown from ' + url.replace(/^https?:\/\//, '').substring(0, 50);
    document.getElementById('resultArea').classList.add('show');
    setStatus('Conversion complete!', 'success');
  } catch (e) {
    setStatus('Error: ' + e.message, 'error');
  }
}

function convertUrlHtml() {
  var url = document.getElementById('urlInput').value.trim();
  if (!url) { setStatus('Please enter a URL.', 'error'); return; }
  if (!url.startsWith('http://') && !url.startsWith('https://')) { url = 'https://' + url; }

  setStatus('Fetching ' + url + ' ...', 'info');
  fetch('https://r.jina.ai/' + encodeURIComponent(url), {
    headers: { 'Accept': 'text/html' }
  })
  .then(function(r) {
    if (!r.ok) throw new Error('HTTP ' + r.status);
    return r.text();
  })
  .then(function(html) {
    var td = initTurndown();
    if (!td) throw new Error('Turndown not loaded');
    currentMarkdown = td.turndown(html);
    document.getElementById('resultContent').textContent = currentMarkdown;
    document.getElementById('resultTitle').textContent = 'Markdown from ' + url.replace(/^https?:\/\//, '').substring(0, 50);
    document.getElementById('resultArea').classList.add('show');
    setStatus('Conversion complete!', 'success');
  })
  .catch(function(e) {
    setStatus('Error: ' + e.message, 'error');
  });
}

async function copyResult() {
  try {
    await navigator.clipboard.writeText(currentMarkdown);
    var btn = document.getElementById('copyBtn');
    var original = btn.textContent;
    btn.textContent = 'Copied!';
    setTimeout(function() { btn.textContent = original; }, 2000);
  } catch (e) {
    alert('Failed to copy. You can select all and copy manually.');
  }
}

function downloadResult() {
  var blob = new Blob([currentMarkdown], { type: 'text/markdown' });
  var a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'converted.md';
  a.click();
  URL.revokeObjectURL(a.href);
}

function loadSample() {
  document.getElementById('htmlInput').value = '<article>\n  <h1>Getting Started with Markdown</h1>\n  <p>Markdown is a <strong>lightweight markup language</strong> that you can use to add formatting to plain text. It was created by <a href="https://daringfireball.net/projects/markdown/">John Gruber</a> in 2004.</p>\n\n  <h2>Why Use Markdown?</h2>\n  <ul>\n    <li>Easy to read and write in raw form</li>\n    <li>Converts to HTML, PDF, and many other formats</li>\n    <li>Used everywhere: GitHub, Reddit, Notion, Obsidian</li>\n  </ul>\n\n  <h2>Common Syntax</h2>\n  <table>\n    <tr><th>Element</th><th>Markdown</th></tr>\n    <tr><td>Bold</td><td><code>**text**</code></td></tr>\n    <tr><td>Italic</td><td><code>*text*</code></td></tr>\n    <tr><td>Link</td><td><code>[text](url)</code></td></tr>\n    <tr><td>Code</td><td><code>`code`</code></td></tr>\n  </table>\n\n  <blockquote>Tip: Markdown is perfect for writing documentation, notes, and content for the web.</blockquote>\n\n  <pre><code>console.log("Hello, Markdown!");</code></pre>\n\n  <p>Happy writing! 🚀</p>\n</article>';
}
