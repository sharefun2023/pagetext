let currentHtml = '';
let renderedHtml = '';

function convert() {
  var md = document.getElementById('mdInput').value.trim();
  if (!md) { setStatus('Please enter some Markdown first.', 'error'); return; }

  setStatus('Converting...', 'info');

  try {
    var breaks = document.getElementById('optBreaks').checked;
    var gfm = document.getElementById('optGfm').checked;

    renderedHtml = marked.parse(md, {
      breaks: breaks,
      gfm: gfm
    });

    currentHtml = renderedHtml;

    document.getElementById('previewArea').innerHTML = renderedHtml;
    document.getElementById('sourceArea').innerHTML = '';
    var sourcePre = document.createElement('pre');
    sourcePre.textContent = renderedHtml;
    document.getElementById('sourceArea').appendChild(sourcePre);

    var charCount = renderedHtml.length;
    document.getElementById('resultTitle').textContent = 'HTML Output (' + charCount + ' chars)';
    document.getElementById('resultArea').style.display = 'block';
    setStatus('Conversion complete!', 'success');
  } catch (e) {
    setStatus('Error: ' + e.message, 'error');
  }
}

function switchOutputTab(name) {
  document.querySelectorAll('.output-tab').forEach(function(t) { t.classList.remove('active'); });
  document.querySelectorAll('.output-panel').forEach(function(p) { p.classList.remove('active'); });
  document.getElementById('otab' + name.charAt(0).toUpperCase() + name.slice(1)).classList.add('active');
  document.getElementById('opanel' + name.charAt(0).toUpperCase() + name.slice(1)).classList.add('active');
}

function setStatus(msg, type) {
  var el = document.getElementById('status');
  el.className = 'status' + (type ? ' ' + type : '');
  el.textContent = msg;
}

async function copyHtml() {
  try {
    await navigator.clipboard.writeText(currentHtml);
    var btn = document.getElementById('copyBtn');
    var original = btn.textContent;
    btn.textContent = 'Copied!';
    setTimeout(function() { btn.textContent = original; }, 2000);
  } catch (e) {
    alert('Failed to copy. You can select all and copy manually.');
  }
}

function downloadHtml() {
  var fullHtml = '<!DOCTYPE html>\n<html lang="en">\n<head>\n<meta charset="UTF-8">\n<meta name="viewport" content="width=device-width, initial-scale=1.0">\n<title>Converted from Markdown</title>\n<style>\nbody { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif; line-height: 1.6; max-width: 800px; margin: 0 auto; padding: 20px; color: #333; }\ncode { background: #f0f0f0; padding: 2px 6px; border-radius: 3px; }\npre { background: #f5f5f5; padding: 16px; border-radius: 6px; overflow-x: auto; }\ntable { border-collapse: collapse; width: 100%; }\nth, td { border: 1px solid #ddd; padding: 8px; }\nblockquote { border-left: 4px solid #666; padding-left: 16px; color: #666; }\nimg { max-width: 100%; }\n</style>\n</head>\n<body>\n' + renderedHtml + '\n</body>\n</html>';
  var blob = new Blob([fullHtml], { type: 'text/html' });
  var a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'converted.html';
  a.click();
  URL.revokeObjectURL(a.href);
}

function loadSample() {
  document.getElementById('mdInput').value = '# Getting Started with Markdown\n\nMarkdown is a **lightweight markup language** that you can use to add formatting to plain text.\n\n## Why Use Markdown?\n\n- Easy to read and write in raw form\n- Converts to HTML, PDF, and many other formats\n- Used everywhere: GitHub, Reddit, Notion, Obsidian\n\n## Common Syntax\n\n| Element | Markdown |\n|---------|-------- |\n| Bold    | `**text**` |\n| Italic  | `*text*` |\n| Link    | `[text](url)` |\n| Code    | \\`code\\` |\n\n```python\ndef greet(name):\n    return f"Hello, {name}!"\n\nprint(greet("Markdown"))\n```\n\n> **Tip:** Markdown is perfect for writing documentation, notes, and content for the web.\n\n---\n\n### Links & Images\n\n- [Markdown Guide](https://www.markdownguide.org)\n- [marked.js](https://marked.js.org/)\n\nHappy writing! 🚀';
}
