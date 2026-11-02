let currentMarkdown = '';
let turndownService = null;

function initTurndown() {
  if (typeof TurndownService === 'undefined') return null;
  if (!turndownService) {
    turndownService = new TurndownService({
      headingStyle: 'atx',
      codeBlockStyle: 'fenced',
      emDelimiter: '*',
      bulletListMarker: '-',
      linkStyle: 'inlined',
      linkReferenceStyle: 'full'
    });

    // --- Confluence-specific rules ---

    // Strip ac:structured-macro wrappers — keep inner content
    turndownService.addRule('confluenceMacro', {
      filter: function(node) {
        if (node.nodeType !== 1) return false;
        if (node.tagName && node.tagName.indexOf('AC:') === 0) return true;
        if (node.getAttribute && node.getAttribute('data-macro-name')) return true;
        return false;
      },
      replacement: function(content) {
        return content;
      }
    });

    // Handle ac:rich-text-body — just pass through content
    turndownService.addRule('confluenceRichTextBody', {
      filter: function(node) {
        return node.tagName === 'AC:RICH-TEXT-BODY';
      },
      replacement: function(content) {
        return content;
      }
    });

    // Handle ac:link (user mentions)
    turndownService.addRule('confluenceLink', {
      filter: function(node) {
        return node.tagName === 'AC:LINK';
      },
      replacement: function(content, node) {
        // Try to find @mention text
        var alt = node.getAttribute('alt') || '';
        return alt ? '@' + alt : (content || '');
      }
    });

    // Convert info panels to blockquotes with label
    turndownService.addRule('confluenceInfoPanel', {
      filter: function(node) {
        if (node.nodeType !== 1) return false;
        var cls = node.className || '';
        return cls.indexOf('confluence-information-macro') !== -1 ||
               cls.indexOf('aui-message') !== -1 ||
               cls.indexOf('panel') !== -1;
      },
      replacement: function(content, node) {
        var cls = node.className || '';
        var prefix = '';
        if (cls.indexOf('info') !== -1) prefix = '**ℹ️ Info:** ';
        else if (cls.indexOf('warning') !== -1 || cls.indexOf('note') !== -1) prefix = '**⚠️ Warning:** ';
        else if (cls.indexOf('tip') !== -1) prefix = '**💡 Tip:** ';
        else if (cls.indexOf('error') !== -1 || cls.indexOf('danger') !== -1) prefix = '**❌ Error:** ';
        else if (cls.indexOf('success') !== -1) prefix = '**✅ Success:** ';
        return '> ' + prefix + content.trim().replace(/\n/g, '\n> ');
      }
    });

    // Handle Confluence task lists
    turndownService.addRule('confluenceTaskList', {
      filter: function(node) {
        return node.tagName === 'AC:TASK-LIST';
      },
      replacement: function(content) {
        return content;
      }
    });

    turndownService.addRule('confluenceTask', {
      filter: function(node) {
        return node.tagName === 'AC:TASK';
      },
      replacement: function(content, node) {
        var statusEl = node.querySelector('ac\\:task-status, AC\\:TASK-STATUS');
        var bodyEl = node.querySelector('ac\\:task-body, AC\\:TASK-BODY');
        var checked = statusEl && (statusEl.textContent || '').trim().toLowerCase() === 'complete';
        var body = bodyEl ? bodyEl.textContent.trim() : content.trim();
        return '- [' + (checked ? 'x' : ' ') + '] ' + body + '\n';
      }
    });

    // Strip Confluence span wrappers
    turndownService.addRule('confluenceSpan', {
      filter: function(node) {
        if (node.nodeType !== 1) return false;
        return node.tagName === 'SPAN' && !node.className;
      },
      replacement: function(content) {
        return content;
      }
    });

    // Handle Confluence emoji
    turndownService.addRule('confluenceEmoji', {
      filter: function(node) {
        if (node.nodeType !== 1) return false;
        if (!node.getAttribute) return false;
        return node.tagName === 'AC:EMOJI' || node.getAttribute('data-emoji-shortname');
      },
      replacement: function(content, node) {
        var shortname = (node.getAttribute('data-emoji-shortname') || content || '').replace(/:/g, '');
        var emojiMap = {
          'thumbsup': '👍', 'thumbsdown': '👎', 'clap': '👏', 'rocket': '🚀',
          'star': '⭐', 'check': '✅', 'cross': '❌', 'warning': '⚠️',
          'info': 'ℹ️', 'question': '❓', 'bulb': '💡', 'fire': '🔥',
          'tada': '🎉', 'smile': '😊', 'slight_smile': '🙂', 'grin': '😁',
          'wink': '😉', 'heart': '❤️', 'green_heart': '💚', 'blue_heart': '💙',
          'broken_heart': '💔', 'ok': '🆗', 'cool': '🆒'
        };
        return emojiMap[shortname] || ':' + shortname + ':';
      }
    });

    // Remove Confluence TOC macro
    turndownService.addRule('confluenceTOC', {
      filter: function(node) {
        return node.tagName === 'AC:STRUCTURED-MACRO' && node.getAttribute('ac:name') === 'toc';
      },
      replacement: function() {
        return '';
      }
    });

    // Remove Confluence children macro
    turndownService.addRule('confluenceChildren', {
      filter: function(node) {
        return node.tagName === 'AC:STRUCTURED-MACRO' && node.getAttribute('ac:name') === 'children';
      },
      replacement: function() {
        return '';
      }
    });

    // Date lozenges
    turndownService.addRule('confluenceDate', {
      filter: function(node) {
        return node.tagName === 'TIME' || (node.getAttribute && node.getAttribute('data-date'));
      },
      replacement: function(content) {
        return content || '';
      }
    });

    // Strip data-* attributes that clutter Markdown
    turndownService.addRule('cleanDataAttrs', {
      filter: function(node) {
        if (node.nodeType === 1 && node.getAttribute) {
          var attrs = node.attributes;
          for (var i = attrs.length - 1; i >= 0; i--) {
            if (attrs[i].name.startsWith('data-') && attrs[i].name !== 'data-date') {
              // Don't remove — just flag for stripping. Turndown will handle naturally.
            }
          }
        }
        return false; // Don't modify output — just run through
      },
      replacement: function(content) {
        return content;
      }
    });
  }
  return turndownService;
}

function setStatus(msg, type) {
  var el = document.getElementById('status');
  el.className = 'status' + (type ? ' ' + type : '');
  el.textContent = msg;
}

function convertConfluence() {
  var html = document.getElementById('htmlInput').value.trim();
  if (!html) { setStatus('Please paste your Confluence HTML content first.', 'error'); return; }

  var td = initTurndown();
  if (!td) { setStatus('Turndown library not loaded. Please check your internet connection.', 'error'); return; }

  try {
    // Pre-process: wrap raw HTML if it starts with DOCTYPE/html
    var toProcess = html;
    // Re-encode to handle Confluence storage format entities
    currentMarkdown = td.turndown(toProcess);

    // Post-process: clean up common Confluence artifacts
    currentMarkdown = currentMarkdown
      .replace(/\\\[/g, '[')
      .replace(/\\\]/g, ']')
      .replace(/\n{3,}/g, '\n\n')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .trim();

    document.getElementById('resultContent').textContent = currentMarkdown;
    document.getElementById('resultTitle').textContent = 'Markdown Output (' + currentMarkdown.length + ' chars)';
    document.getElementById('resultArea').classList.add('show');
    setStatus('Conversion complete! ' + currentMarkdown.length + ' characters of Markdown generated.', 'success');
  } catch (e) {
    setStatus('Error: ' + e.message, 'error');
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
    alert('Failed to copy. You can select all and copy manually.');
  }
}

function downloadResult() {
  var blob = new Blob([currentMarkdown], { type: 'text/markdown' });
  var a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'confluence-export.md';
  a.click();
  URL.revokeObjectURL(a.href);
}

function loadCFSample() {
  document.getElementById('htmlInput').value = '<div class="content-wrapper">\n  <h1>Sprint #42 Retrospective</h1>\n  <p>Led by <ac:link><ri:user ri:userkey="jane"/></ac:link>@jane &mdash; Sprint ended 2024-03-15</p>\n\n  <ac:structured-macro ac:name="info">\n    <ac:rich-text-body>\n      <p><strong>Goal:</strong> Complete user auth module and deploy v2.1.</p>\n    </ac:rich-text-body>\n  </ac:structured-macro>\n\n  <h2>What Went Well</h2>\n  <ul>\n    <li>Auth module shipped on time 🚀</li>\n    <li>Code review turnaround improved to &lt;2h</li>\n    <li>Zero P0 bugs in production</li>\n  </ul>\n\n  <h2>Action Items</h2>\n  <ac:task-list>\n    <ac:task>\n      <ac:task-status>complete</ac:task-status>\n      <ac:task-body>Fix login redirect bug (#4231)</ac:task-body>\n    </ac:task>\n    <ac:task>\n      <ac:task-status>incomplete</ac:task-status>\n      <ac:task-body>Add 2FA support for admin accounts</ac:task-body>\n    </ac:task>\n    <ac:task>\n      <ac:task-status>incomplete</ac:task-status>\n      <ac:task-body>Update API documentation for v2.1</ac:task-body>\n    </ac:task>\n  </ac:task-list>\n\n  <h2>Sprint Metrics</h2>\n  <table>\n    <tr><th>Metric</th><th>Target</th><th>Actual</th></tr>\n    <tr><td>Story Points</td><td>34</td><td>32</td></tr>\n    <tr><td>Bugs Resolved</td><td>12</td><td>15</td></tr>\n    <tr><td>Velocity</td><td>34</td><td>32</td></tr>\n  </table>\n\n  <ac:structured-macro ac:name="code">\n    <ac:parameter ac:name="language">bash</ac:parameter>\n    <ac:plain-text-body><![CDATA[$ npm run deploy\n✅ Build complete\n✅ Deployed to production]]></ac:plain-text-body>\n  </ac:structured-macro>\n</div>';
}

// Drag and drop support
var dropZone = document.getElementById('dropZone');
dropZone.addEventListener('dragover', function(e) { e.preventDefault(); dropZone.classList.add('dragover'); });
dropZone.addEventListener('dragleave', function() { dropZone.classList.remove('dragover'); });
dropZone.addEventListener('drop', function(e) {
  e.preventDefault();
  dropZone.classList.remove('dragover');
  var file = e.dataTransfer.files[0];
  if (file) {
    var reader = new FileReader();
    reader.onload = function(ev) {
      document.getElementById('htmlInput').value = ev.target.result;
      setStatus('File loaded: ' + file.name + ' (' + (file.size / 1024).toFixed(1) + ' KB)', 'info');
    };
    reader.readAsText(file);
  }
});
