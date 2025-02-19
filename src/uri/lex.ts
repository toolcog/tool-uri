/** @internal */
export function isAlpha(c: number): boolean {
  return (
    (c >= 0x41 /*"A"*/ && c <= 0x5a) /*"Z"*/ ||
    (c >= 0x61 /*"a"*/ && c <= 0x7a) /*"z"*/
  );
}

/** @internal */
export function isDigit(c: number): boolean {
  return c >= 0x30 /*"0"*/ && c <= 0x39 /*"9"*/;
}

/** @internal */
export function isUcsChar(c: number): boolean {
  // ucschar = %xA0-D7FF / %xF900-FDCF / %xFDF0-FFEF
  //         / %x10000-1FFFD / %x20000-2FFFD / %x30000-3FFFD
  //         / %x40000-4FFFD / %x50000-5FFFD / %x60000-6FFFD
  //         / %x70000-7FFFD / %x80000-8FFFD / %x90000-9FFFD
  //         / %xA0000-AFFFD / %xB0000-BFFFD / %xC0000-CFFFD
  //         / %xD0000-DFFFD / %xE1000-EFFFD
  return (
    (c >= 0xa0 && c <= 0xd7ff) ||
    (c >= 0xf900 && c <= 0xfdcf) ||
    (c >= 0xfdf0 && c <= 0xffef) ||
    (c >= 0x10000 && c <= 0x1fffd) ||
    (c >= 0x20000 && c <= 0x2fffd) ||
    (c >= 0x30000 && c <= 0x3fffd) ||
    (c >= 0x40000 && c <= 0x4fffd) ||
    (c >= 0x50000 && c <= 0x5fffd) ||
    (c >= 0x60000 && c <= 0x6fffd) ||
    (c >= 0x70000 && c <= 0x7fffd) ||
    (c >= 0x80000 && c <= 0x8fffd) ||
    (c >= 0x90000 && c <= 0x9fffd) ||
    (c >= 0xa0000 && c <= 0xafffd) ||
    (c >= 0xb0000 && c <= 0xbfffd) ||
    (c >= 0xc0000 && c <= 0xcfffd) ||
    (c >= 0xd0000 && c <= 0xdfffd) ||
    (c >= 0xe1000 && c <= 0xefffd)
  );
}

/** @internal */
export function isIPrivateChar(c: number): boolean {
  // iprivate = %xE000-F8FF / %xF0000-FFFFD / %x100000-10FFFD
  return (
    (c >= 0xe000 && c <= 0xf8ff) ||
    (c >= 0xf0000 && c <= 0xffffd) ||
    (c >= 0x100000 && c <= 0x10fffd)
  );
}

/**
 * Returns `true` if a character is in the RFC 3986 unreserved set.
 *
 * @see [RFC 3986 §2.3](https://datatracker.ietf.org/doc/html/rfc3986#section-2.3)
 * @category Uri
 * @internal
 */
export function isUnreservedChar(c: number, ucs: boolean = false): boolean {
  // unreserved = ALPHA / DIGIT / "-" / "." / "_" / "~"
  // iunreserved = ALPHA / DIGIT / "-" / "." / "_" / "~" / ucschar
  return (
    isAlpha(c) ||
    isDigit(c) ||
    c === 0x2d /*"-"*/ ||
    c === 0x2e /*"."*/ ||
    c === 0x5f /*"_"*/ ||
    c === 0x7e /*"~"*/ ||
    (ucs && isUcsChar(c))
  );
}

/** @internal */
function isGenDelimChar(c: number): boolean {
  // gen-delims = ":" / "/" / "?" / "#" / "[" / "]" / "@"
  switch (c) {
    case 0x3a: // ":"
    case 0x2f: // "/"
    case 0x3f: // "?"
    case 0x23: // "#"
    case 0x5b: // "["
    case 0x5d: // "]"
    case 0x40: // "@"
      return true;
    default:
      return false;
  }
}

/** @internal */
function isSubDelimChar(c: number): boolean {
  // sub-delims = "!" / "$" / "&" / "'" / "(" / ")"
  //            / "*" / "+" / "," / ";" / "="
  switch (c) {
    case 0x21: // "!"
    case 0x24: // "$"
    case 0x26: // "&"
    case 0x27: // "'"
    case 0x28: // "("
    case 0x29: // ")"
    case 0x2a: // "*"
    case 0x2b: // "+"
    case 0x2c: // ","
    case 0x3b: // ";"
    case 0x3d: // "="
      return true;
    default:
      return false;
  }
}

/**
 * Returns `true` if a character is in the RFC 3986 reserved set.
 *
 * @see [RFC 3986 §2.2](https://datatracker.ietf.org/doc/html/rfc3986#section-2.2)
 * @category Uri
 * @internal
 */
export function isReservedChar(c: number): boolean {
  // reserved = gen-delims / sub-delims
  return isGenDelimChar(c) || isSubDelimChar(c);
}

/**
 * Returns `true` if a character is in the RFC 3986 scheme set.
 *
 * @see [RFC 3986 §3.1](https://datatracker.ietf.org/doc/html/rfc3986#section-3.1)
 * @category Uri
 * @internal
 */
export function isSchemeChar(c: number): boolean {
  return (
    isAlpha(c) ||
    isDigit(c) ||
    c === 0x2b /*"+"*/ ||
    c === 0x2d /*"-"*/ ||
    c === 0x2e /*"."*/
  );
}

/**
 * Returns `true` if a character is in the RFC 3986 userinfo set.
 *
 * @see [RFC 3986 §3.2.1](https://datatracker.ietf.org/doc/html/rfc3986#section-3.2.1)
 * @category Uri
 * @internal
 */
export function isUserinfoChar(c: number, ucs: boolean = false): boolean {
  // userinfo = *( unreserved / pct-encoded / sub-delims / ":" )
  // iuserinfo = *( iunreserved / pct-encoded / sub-delims / ":" )
  return isUnreservedChar(c, ucs) || isSubDelimChar(c) || c === 0x3a /*":"*/;
}

/**
 * Returns `true` if a character is in the RFC 3986 reg-name set.
 *
 * @see [RFC 3986 §3.2.2](https://datatracker.ietf.org/doc/html/rfc3986#section-3.2.2)
 * @category Uri
 * @internal
 */
export function isHostChar(c: number, ucs: boolean = false): boolean {
  // reg-name = *( unreserved / pct-encoded / sub-delims )
  // ireg-name = *( iunreserved / pct-encoded / sub-delims )
  return isUnreservedChar(c, ucs) || isSubDelimChar(c);
}

/**
 * Returns `true` if a character is in the RFC 3986 pchar set.
 *
 * @see [RFC 3986 §3.3](https://datatracker.ietf.org/doc/html/rfc3986#section-3.3)
 * @category Uri
 * @internal
 */
export function isPathChar(c: number, ucs: boolean = false): boolean {
  // pchar = unreserved / pct-encoded / sub-delims / ":" / "@"
  // ipchar = iunreserved / pct-encoded / sub-delims / ":" / "@"
  return (
    isUnreservedChar(c, ucs) ||
    isSubDelimChar(c) ||
    c === 0x3a /*":"*/ ||
    c === 0x40 /*"@"*/
  );
}

/**
 * Returns `true` if a character is in the RFC 3986 query set.
 *
 * @see [RFC 3986 §3.4](https://datatracker.ietf.org/doc/html/rfc3986#section-3.4)
 * @category Uri
 * @internal
 */
export function isQueryChar(c: number, ucs: boolean = false): boolean {
  // query = *( pchar / "/" / "?" )
  // iquery = *( ipchar / iprivate / "/" / "?" )
  return (
    isPathChar(c, ucs) ||
    (ucs && isIPrivateChar(c)) ||
    c === 0x2f /*"/"*/ ||
    c === 0x3f /*"?"*/
  );
}

/**
 * Returns `true` if a character is in the RFC 3986 fragment set.
 *
 * @see [RFC 3986 §3.5](https://datatracker.ietf.org/doc/html/rfc3986#section-3.5)
 * @category Uri
 * @internal
 */
export function isFragmentChar(c: number, ucs: boolean = false): boolean {
  // fragment = *( pchar / "/" / "?" )
  // ifragment = *( ipchar / "/" / "?" )
  return isPathChar(c, ucs) || c === 0x2f /*"/"*/ || c === 0x3f /*"?"*/;
}

/**
 * Returns `true` if a character is safe to leave unencoded in
 * `application/x-www-form-urlencoded` data.
 *
 * @category Uri
 * @internal
 */
export function isFormChar(c: number, ucs: boolean = false): boolean {
  return isUnreservedChar(c, ucs) || c === 0x2f /*"/"*/ || c === 0x2b /*"+"*/;
}

/**
 * A named URI character set.
 *
 * @category Uri
 * @internal
 */
export type UriCharset =
  | "unreserved"
  | "reserved"
  | "userinfo"
  | "host"
  | "path"
  | "query"
  | "fragment"
  | "form";

/**
 * Returns `true` if a character is in the named URI character set.
 *
 * @category Uri
 * @internal
 */
export function isUriChar(
  c: number,
  charset: UriCharset,
  ucs: boolean = false,
): boolean {
  switch (charset) {
    case "unreserved":
      return isUnreservedChar(c, ucs);
    case "reserved":
      return isUnreservedChar(c, ucs) || isReservedChar(c);
    case "userinfo":
      return isUserinfoChar(c, ucs);
    case "host":
      return isHostChar(c, ucs);
    case "path":
      return isPathChar(c, ucs);
    case "query":
      return isQueryChar(c, ucs);
    case "fragment":
      return isFragmentChar(c, ucs);
    case "form":
      return isFormChar(c, ucs);
    default:
      return false;
  }
}

/**
 * @category Uri
 * @internal
 */
export function isHexChar(c: number): boolean {
  return (
    isDigit(c) ||
    (c >= 0x41 /*"A"*/ && c <= 0x46) /*"F"*/ ||
    (c >= 0x61 /*"a"*/ && c <= 0x66) /*"f"*/
  );
}

/**
 * @category Uri
 * @internal
 */
export function hexDecode(c: number): number | undefined {
  if (c >= 0x30 /*"0"*/ && c <= 0x39 /*"9"*/) {
    return c - 0x30 /*"0"*/;
  } else if (c >= 0x41 /*"A"*/ && c <= 0x46 /*"F"*/) {
    return c - (0x41 /*"A"*/ - 10);
  } else if (c >= 0x61 /*"a"*/ && c <= 0x66 /*"f"*/) {
    return c - (0x61 /*"a"*/ - 10);
  } else {
    return undefined;
  }
}

/**
 * @category Uri
 * @internal
 */
export function hexEncode(value: number): string {
  // assert(0 <= value && value < 16);
  return "0123456789ABCDEF"[value]!;
}

/**
 * @category Uri
 * @internal
 */
export function isPctEncoded(buf: {
  readonly input: string;
  readonly offset: number;
  readonly limit: number;
}): boolean {
  // §2.1: pct-encoded = "%" HEXDIG HEXDIG
  return (
    buf.offset + 2 < buf.limit &&
    buf.input.charCodeAt(buf.offset) === 0x25 /*"%"*/ &&
    isHexChar(buf.input.charCodeAt(buf.offset + 1)) &&
    isHexChar(buf.input.charCodeAt(buf.offset + 2))
  );
}

/**
 * Percent-encodes a string according to RFC 3986, optionally allowing
 * reserved characters to pass through.
 *
 * @category Uri
 * @internal
 */
export function pctEncode(
  string: string,
  charset: UriCharset = "unreserved",
): string {
  let result = "";
  let offset = 0;
  let start = 0;

  while (offset < string.length) {
    const c = string.codePointAt(offset)!;
    if (isUriChar(c, charset)) {
      offset += 1;
      continue;
    }
    result += string.slice(start, offset);
    result += pctEncodeUtf8(c);
    offset += c > 0xffff ? 2 : 1;
    start = offset;
  }

  if (start < string.length) {
    result += string.slice(start);
  }

  return result;
}

/**
 * Encodes the UTF-8 code units of a Unicode code point as a sequence
 * of percent-encoded triplets.
 *
 * @category Uri
 * @internal
 */
export function pctEncodeUtf8(codePoint: number): string {
  let result = "";

  if (codePoint <= 0x7f) {
    const byte = codePoint & 0xff;
    result += "%";
    result += hexEncode((byte >> 4) & 0xf);
    result += hexEncode(byte & 0xf);
  } else if (codePoint <= 0x7ff) {
    const byte1 = ((codePoint >> 6) & 0x1f) | 0xc0;
    const byte2 = (codePoint & 0x3f) | 0x80;

    result += "%";
    result += hexEncode((byte1 >> 4) & 0xf);
    result += hexEncode(byte1 & 0xf);

    result += "%";
    result += hexEncode((byte2 >> 4) & 0xf);
    result += hexEncode(byte2 & 0xf);
  } else if (codePoint <= 0xffff) {
    const byte1 = ((codePoint >> 12) & 0x0f) | 0xe0;
    const byte2 = ((codePoint >> 6) & 0x3f) | 0x80;
    const byte3 = (codePoint & 0x3f) | 0x80;

    result += "%";
    result += hexEncode((byte1 >> 4) & 0xf);
    result += hexEncode(byte1 & 0xf);

    result += "%";
    result += hexEncode((byte2 >> 4) & 0xf);
    result += hexEncode(byte2 & 0xf);

    result += "%";
    result += hexEncode((byte3 >> 4) & 0xf);
    result += hexEncode(byte3 & 0xf);
  } else if (codePoint <= 0x10ffff) {
    const byte1 = ((codePoint >> 18) & 0x07) | 0xf0;
    const byte2 = ((codePoint >> 12) & 0x3f) | 0x80;
    const byte3 = ((codePoint >> 6) & 0x3f) | 0x80;
    const byte4 = (codePoint & 0x3f) | 0x80;

    result += "%";
    result += hexEncode((byte1 >> 4) & 0xf);
    result += hexEncode(byte1 & 0xf);

    result += "%";
    result += hexEncode((byte2 >> 4) & 0xf);
    result += hexEncode(byte2 & 0xf);

    result += "%";
    result += hexEncode((byte3 >> 4) & 0xf);
    result += hexEncode(byte3 & 0xf);

    result += "%";
    result += hexEncode((byte4 >> 4) & 0xf);
    result += hexEncode(byte4 & 0xf);
  }

  return result;
}
