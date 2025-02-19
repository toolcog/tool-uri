/**
 * A parsed [RFC 3986](https://datatracker.ietf.org/doc/html/rfc3986)
 * URI reference.
 *
 * @category Uri
 */
export interface Uri {
  readonly href: string;
  readonly scheme?: string | undefined;
  readonly authority?: string | undefined;
  readonly userinfo?: string | undefined;
  readonly host?: string | undefined;
  readonly hostname?: string | undefined;
  readonly ipv4?: string | undefined;
  readonly ipv6?: string | undefined;
  readonly ipvFuture?: string | undefined;
  readonly port?: string | undefined;
  readonly path: string;
  readonly query?: string | undefined;
  readonly fragment?: string | undefined;
}

/**
 * Returns `true` if the given URI is an absolute URI (it has a scheme
 * but no non-empty fragment).
 *
 * Note that `isAbsoluteUri` is not the inverse of `isRelativeUri`.
 *
 * @category Uri
 */
export function isAbsoluteUri(uri: Uri): boolean {
  return (
    uri.scheme !== undefined &&
    (uri.fragment === undefined || uri.fragment.length === 0)
  );
}

/**
 * Returns `true` if the given URI is a relative reference (it has no scheme).
 *
 * Note that `isRelativeUri` is not the inverse of `isAbsoluteUri`.
 *
 * @category Uri
 */
export function isRelativeUri(uri: Uri): boolean {
  return uri.scheme === undefined;
}

/**
 * Composes an RFC 3986 URI reference string from its components.
 *
 * @category Uri
 */
export function formatUri(components: {
  readonly scheme?: string | undefined;
  readonly authority?: string | undefined;
  readonly path?: string | undefined;
  readonly query?: string | undefined;
  readonly fragment?: string | undefined;
}): string {
  let result = "";
  if (components.scheme !== undefined) {
    result += components.scheme;
    result += ":";
  }
  if (components.authority !== undefined) {
    result += "//";
    result += components.authority;
  }
  if (components.path !== undefined) {
    result += components.path;
  }
  if (components.query !== undefined) {
    result += "?";
    result += components.query;
  }
  if (components.fragment !== undefined) {
    result += "#";
    result += components.fragment;
  }
  return result;
}
