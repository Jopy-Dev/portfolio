import assert from "node:assert/strict";
import test from "node:test";
import { parseContactRequest } from "../src/request.ts";

const valid = {
  name: "  Ada Lovelace  ",
  email: " ada@example.com ",
  subject: "  Engineering role  ",
  message: "Hello\r\nSecond line\rThird line",
  turnstileToken: "XXXX.DUMMY.TOKEN.XXXX",
  honeypot: "",
  requestId: "0b7c6c1e-8f3a-4d2b-9c1a-2f6e5d4c3b2a",
};

test("unknown fields are rejected", () => {
  const result = parseContactRequest({ ...valid, cc: "attacker@example.com" });
  assert.equal(result.success, false);
});

test("missing fields are rejected", () => {
  const { subject: _subject, ...withoutSubject } = valid;
  assert.equal(parseContactRequest(withoutSubject).success, false);
});

const accepts = (patch: Record<string, string>) =>
  parseContactRequest({ ...valid, ...patch }).success;

test("text limits count Unicode code points at inclusive boundaries", () => {
  const astral = "\u{1F600}";
  const cases: Array<[string, number, number]> = [
    ["name", 1, 80],
    ["subject", 1, 120],
    ["message", 1, 2000],
  ];
  for (const [field, min, max] of cases) {
    assert.equal(
      accepts({ [field]: astral.repeat(max) }),
      true,
      `${field} max`,
    );
    assert.equal(
      accepts({ [field]: astral.repeat(max + 1) }),
      false,
      `${field} over`,
    );
    assert.equal(accepts({ [field]: "x".repeat(min) }), true, `${field} min`);
    assert.equal(accepts({ [field]: "   " }), false, `${field} blank`);
  }
});

test("message length is measured after CRLF normalization", () => {
  assert.equal(accepts({ message: `${"x".repeat(1999)}\r\n` }), true);
});

test("message keeps surrounding whitespace exactly as written", () => {
  const result = parseContactRequest({ ...valid, message: "\n  indented\n" });
  assert.equal(result.success && result.data.message, "\n  indented\n");
});

test("honeypot allows empty and caps at 200 code points", () => {
  assert.equal(accepts({ honeypot: "" }), true);
  assert.equal(accepts({ honeypot: "x".repeat(200) }), true);
  assert.equal(accepts({ honeypot: "x".repeat(201) }), false);
});

test("single-line fields reject control characters and line separators", () => {
  for (const field of ["name", "subject", "email"]) {
    for (const bad of ["a\nb", "a\rb", "a\tb", "a\u0000b", "a\u0085b", "a b"]) {
      assert.equal(
        accepts({ [field]: bad }),
        false,
        `${field} ${JSON.stringify(bad)}`,
      );
    }
  }
});

test("message allows line feeds and tabs but rejects other controls", () => {
  assert.equal(accepts({ message: "line one\n\tline two" }), true);
  assert.equal(accepts({ message: "bell\u0007" }), false);
  assert.equal(accepts({ message: "nul\u0000" }), false);
});

test("lone surrogates are rejected in every text field", () => {
  for (const field of ["name", "subject", "message", "honeypot"]) {
    assert.equal(accepts({ [field]: "ok\uD800" }), false, field);
  }
});

test("email must be a valid address within 3 to 254 code points", () => {
  assert.equal(accepts({ email: "not-an-email" }), false);
  const domain = `${"b".repeat(63)}.${"c".repeat(60)}.${"d".repeat(60)}.com`;
  const maxEmail = `${"a".repeat(64)}@${domain}`;
  assert.equal(maxEmail.length, 254);
  assert.equal(accepts({ email: maxEmail }), true);
  assert.equal(accepts({ email: `a${maxEmail}` }), false);
});

test("Turnstile token is required and capped at 2048 characters", () => {
  assert.equal(accepts({ turnstileToken: "" }), false);
  assert.equal(accepts({ turnstileToken: "t".repeat(2048) }), true);
  assert.equal(accepts({ turnstileToken: "t".repeat(2049) }), false);
});

test("request id must be a canonical lowercase UUID", () => {
  assert.equal(accepts({ requestId: valid.requestId.toUpperCase() }), false);
  assert.equal(accepts({ requestId: "not-a-uuid" }), false);
  assert.equal(accepts({ requestId: `{${valid.requestId}}` }), false);
});

test("valid request is accepted with trimmed fields and LF-normalized message", () => {
  const result = parseContactRequest(valid);
  assert.equal(result.success, true);
  assert.deepEqual(result.success && result.data, {
    ...valid,
    name: "Ada Lovelace",
    email: "ada@example.com",
    subject: "Engineering role",
    message: "Hello\nSecond line\nThird line",
  });
});
