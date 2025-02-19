import assert from "node:assert/strict";
import { suite, test } from "node:test";
import { parseUri, resolveUri } from "tool-uri";

void suite("URI resolution", () => {
  const baseUri = parseUri("http://a/b/c/d;p?q");

  void test("resolves normal references", () => {
    // Empty reference
    assert.equal(resolveUri(baseUri, "").href, "http://a/b/c/d;p?q");

    // Absolute URI
    assert.equal(resolveUri(baseUri, "g:h").href, "g:h");

    // Authority
    assert.equal(resolveUri(baseUri, "//g").href, "http://g");

    // Path variations
    assert.equal(resolveUri(baseUri, "g").href, "http://a/b/c/g");
    assert.equal(resolveUri(baseUri, "./g").href, "http://a/b/c/g");
    assert.equal(resolveUri(baseUri, "g/").href, "http://a/b/c/g/");
    assert.equal(resolveUri(baseUri, "/g").href, "http://a/g");
    // Query/Fragment
    assert.equal(resolveUri(baseUri, "?y").href, "http://a/b/c/d;p?y");
    assert.equal(resolveUri(baseUri, "g?y").href, "http://a/b/c/g?y");
    assert.equal(resolveUri(baseUri, "#s").href, "http://a/b/c/d;p?q#s");
    assert.equal(resolveUri(baseUri, "g#s").href, "http://a/b/c/g#s");
    assert.equal(resolveUri(baseUri, "g?y#s").href, "http://a/b/c/g?y#s");
  });

  void test("resolves dot segments", () => {
    assert.equal(resolveUri(baseUri, ".").href, "http://a/b/c/");
    assert.equal(resolveUri(baseUri, "./").href, "http://a/b/c/");
    assert.equal(resolveUri(baseUri, "..").href, "http://a/b/");
    assert.equal(resolveUri(baseUri, "../").href, "http://a/b/");
    assert.equal(resolveUri(baseUri, "../g").href, "http://a/b/g");
    assert.equal(resolveUri(baseUri, "../..").href, "http://a/");
    assert.equal(resolveUri(baseUri, "../../").href, "http://a/");
    assert.equal(resolveUri(baseUri, "../../g").href, "http://a/g");
  });

  void test("resolves excessive dot-segments", () => {
    assert.equal(resolveUri(baseUri, "../../../g").href, "http://a/g");
    assert.equal(resolveUri(baseUri, "../../../../g").href, "http://a/g");
  });

  void test("resolves dot-segments in paths", () => {
    // dots in directories
    assert.equal(resolveUri(baseUri, "/./g").href, "http://a/g");
    assert.equal(resolveUri(baseUri, "/../g").href, "http://a/g");

    // dots in filenames
    assert.equal(resolveUri(baseUri, "g.").href, "http://a/b/c/g.");
    assert.equal(resolveUri(baseUri, ".g").href, "http://a/b/c/.g");
    assert.equal(resolveUri(baseUri, "g..").href, "http://a/b/c/g..");
    assert.equal(resolveUri(baseUri, "..g").href, "http://a/b/c/..g");
  });

  void test("resolve paths with parameters", () => {
    assert.equal(resolveUri(baseUri, ";x").href, "http://a/b/c/;x");
    assert.equal(resolveUri(baseUri, "g;x").href, "http://a/b/c/g;x");
    assert.equal(resolveUri(baseUri, "g;x?y#s").href, "http://a/b/c/g;x?y#s");
  });

  void test("resolves mixed dot-segments", () => {
    // mixed relative patterns
    assert.equal(resolveUri(baseUri, "./../g").href, "http://a/b/g");
    assert.equal(resolveUri(baseUri, "./g/.").href, "http://a/b/c/g/");
    assert.equal(resolveUri(baseUri, "g/./h").href, "http://a/b/c/g/h");
    assert.equal(resolveUri(baseUri, "g/../h").href, "http://a/b/c/h");

    // with parameters
    assert.equal(resolveUri(baseUri, "g;x=1/./y").href, "http://a/b/c/g;x=1/y");
    assert.equal(resolveUri(baseUri, "g;x=1/../y").href, "http://a/b/c/y");
  });

  void test("preserves dot-segments in query and fragment", () => {
    // query dot-segments
    assert.equal(resolveUri(baseUri, "g?y/./x").href, "http://a/b/c/g?y/./x");
    assert.equal(resolveUri(baseUri, "g?y/../x").href, "http://a/b/c/g?y/../x");

    // fragment dot-segments
    assert.equal(resolveUri(baseUri, "g#s/./x").href, "http://a/b/c/g#s/./x");
    assert.equal(resolveUri(baseUri, "g#s/../x").href, "http://a/b/c/g#s/../x");
  });

  void test("resolves same-scheme URIs", () => {
    assert.equal(resolveUri(baseUri, "http:g").href, "http:g");
  });
});
