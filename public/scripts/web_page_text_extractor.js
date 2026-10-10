let currentText = '';
let currentUrl = '';

async function extractText() {
  const urlInput = document.getElementById('urlInput');
  const status = document.getElementById('status');
  const btn = document.getElementById('extractBtn');
  const resultArea = document.getElementById('resultArea');
  const resultContent = document.getElementById('resultContent');
  const resultTitle = document.getElementById('resultTitle');
  const statsArea = document.getElementById('statsArea');

  let url = urlInput.value.trim();
  if (!url) { status.className = 'status error'; status.textContent = 'Please enter a URL'; return; }
  if (!url.startsWith('http://') && !url.startsWith('https://')) { url = 'https://' + url; }

  currentUrl = url;
  status.className = 'status';
  status.textContent = 'Extracting text from ' + url + ' ...';
  btn.disabled = true;
  resultArea.classList.remove('show');
  statsArea.style.display = 'none';

  try {
    const apiUrl = 'https://r.jina.ai/' + encodeURIComponent(url);
    const response = await fetch(apiUrl, {
      headers: { 'Accept': 'text/plain', 'X-With-Generated-Alt': 'true' }
    });
    if (!response.ok) throw new Error('HTTP ' + response.status + ': ' + response.statusText);
    let text = await response.text();

    // Strip any remaining Markdown formatting to get pure text
    // Remove headings markers
    text = text.replace(/^#+\s*/gm, '');
    // Remove bold/italic markers
    text = text.replace(/\*{1,3}/g, '');
    // Remove link syntax, keep text
    text = text.replace(/\[([^\]]*)\]\([^)]+\)/g, '$1');
    // Remove image syntax
    text = text.replace(/!\[([^\]]*)\]\([^)]+\)/g, '$1');
    // Remove code markers
    text = text.replace(/```[\s\S]*?```/g, function(m) {
      return m.replace(/```/g, '').trim();
    });
    text = text.replace(/`([^`]+)`/g, '$1');
    // Remove horizontal rules
    text = text.replace(/^---+\s*$/gm, '');
    // Remove blockquote markers
    text = text.replace(/^>\s*/gm, '');
    // Collapse multiple blank lines
    text = text.replace(/\n{3,}/g, '\n\n');
    text = text.trim();

    currentText = text;

    // Update stats
    document.getElementById('charCount').textContent = text.length.toLocaleString();
    const words = text ? text.split(/\s+/).length : 0;
    document.getElementById('wordCount').textContent = words.toLocaleString();
    document.getElementById('lineCount').textContent = text.split('\n').length.toLocaleString();

    resultContent.textContent = text;
    resultTitle.innerHTML = 'Extracted Text &mdash; <a href="' + url + '" target="_blank">' + url.replace(/^https?:\/\//, '').substring(0, 60) + '</a>';
    resultArea.classList.add('show');
    statsArea.style.display = 'flex';
    status.className = 'status success';
    status.textContent = 'Done! Extracted ' + text.length.toLocaleString() + ' characters from ' + url.replace(/^https?:\/\//, '').substring(0, 50);
  } catch (e) {
    status.className = 'status error';
    status.textContent = 'Error: ' + e.message + ' (check the URL is public and accessible)';
  } finally {
    btn.disabled = false;
  }
}

async function copyResult() {
  try {
    await navigator.clipboard.writeText(currentText);
    const btn = document.getElementById('copyBtn');
    const original = btn.textContent;
    btn.textContent = 'Copied!';
    setTimeout(() => { btn.textContent = original; }, 2000);
  } catch (e) {
    alert('Failed to copy. Please select all and copy manually.');
  }
}

function downloadResult() {
  if (!currentText) return;
  const domain = currentUrl.replace(/^https?:\/\//, '').split('/')[0].replace(/\./g, '_');
  const blob = new Blob([currentText], { type: 'text/plain' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = domain + '_extracted.txt';
  a.click();
  URL.revokeObjectURL(a.href);
}

document.getElementById('urlInput').addEventListener('keydown', function(e) {
  if (e.key === 'Enter') extractText();
});
