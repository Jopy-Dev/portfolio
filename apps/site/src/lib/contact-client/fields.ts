// Field names and order only: safe to import from the first page load
// because it carries no validation code.
export type ContactFields = {
  name: string;
  email: string;
  subject: string;
  message: string;
};

export type FieldName = keyof ContactFields;
export type FieldErrors = Partial<Record<FieldName, string>>;

export const FIELD_ORDER: readonly FieldName[] = [
  "name",
  "email",
  "subject",
  "message",
];
