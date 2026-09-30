import assert from "node:assert/strict";
import test from "node:test";
import { validateContactFields } from "../../apps/site/src/lib/contact-client/validate-fields.ts";

const VALID = {
  name: "Ada Lovelace",
  email: "ada@example.test",
  subject: "Project enquiry",
  message: "Hello,\r\nI would like to talk.",
};

test("accepts complete fields with no errors", () => {
  assert.deepEqual(validateContactFields(VALID), {});
});

for (const [field, value, message] of [
  ["name", "   ", "Enter your name."],
  ["email", "ada@", "Enter a valid email address."],
  ["email", "", "Enter a valid email address."],
  ["subject", "", "Enter a subject."],
  ["message", " \n ", "Enter a message."],
  ["name", "a".repeat(81), "Use 80 characters or fewer."],
  ["email", `${"a".repeat(245)}@example.test`, "Use 254 characters or fewer."],
  ["subject", "s".repeat(121), "Use 120 characters or fewer."],
  ["message", "m".repeat(2001), "Use 2,000 characters or fewer."],
]) {
  test(`reports "${message}" for an invalid ${field}`, () => {
    assert.deepEqual(validateContactFields({ ...VALID, [field]: value }), {
      [field]: message,
    });
  });
}

test("counts characters as code points, so 80 emoji fit a name", () => {
  assert.deepEqual(
    validateContactFields({ ...VALID, name: "😀".repeat(80) }),
    {},
  );
});

test("reports every invalid field at once", () => {
  const errors = validateContactFields({
    name: "",
    email: "x",
    subject: "",
    message: "",
  });
  assert.deepEqual(Object.keys(errors), [
    "name",
    "email",
    "subject",
    "message",
  ]);
});
