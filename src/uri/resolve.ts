import type { Uri } from "./uri.ts";
import { formatUri } from "./uri.ts";
import { parseUriReference } from "./parse.ts";

/**
 * Resolves a URI reference relative to a base URI.
 *
 * @category Uri
 */
export function resolveUri(
  base: Uri | string | null | undefined,
  reference: Uri | string,
): Uri {
  if (typeof reference === "string") {
    reference = parseUriReference(reference);
  }

  base ??= reference;
  if (typeof base === "string") {
    base = parseUriReference(base);
  }

  const target: {
    href: string | undefined;
    scheme?: string | undefined;
    relative?: string | undefined;
    authority?: string | undefined;
    userinfo?: string | undefined;
    host?: string | undefined;
    hostname?: string | undefined;
    port?: string | undefined;
    path?: string | undefined;
    query?: string | undefined;
    fragment?: string | undefined;
  } = {
    href: undefined,
  };

  if (reference.scheme !== undefined) {
    target.scheme = reference.scheme;
    target.authority = reference.authority;
    target.userinfo = reference.userinfo;
    target.host = reference.host;
    target.hostname = reference.hostname;
    target.port = reference.port;
    target.path = removeDotSegments(reference.path);
    target.query = reference.query;
  } else {
    target.scheme = base.scheme;
    if (reference.authority !== undefined) {
      target.authority = reference.authority;
      target.userinfo = reference.userinfo;
      target.host = reference.host;
      target.hostname = reference.hostname;
      target.port = reference.port;
      target.path = removeDotSegments(reference.path);
      target.query = reference.query;
    } else {
      target.authority = base.authority;
      target.userinfo = base.userinfo;
      target.host = base.host;
      target.hostname = base.hostname;
      target.port = base.port;
      if (reference.path.length === 0) {
        target.path = base.path;
        target.query = reference.query ?? base.query;
      } else {
        if (reference.path.startsWith("/")) {
          target.path = removeDotSegments(reference.path);
        } else {
          target.path = mergePaths(base.authority, base.path, reference.path);
          target.path = removeDotSegments(target.path);
        }
        target.query = reference.query;
      }
    }
  }

  target.fragment = reference.fragment;

  target.href = formatUri(target);

  return target as Uri;
}

/** @internal */
function mergePaths(
  baseAuthority: string | undefined,
  basePath: string,
  refPath: string,
): string {
  // If the base URI has a defined authority component and an empty path,
  // then return a string consisting of "/" concatenated with the
  // reference's path.
  if (baseAuthority !== undefined && basePath.length === 0) {
    return "/" + refPath;
  }

  // Return a string consisting of the reference's path component
  // appended to all but the last segment of the base URI's path (i.e.,
  // excluding any characters after the right-most "/" in the base URI
  // path, or excluding the entire base URI path if it does not contain
  // any "/" characters).
  const lastSlashIndex = basePath.lastIndexOf("/");
  if (lastSlashIndex === -1) {
    return refPath;
  }
  return basePath.slice(0, lastSlashIndex + 1) + refPath;
}

/** @internal */
function removeDotSegments(input: string): string {
  // 1. The input buffer is initialized with the now-appended path components
  //    and the output buffer is initialized to the empty string.
  let output = "";

  // 2. While the input buffer is not empty, loop as follows:
  while (input.length > 0) {
    if (input.startsWith("../") || input.startsWith("./")) {
      // A. If the input buffer begins with a prefix of "../" or "./",
      //    then remove that prefix from the input buffer.
      input = input.slice(input.startsWith("../") ? 3 : 2);
    } else if (
      input.startsWith("/./") ||
      (input === "/." && input.length === 2)
    ) {
      // B. If the input buffer begins with a prefix of "/./" or "/.",
      //    where "." is a complete path segment, then replace that
      //    prefix with "/" in the input buffer.
      input = input.startsWith("/./") ? "/" + input.slice(3) : "/";
    } else if (
      input.startsWith("/../") ||
      (input === "/.." && input.length === 3)
    ) {
      // C. If the input buffer begins with a prefix of "/../" or "/..",
      //    where ".." is a complete path segment, then replace that
      //    prefix with "/" in the input buffer and remove the last
      //    segment and its preceding "/" (if any) from the output
      //    buffer.
      input = input.startsWith("/../") ? "/" + input.slice(4) : "/";
      const lastSlash = output.lastIndexOf("/");
      output = lastSlash === -1 ? "" : output.slice(0, lastSlash);
    } else if (input === "." || input === "..") {
      // D. If the input buffer consists only of "." or "..", then remove
      //    that from the input buffer.
      input = "";
    } else {
      // E. move the first path segment in the input buffer to the end of
      //    the output buffer, including the initial "/" character (if
      //    any) and any subsequent characters up to, but not including,
      //    the next "/" character or the end of the input buffer.
      let slashIndex;
      if (input.startsWith("/")) {
        slashIndex = input.indexOf("/", 1);
      } else {
        slashIndex = input.indexOf("/");
      }
      if (slashIndex === -1) {
        output += input;
        input = "";
      } else {
        output += input.slice(0, slashIndex);
        input = input.slice(slashIndex);
      }
    }
  }

  // 3. Finally, the output buffer is returned.
  return output;
}
