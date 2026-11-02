let currentMarkdown = '';
let currentUrl = '';

async function convert() {
  const urlInput = document.getElementById('urlInput');
  const status = document.getElementById('status');
  const btn = document.getElementById('convertBtn');
  const resultArea = document.getElementById('resultArea');
  const resultContent = document.getElementById('resultContent');
  const resultTitle = document.getElementById('resultTitle');

  let url = urlInput.value.trim();
  if (!url) { status.className = 'status error'; status.textContent = 'Please enter a URL'; return; }
  if (!url.startsWith('http://') && !url.startsWith('https://')) { url = 'https://' + url; }

  currentUrl = url;
  status.className = 'status';
  status.textContent = 'Converting...';
  btn.disabled = true;
  resultArea.classList.remove('show');

  try {
    const apiUrl = 'https://r.jina.ai/' + encodeURIComponent(url);
    const response = await fetch(apiUrl, {
      headers: { 'Accept': 'text/markdown', 'X-Return-Format': 'markdown' }
    });
    if (!response.ok) throw new Error('HTTP ' + response.status + ': ' + response.statusText);
    currentMarkdown = await response.text();
    resultContent.textContent = currentMarkdown;
    resultTitle.innerHTML = 'Result &mdash; <a href="' + url + '" target="_blank">' + url.replace(/^https?:\/\//, '').substring(0, 60) + '</a>';
    resultArea.classList.add('show');
    status.className = 'status success';
    status.textContent = 'Done!';
  } catch (e) {
    status.className = 'status error';
    status.textContent = 'Error: ' + e.message + ' (check the URL is public and accessible)';
  } finally {
    btn.disabled = false;
  }
}

async function copyResult() {
  try {
    await navigator.clipboard.writeText(currentMarkdown);
    const btn = document.getElementById('copyBtn');
    const original = btn.textContent;
    btn.textContent = 'Copied!';
    setTimeout(() => { btn.textContent = original; }, 2000);
  } catch (e) {
    alert('Failed to copy');
  }
}

function downloadResult() {
  const domain = currentUrl.replace(/^https?:\/\//, '').split('/')[0].replace(/\./g, '_');
  const blob = new Blob([currentMarkdown], { type: 'text/markdown' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = domain + '.md';
  a.click();
  URL.revokeObjectURL(a.href);
}

document.getElementById('urlInput').addEventListener('keydown', function(e) {
  if (e.key === 'Enter') convert();
});
