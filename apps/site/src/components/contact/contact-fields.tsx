import type { FieldErrors, FieldName } from "@/lib/contact-client/fields";

type FormFieldProps = {
  name: FieldName;
  label: string;
  type?: "email" | "text";
  autoComplete?: string;
  maxLength: number;
  multiline?: boolean;
  error: string | undefined;
};

function FormField({
  name,
  label,
  type = "text",
  autoComplete,
  maxLength,
  multiline = false,
  error,
}: FormFieldProps) {
  const id = `contact-${name}`;
  const errorId = `${id}-error`;
  const shared = {
    id,
    name,
    maxLength,
    required: true,
    "aria-invalid": error ? true : undefined,
    "aria-describedby": error ? errorId : undefined,
  };
  // Error text sits outside the label so it describes, not renames, the field.
  return (
    <div className="form-field">
      <label htmlFor={id}>{label}</label>
      {multiline ? (
        <textarea rows={7} {...shared} />
      ) : (
        <input type={type} autoComplete={autoComplete} {...shared} />
      )}
      {error ? (
        <small className="form-field__error" id={errorId}>
          {error}
        </small>
      ) : null}
    </div>
  );
}

type FieldSpec = Omit<FormFieldProps, "error">;

const PAIRED_FIELDS: readonly FieldSpec[] = [
  { name: "name", label: "Name", autoComplete: "name", maxLength: 80 },
  {
    name: "email",
    label: "Email",
    type: "email",
    autoComplete: "email",
    maxLength: 254,
  },
];

const FULL_WIDTH_FIELDS: readonly FieldSpec[] = [
  { name: "subject", label: "Subject", maxLength: 120 },
  { name: "message", label: "Message", multiline: true, maxLength: 2000 },
];

// Honeypot for bots: hidden from people and assistive technology.
function HoneypotField() {
  return (
    <div className="contact-form__trap" aria-hidden="true">
      <label>
        Leave this field empty
        <input name="website" tabIndex={-1} autoComplete="off" />
      </label>
    </div>
  );
}

export function ContactFieldGroup({ errors }: { errors: FieldErrors }) {
  const render = (spec: FieldSpec) => (
    <FormField key={spec.name} {...spec} error={errors[spec.name]} />
  );
  return (
    <>
      <div className="field-row">{PAIRED_FIELDS.map(render)}</div>
      {FULL_WIDTH_FIELDS.map(render)}
      <HoneypotField />
    </>
  );
}
