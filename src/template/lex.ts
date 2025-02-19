import { isAlpha, isDigit, isUcsChar, isIPrivateChar } from "../uri/lex.ts";

/** @internal */
export function ucsPrefix(input: string, maxLength: number): string {
  let offset = 0;
  let count = 0;
  while (offset < input.length && count < maxLength) {
    offset += input.codePointAt(offset)! > 0xffff ? 2 : 1;
    count += 1;
  }
  return input.slice(0, offset);
}

/** @internal */
export function isLiteralChar(c: number): boolean {
  // literals = %x21 / %x23-24 / %x26 / %x28-3B / %x3D / %x3F-5B
  //          / %x5D / %x5F / %x61-7A / %x7E / ucschar / iprivate
  //          / pct-encoded
  return (
    c === 0x21 ||
    (c >= 0x23 && c <= 0x24) ||
    c === 0x26 ||
    (c >= 0x28 && c <= 0x3b) ||
    c === 0x3d ||
    (c >= 0x3f && c <= 0x5b) ||
    c === 0x5d ||
    c === 0x5f ||
    (c >= 0x61 && c <= 0x7a) ||
    c === 0x7e ||
    isUcsChar(c) ||
    isIPrivateChar(c)
  );
}

/** @internal */
export function isVarChar(c: number): boolean {
  // varchar = ALPHA / DIGIT / "_" / pct-encoded
  return isAlpha(c) || isDigit(c) || c === 0x5f /*"_"*/;
}
