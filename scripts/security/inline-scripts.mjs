// Small HTML scanner for CSP hashing. It walks the markup the way a browser
// tokenizer does for <script> raw text: attribute values may contain ">",
// script bodies end only at "</script" followed by space, "/" or ">", and the
// body is taken byte-for-byte (no entity decoding, no DOM re-serialization).

const TAG_BOUNDARY = /[\s/>]/;

function isScriptTagAt(html, index, prefix) {
  const end = index + prefix.length;
  return (
    html.slice(index, end).toLowerCase() === prefix &&
    TAG_BOUNDARY.test(html[end] ?? "")
  );
}

// Returns the index just past the start tag's closing ">", honoring quotes.
function endOfStartTag(html, from) {
  let quote = null;
  for (let index = from; index < html.length; index++) {
    const char = html[index];
    if (quote) {
      if (char === quote) quote = null;
    } else if (char === '"' || char === "'") {
      quote = char;
    } else if (char === ">") {
      return index + 1;
    }
  }
  throw new Error("Unterminated <script> start tag");
}

function endOfBody(html, from) {
  for (let index = from; index < html.length; index++) {
    if (html[index] === "<" && isScriptTagAt(html, index, "</script")) {
      return index;
    }
  }
  throw new Error("Unterminated <script> element");
}

function scriptElements(html) {
  const elements = [];
  let index = 0;
  while (index < html.length) {
    if (html.startsWith("<!--", index)) {
      const close = html.indexOf("-->", index + 4);
      index = close === -1 ? html.length : close + 3;
    } else if (html[index] === "<" && isScriptTagAt(html, index, "<script")) {
      const bodyStart = endOfStartTag(html, index + 7);
      const bodyEnd = endOfBody(html, bodyStart);
      elements.push({
        attributes: html.slice(index + 7, bodyStart - 1),
        body: html.slice(bodyStart, bodyEnd),
      });
      index = bodyEnd + 8;
    } else {
      index++;
    }
  }
  return elements;
}

// HTML spec "JavaScript MIME type essence" list plus "module"; any other
// type (JSON-LD, templates) is data the browser never executes.
const EXECUTABLE_TYPES = new Set([
  "",
  "module",
  "application/ecmascript",
  "application/javascript",
  "application/x-ecmascript",
  "application/x-javascript",
  "text/ecmascript",
  "text/javascript",
  "text/javascript1.0",
  "text/javascript1.1",
  "text/javascript1.2",
  "text/javascript1.3",
  "text/javascript1.4",
  "text/javascript1.5",
  "text/jscript",
  "text/livescript",
  "text/x-ecmascript",
  "text/x-javascript",
]);

function readName(source, from) {
  let index = from;
  while (index < source.length && !/[\s=/>]/.test(source[index])) index++;
  return { name: source.slice(from, index).toLowerCase(), next: index };
}

function readValue(source, from) {
  const quote = source[from];
  if (quote === '"' || quote === "'") {
    const close = source.indexOf(quote, from + 1);
    const end = close === -1 ? source.length : close;
    return { value: source.slice(from + 1, end), next: end + 1 };
  }
  let index = from;
  while (index < source.length && !/[\s>]/.test(source[index])) index++;
  return { value: source.slice(from, index), next: index };
}

function skipSpace(source, from) {
  let index = from;
  while (index < source.length && /[\s/]/.test(source[index])) index++;
  return index;
}

// Attribute names -> values, walked character by character so a quoted value
// can never be mistaken for another attribute.
function parseAttributes(source) {
  const attributes = new Map();
  let index = skipSpace(source, 0);
  while (index < source.length) {
    const { name, next } = readName(source, index);
    index = skipSpace(source, next);
    let value = "";
    if (source[index] === "=") {
      const read = readValue(source, skipSpace(source, index + 1));
      value = read.value;
      index = read.next;
    }
    if (name && !attributes.has(name)) attributes.set(name, value);
    index = skipSpace(source, Math.max(index, next + (name ? 0 : 1)));
  }
  return attributes;
}

function isExecutableInline(attributes) {
  const type = (attributes.get("type") ?? "").trim().toLowerCase();
  return !attributes.has("src") && EXECUTABLE_TYPES.has(type);
}

// The HTML input stream converts CRLF and lone CR to LF before tokenizing, so
// browsers hash the normalized text.
function normalizeNewlines(text) {
  return text.replace(/\r\n?/g, "\n");
}

export function executableInlineScripts(html) {
  return scriptElements(html)
    .filter((element) =>
      isExecutableInline(parseAttributes(element.attributes)),
    )
    .map((element) => normalizeNewlines(element.body));
}
