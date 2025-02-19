import { pctEncode } from "../uri/lex.ts";
import type { UriTemplate, UriExpression, UriVariable } from "./template.ts";
import { ucsPrefix } from "./lex.ts";
import { parseUriTemplate } from "./parse.ts";

/**
 * Substitutes the given variables values into the template, returning the
 * expanded URI string.
 *
 * @throws UriTemplateError if the template is malformed.
 * @category UriTemplate
 */
export function expandUriTemplate(
  template: UriTemplate | string,
  variables:
    | { readonly [varname: string]: unknown }
    | ((varname: string) => unknown),
): string {
  if (typeof template === "string") {
    template = parseUriTemplate(template);
  }

  let result = "";
  for (const part of template.parts) {
    if (typeof part === "string") {
      result += part;
    } else {
      result += expandUriExpression(part, variables);
    }
  }
  return result;
}

/**
 * Returns the RFC 6570 expansion of the given values according to
 * the operator and variable specifiers of the expression.
 *
 * @category UriExpression
 */
export function expandUriExpression(
  expression: UriExpression,
  variables:
    | { readonly [varname: string]: unknown }
    | ((varname: string) => unknown),
): string {
  let result = "";

  let first = true;
  for (const variable of expression.variables) {
    const value =
      typeof variables === "function" ?
        variables(variable.name)
      : variables[variable.name];
    if (value === undefined || value === null) {
      continue;
    }

    const expanded = expandUriVariable(variable, value);
    if (expanded === undefined) {
      continue;
    }

    if (first) {
      first = false;
      result += expression.first;
    } else {
      result += expression.separator;
    }

    result += expanded;
  }

  return result;
}

/**
 * Returns the RFC 6570 expansion of the given value according to the rules
 * of the template variable.
 *
 * @category UriVariable
 */
export function expandUriVariable(
  variable: UriVariable,
  value: unknown,
): string | undefined {
  if (value === null || typeof value !== "object") {
    return expandUriVariableString(variable, value);
  } else if (!variable.explode) {
    return expandUriVariableComposite(variable, value);
  } else {
    return explodeUriVariableComposite(variable, value);
  }
}

/** @internal */
function expandUriVariableString(
  variable: UriVariable,
  value: unknown,
): string | undefined {
  let valueString = (variable.coerceString ?? coerceUriVariableString)(value);
  if (valueString === undefined) {
    return undefined;
  }
  let result = "";
  if (variable.named) {
    result += variable.name;
    if (valueString.length === 0) {
      result += variable.empty;
      return result;
    }
    result += "=";
  }
  if (variable.maxLength > 0) {
    valueString = ucsPrefix(valueString, variable.maxLength);
  }
  result += pctEncode(valueString, variable.allow);
  return result;
}

/** @internal */
function expandUriVariableComposite(
  variable: UriVariable,
  value: object,
): string | undefined {
  let expanded: string | undefined;
  if (Array.isArray(value)) {
    expanded = expandUriVariableCompositeArray(variable, value);
  } else {
    expanded = expandUriVariableCompositeObject(
      variable,
      value as { readonly [key: string]: unknown },
    );
  }
  if (expanded === undefined) {
    return undefined;
  }
  let result = "";
  if (variable.named) {
    result += variable.name;
    result += "=";
  }
  result += expanded;
  return result;
}

/** @internal */
function expandUriVariableCompositeArray(
  variable: UriVariable,
  array: readonly unknown[],
): string | undefined {
  let result = "";
  let first = true;
  for (const item of array) {
    const itemString = (variable.coerceString ?? coerceUriVariableString)(item);
    if (itemString === undefined) {
      continue;
    }
    if (first) {
      first = false;
    } else {
      result += variable.compositeSeparator;
    }
    result += pctEncode(itemString, variable.allow);
  }
  return !first ? result : undefined;
}

/** @internal */
function expandUriVariableCompositeObject(
  variable: UriVariable,
  object: {
    readonly [key: string]: unknown;
  },
): string | undefined {
  let result = "";
  let first = true;
  for (const key in object) {
    const valueString = (variable.coerceString ?? coerceUriVariableString)(
      object[key],
    );
    if (valueString === undefined) {
      continue;
    }
    if (first) {
      first = false;
    } else {
      result += variable.compositeSeparator;
    }
    result += pctEncode(key);
    result += variable.compositeSeparator;
    result += pctEncode(valueString, variable.allow);
  }
  return !first ? result : undefined;
}

/** @internal */
function explodeUriVariableComposite(
  variable: UriVariable,
  value: object,
): string | undefined {
  if (variable.deepObject) {
    return explodeUriVariableDeepObject(
      variable,
      value as { readonly [key: string]: unknown },
    );
  } else if (variable.named) {
    if (Array.isArray(value)) {
      return explodeUriVariableNamedArray(variable, value);
    } else {
      return explodeUriVariableNamedObject(
        variable,
        value as { readonly [key: string]: unknown },
      );
    }
  } else {
    if (Array.isArray(value)) {
      return explodeUriVariableUnnamedArray(variable, value);
    } else {
      return explodeUriVariableUnnamedObject(
        variable,
        value as { readonly [key: string]: unknown },
      );
    }
  }
}

/** @internal */
function explodeUriVariableNamedArray(
  variable: UriVariable,
  array: readonly unknown[],
): string | undefined {
  let result = "";
  let first = true;
  for (const item of array) {
    const itemString = (variable.coerceString ?? coerceUriVariableString)(item);
    if (itemString === undefined) {
      continue;
    }
    if (first) {
      first = false;
    } else {
      result += variable.separator;
    }
    result += variable.name;
    if (result.length === 0) {
      result += variable.empty;
    } else {
      result += "=";
      result += pctEncode(itemString, variable.allow);
    }
  }
  return !first ? result : undefined;
}

/** @internal */
function explodeUriVariableNamedObject(
  variable: UriVariable,
  object: {
    readonly [key: string]: unknown;
  },
): string | undefined {
  let result = "";
  let first = true;
  for (const key in object) {
    const valueString = (variable.coerceString ?? coerceUriVariableString)(
      object[key],
    );
    if (valueString === undefined) {
      continue;
    }
    if (first) {
      first = false;
    } else {
      result += variable.separator;
    }
    result += pctEncode(key);
    if (result.length === 0) {
      result += variable.empty;
    } else {
      result += "=";
      result += pctEncode(valueString, variable.allow);
    }
  }
  return !first ? result : undefined;
}

/** @internal */
function explodeUriVariableUnnamedArray(
  variable: UriVariable,
  array: readonly unknown[],
): string | undefined {
  let result = "";
  let first = true;
  for (const item of array) {
    const itemString = (variable.coerceString ?? coerceUriVariableString)(item);
    if (itemString === undefined) {
      continue;
    }
    if (first) {
      first = false;
    } else {
      result += variable.separator;
    }
    result += pctEncode(itemString, variable.allow);
  }
  return !first ? result : undefined;
}

/** @internal */
function explodeUriVariableUnnamedObject(
  variable: UriVariable,
  object: {
    readonly [key: string]: unknown;
  },
): string | undefined {
  let result = "";
  let first = true;
  for (const key in object) {
    const valueString = (variable.coerceString ?? coerceUriVariableString)(
      object[key],
    );
    if (valueString === undefined) {
      continue;
    }
    if (first) {
      first = false;
    } else {
      result += variable.separator;
    }
    result += pctEncode(key);
    result += "=";
    result += pctEncode(valueString, variable.allow);
  }
  return !first ? result : undefined;
}

/** @internal */
function explodeUriVariableDeepObject(
  variable: UriVariable,
  object: {
    readonly [key: string]: unknown;
  },
): string | undefined {
  let result = "";
  let first = true;
  for (const [path, value] of flattenDeepObject(object, variable.name)) {
    const valueString = (variable.coerceString ?? coerceUriVariableString)(
      value,
    );
    if (valueString === undefined) {
      continue;
    }
    if (first) {
      first = false;
    } else {
      result += variable.separator;
    }
    result += pctEncode(path, variable.allow);
    if (result.length === 0) {
      result += variable.empty;
    } else {
      result += "=";
      result += pctEncode(valueString, variable.allow);
    }
  }
  return !first ? result : undefined;
}

/** @internal */
function coerceUriVariableString(value: unknown): string | undefined {
  return (
    value === undefined || value === null ? undefined
    : typeof value === "string" ? value
    : JSON.stringify(value)
  );
}

/**
 * Returns an iterator over all leaf properties reachable from a root object.
 *
 * @internal
 */
function* flattenDeepObject(
  value: unknown,
  path: string,
  seen?: Set<unknown>,
): IterableIterator<[path: string, value: unknown]> {
  if (value === null || typeof value !== "object") {
    yield [path, value];
    return;
  }

  seen ??= new Set();
  if (seen.has(value)) {
    return;
  }
  seen.add(value);

  for (const key in value) {
    const val = (value as { readonly [key: string]: unknown })[key];
    const subpath = path + "[" + pctEncode(key) + "]";
    yield* flattenDeepObject(val, subpath, seen);
  }
}
