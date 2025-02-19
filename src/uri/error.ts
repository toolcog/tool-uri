/**
 * Initialization options for URI parsing errors.
 *
 * @category Uri
 */
export interface UriErrorOptions extends ErrorOptions {
  /**
   * The input that caused the error.
   */
  input?: string | undefined;

  /**
   * The position in the input where the error occurred.
   */
  offset?: number | undefined;
}

/**
 * An error that occurs when parsing URIs.
 *
 * @category Uri
 */
export class UriError extends Error {
  /**
   * The input that caused the error.
   */
  input?: string | undefined;

  /**
   * The position in the input where the error occurred.
   */
  offset?: number | undefined;

  constructor(message?: string, options?: UriErrorOptions) {
    super(message, options);
    this.input = options?.input;
    this.offset = options?.offset;
  }
}
