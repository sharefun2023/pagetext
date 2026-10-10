let currentMarkdown = '';
let currentUrl = '';

function setStatus(msg, type) {
  var el = document.getElementById('status');
  el.className = 'status' + (type ? ' ' + type : '');
  el.textContent = msg;
}

async function convertToMarkdown() {
  const urlInput = document.getElementById('urlInput');
  const btn = document.getElementById('convertBtn');
  const resultArea = document.getElementById('resultArea');
  const resultContent = document.getElementById('resultContent');
  const resultTitle = document.getElementById('resultTitle');

  let url = urlInput.value.trim();
  if (!url) { setStatus('Please enter a URL', 'error'); return; }
  if (!url.startsWith('http://') && !url.startsWith('https://')) { url = 'https://' + url; }

  currentUrl = url;
  setStatus('Fetching and converting to Markdown...', 'info');
  btn.disabled = true;
  resultArea.classList.remove('show');

  try {
    const apiUrl = 'https://r.jina.ai/' + encodeURIComponent(url);
    const response = await fetch(apiUrl, {
      headers: { 'Accept': 'text/markdown', 'X-Return-Format': 'markdown' }
    });
    if (!response.ok) throw new Error('HTTP ' + response.status + ': ' + response.statusText);
    const markdown = await response.text();
    currentMarkdown = markdown;
    resultContent.textContent = currentMarkdown;
    var displayUrl = url.replace(/^https?:\/\//, '').substring(0, 60);
    resultTitle.innerHTML = 'Result &mdash; <a href="' + url + '" target="_blank">' + displayUrl + '</a>';
    resultArea.classList.add('show');
    setStatus('Done! ' + currentMarkdown.length.toLocaleString() + ' characters of Markdown.', 'success');
  } catch (e) {
    setStatus('Error: ' + e.message + ' (check the URL is public and accessible)', 'error');
  } finally {
    btn.disabled = false;
  }
}

async function copyResult() {
  try {
    await navigator.clipboard.writeText(currentMarkdown);
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
  var blob = new Blob([currentMarkdown], { type: 'text/markdown' });
  var a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = domain + '.md';
  a.click();
  URL.revokeObjectURL(a.href);
}

document.getElementById('urlInput').addEventListener('keydown', function(e) {
  if (e.key === 'Enter') convertToMarkdown();
});
