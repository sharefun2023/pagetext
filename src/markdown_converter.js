let quickMd = '';

async function quickConvert() {
  const urlInput = document.getElementById('quickUrl');
  const status = document.getElementById('quickStatus');
  const btn = document.getElementById('quickBtn');
  const resultArea = document.getElementById('quickResult');
  const content = document.getElementById('quickContent');
  const title = document.getElementById('quickTitle');

  let url = urlInput.value.trim();
  if (!url) { status.className = 'status error'; status.textContent = 'Please enter a URL'; return; }
  if (!url.startsWith('http://') && !url.startsWith('https://')) { url = 'https://' + url; }

  status.className = 'status';
  status.textContent = 'Converting...';
  btn.disabled = true;
  resultArea.classList.remove('show');

  try {
    const resp = await fetch('https://r.jina.ai/' + encodeURIComponent(url), {
      headers: { 'Accept': 'text/markdown', 'X-Return-Format': 'markdown' }
    });
    if (!resp.ok) throw new Error('HTTP ' + resp.status);
    quickMd = await resp.text();
    content.textContent = quickMd;
    title.innerHTML = 'Result &mdash; <a href="' + url + '" target="_blank">' + url.replace(/^https?:\/\//, '').substring(0, 60) + '</a>';
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

async function quickCopy() {
  try {
    await navigator.clipboard.writeText(quickMd);
    const btn = document.getElementById('quickCopyBtn');
    const orig = btn.textContent;
    btn.textContent = 'Copied!';
    setTimeout(() => { btn.textContent = orig; }, 2000);
  } catch (e) {
    alert('Failed to copy');
  }
}

function quickDownload() {
  const blob = new Blob([quickMd], { type: 'text/markdown' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'page-content.md';
  a.click();
  URL.revokeObjectURL(a.href);
}
