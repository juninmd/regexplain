const vscode = require("vscode");
const { explain, parseLiteral } = require("./src/explain");

function webviewHtml(pattern, tokens, flags = "") {
  // JSON inside <script>: escape "<" so a pattern containing </script> cannot break out.
  const lit = (v) => JSON.stringify(v).replace(/</g, "\\u003c");
  const jsFlags = flags.includes("g") ? flags : flags + "g";
  const rows = tokens
    .map(
      (t) =>
        `<tr><td class="tok">${esc(t.token)}</td><td>${esc(t.desc)}</td></tr>`,
    )
    .join("");
  return /* html */ `<!doctype html><html><head><meta charset="utf-8"/><style>
    body{font:13px ui-sans-serif,system-ui;background:#0b0f17;color:#e5e7eb;padding:14px}
    h2{font-size:15px} .pat{font-family:ui-monospace,monospace;color:#f59e0b;word-break:break-all}
    table{border-collapse:collapse;width:100%;margin-top:10px} td{border-top:1px solid #1f2937;padding:6px 8px;vertical-align:top}
    .tok{font-family:ui-monospace,monospace;color:#60a5fa;white-space:nowrap}
    input,textarea{width:100%;background:#0b0f17;border:1px solid #374151;color:#e5e7eb;border-radius:6px;padding:8px;font:inherit;margin-top:6px}
    #out{margin-top:8px;font-family:ui-monospace,monospace;white-space:pre-wrap} mark{background:#f59e0b;color:#1a1400}
  </style></head><body>
    <h2>regexplain</h2>
    <div class="pat">/${esc(pattern)}/</div>
    <table>${rows}</table>
    <h2 style="margin-top:16px">testar</h2>
    <textarea id="text" rows="4" placeholder="cole um texto para testar…"></textarea>
    <div id="out"></div>
    <script>
      const pattern = ${lit(pattern)}, flags = ${lit(jsFlags)};
      const el = document.getElementById('text'), out = document.getElementById('out');
      function esc(s){return s.replace(/[&<>]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;'}[c]));}
      el.addEventListener('input', () => {
        try {
          const t = el.value; let n = 0;
          out.innerHTML = esc(t).replace(new RegExp(pattern, flags), m => (n++, '<mark>'+esc(m)+'</mark>')) + '\\n\\n' + n + ' match(es)';
        } catch(e){ out.textContent = 'regex inválido: ' + e.message; }
      });
    </script>
  </body></html>`;
}

function esc(s) {
  return String(s).replace(/[&<>]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" })[c]);
}

function run() {
  const editor = vscode.window.activeTextEditor;
  if (!editor) return;
  const sel = editor.document.getText(editor.selection).trim();
  if (!sel) {
    vscode.window.showInformationMessage("regexplain: selecione um regex (com ou sem /barras/).");
    return;
  }
  const { source, flags } = parseLiteral(sel);
  const panel = vscode.window.createWebviewPanel("regexplain", "regexplain", vscode.ViewColumn.Beside, {
    enableScripts: true,
  });
  panel.webview.html = webviewHtml(source, explain(sel), flags);
}

function activate(context) {
  context.subscriptions.push(vscode.commands.registerCommand("regexplain.explain", run));
}

function deactivate() {}

module.exports = { activate, deactivate };
