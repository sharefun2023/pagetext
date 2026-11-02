let currentText = '';
let currentUrl = '';

function setStatus(msg, type) {
  var el = document.getElementById('status');
  el.className = 'status' + (type ? ' ' + type : '');
  el.textContent = msg;
}

function stripMarkdown(md) {
  var text = md;
  // Remove HTML comments
  text = text.replace(/<!--[\s\S]*?-->/g, '');
  // Remove fenced code blocks (keep content, remove fences)
  text = text.replace(/```[\s\S]*?```/g, function(match) {
    return match.replace(/^```.*$/gm, '').trim() + '\n';
  });
  // Remove inline code backticks (keep content)
  text = text.replace(/`([^`]+)`/g, '$1');
  // Remove images
  text = text.replace(/!\[([^\]]*)\]\([^)]+\)/g, '$1');
  // Remove links (keep text)
  text = text.replace(/\[([^\]]+)\]\([^)]+\)/g, '$1');
  // Remove headings markers (keep text)
  text = text.replace(/^#{1,6}\s+/gm, '');
  // Remove bold/italic
  text = text.replace(/(\*\*\*|___)(.*?)\1/g, '$2');
  text = text.replace(/(\*\*|__)(.*?)\1/g, '$2');
  text = text.replace(/(\*|_)(.*?)\1/g, '$2');
  // Remove blockquote markers
  text = text.replace(/^>\s?/gm, '');
  // Remove horizontal rules
  text = text.replace(/^(\*{3,}|-{3,}|_{3,})$/gm, '');
  // Remove unordered list markers
  text = text.replace(/^[\s]*[-*+]\s/gm, '');
  // Remove ordered list markers
  text = text.replace(/^[\s]*\d+\.\s/gm, '');
  // Remove strikethrough
  text = text.replace(/~~(.*?)~~/g, '$1');
  // Collapse multiple blank lines
  text = text.replace(/\n{3,}/g, '\n\n');
  // Trim
  return text.trim();
}

async function extractText() {
  const urlInput = document.getElementById('urlInput');
  const btn = document.getElementById('extractBtn');
  const resultArea = document.getElementById('resultArea');
  const resultContent = document.getElementById('resultContent');
  const resultTitle = document.getElementById('resultTitle');

  let url = urlInput.value.trim();
  if (!url) { setStatus('Please enter a URL', 'error'); return; }
  if (!url.startsWith('http://') && !url.startsWith('https://')) { url = 'https://' + url; }

  currentUrl = url;
  setStatus('Fetching and extracting text...', 'info');
  btn.disabled = true;
  resultArea.classList.remove('show');

  try {
    const apiUrl = 'https://r.jina.ai/' + encodeURIComponent(url);
    const response = await fetch(apiUrl, {
      headers: { 'Accept': 'text/markdown', 'X-Return-Format': 'markdown' }
    });
    if (!response.ok) throw new Error('HTTP ' + response.status + ': ' + response.statusText);
    const rawMarkdown = await response.text();
    currentText = stripMarkdown(rawMarkdown);
    resultContent.textContent = currentText;
    var displayUrl = url.replace(/^https?:\/\//, '').substring(0, 60);
    resultTitle.innerHTML = 'Result &mdash; <a href="' + url + '" target="_blank">' + displayUrl + '</a>';
    resultArea.classList.add('show');
    setStatus('Done! ' + currentText.length.toLocaleString() + ' characters extracted.', 'success');
  } catch (e) {
    setStatus('Error: ' + e.message + ' (check the URL is public and accessible)', 'error');
  } finally {
    btn.disabled = false;
  }
}

async function copyResult() {
  try {
    await navigator.clipboard.writeText(currentText);
    var btn = document.getElementById('copyBtn');
    var original = btn.textContent;
    btn.textContent = 'Copied!';
    setTimeout(function() { btn.textContent = original; }, 2000);
  } catch (e) {
    setStatus('Failed to copy', 'error');
  }
}

function downloadResult() {
  var domain = currentUrl.replace(/^https?:\/\//, '').split('/')[0].replace(/\./g, '_');
  var blob = new Blob([currentText], { type: 'text/plain' });
  var a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = domain + '.txt';
  a.click();
  URL.revokeObjectURL(a.href);
}

document.getElementById('urlInput').addEventListener('keydown', function(e) {
  if (e.key === 'Enter') extractText();
});
