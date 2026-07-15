# 🧵 regexplain

Select a regular expression, run **regexplain: Explicar regex selecionado** (`Ctrl+Alt+R`), and get a **plain-language breakdown** of every token in a side panel — plus a **live tester** where you paste sample text and see matches highlighted as you type.

Accepts both `\d{3}-\d{4}` and `/\d{3}-\d{4}/gi` (flags are honored in the tester).

## Explains
Anchors (`^ $`), classes (`\d \w \s \b`), quantifiers (`* + ? {n,m}`, lazy), groups (capturing, non-capturing, named, look-ahead/behind), character sets (`[a-z]`, negated), alternation, and literals.

## Layout
- `src/explain.js` — pure `explain()` tokenizer + `runMatches()` (the tested core).
- `extension.js` — webview panel with the breakdown + live match tester.

## Dev
```bash
bun test
# F5 for the Extension Development Host, or: npx @vscode/vsce package
```

MIT.
