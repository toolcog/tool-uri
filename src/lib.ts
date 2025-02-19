export type { UriErrorOptions } from "./uri/error.ts";
export { UriError } from "./uri/error.ts";

export type { Uri } from "./uri/uri.ts";
export { isAbsoluteUri, isRelativeUri, formatUri } from "./uri/uri.ts";

export type { UriCharset } from "./uri/lex.ts";
export {
  isAlpha,
  isDigit,
  isUcsChar,
  isIPrivateChar,
  isUnreservedChar,
  isReservedChar,
  isSchemeChar,
  isUserinfoChar,
  isHostChar,
  isPathChar,
  isQueryChar,
  isFragmentChar,
  isFormChar,
  isUriChar,
  isHexChar,
  hexDecode,
  hexEncode,
  isPctEncoded,
  pctEncode,
  pctEncodeUtf8,
} from "./uri/lex.ts";

export {
  parseUri,
  tryParseUri,
  isValidUri,
  parseUriReference,
  tryParseUriReference,
  isValidUriReference,
  parseIri,
  tryParseIri,
  isValidIri,
  parseIriReference,
  tryParseIriReference,
  isValidIriReference,
  parseIpv4,
  parseIpv6,
} from "./uri/parse.ts";

export { resolveUri } from "./uri/resolve.ts";

export type { UriTemplateErrorOptions } from "./template/error.ts";
export { UriTemplateError } from "./template/error.ts";

export type {
  UriTemplate,
  UriExpansionOperator,
  UriExpressionOptions,
  UriExpression,
  UriVariableOptions,
  UriVariable,
} from "./template/template.ts";
export {
  createUriTemplate,
  getUriTemplateVariables,
  createUriExpression,
  createUriVariable,
} from "./template/template.ts";

export {
  parseUriTemplate,
  tryParseUriTemplate,
  parseUriExpression,
  tryParseUriExpression,
  parseUriVariable,
  tryParseUriVariable,
} from "./template/parse.ts";

export {
  formatUriTemplate,
  formatUriExpression,
  formatUriVariable,
} from "./template/format.ts";

export {
  expandUriTemplate,
  expandUriExpression,
  expandUriVariable,
} from "./template/expand.ts";
