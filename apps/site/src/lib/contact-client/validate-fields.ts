import {
  ContactRequestSchema,
  codePointLength,
} from "@jopy-dev/contact-contract";
import {
  type ContactFields,
  FIELD_ORDER,
  type FieldErrors,
  type FieldName,
} from "./fields.ts";

export type { ContactFields, FieldErrors, FieldName };
export { FIELD_ORDER };

// Approved error text; keep the wording exact. Limits mirror the shared
// request schema.
const RULES: Record<FieldName, { max: number; missing: string }> = {
  name: { max: 80, missing: "Enter your name." },
  email: { max: 254, missing: "Enter a valid email address." },
  subject: { max: 120, missing: "Enter a subject." },
  message: { max: 2000, missing: "Enter a message." },
};

function lengthOf(field: FieldName, value: string): number {
  const normalized =
    field === "message" ? value.replace(/\r\n?/g, "\n") : value.trim();
  return codePointLength(normalized);
}

// The Worker schema stays authoritative; this reuses it field by field so
// the client can never accept something the Worker would reject.
function errorFor(field: FieldName, value: string): string | undefined {
  if (ContactRequestSchema.shape[field].safeParse(value).success) {
    return undefined;
  }
  const { max, missing } = RULES[field];
  if (lengthOf(field, value) > max) {
    return `Use ${max.toLocaleString("en-US")} characters or fewer.`;
  }
  return missing;
}

export function validateContactFields(fields: ContactFields): FieldErrors {
  const errors: FieldErrors = {};
  for (const field of FIELD_ORDER) {
    const error = errorFor(field, fields[field]);
    if (error) errors[field] = error;
  }
  return errors;
}
