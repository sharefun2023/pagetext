let currentHtml = '';

function loadSample() {
  document.getElementById('mdInput').value =
    '# Markdown to PDF Demo\n\n' +
    'Welcome to the **Markdown to PDF converter** by [pagetext.io](https://pagetext.io).\n\n' +
    '## Key Features\n\n' +
    '- **Privacy first** — everything runs in your browser\n' +
    '- **No sign-up** — start converting immediately\n' +
    '- **GFM support** — tables, code blocks, and more\n' +
    '- **Professional output** — clean A4 PDFs\n\n' +
    '### Code Block Example\n\n' +
    '```javascript\n' +
    "const greeting = 'Hello, Markdown!';\n" +
    'console.log(greeting);\n' +
    '```\n\n' +
    '### Table Example\n\n' +
    '| Format   | Extension | Use Case            |\n' +
    '|----------|----------|---------------------|\n' +
    '| Markdown | .md      | Writing & editing   |\n' +
    '| HTML     | .html    | Web publishing      |\n' +
    '| PDF      | .pdf     | Sharing & printing  |\n\n' +
    '> **Tip:** Markdown is the most portable document format. Convert to PDF when you need a polished, print-ready version.\n\n' +
    '---\n\n' +
    '### Next Steps\n\n' +
    '1. Edit this text or paste your own Markdown\n' +
    '2. Click **Convert to PDF** to preview\n' +
    '3. Click **Download PDF** to save your document\n\n' +
    'Happy converting! 🚀';
}

function setStatus(msg, type) {
  var el = document.getElementById('status');
  el.className = 'status' + (type ? ' ' + type : '');
  el.textContent = msg;
}

function convertToPdf() {
  var md = document.getElementById('mdInput').value.trim();
  if (!md) { setStatus('Please enter some Markdown text first.', 'error'); return; }

  setStatus('Rendering Markdown...', 'info');

  try {
    currentHtml = marked.parse(md, { breaks: true, gfm: true });

    var previewContent = document.getElementById('previewContent');
    previewContent.innerHTML = currentHtml;

    document.getElementById('previewSection').classList.add('show');
    setStatus('Preview ready! Click "Download PDF" to save.', 'success');
  } catch (e) {
    setStatus('Error rendering Markdown: ' + e.message, 'error');
  }
}

function downloadPdf() {
  if (!currentHtml) {
    setStatus('Please convert your Markdown first.', 'error');
    return;
  }

  setStatus('Generating PDF...', 'info');

  try {
    var { jsPDF } = window.jspdf;
    var doc = new jsPDF({ unit: 'mm', format: 'a4' });

    // Create a temporary off-screen div for PDF-friendly rendering
    var tempDiv = document.createElement('div');
    tempDiv.innerHTML = currentHtml;
    tempDiv.style.cssText = 'font-family:Georgia,Times,serif;font-size:12pt;line-height:1.7;color:#1a1a2e;padding:10mm;max-width:190mm;word-wrap:break-word;';

    // Style elements inside for PDF readability
    var styles = tempDiv.querySelectorAll('*');
    styles.forEach(function(el) {
      el.style.fontFamily = 'Georgia, Times, serif';
      if (el.tagName === 'CODE' || el.tagName === 'PRE') {
        el.style.fontFamily = 'Courier New, monospace';
        el.style.fontSize = '10pt';
      }
      if (el.tagName === 'PRE') {
        el.style.background = '#f5f5f5';
        el.style.padding = '8px';
        el.style.borderRadius = '4px';
      }
    });

    document.body.appendChild(tempDiv);

    doc.html(tempDiv, {
      callback: function(pdf) {
        pdf.save('document.pdf');
        document.body.removeChild(tempDiv);
        setStatus('PDF downloaded successfully!', 'success');
      },
      margin: [10, 10, 10, 10],
      autoPaging: 'text',
      html2canvas: {
        scale: 0.25,
        useCORS: true,
        logging: false
      },
      x: 10,
      y: 10,
      width: 190
    });
  } catch (e) {
    setStatus('Error generating PDF: ' + e.message, 'error');
  }
}
