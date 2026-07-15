// Pure regex explainer/tester — no vscode dependency, unit-testable.

const ESCAPES = {
  d: "any digit (0-9)",
  D: "any non-digit",
  w: "any word char (a-z, A-Z, 0-9, _)",
  W: "any non-word char",
  s: "any whitespace",
  S: "any non-whitespace",
  b: "a word boundary",
  B: "a non-word boundary",
  n: "a newline",
  t: "a tab",
  r: "a carriage return",
};

const QUANT = {
  "*": "zero or more",
  "+": "one or more",
  "?": "optional (zero or one)",
};

/** Strip surrounding /.../flags if present; returns { source, flags }. */
function parseLiteral(input) {
  const m = /^\/(.*)\/([a-z]*)$/is.exec(input.trim());
  return m ? { source: m[1], flags: m[2] } : { source: input.trim(), flags: "" };
}

/**
 * Tokenize a regex source into { token, desc } pieces. Not a full parser —
 * a readable, linear breakdown of the common constructs.
 */
function explain(input) {
  const { source } = parseLiteral(input);
  const out = [];
  let i = 0;
  const push = (token, desc) => out.push({ token, desc });

  while (i < source.length) {
    const c = source[i];

    if (c === "\\") {
      const n = source[i + 1];
      push(`\\${n}`, ESCAPES[n] ?? `literal "${n}"`);
      i += 2;
      continue;
    }
    if (c === "^") { push("^", "start of string/line"); i++; continue; }
    if (c === "$") { push("$", "end of string/line"); i++; continue; }
    if (c === ".") { push(".", "any character"); i++; continue; }
    if (c === "|") { push("|", "OR / alternation"); i++; continue; }

    if (c === "(") {
      if (source.startsWith("(?:", i)) { push("(?:", "non-capturing group"); i += 3; }
      else if (source.startsWith("(?=", i)) { push("(?=", "lookahead"); i += 3; }
      else if (source.startsWith("(?!", i)) { push("(?!", "negative lookahead"); i += 3; }
      else if (source.startsWith("(?<=", i)) { push("(?<=", "lookbehind"); i += 4; }
      else if (source.startsWith("(?<!", i)) { push("(?<!", "negative lookbehind"); i += 4; }
      else if (source.startsWith("(?<", i)) {
        const end = source.indexOf(">", i);
        push(source.slice(i, end + 1), "named capturing group");
        i = end + 1;
      } else { push("(", "start capturing group"); i++; }
      continue;
    }
    if (c === ")") { push(")", "end group"); i++; continue; }

    if (c === "[") {
      const end = source.indexOf("]", i + 1);
      const body = source.slice(i + 1, end);
      const negated = body.startsWith("^");
      push(source.slice(i, end + 1), `${negated ? "none of" : "any of"}: ${negated ? body.slice(1) : body}`);
      i = end + 1;
      continue;
    }

    if (c === "{") {
      const end = source.indexOf("}", i);
      const spec = source.slice(i + 1, end);
      const [min, max] = spec.split(",");
      let desc;
      if (max === undefined) desc = `exactly ${min} time(s)`;
      else if (max === "") desc = `${min} or more times`;
      else desc = `between ${min} and ${max} times`;
      push(source.slice(i, end + 1), desc);
      i = end + 1;
      continue;
    }

    if (QUANT[c]) {
      const lazy = source[i + 1] === "?";
      push(lazy ? c + "?" : c, QUANT[c] + (lazy ? " (lazy)" : ""));
      i += lazy ? 2 : 1;
      continue;
    }

    push(c, `literal "${c}"`);
    i++;
  }
  return out;
}

/** Run the regex against text, returning up to `limit` matches with indices. */
function runMatches(input, text, limit = 100) {
  const { source, flags } = parseLiteral(input);
  const re = new RegExp(source, flags.includes("g") ? flags : flags + "g");
  const out = [];
  for (let m = re.exec(text); m && out.length < limit; m = re.exec(text)) {
    out.push({ match: m[0], index: m.index, groups: m.slice(1) });
    if (m.index === re.lastIndex) re.lastIndex++; // avoid zero-width loop
  }
  return out;
}

module.exports = { explain, runMatches, parseLiteral };
