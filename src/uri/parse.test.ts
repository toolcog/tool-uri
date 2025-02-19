import assert from "node:assert/strict";
import { suite, test } from "node:test";
import { UriError, parseUri, parseUriReference } from "tool-uri";

void suite("URI parsing", () => {
  void test("parses URIs with all components", () => {
    parseUri("https://user:pass@example.com:8080/path?q=1#f");
    parseUri("http://example.com:80/path/to/resource?key=value#section");
  });

  void test("parses URI schemes", () => {
    parseUri("http://example.com");
    parseUri("https://example.com");
    parseUri("ftp://example.com");
    parseUri("file:///path");
    parseUri("mailto:user@example.com");
    parseUri("urn:isbn:0-486-27557-4");
    parseUri("a+b://host");
    parseUri("a-b://host");
    parseUri("a.b://host");
  });

  void test("rejects invalid schemes", () => {
    assert.throws(() => parseUri("://example.com"), UriError);
    assert.throws(() => parseUri("1http://example.com"), UriError);
    assert.throws(() => parseUri("-http://example.com"), UriError);
    assert.throws(() => parseUri(".http://example.com"), UriError);
    assert.throws(() => parseUri("http!://example.com"), UriError);
    assert.throws(() => parseUri("http@://example.com"), UriError);
  });

  void test("parses URI authorities", () => {
    assert.deepEqual(parseUri("https://user:pass@example.com:8080/path"), {
      href: "https://user:pass@example.com:8080/path",
      relative: "//user:pass@example.com:8080/path",
      scheme: "https",
      authority: "user:pass@example.com:8080",
      userinfo: "user:pass",
      host: "example.com:8080",
      hostname: "example.com",
      port: "8080",
      path: "/path",
    });
  });

  void test("parses authorities with minimal components", () => {
    assert.deepEqual(parseUri("https://example.com/path"), {
      href: "https://example.com/path",
      relative: "//example.com/path",
      scheme: "https",
      authority: "example.com",
      host: "example.com",
      hostname: "example.com",
      path: "/path",
    });
  });

  void test("parses IPv4 addresses", () => {
    assert.deepEqual(parseUri("http://192.168.0.1/path"), {
      href: "http://192.168.0.1/path",
      relative: "//192.168.0.1/path",
      scheme: "http",
      authority: "192.168.0.1",
      host: "192.168.0.1",
      hostname: "192.168.0.1",
      ipv4: "192.168.0.1",
      path: "/path",
    });
    parseUri("http://0.0.0.0");
    parseUri("http://255.255.255.255");
  });

  void test("parses IPv6 addresses", () => {
    parseUri("http://[2001:db8::1]"); // compressed
    parseUri("http://[2001:db8:0:0:0:0:0:1]"); // full
    parseUri("http://[::1]"); // localhost
    parseUri("http://[::]"); // empty
    parseUri("http://[2001:db8::192.168.0.1]"); // mixed with IPv4
    parseUri("http://[::ffff:192.168.0.1]"); // IPv4-mapped
    parseUri("http://[2001:db8:a::123]"); // with letter
  });

  void test("rejects invalid IPv6 addresses", () => {
    assert.throws(() => parseUri("http://[2001:db8]"), UriError);
    assert.throws(() => parseUri("http://[2001:db8:::1]"), UriError);
    assert.throws(() => parseUri("http://[2001:db8::1::]"), UriError);
    assert.throws(() => parseUri("http://[2001:db8::192.168]"), UriError);
    assert.throws(() => parseUri("http://[2001:db8::1/]"), UriError);
    assert.throws(() => parseUri("http://[2001:db8::1"), UriError);
    assert.throws(() => parseUri("http://2001:db8::1]"), UriError);
  });

  void test("parses IPvFuture addresses", () => {
    parseUri("http://[v1.1:2:3]");
    parseUri("http://[v2.abc:def]");
    parseUri("http://[vf.hello:world]");
    parseUri("http://[v1.123:45:6]");
  });

  void test("rejects invalid IPvFuture addresses", () => {
    assert.throws(() => parseUri("http://[v.1:2:3]"), UriError); // missing hex after v
    assert.throws(() => parseUri("http://[v1]"), UriError); // missing dot and chars
    assert.throws(() => parseUri("http://[v1.]"), UriError); // missing chars after dot
    assert.throws(() => parseUri("http://[1v.1:2:3]"), UriError); // v not at start
    assert.throws(() => parseUri("http://[V1.1:2:3]"), UriError); // uppercase V
    assert.throws(() => parseUri("http://[v1.1:2:3"), UriError); // unclosed bracket
    assert.throws(() => parseUri("http://v1.1:2:3]"), UriError); // no opening bracket
  });

  void test("parses userinfo", () => {
    assert.deepEqual(parseUri("http://user:pass@example.com"), {
      href: "http://user:pass@example.com",
      relative: "//user:pass@example.com",
      scheme: "http",
      authority: "user:pass@example.com",
      userinfo: "user:pass",
      host: "example.com",
      hostname: "example.com",
      path: "",
    });

    // percent-encoded
    parseUri("http://us%2Fer:p%40ss@example.com");
    parseUri("http://user%20name@example.com");
    parseUri("http://user%2B1@example.com");
    parseUri("http://%75%73%65%72@example.com");
  });

  void test("rejects invalid userinfo", () => {
    // invalid characters
    assert.throws(() => parseUri("http://user[name@example.com"), UriError);
    assert.throws(() => parseUri("http://user]name@example.com"), UriError);
    assert.throws(() => parseUri("http://user<>@example.com"), UriError);

    // invalid percent-encoding
    assert.throws(() => parseUri("http://user%@example.com"), UriError);
    assert.throws(() => parseUri("http://user%2@example.com"), UriError);
    assert.throws(() => parseUri("http://user%2Z@example.com"), UriError);
  });

  void test("parses valid hostnames", () => {
    // percent-encoded
    parseUri("http://ex%2Fample.com");
    parseUri("http://example%2Ecom");
    parseUri("http://ex%41mple.com");
    parseUri("http://%65%78%61%6D%70%6C%65.com");
  });

  void test("rejects invalid hostnames", () => {
    // invalid percent-encoding
    assert.throws(() => parseUri("http://example.c%m"), UriError);
    assert.throws(() => parseUri("http://example.c%2m"), UriError);
    assert.throws(() => parseUri("http://example.c%2Zm"), UriError);
  });

  void test("parses paths", () => {
    assert.equal(parseUri("http://example.com/path").path, "/path");
    assert.equal(parseUri("http://example.com/a/b/c").path, "/a/b/c");
    assert.equal(parseUri("file:///path/to/file").path, "/path/to/file");

    // empty
    assert.equal(parseUri("http://example.com").path, "");
    assert.equal(parseUri("http://example.com?query").path, "");

    // percent-encoded
    assert.equal(
      parseUri("http://example.com/path%20name").path,
      "/path%20name",
    );
    assert.equal(parseUri("http://example.com/%2Fpath").path, "/%2Fpath");
    assert.equal(
      parseUri("http://example.com/path%2Fto%2Ffile").path,
      "/path%2Fto%2Ffile",
    );
    assert.equal(
      parseUri("http://example.com/%70%61%74%68").path,
      "/%70%61%74%68",
    );
    assert.equal(parseUri("http://example.com/path%3A%40").path, "/path%3A%40");
  });

  void test("rejects invalid paths", () => {
    // invalid characters
    assert.throws(() => parseUri("http://example.com/<"), UriError);
    assert.throws(() => parseUri("http://example.com/>"), UriError);
    assert.throws(() => parseUri("http://example.com/{"), UriError);
    assert.throws(() => parseUri("http://example.com/}"), UriError);
    assert.throws(() => parseUri("http://example.com/|"), UriError);
    assert.throws(() => parseUri("http://example.com/\\"), UriError);
    assert.throws(() => parseUri("http://example.com/^"), UriError);
    assert.throws(() => parseUri("http://example.com/`"), UriError);

    // invalid percent-encoding
    assert.throws(() => parseUri("http://example.com/path%"), UriError);
    assert.throws(() => parseUri("http://example.com/path%2"), UriError);
    assert.throws(() => parseUri("http://example.com/path%2Z"), UriError);
  });

  void test("parses queries", () => {
    assert.equal(parseUri("http://example.com?q=1").query, "q=1");
    assert.equal(parseUri("http://example.com?a=1&b=2").query, "a=1&b=2");

    // empty
    assert.equal(parseUri("http://example.com?").query, "");

    // percent-encoded
    parseUri("http://example.com?q%20ery");
    parseUri("http://example.com?q=%2F");
    parseUri("http://example.com?key%3Dvalue");
    parseUri("http://example.com?%71%75%65%72%79");
    parseUri("http://example.com?q%3F%2F%3A%40");
  });

  void test("rejects invalid queries", () => {
    // invalid characters
    assert.throws(() => parseUri("http://example.com?<"), UriError);
    assert.throws(() => parseUri("http://example.com?>"), UriError);
    assert.throws(() => parseUri("http://example.com?{"), UriError);
    assert.throws(() => parseUri("http://example.com?}"), UriError);
    assert.throws(() => parseUri("http://example.com?|"), UriError);
    assert.throws(() => parseUri("http://example.com?\\"), UriError);
    assert.throws(() => parseUri("http://example.com?^"), UriError);
    assert.throws(() => parseUri("http://example.com?`"), UriError);

    // invalid percent-encoding
    assert.throws(() => parseUri("http://example.com?q=%"), UriError);
    assert.throws(() => parseUri("http://example.com?q=%2"), UriError);
    assert.throws(() => parseUri("http://example.com?q=%2Z"), UriError);
  });

  void test("parses fragments", () => {
    assert.equal(parseUri("http://example.com#fragment").fragment, "fragment");
    assert.equal(
      parseUri("http://example.com#section/subsection").fragment,
      "section/subsection",
    );

    // empty
    assert.equal(parseUri("http://example.com#").fragment, "");

    // percent-encoded
    assert.equal(
      parseUri("http://example.com#frag%20ment").fragment,
      "frag%20ment",
    );
    assert.equal(parseUri("http://example.com#%2Ffrag").fragment, "%2Ffrag");
    assert.equal(
      parseUri("http://example.com#section%2Fpart").fragment,
      "section%2Fpart",
    );
    assert.equal(
      parseUri("http://example.com#%66%72%61%67").fragment,
      "%66%72%61%67",
    );
    assert.equal(
      parseUri("http://example.com#frag%3F%2F%3A%40").fragment,
      "frag%3F%2F%3A%40",
    );
  });

  void test("rejects invalid fragments", () => {
    // invalid characters
    assert.throws(() => parseUri("http://example.com#<"), UriError);
    assert.throws(() => parseUri("http://example.com#>"), UriError);
    assert.throws(() => parseUri("http://example.com#{"), UriError);
    assert.throws(() => parseUri("http://example.com#}"), UriError);
    assert.throws(() => parseUri("http://example.com#|"), UriError);
    assert.throws(() => parseUri("http://example.com#\\"), UriError);
    assert.throws(() => parseUri("http://example.com#^"), UriError);
    assert.throws(() => parseUri("http://example.com#`"), UriError);

    // invalid percent-encoding
    assert.throws(() => parseUri("http://example.com#f%"), UriError);
    assert.throws(() => parseUri("http://example.com#f%2"), UriError);
    assert.throws(() => parseUri("http://example.com#f%2Z"), UriError);
  });
});

void suite("URI reference parsing", () => {
  void test("parses absolute references", () => {
    parseUriReference("http://example.com");
    parseUriReference("https://example.com/path?query#fragment");
  });

  void test("parses path-absolute references", () => {
    assert.deepEqual(parseUriReference("/path/to/resource?query#fragment"), {
      href: "/path/to/resource?query#fragment",
      relative: "/path/to/resource",
      path: "/path/to/resource",
      query: "query",
      fragment: "fragment",
    });

    parseUriReference("/");
    parseUriReference("/path");
    parseUriReference("/path/to/resource");
    parseUriReference("/path?query");
    parseUriReference("/path#fragment");
    parseUriReference("/path?query#fragment");
  });

  void test("parses path-rootless references", () => {
    parseUriReference("path");
    parseUriReference("path/to/resource");
    parseUriReference("path?query");
    parseUriReference("path#fragment");
    parseUriReference("path?query#fragment");
  });

  void test("parses path-noscheme references", () => {
    parseUriReference("user@example.com");
    parseUriReference("path/to@/resource");
    parseUriReference("user@host/path");
    parseUriReference("path@/to/resource?query#fragment");
  });

  void test("parses path-empty references", () => {
    parseUriReference("");
    parseUriReference("?query");
    parseUriReference("#fragment");
    parseUriReference("?query#fragment");
  });

  void test("parses authority references", () => {
    assert.deepEqual(
      parseUriReference("//user:pass@example.com:123/path?query#fragment"),
      {
        href: "//user:pass@example.com:123/path?query#fragment",
        relative: "//user:pass@example.com:123/path",
        authority: "user:pass@example.com:123",
        userinfo: "user:pass",
        host: "example.com:123",
        hostname: "example.com",
        port: "123",
        path: "/path",
        query: "query",
        fragment: "fragment",
      },
    );
    parseUriReference("//example.com");
    parseUriReference("//example.com/path");
    parseUriReference("//user:pass@host:123");
    parseUriReference("//example.com?query");
    parseUriReference("//example.com#fragment");
  });

  void test("rejects invalid URI reference paths", () => {
    // invalid characters
    assert.throws(() => parseUriReference("path<name"), UriError);
    assert.throws(() => parseUriReference("path>name"), UriError);
    assert.throws(() => parseUriReference("path[name"), UriError);
    assert.throws(() => parseUriReference("path]name"), UriError);
    assert.throws(() => parseUriReference("path\\name"), UriError);
    assert.throws(() => parseUriReference("path^name"), UriError);
    assert.throws(() => parseUriReference("path|name"), UriError);
    assert.throws(() => parseUriReference("path`name"), UriError);

    // invalid percent-encoding
    assert.throws(() => parseUriReference("path%"), UriError);
    assert.throws(() => parseUriReference("path%2"), UriError);
    assert.throws(() => parseUriReference("path%2Z"), UriError);
    assert.throws(() => parseUriReference("%"), UriError);
    assert.throws(() => parseUriReference("%2"), UriError);
    assert.throws(() => parseUriReference("%2Z"), UriError);
  });
});
