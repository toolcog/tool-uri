import type { UriCharset } from "../uri/lex.ts";
import {
  isPctEncoded,
  isReservedChar,
  isUnreservedChar,
  pctEncodeUtf8,
} from "../uri/lex.ts";
import { UriTemplateError } from "./error.ts";
import type {
  UriTemplate,
  UriExpansionOperator,
  UriExpression,
  UriVariableOptions,
  UriVariable,
} from "./template.ts";
import {
  createUriTemplate,
  createUriExpression,
  createUriVariable,
} from "./template.ts";
import { isLiteralChar, isVarChar } from "./lex.ts";

/** @internal */
interface InputBuffer {
  readonly input: string;
  offset: number;
  limit: number;
  readonly ucs: boolean;
}

/**
 * Parses an RFC 6570 URI template.
 *
 * @throws UriTemplateError if the input is malformed.
 * @category UriTemplate
 */
export function parseUriTemplate(input: string): UriTemplate {
  const buf = { input, offset: 0, limit: input.length, ucs: true };
  const template = parseUriTemplateParts(buf);
  if (buf.offset !== input.length) {
    throw new UriTemplateError(
      "Invalid URI template " + JSON.stringify(input),
      buf,
    );
  }
  return template;
}

/**
 * Parses an RFC 6570 URI template, returning `undefined` if the input
 * is malformed.
 *
 * @category UriTemplate
 */
export function tryParseUriTemplate(input: string): UriTemplate | undefined {
  try {
    return parseUriTemplate(input);
  } catch {
    return undefined;
  }
}

/**
 * Parses an RFC 6570 expression.
 *
 * @throws UriTemplateError if the input is malformed.
 * @category UriExpression
 */
export function parseUriExpression(input: string): UriExpression {
  const buf = { input, offset: 0, limit: input.length, ucs: true };
  const expression = parseUriTemplateExpression(buf);
  if (buf.offset !== input.length) {
    throw new UriTemplateError(
      "Invalid URI template expression " + JSON.stringify(input),
      buf,
    );
  }
  return expression;
}

/**
 * Parses an RFC 6570 expression, returning `undefined` if the input
 * is malformed.
 *
 * @category UriExpression
 */
export function tryParseUriExpression(
  input: string,
): UriExpression | undefined {
  try {
    return parseUriExpression(input);
  } catch {
    return undefined;
  }
}

/**
 * Parses an RFC 6570 variable specifier.
 *
 * @throws UriTemplateError if the input is malformed.
 * @category UriVariable
 */
export function parseUriVariable(
  input: string,
  options?: UriVariableOptions,
): UriVariable {
  const buf = { input, offset: 0, limit: input.length, ucs: true };
  const variable = parseUriTemplateVariable(buf, options);
  if (buf.offset !== input.length) {
    throw new UriTemplateError(
      "Invalid URI template variable " + JSON.stringify(input),
      buf,
    );
  }
  return variable;
}

/**
 * Parses an RFC 6570 variable specifier, returning `undefined` if the input
 * is malformed.
 *
 * @category UriVariable
 */
export function tryParseUriVariable(
  input: string,
  options?: UriVariableOptions,
): UriVariable | undefined {
  try {
    return parseUriVariable(input, options);
  } catch {
    return undefined;
  }
}

/** @internal */
function parseUriTemplateParts(buf: InputBuffer): UriTemplate {
  const parts: (UriExpression | string)[] = [];
  let literal = "";

  let start = buf.offset;
  while (buf.offset < buf.limit) {
    // Decode the next Unicode character.
    const c = buf.input.codePointAt(buf.offset)!;
    if (c === 0x7b /*"{"*/) {
      // Append any accumulated literal part.
      literal += buf.input.slice(start, buf.offset);
      if (literal.length !== 0) {
        parts.push(literal);
        literal = "";
      }
      buf.offset += 1;
      start = buf.offset;

      // Scan for expression end.
      const end = Math.min(buf.input.indexOf("}", buf.offset), buf.limit);
      if (end === -1) {
        throw new UriTemplateError("Unclosed URI template expression", buf);
      }

      // Parse and append the expression part.
      const limit = buf.limit;
      buf.limit = end;
      const expression = parseUriTemplateExpression(buf);
      parts.push(expression);
      buf.offset = end + 1;
      buf.limit = limit;
      start = buf.offset;
    } else if (isUnreservedChar(c) || isReservedChar(c)) {
      // Accumulate literal character.
      buf.offset += 1;
    } else if (isPctEncoded(buf)) {
      // Accumulate percent-encoded triplet.
      buf.offset += 3;
    } else if (isLiteralChar(c)) {
      literal += buf.input.slice(start, buf.offset);
      if (start !== buf.offset) {
        parts.push(literal + buf.input.slice(start, buf.offset));
        literal = "";
      }
      literal += pctEncodeUtf8(c);
      buf.offset += c > 0xffff ? 2 : 1;
      start = buf.offset;
    } else {
      throw new UriTemplateError(
        "Invalid URI template literal character " +
          JSON.stringify(String.fromCharCode(c)),
        buf,
      );
    }
  }

  // Append any trailing literal part.
  if (start < buf.limit) {
    parts.push(literal + buf.input.slice(start));
  }

  return createUriTemplate(parts);
}

/** @internal */
function parseUriTemplateExpression(buf: InputBuffer): UriExpression {
  if (buf.offset >= buf.limit) {
    throw new UriTemplateError("Empty URI template expression", buf);
  }

  // Parse the expansion operator.
  let operator: UriExpansionOperator;
  let first: string;
  let separator: string;
  let named: boolean;
  let empty: string;
  let allow: UriCharset;
  const c = buf.input.charCodeAt(buf.offset);
  switch (c) {
    case 0x2b: // "+"
      buf.offset += 1;
      operator = "+";
      first = "";
      separator = ",";
      named = false;
      empty = "";
      allow = "reserved";
      break;
    case 0x23: // "#"
      buf.offset += 1;
      operator = "#";
      first = "#";
      separator = ",";
      named = false;
      empty = "";
      allow = "reserved";
      break;
    case 0x2e: // "."
      buf.offset += 1;
      operator = ".";
      first = ".";
      separator = ".";
      named = false;
      empty = "";
      allow = "unreserved";
      break;
    case 0x2f: // "/"
      buf.offset += 1;
      operator = "/";
      first = "/";
      separator = "/";
      named = false;
      empty = "";
      allow = "unreserved";
      break;
    case 0x3b: // ";"
      buf.offset += 1;
      operator = ";";
      first = ";";
      separator = ";";
      named = true;
      empty = "";
      allow = "unreserved";
      break;
    case 0x3f: // "?"
      buf.offset += 1;
      operator = "?";
      first = "?";
      separator = "&";
      named = true;
      empty = "=";
      allow = "unreserved";
      break;
    case 0x26: // "&"
      buf.offset += 1;
      operator = "&";
      first = "&";
      separator = "&";
      named = true;
      empty = "=";
      allow = "unreserved";
      break;
    case 0x3d: // "="
    case 0x2c: // ","
    case 0x21: // "!"
    case 0x40: // "@"
    case 0x7c: // "|"
      throw new UriTemplateError(
        "Reserved URI template operator: " +
          JSON.stringify(String.fromCharCode(c)),
        buf,
      );
    default:
      operator = "";
      first = "";
      separator = ",";
      named = false;
      empty = "";
      allow = "unreserved";
  }

  // Parse the variable list.
  const variables: UriVariable[] = [];
  while (true) {
    let end = Math.min(buf.input.indexOf(",", buf.offset), buf.limit);
    if (end === -1) {
      end = buf.limit;
    }

    const limit = buf.limit;
    buf.limit = end;
    const variable = parseUriTemplateVariable(buf, {
      separator,
      named,
      empty,
      allow,
    });
    variables.push(variable);
    buf.limit = limit;
    if (end < buf.limit) {
      buf.offset = end + 1;
    } else {
      break;
    }
  }

  return createUriExpression(operator, variables, { first, separator });
}

/** @internal */
function parseUriTemplateVariable(
  buf: InputBuffer,
  options: UriVariableOptions | undefined,
): UriVariable {
  const start = buf.offset;

  // Parse the variable name.
  let c = buf.input.codePointAt(buf.offset)!;
  if (isVarChar(c)) {
    buf.offset += c > 0xffff ? 2 : 1;
  } else if (isPctEncoded(buf)) {
    buf.offset += 3;
  } else {
    throw new UriTemplateError("Expected URI template variable name", buf);
  }

  while (buf.offset < buf.limit) {
    c = buf.input.codePointAt(buf.offset)!;
    if (c === 0x2e /*"."*/) {
      buf.offset += 1;
      c = buf.offset < buf.limit ? buf.input.codePointAt(buf.offset)! : -1;
    }
    if (isVarChar(c)) {
      buf.offset += c > 0xffff ? 2 : 1;
    } else if (isPctEncoded(buf)) {
      buf.offset += 3;
    } else {
      break;
    }
  }

  const name = buf.input.slice(start, buf.offset);

  if (buf.offset >= buf.limit) {
    return createUriVariable(name, {
      ...options,
      maxLength: undefined,
      explode: false,
    });
  }

  c = buf.input.charCodeAt(buf.offset);
  if (c === 0x2a /*"*"*/) {
    buf.offset += 1;
    if (buf.offset < buf.limit) {
      throw new UriTemplateError("Invalid URI template variable", buf);
    }
    return createUriVariable(name, {
      ...options,
      maxLength: undefined,
      explode: true,
    });
  } else if (c === 0x3a /*":"*/) {
    buf.offset += 1;
    let maxLength = 0;
    while (maxLength < 1000 && buf.offset < buf.limit) {
      c = buf.input.charCodeAt(buf.offset);
      if (
        (maxLength === 0 && (c < 0x31 || c > 0x39)) || // 1-9
        (maxLength !== 0 && (c < 0x30 || c > 0x39)) // 0-9
      ) {
        break;
      }
      maxLength = maxLength * 10 + (c - 0x30);
      buf.offset += 1;
    }
    if (maxLength === 0) {
      throw new UriTemplateError(
        "Invalid URI template variable max length modifier",
        buf,
      );
    }
    if (buf.offset < buf.limit) {
      throw new UriTemplateError("Invalid URI template variable", buf);
    }
    return createUriVariable(name, {
      ...options,
      maxLength,
      explode: false,
    });
  }

  throw new UriTemplateError("Invalid URI template variable", buf);
}
