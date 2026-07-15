import { test, expect } from "bun:test";
import { explain, runMatches, parseLiteral } from "../src/explain.js";

const descs = (p: string) => explain(p).map((t) => t.desc);
const toks = (p: string) => explain(p).map((t) => t.token);

test("parseLiteral strips /.../flags", () => {
  expect(parseLiteral("/ab+c/gi")).toEqual({ source: "ab+c", flags: "gi" });
  expect(parseLiteral("ab+c")).toEqual({ source: "ab+c", flags: "" });
});

test("explains anchors, classes and quantifiers", () => {
  const d = descs("^\\d{3}-\\d{4}$");
  expect(d).toContain("start of string/line");
  expect(d).toContain("any digit (0-9)");
  expect(d).toContain("exactly 3 time(s)");
  expect(d).toContain('literal "-"');
  expect(d).toContain("end of string/line");
});

test("explains quantifier variants", () => {
  expect(descs("a*")).toContain("zero or more");
  expect(descs("a+?")).toContain("one or more (lazy)");
  expect(descs("a{2,5}")).toContain("between 2 and 5 times");
  expect(descs("a{2,}")).toContain("2 or more times");
});

test("explains groups and char sets", () => {
  expect(toks("(?:ab)")).toContain("(?:");
  expect(descs("(?:ab)")).toContain("non-capturing group");
  expect(descs("[a-z]")).toContain("any of: a-z");
  expect(descs("[^0-9]")).toContain("none of: 0-9");
  expect(descs("(?=x)")).toContain("lookahead");
});

test("runMatches finds all matches with indices", () => {
  const m = runMatches("/\\d+/g", "a12 b345");
  expect(m.map((x) => x.match)).toEqual(["12", "345"]);
  expect(m[0].index).toBe(1);
});

test("runMatches avoids zero-width infinite loop", () => {
  const m = runMatches("/a*/g", "aa b");
  expect(m.length).toBeGreaterThan(0); // terminates
});
