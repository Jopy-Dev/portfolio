import assert from "node:assert/strict";
import test from "node:test";
import { executableInlineScripts } from "../../scripts/security/inline-scripts.mjs";

test("returns the exact body of an inline script", () => {
  assert.deepEqual(
    executableInlineScripts("<p>x</p><script>self.a=1;</script><p>y</p>"),
    ["self.a=1;"],
  );
});

for (const [label, html, expected] of [
  [
    "a quoted '>' inside an attribute",
    '<script data-x="a>b">run()</script>',
    ["run()"],
  ],
  [
    "a single-quoted attribute",
    "<script data-x='</script>'>run()</script>",
    ["run()"],
  ],
  ["an uppercase closing tag with space", "<SCRIPT>run()</SCRIPT >", ["run()"]],
  [
    "a closing tag look-alike in the body",
    "<script>a='</scriptx>';</script>",
    ["a='</scriptx>';"],
  ],
  ["entities kept raw", "<script>a&amp;b</script>", ["a&amp;b"]],
  [
    "a <scripts> element that is not a script",
    "<scripts>x</scripts><script>y</script>",
    ["y"],
  ],
  [
    "a script inside an HTML comment",
    "<!-- <script>no()</script> --><script>yes()</script>",
    ["yes()"],
  ],
  ["an empty script", "<script></script>", [""]],
]) {
  test(`handles ${label}`, () => {
    assert.deepEqual(executableInlineScripts(html), expected);
  });
}

for (const [label, html, expected] of [
  ["an external script", '<script src="/_next/a.js" async></script>', []],
  ["JSON-LD data", '<script type="application/ld+json">{"a":1}</script>', []],
  [
    "an unknown data type",
    '<script type="text/template"><b>x</b></script>',
    [],
  ],
  ["a module script", '<script type="module">m()</script>', ["m()"]],
  [
    "a classic MIME type",
    '<script type="text/javascript">c()</script>',
    ["c()"],
  ],
  [
    "an uppercase MIME type",
    '<script type="Application/JavaScript">u()</script>',
    ["u()"],
  ],
  ["an empty type", '<script type="">e()</script>', ["e()"]],
  [
    "a src named inside another attribute",
    '<script data-src="x">d()</script>',
    ["d()"],
  ],
]) {
  test(`classifies ${label}`, () => {
    assert.deepEqual(executableInlineScripts(html), expected);
  });
}

test("normalizes CRLF and lone CR to LF, as the HTML parser does", () => {
  assert.deepEqual(executableInlineScripts("<script>a\r\nb\rc</script>"), [
    "a\nb\nc",
  ]);
});

test("rejects an unterminated script so hashing never guesses", () => {
  assert.throws(() => executableInlineScripts("<script>run()"), /Unterminated/);
});
