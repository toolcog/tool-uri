/**
 * Initialization options for URI template parsing errors.
 *
 * @category UriTemplate
 */
export interface UriTemplateErrorOptions extends ErrorOptions {
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
 * An error that occurs while parsing RFC 6570 URI templates.
 *
 * @category UriTemplate
 */
export class UriTemplateError extends Error {
  /**
   * The input that caused the error.
   */
  input?: string | undefined;

  /**
   * The position in the input where the error occurred.
   */
  offset?: number | undefined;

  constructor(message?: string, options?: UriTemplateErrorOptions) {
    super(message, options);
    this.input = options?.input;
    this.offset = options?.offset;
  }
}
