import type { UriTemplate, UriExpression, UriVariable } from "./template.ts";

/**
 * Formats an RFC 6570 URI template.
 *
 * @category UriTemplate
 */
export function formatUriTemplate(template: UriTemplate): string {
  let result = "";
  for (const part of template.parts) {
    result += typeof part === "string" ? part : formatUriExpression(part);
  }
  return result;
}

/**
 * Formats an RFC 6570 expression.
 *
 * @category UriExpression
 */
export function formatUriExpression(expression: UriExpression): string {
  let result = "{";
  result += expression.operator;
  for (let i = 0; i < expression.variables.length; i += 1) {
    if (i !== 0) {
      result += ",";
    }
    result += formatUriVariable(expression.variables[i]!);
  }
  result += "}";
  return result;
}

/**
 * Formats an RFC 6570 template variable specifier.
 *
 * @category UriVariable
 */
export function formatUriVariable(variable: UriVariable): string {
  let result = variable.name;
  if (variable.explode) {
    result += "*";
  } else if (variable.maxLength > 0) {
    result += ":" + variable.maxLength;
  }
  return result;
}
