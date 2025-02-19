import type { UriCharset } from "../uri/lex.ts";

/**
 * An [RFC 6570](https://datatracker.ietf.org/doc/html/rfc6570) URI template.
 *
 * @see [RFC 6570 §2](https://datatracker.ietf.org/doc/html/rfc6570#section-2)
 * @category UriTemplate
 */
export interface UriTemplate {
  /**
   * The literal and expression parts of the template.
   */
  readonly parts: readonly (UriExpression | string)[];
}

/**
 * Creates a new RFC 6570 URI template.
 *
 * @category UriTemplate
 */
export function createUriTemplate(
  parts: readonly (UriExpression | string)[],
): UriTemplate {
  return { parts };
}

/**
 * Returns an array of the variables in the template.
 *
 * @category UriTemplate
 */
export function getUriTemplateVariables(
  template: UriTemplate,
): readonly UriVariable[] {
  const output: UriVariable[] = [];
  for (const part of template.parts) {
    if (typeof part === "string") {
      continue;
    }
    output.push(...part.variables);
  }
  return output;
}

/**
 * An RFC 6570 URI template expansion operator.
 *
 * @see [RFC 6570 §2.2](https://datatracker.ietf.org/doc/html/rfc6570#section-2.2)
 * @category UriExpression
 */
export type UriExpansionOperator = "" | "+" | "#" | "." | "/" | ";" | "?" | "&";

/**
 * Options for controlling RFC 6570 template expression expansion.
 * @category UriExpression
 */
export interface UriExpressionOptions {
  /**
   * The string to include before the first expanded variable value.
   */
  first?: string | undefined;

  /**
   * The string to include between expanded variable values.
   */
  separator?: string | undefined;
}

/**
 * An RFC 6570 URI expansion expression.
 *
 * @see [RFC 6570 §2.2](https://datatracker.ietf.org/doc/html/rfc6570#section-2.2)
 * @category UriExpression
 */
export interface UriExpression {
  /**
   * The expansion operator for the expression.
   */
  readonly operator: UriExpansionOperator;

  /**
   * The variable specifiers expanded by the expression.
   */
  readonly variables: readonly UriVariable[];

  /**
   * The string to include before the first expanded variable value.
   */
  readonly first: string;

  /**
   * The string to include between expanded variable values.
   */
  readonly separator: string;
}

/**
 * Creates a new RFC 6570 URI expansion expression.
 *
 * @category UriExpression
 */
export function createUriExpression(
  operator: UriExpansionOperator,
  variables: readonly UriVariable[],
  options?: UriExpressionOptions,
): UriExpression {
  return {
    operator,
    variables,
    first: options?.first ?? "",
    separator: options?.separator ?? ",",
  };
}

/**
 * Options for controlling RFC 6570 template variable expansion.
 *
 * @category UriVariable
 */
export interface UriVariableOptions {
  /**
   * The string to include between expanded values.
   */
  separator?: string | undefined;

  /**
   * The string to include between expanded composite values.
   */
  compositeSeparator?: string | undefined;

  /**
   * Whether to include variable names in expanded strings.
   */
  named?: boolean | undefined;

  /**
   * The string to substitute when expanding an empty value.
   */
  empty?: string | undefined;

  /**
   * The set of characters to pass through without pct-encoding.
   */
  allow?: UriCharset | undefined;

  /**
   * The maximum number of prefix Unicode characters to include when expanding
   * value strings. A non-positive `maxLength` indicates that value strings
   * should not be truncated.
   */
  maxLength?: number | undefined;

  /**
   * Whether to expand composite values as separate variables.
   */
  explode?: boolean | undefined;

  /**
   * Whether to expand deep object values as separate variables.
   */
  deepObject?: boolean | undefined;

  /**
   * A function to coerce values to strings when expanding.
   */
  coerceString?: ((value: unknown) => string | undefined) | undefined;
}

/**
 * A variable specifier in an RFC 6570 template expression.
 *
 * @see [RFC 6570 §2.3](https://datatracker.ietf.org/doc/html/rfc6570#section-2.3)
 * @category UriVariable
 */
export interface UriVariable {
  /**
   * The encoded name of the expansion variable.
   *
   * The variable name must consist of one or more letters, digits, underscores,
   * or pct-encoded characters, optionally interspersed with dots.
   *
   * ```
   * varname = varchar *( ["."] varchar )
   * varchar = ALPHA / DIGIT / "_" / pct-encoded
   * ```
   */
  readonly name: string;

  /**
   * The string to include between expanded values.
   */
  readonly separator: string;

  /**
   * The string to include between expanded composite values.
   */
  readonly compositeSeparator: string;

  /**
   * Whether to include variable names in expanded strings.
   */
  readonly named: boolean;

  /**
   * The string to substitute when expanding an empty value.
   */
  readonly empty: string;

  /**
   * The set of characters to pass through without pct-encoding.
   */
  readonly allow: UriCharset;

  /**
   * The maximum number of prefix Unicode characters to include when expanding
   * value strings. A non-positive `maxLength` indicates that value strings
   * should not be truncated.
   */
  readonly maxLength: number;

  /**
   * Whether to expand composite values as separate variables.
   */
  readonly explode: boolean;

  /**
   * Whether to expand deep object values as separate variables.
   */
  readonly deepObject: boolean;

  /**
   * A function to coerce values to strings when expanding.
   */
  readonly coerceString: ((value: unknown) => string | undefined) | undefined;
}

/**
 * Creates a new URI template variable specifier.
 *
 * @category UriVariable
 */
export function createUriVariable(
  name: string,
  options?: UriVariableOptions,
): UriVariable {
  return {
    name,
    separator: options?.separator ?? ",",
    compositeSeparator: options?.compositeSeparator ?? ",",
    named: options?.named ?? false,
    empty: options?.empty ?? "",
    allow: options?.allow ?? "unreserved",
    maxLength: options?.maxLength ?? -1,
    explode: options?.explode ?? false,
    deepObject: options?.deepObject ?? false,
    coerceString: options?.coerceString,
  };
}
