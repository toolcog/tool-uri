# Tool URI

[![Package](https://img.shields.io/badge/npm-0.1.0-ae8c7e?labelColor=3b3a37)](https://www.npmjs.com/package/tool-uri)
[![License](https://img.shields.io/badge/license-MIT-ae8c7e?labelColor=3b3a37)](https://opensource.org/licenses/MIT)

URI (RFC 3986), IRI (RFC 3987), and URI Template (RFC 6570) implementation.

## Installation

To install the package, run:

```bash
npm install tool-uri
```

## URI Templates (RFC 6570)

Parse and expand a URI template:

```typescript
import { parseUriTemplate, expandUriTemplate } from "tool-uri";

const template = parseUriTemplate("/users/{id}");
const uri = expandUriTemplate(template, { id: 123 });
// => "/users/123"
```

Or expand a template string directly:

```typescript
import { expandUriTemplate } from "tool-uri";

const uri = expandUriTemplate("/users/{id}", { id: 123 });
// => "/users/123"
```

### Query Parameter Expansion

Add query parameters using the `?` operator:

```typescript
const uri = expandUriTemplate("/search{?q,lang}", {
  q: "URI templates",
  lang: "en"
});
// => "/search?q=URI%20templates&lang=en"
```

Continue query parameters with the `&` operator:

```typescript
const uri = expandUriTemplate("/items?sort=date{&page,limit}", {
  page: 1,
  limit: 10
});
// => "/items?sort=date&page=1&limit=10"
```

### Path Segment Expansion

Construct path segments with multiple variables:

```typescript
const uri = expandUriTemplate("/api{/version}/users/{userId}/posts/{postId}", {
  version: "v1",
  userId: 123,
  postId: 456
});
// => "/api/v1/users/123/posts/456"
```

Explode arrays into adjacent path segments:

```typescript
const uri = expandUriTemplate("/files{/path*}", {
  path: ["docs", "2024", "report.pdf"]
});
// => "/files/docs/2024/report.pdf"
```

### Reserved Character Expansion

Use the `+` operator to pass through reserved characters:

```typescript
const uri = expandUriTemplate("{+base}docs/", {
  base: "http://example.com/api/"
});
// => "http://example.com/api/docs/"
```

Normal expansion percent-encodes reserved characters:

```typescript
const uri = expandUriTemplate("{base}docs/", {
  base: "http://example.com/api/"
});
// => "http%3A%2F%2Fexample.com%2Fapi%2Fdocs/"
```

### Fragment Identifier Expansion

Add fragment identifiers with the `#` operator:

```typescript
const uri = expandUriTemplate("/docs/guide.html{#section}", {
  section: "installation"
});
// => "/docs/guide.html#installation"
```

### Composite Value Expansion

Expand arrays and objects using the explode modifier (`*`):

```typescript
const uri = expandUriTemplate("/search{?filters*}", {
  filters: {
    category: "books",
    minPrice: 10,
    inStock: true
  }
});
// => "/search?category=books&minPrice=10&inStock=true"
```

Expand arrays as composite values:

```typescript
const uri = expandUriTemplate("www{.domain*}.example.com", {
  domain: ["api", "v1"]
});
// => "www.api.v1.example.com"
```

### String Prefix Modifiers

Limit expanded strings to a maximum length with the `:max-length` modifier:

```typescript
const uri = expandUriTemplate("/dictionary/{word:1}/{word}", {
  word: "apple"
});
// => "/dictionary/a/apple"
```

### Error Handling

Template parsing throws a `UriTemplateError` with detailed information:

```typescript
import { parseUriTemplate, UriTemplateError } from "tool-uri";

try {
  parseUriTemplate("{invalid");
} catch (error) {
  if (error instanceof UriTemplateError) {
    console.log(error.message); // "Unclosed URI template expression"
    console.log(error.input); // Input that caused error
    console.log(error.offset); // Position where error occurred
  }
}
```

Use `tryParseUriTemplate` to return `undefined` on invalid input:

```typescript
import { tryParseUriTemplate } from "tool-uri";

const template = tryParseUriTemplate("{invalid"); // Returns undefined
```

## URIs (RFC 3986)

Parse an absolute URI:

```typescript
import { parseUri } from "tool-uri";

const uri = parseUri("https://user:pass@example.com:8080/path?query#fragment");
console.log(uri.scheme); // "https"
console.log(uri.authority); // "user:pass@example.com:8080"
console.log(uri.userinfo); // "user:pass"
console.log(uri.host); // "example.com:8080"
console.log(uri.hostname); // "example.com"
console.log(uri.port); // "8080"
console.log(uri.path); // "/path"
console.log(uri.query); // "query"
console.log(uri.fragment); // "fragment"
```

Parse a URI reference:

```typescript
import { parseUriReference } from "tool-uri";

const ref = parseUriReference("/path?query#fragment");
```

Resolve a reference against a base URI:

```typescript
import { parseUri, resolveUri } from "tool-uri";

const base = parseUri("http://example.com/a/b/c");
const resolved = resolveUri(base, "../d");
console.log(resolved.href); // "http://example.com/a/d"
```

`parseUri` and `parseUriReference` throw errors on invalid input:

```typescript
import { parseUri, UriError } from "tool-uri";

try {
  const uri = parseUri("invalid::/uri");
} catch (error) {
  if (error instanceof UriError) {
    console.log(error.message); // Error details
    console.log(error.input); // Input that caused error
    console.log(error.offset); // Position where error occurred
  }
}
```

Use `tryParseUri` and `tryParseUriReference` to return `undefined` on invalid input:

```typescript
import { tryParseUri, tryParseUriReference } from "tool-uri";

const uri = tryParseUri("invalid::/uri"); // Returns undefined
const ref = tryParseUriReference("bad::ref"); // Returns null
```

## License

MIT © Tool Cognition Inc.
