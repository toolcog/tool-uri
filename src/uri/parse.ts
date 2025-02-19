import { UriError } from "./error.ts";
import type { Uri } from "./uri.ts";
import {
  isAlpha,
  isDigit,
  isSchemeChar,
  isUserinfoChar,
  isHostChar,
  isPathChar,
  isQueryChar,
  isFragmentChar,
  isHexChar,
  isPctEncoded,
} from "./lex.ts";

/** @internal */
interface InputBuffer {
  readonly input: string;
  offset: number;
  limit: number;
  readonly ucs: boolean;
}

/**
 * Parses an RFC 3986 URI.
 *
 * @throws UriError if the input is malformed.
 * @category Uri
 */
export function parseUri(input: string): Uri;

/** @internal */
export function parseUri(buf: InputBuffer): Uri;

export function parseUri(input: string | InputBuffer): Uri {
  const buf =
    typeof input === "string" ?
      { input, offset: 0, limit: input.length, ucs: false }
    : input;

  const components: {
    href?: string | undefined;
    scheme?: string | undefined;
    relative?: string | undefined;
    authority?: string | undefined;
    userinfo?: string | undefined;
    host?: string | undefined;
    hostname?: string | undefined;
    ipv4?: string | undefined;
    ipv6?: string | undefined;
    ipvFuture?: string | undefined;
    port?: string | undefined;
    path?: string | undefined;
    query?: string | undefined;
    fragment?: string | undefined;
  } = {};

  // URI = scheme ":" hier-part [ "?" query ] [ "#" fragment ]
  const uriStart = buf.offset;
  components.href = undefined; // Reserve slot.

  components.scheme = parseScheme(buf);

  if (
    buf.offset >= buf.limit ||
    buf.input.charCodeAt(buf.offset) !== 0x3a /*":"*/
  ) {
    throw new UriError("Invalid scheme ", buf);
  }
  buf.offset += 1; // ":"

  parseRelativeRef(buf, components);

  components.href = buf.input.slice(uriStart, buf.offset);

  if (typeof input === "string" && buf.offset !== input.length) {
    throw new UriError("Invalid URI " + JSON.stringify(input), buf);
  }
  return components as Uri;
}

/**
 * Parses an RFC 3986 URI, returning `undefined` if the input is malformed.
 *
 * @category Uri
 */
export function tryParseUri(input: string): Uri | undefined {
  try {
    return parseUri(input);
  } catch {
    return undefined;
  }
}

/**
 * Returns `true` if the given string is a valid RFC 3986 URI.
 *
 * @category Uri
 */
export function isValidUri(input: string): boolean {
  return tryParseUri(input) !== undefined;
}

/**
 * Parses an RFC 3986 URI reference.
 *
 * @throws UriError if the input is malformed.
 * @category Uri
 */
export function parseUriReference(input: string): Uri;

/** @internal */
export function parseUriReference(buf: InputBuffer): Uri;

export function parseUriReference(input: string | InputBuffer): Uri {
  const buf =
    typeof input === "string" ?
      { input, offset: 0, limit: input.length, ucs: false }
    : input;

  const components: {
    href?: string | undefined;
    scheme?: string | undefined;
    relative?: string | undefined;
    authority?: string | undefined;
    userinfo?: string | undefined;
    host?: string | undefined;
    hostname?: string | undefined;
    ipv4?: string | undefined;
    ipv6?: string | undefined;
    ipvFuture?: string | undefined;
    port?: string | undefined;
    path?: string | undefined;
    query?: string | undefined;
    fragment?: string | undefined;
  } = {};

  // URI = URI-reference = URI / relative-ref
  const uriStart = buf.offset;
  components.href = undefined; // Reserve slot.

  if (buf.offset < buf.limit && isAlpha(buf.input.charCodeAt(buf.offset))) {
    const scheme = parseScheme(buf);
    if (
      buf.offset < buf.limit &&
      buf.input.charCodeAt(buf.offset) === 0x3a // ":"
    ) {
      buf.offset += 1; // ":"
      components.scheme = scheme;
    } else {
      buf.offset = uriStart;
    }
  }

  parseRelativeRef(buf, components);

  components.href = buf.input.slice(uriStart, buf.offset);

  if (typeof input === "string" && buf.offset !== input.length) {
    throw new UriError("Invalid URI reference " + JSON.stringify(input), buf);
  }
  return components as Uri;
}

/**
 * Parses an RFC 3986 URI reference, returning `null` if the input
 * is malformed.
 *
 * @category Uri
 */
export function tryParseUriReference(input: string): Uri | null {
  try {
    return parseUriReference(input);
  } catch {
    return null;
  }
}

/**
 * Returns `true` if the given string is a valid RFC 3986 URI reference.
 *
 * @category Uri
 */
export function isValidUriReference(input: string): boolean {
  return tryParseUriReference(input) !== null;
}

/**
 * Parses an RFC 3987 IRI.
 *
 * @throws UriError if the input is malformed.
 * @category Uri
 */
export function parseIri(input: string): Uri;

/** @internal */
export function parseIri(buf: InputBuffer): Uri;

export function parseIri(input: string | InputBuffer): Uri {
  const buf =
    typeof input === "string" ?
      { input, offset: 0, limit: input.length, ucs: true }
    : input;

  const components = parseUri(buf);

  if (typeof input === "string" && buf.offset !== input.length) {
    throw new UriError("Invalid IRI " + JSON.stringify(input), buf);
  }
  return components;
}

/**
 * Parses an RFC 3987 IRI, returning `undefined` if the input is malformed.
 *
 * @category Uri
 */
export function tryParseIri(input: string): Uri | undefined {
  try {
    return parseIri(input);
  } catch {
    return undefined;
  }
}

/**
 * Returns `true` if the given string is a valid RFC 3987 IRI.
 *
 * @category Uri
 */
export function isValidIri(input: string): boolean {
  return tryParseIri(input) !== undefined;
}

/**
 * Parses an RFC 3987 IRI reference.
 *
 * @throws UriError if the input is malformed.
 * @category Uri
 */
export function parseIriReference(input: string): Uri;

/** @internal */
export function parseIriReference(buf: InputBuffer): Uri;

export function parseIriReference(input: string | InputBuffer): Uri {
  const buf =
    typeof input === "string" ?
      { input, offset: 0, limit: input.length, ucs: true }
    : input;

  const components = parseUriReference(buf);

  if (typeof input === "string" && buf.offset !== input.length) {
    throw new UriError("Invalid IRI reference " + JSON.stringify(input), buf);
  }
  return components;
}

/**
 * Parses an RFC 3987 IRI reference, returning `null` if the input
 * is malformed.
 *
 * @category Uri
 */
export function tryParseIriReference(input: string): Uri | null {
  try {
    return parseIriReference(input);
  } catch {
    return null;
  }
}

/**
 * Returns `true` if the given string is a valid RFC 3987 IRI reference.
 *
 * @category Uri
 */
export function isValidIriReference(input: string): boolean {
  return tryParseIriReference(input) !== null;
}

/** @internal */
function parseRelativeRef(
  buf: InputBuffer,
  components: {
    relative?: string | undefined;
    authority?: string | undefined;
    userinfo?: string | undefined;
    host?: string | undefined;
    hostname?: string | undefined;
    ipv4?: string | undefined;
    ipv6?: string | undefined;
    ipvFuture?: string | undefined;
    port?: string | undefined;
    path?: string | undefined;
    query?: string | undefined;
    fragment?: string | undefined;
  },
): void {
  // relative-ref = relative-part [ "?" query ] [ "#" fragment ]
  parseRelativePart(buf, components);

  // [ "?" query ]
  if (buf.offset < buf.limit && buf.input.charCodeAt(buf.offset) === 0x3f) {
    buf.offset += 1; // "?"
    components.query = parseQuery(buf);
  }

  // [ "#" fragment ]
  if (buf.offset < buf.limit && buf.input.charCodeAt(buf.offset) === 0x23) {
    buf.offset += 1; // "#"
    components.fragment = parseFragment(buf);
  }
}

/** @internal */
function parseRelativePart(
  buf: InputBuffer,
  components: {
    relative?: string | undefined;
    authority?: string | undefined;
    userinfo?: string | undefined;
    host?: string | undefined;
    hostname?: string | undefined;
    ipv4?: string | undefined;
    ipv6?: string | undefined;
    ipvFuture?: string | undefined;
    port?: string | undefined;
    path?: string | undefined;
  },
): void {
  // relative-part = "//" authority path-abempty
  //               / path-absolute
  //               / path-noscheme
  //               / path-empty
  const relativeStart = buf.offset;
  components.relative = undefined; // Reserve slot.

  if (
    buf.offset + 1 < buf.limit &&
    buf.input.charCodeAt(buf.offset) === 0x2f && // "/"
    buf.input.charCodeAt(buf.offset + 1) === 0x2f // "/"
  ) {
    buf.offset += 2; // "//"
    parseAuthority(buf, components);

    // After authority, path must be empty or start with "/"
    if (
      buf.offset < buf.limit &&
      buf.input.charCodeAt(buf.offset) !== 0x2f && // "/"
      buf.input.charCodeAt(buf.offset) !== 0x3f && // "?"
      buf.input.charCodeAt(buf.offset) !== 0x23 // "#"
    ) {
      throw new UriError(
        "Path after authority must be empty or start with '/'",
        buf,
      );
    }
  }

  components.path = parsePath(buf);
  components.relative = buf.input.slice(relativeStart, buf.offset);
}

/** @internal */
function parseScheme(buf: InputBuffer): string {
  // scheme = ALPHA *( ALPHA / DIGIT / "+" / "-" / "." )
  const schemeStart = buf.offset;

  // ALPHA
  if (buf.offset < buf.limit && isAlpha(buf.input.charCodeAt(buf.offset))) {
    buf.offset += 1; // ALPHA
  } else {
    throw new UriError("Scheme must start with a letter", buf);
  }

  // *( ALPHA / DIGIT / "+" / "-" / "." )
  while (
    buf.offset < buf.limit &&
    isSchemeChar(buf.input.charCodeAt(buf.offset))
  ) {
    buf.offset += 1; // ALPHA / DIGIT / "+" / "-" / "."
  }

  return buf.input.slice(schemeStart, buf.offset);
}

/** @internal */
function parseAuthority(
  buf: InputBuffer,
  components: {
    authority?: string | undefined;
    userinfo?: string | undefined;
    host?: string | undefined;
    hostname?: string | undefined;
    ipv4?: string | undefined;
    ipv6?: string | undefined;
    ipvFuture?: string | undefined;
    port?: string | undefined;
  },
): void {
  // authority = [ userinfo "@" ] host [ ":" port ]
  const authorityStart = buf.offset;
  components.authority = undefined;

  // [ userinfo "@" ]
  if (buf.input.includes("@", buf.offset)) {
    parseUserinfo(buf, components);

    if (
      buf.offset >= buf.limit ||
      buf.input.charCodeAt(buf.offset) !== 0x40 /*"@"*/
    ) {
      throw new UriError("Invalid userinfo", buf);
    }
    buf.offset += 1; // "@"
  }

  // host
  const hostStart = buf.offset;
  components.host = undefined;
  parseHost(buf, components);

  // [ ":" port ]
  parsePort(buf, components);

  components.host = buf.input.slice(hostStart, buf.offset);

  components.authority = buf.input.slice(authorityStart, buf.offset);
}

/** @internal */
function parseUserinfo(
  buf: InputBuffer,
  components: {
    userinfo?: string | undefined;
  },
): void {
  // userinfo = *( unreserved / pct-encoded / sub-delims / ":" )
  const userinfoStart = buf.offset;

  while (buf.offset < buf.limit) {
    if (isUserinfoChar(buf.input.charCodeAt(buf.offset), buf.ucs)) {
      buf.offset += 1; // unreserved / sub-delims / ":"
    } else if (isPctEncoded(buf)) {
      buf.offset += 3; // pct-encoded
    } else if (buf.input.charCodeAt(buf.offset) === 0x25 /*"%"*/) {
      throw new UriError("Invalid percent-encoding", buf);
    } else {
      break;
    }
  }

  components.userinfo = buf.input.slice(userinfoStart, buf.offset);
}

/** @internal */
function parseHost(
  buf: InputBuffer,
  components: {
    hostname?: string | undefined;
    ipv4?: string | undefined;
    ipv6?: string | undefined;
    ipvFuture?: string | undefined;
  },
): void {
  // host = IP-literal / IPv4address / reg-name
  const hostStart = buf.offset;

  if (
    buf.offset < buf.limit &&
    buf.input.charCodeAt(buf.offset) === 0x5b /*"["*/
  ) {
    // IP-literal = "[" ( IPv6address / IPvFuture  ) "]"
    buf.offset += 1; // "["

    const bufLimit = buf.limit;
    const hostLimit = buf.input.indexOf("]", buf.offset);
    try {
      buf.limit = hostLimit;
      if (
        buf.offset < buf.limit &&
        buf.input.charCodeAt(buf.offset) === 0x76 /*"v"*/
      ) {
        components.ipvFuture = parseIpvFuture(buf);
      } else {
        components.ipv6 = parseIpv6(buf);
      }
    } finally {
      buf.limit = bufLimit;
    }

    if (
      buf.offset >= buf.limit ||
      buf.input.charCodeAt(buf.offset) !== 0x5d /*"]"*/
    ) {
      throw new UriError("Invalid IP literal", buf);
    }
    buf.offset += 1; // "]"

    components.hostname = buf.input.slice(hostStart, buf.offset);
  } else {
    try {
      components.ipv4 = parseIpv4(buf);
      components.hostname = components.ipv4;
    } catch {
      components.hostname = parseRegName(buf);
    }
  }
}

/** @internal */
function parseRegName(buf: InputBuffer): string {
  // reg-name = *( unreserved / pct-encoded / sub-delims )
  const regNameStart = buf.offset;

  while (buf.offset < buf.limit) {
    if (isHostChar(buf.input.charCodeAt(buf.offset), buf.ucs)) {
      buf.offset += 1; // unreserved / sub-delims
    } else if (isPctEncoded(buf)) {
      buf.offset += 3; // pct-encoded
    } else if (buf.input.charCodeAt(buf.offset) === 0x25 /*"%"*/) {
      throw new UriError("Invalid percent-encoding", buf);
    } else {
      break;
    }
  }

  return buf.input.slice(regNameStart, buf.offset);
}

/** @internal */
export function parseIpv4(input: string | InputBuffer): string {
  const buf =
    typeof input === "string" ?
      { input, offset: 0, limit: input.length, ucs: false }
    : input;

  // IPv4address = dec-octet "." dec-octet "." dec-octet "." dec-octet
  const ipv4Start = buf.offset;

  for (let i = 0; i < 4; i += 1) {
    parseDecimalOctet(buf);
    if (i < 3) {
      const c = buf.offset < buf.limit ? buf.input.charCodeAt(buf.offset) : -1;
      if (c !== 0x2e /*"."*/) {
        throw new UriError('Expected "."', buf);
      }
      buf.offset += 1;
    }
  }

  if (typeof input === "string" && buf.offset !== input.length) {
    throw new UriError("Invalid IPv4 address " + JSON.stringify(input), buf);
  }
  return buf.input.slice(ipv4Start, buf.offset);
}

/** @internal */
function parseDecimalOctet(buf: InputBuffer): number {
  // dec-octet = DIGIT                 ; 0-9
  //           / %x31-39 DIGIT         ; 10-99
  //           / "1" 2DIGIT            ; 100-199
  //           / "2" %x30-34 DIGIT     ; 200-249
  //           / "25" %x30-35          ; 250-255
  let digits = 0;
  let value = 0;
  let c: number;

  while (
    digits < 3 &&
    buf.offset < buf.limit &&
    ((c = buf.input.charCodeAt(buf.offset)), isDigit(c))
  ) {
    if (digits !== 0 && value === 0) {
      throw new UriError("Invalid IPv4 octet", buf);
    }
    buf.offset += 1;
    value = value * 10 + (c - 0x30) /*"0"*/;
    digits += 1;
  }

  if (digits === 0 || value > 255) {
    throw new UriError("Invalid IPv4 octet", buf);
  }

  return value;
}

/** @internal */
export function parseIpv6(input: string | InputBuffer): string {
  const buf =
    typeof input === "string" ?
      { input, offset: 0, limit: input.length, ucs: false }
    : input;

  // IPv6address =                            6( h16 ":" ) ls32
  //             /                       "::" 5( h16 ":" ) ls32
  //             / [               h16 ] "::" 4( h16 ":" ) ls32
  //             / [ *1( h16 ":" ) h16 ] "::" 3( h16 ":" ) ls32
  //             / [ *2( h16 ":" ) h16 ] "::" 2( h16 ":" ) ls32
  //             / [ *3( h16 ":" ) h16 ] "::"    h16 ":"   ls32
  //             / [ *4( h16 ":" ) h16 ] "::"              ls32
  //             / [ *5( h16 ":" ) h16 ] "::"              h16
  //             / [ *6( h16 ":" ) h16 ] "::"

  // h16         = 1*4HEXDIG
  // ls32        = ( h16 ":" h16 ) / IPv4address
  const ipv6Start = buf.offset;

  let compression = false;
  let ipv4Start = 0;
  let hextets = 0;

  // Parse hextets that precede a compression marker (`::`).
  // This loop will advance the parser into one of three states:
  // - 8 hextets (full address).
  // - 6 hextets ending with `:`.
  // - 0-6 hextets with ending with `::`.
  while (hextets < 8) {
    if (
      buf.offset < buf.limit &&
      buf.input.charCodeAt(buf.offset) === 0x3a /*":"*/
    ) {
      buf.offset += 1;
      if (
        buf.offset < buf.limit &&
        buf.input.charCodeAt(buf.offset) === 0x3a /*":"*/
      ) {
        buf.offset += 1;
        compression = true;
        ipv4Start = 0;
        break;
      } else if (hextets === 0) {
        throw new UriError("Expected colon", buf);
      }
    } else if (ipv4Start !== 0) {
      // Backtrack to the possible start of a trailing IPv4 address.
      buf.offset = ipv4Start;
      hextets = 6;
      break;
    } else if (hextets !== 0) {
      throw new UriError("Expected colon", buf);
    }

    if (hextets === 6) {
      // Mark the start of a possible trailing IPv4 address.
      ipv4Start = buf.offset;
    }

    const hextetStart = buf.offset;
    while (
      buf.offset - hextetStart < 4 &&
      buf.offset < buf.limit &&
      isHexChar(buf.input.charCodeAt(buf.offset))
    ) {
      buf.offset += 1;
    }

    if (buf.offset === hextetStart) {
      if (ipv4Start !== 0) {
        // Backtrack to the possible start of a trailing IPv4 address.
        buf.offset = ipv4Start;
        hextets = 6;
        break;
      }
      throw new UriError("Expected hex digit", buf);
    }

    // Successfully parsed a hextet.
    hextets += 1;
  }

  // Parse hextets that follow a compression marker (`::`).
  if (compression && buf.offset < buf.limit) {
    while (hextets < 7) {
      const hextetStart = buf.offset;
      while (
        buf.offset - hextetStart < 4 &&
        buf.offset < buf.limit &&
        isHexChar(buf.input.charCodeAt(buf.offset))
      ) {
        buf.offset += 1;
      }

      if (buf.offset === hextetStart) {
        throw new UriError("Expected hex digit", buf);
      } else if (buf.offset === buf.limit) {
        break;
      }

      if (
        buf.offset < buf.limit &&
        buf.input.charCodeAt(buf.offset) === 0x3a /*":"*/
      ) {
        buf.offset += 1;
      } else {
        // Backtrack to the possible start of a trailing IPv4 address.
        buf.offset = hextetStart;
        ipv4Start = hextetStart;
        break;
      }

      // Successfully parsed a hextet.
      hextets += 1;
    }
  }

  // Parse any trailing IPv4 address.
  if (buf.offset === ipv4Start) {
    parseIpv4(buf);
  }

  if (buf.offset !== buf.limit) {
    throw new UriError("Invalid IPv6 address " + JSON.stringify(input), buf);
  }
  return buf.input.slice(ipv6Start, buf.offset);
}

/** @internal */
function parseIpvFuture(buf: InputBuffer): string {
  // IPvFuture = "v" 1*HEXDIG "." 1*( unreserved / sub-delims / ":" )
  const ipvFutureStart = buf.offset;

  let c = buf.offset < buf.limit ? buf.input.charCodeAt(buf.offset) : -1;
  if (c !== 0x76 /*"v"*/) {
    throw new UriError('IPvFuture must start with "v"', buf);
  }
  buf.offset += 1; // "v"

  c = buf.offset < buf.limit ? buf.input.charCodeAt(buf.offset) : -1;
  if (!isHexChar(c)) {
    throw new UriError("Expected hex digit", buf);
  }
  buf.offset += 1; // hex digit
  while (
    buf.offset < buf.limit &&
    isHexChar(buf.input.charCodeAt(buf.offset))
  ) {
    buf.offset += 1; // hex digit
  }

  if (
    buf.offset >= buf.limit ||
    buf.input.charCodeAt(buf.offset) !== 0x2e /*"."*/
  ) {
    throw new UriError('Expected "." after version', buf);
  }
  buf.offset += 1; // "."

  c = buf.offset < buf.limit ? buf.input.charCodeAt(buf.offset) : -1;
  if (!isUserinfoChar(c, buf.ucs)) {
    throw new UriError("Expected address", buf);
  }
  buf.offset += 1;
  while (
    buf.offset < buf.limit &&
    isUserinfoChar(buf.input.charCodeAt(buf.offset), buf.ucs)
  ) {
    buf.offset += 1;
  }

  return buf.input.slice(ipvFutureStart, buf.offset);
}

/** @internal */
function parsePort(
  buf: InputBuffer,
  components: {
    port?: string | undefined;
  },
): void {
  // [ ":" port ]
  if (
    buf.offset < buf.limit &&
    buf.input.charCodeAt(buf.offset) === 0x3a /*":"*/
  ) {
    buf.offset += 1; // ":"

    // port = *DIGIT
    const portStart = buf.offset;

    let value = 0;
    let c: number;
    while (
      value < 0xffff &&
      buf.offset < buf.limit &&
      ((c = buf.input.charCodeAt(buf.offset)), isDigit(c))
    ) {
      value = value * 10 + (c - 0x30) /*"0"*/;
      buf.offset += 1; // DIGIT
    }
    if (value > 0xffff) {
      throw new UriError("Invalid port number", buf);
    }

    components.port = buf.input.slice(portStart, buf.offset);
  }
}

/** @internal */
function parsePath(buf: InputBuffer): string {
  // *( segment "/" )
  const pathStart = buf.offset;

  while (true) {
    // segment = *pchar
    while (buf.offset < buf.limit) {
      if (isPathChar(buf.input.charCodeAt(buf.offset), buf.ucs)) {
        buf.offset += 1; // unreserved / sub-delims / ":" / "@"
      } else if (isPctEncoded(buf)) {
        buf.offset += 3; // pct-encoded
      } else if (buf.input.charCodeAt(buf.offset) === 0x25 /*"%"*/) {
        throw new UriError("Invalid percent-encoding", buf);
      } else {
        break;
      }
    }

    // *( "/" segment )
    if (
      buf.offset < buf.limit &&
      buf.input.charCodeAt(buf.offset) === 0x2f /*"/"*/
    ) {
      buf.offset += 1; // "/"
    } else {
      break;
    }
  }

  return buf.input.slice(pathStart, buf.offset);
}

/** @internal */
function parseQuery(buf: InputBuffer): string {
  // query = *( pchar / "/" / "?" )
  const queryStart = buf.offset;

  while (buf.offset < buf.limit) {
    if (isQueryChar(buf.input.charCodeAt(buf.offset), buf.ucs)) {
      buf.offset += 1; // pchar / "/" / "?"
    } else if (isPctEncoded(buf)) {
      buf.offset += 3; // pct-encoded
    } else if (buf.input.charCodeAt(buf.offset) === 0x25 /*"%"*/) {
      throw new UriError("Invalid percent-encoding", buf);
    } else {
      break;
    }
  }

  return buf.input.slice(queryStart, buf.offset);
}

/** @internal */
function parseFragment(buf: InputBuffer): string {
  // fragment = *( pchar / "/" / "?" )
  const fragmentStart = buf.offset;

  while (buf.offset < buf.limit) {
    if (isFragmentChar(buf.input.charCodeAt(buf.offset), buf.ucs)) {
      buf.offset += 1; // pchar / "/" / "?"
    } else if (isPctEncoded(buf)) {
      buf.offset += 3; // pct-encoded
    } else if (buf.input.charCodeAt(buf.offset) === 0x25 /*"%"*/) {
      throw new UriError("Invalid percent-encoding", buf);
    } else {
      break;
    }
  }

  return buf.input.slice(fragmentStart, buf.offset);
}
