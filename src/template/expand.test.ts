import assert from "node:assert/strict";
import { suite, test } from "node:test";
import { expandUriTemplate } from "tool-uri";

void suite("URI template expansion", () => {
  // Sample variable assignments from the RFC 6570 specification.
  const values = {
    count: ["one", "two", "three"],
    dom: ["example", "com"],
    dub: "me/too",
    hello: "Hello World!",
    half: "50%",
    var: "value",
    who: "fred",
    base: "http://example.com/home/",
    path: "/foo/bar",
    list: ["red", "green", "blue"],
    keys: { semi: ";", dot: ".", comma: "," },
    v: "6",
    x: "1024",
    y: "768",
    empty: "",
    empty_keys: {},
    undef: null,
  } as const;

  void test("passes through literal characters", () => {
    // unreserved characters
    assert.equal(expandUriTemplate("AZaz09-._~", {}), "AZaz09-._~");

    // reserved characters
    assert.equal(expandUriTemplate(":/?#[]@", {}), ":/?#[]@");
    assert.equal(expandUriTemplate("!$&'()*+,;=", {}), "!$&'()*+,;=");

    // percent-encoded
    assert.equal(expandUriTemplate("Hello,%20world!", {}), "Hello,%20world!");
  });

  void test("percent-encodes non-URI literal characters", () => {
    assert.equal(expandUriTemplate("§1", {}), "%C2%A71");
  });

  void test("expands variables", () => {
    assert.equal(expandUriTemplate("{count}", values), "one,two,three");
    assert.equal(expandUriTemplate("{count*}", values), "one,two,three");
    assert.equal(expandUriTemplate("{/count}", values), "/one,two,three");
    assert.equal(expandUriTemplate("{/count*}", values), "/one/two/three");
    assert.equal(expandUriTemplate("{;count}", values), ";count=one,two,three");
    assert.equal(
      expandUriTemplate("{;count*}", values),
      ";count=one;count=two;count=three",
    );
    assert.equal(expandUriTemplate("{?count}", values), "?count=one,two,three");
    assert.equal(
      expandUriTemplate("{?count*}", values),
      "?count=one&count=two&count=three",
    );
    assert.equal(
      expandUriTemplate("{&count*}", values),
      "&count=one&count=two&count=three",
    );
  });

  void test("performs simple string expansion", () => {
    assert.equal(expandUriTemplate("{var}", values), "value");
    assert.equal(expandUriTemplate("{hello}", values), "Hello%20World%21");
    assert.equal(expandUriTemplate("{half}", values), "50%25");
    assert.equal(expandUriTemplate("O{empty}X", values), "OX");
    assert.equal(expandUriTemplate("O{undef}X", values), "OX");
    assert.equal(expandUriTemplate("{x,y}", values), "1024,768");
    assert.equal(
      expandUriTemplate("{x,hello,y}", values),
      "1024,Hello%20World%21,768",
    );
    assert.equal(expandUriTemplate("?{x,empty}", values), "?1024,");
    assert.equal(expandUriTemplate("?{x,undef}", values), "?1024");
    assert.equal(expandUriTemplate("?{undef,y}", values), "?768");
    assert.equal(expandUriTemplate("{var:3}", values), "val");
    assert.equal(expandUriTemplate("{var:30}", values), "value");
    assert.equal(expandUriTemplate("{list}", values), "red,green,blue");
    assert.equal(expandUriTemplate("{list*}", values), "red,green,blue");
    assert.equal(
      expandUriTemplate("{keys}", values),
      "semi,%3B,dot,.,comma,%2C",
    );
    assert.equal(
      expandUriTemplate("{keys*}", values),
      "semi=%3B,dot=.,comma=%2C",
    );
  });

  void test("performs reserved expansion", () => {
    assert.equal(expandUriTemplate("{+var}", values), "value");
    assert.equal(expandUriTemplate("{+hello}", values), "Hello%20World!");
    assert.equal(expandUriTemplate("{+half}", values), "50%25");

    assert.equal(
      expandUriTemplate("{base}index", values),
      "http%3A%2F%2Fexample.com%2Fhome%2Findex",
    );
    assert.equal(
      expandUriTemplate("{+base}index", values),
      "http://example.com/home/index",
    );
    assert.equal(expandUriTemplate("O{+empty}X", values), "OX");
    assert.equal(expandUriTemplate("O{+undef}X", values), "OX");

    assert.equal(expandUriTemplate("{+path}/here", values), "/foo/bar/here");
    assert.equal(
      expandUriTemplate("here?ref={+path}", values),
      "here?ref=/foo/bar",
    );
    assert.equal(
      expandUriTemplate("up{+path}{var}/here", values),
      "up/foo/barvalue/here",
    );
    assert.equal(
      expandUriTemplate("{+x,hello,y}", values),
      "1024,Hello%20World!,768",
    );
    assert.equal(
      expandUriTemplate("{+path,x}/here", values),
      "/foo/bar,1024/here",
    );

    assert.equal(expandUriTemplate("{+path:6}/here", values), "/foo/b/here");
    assert.equal(expandUriTemplate("{+list}", values), "red,green,blue");
    assert.equal(expandUriTemplate("{+list*}", values), "red,green,blue");
    assert.equal(expandUriTemplate("{+keys}", values), "semi,;,dot,.,comma,,");
    assert.equal(expandUriTemplate("{+keys*}", values), "semi=;,dot=.,comma=,");
  });

  void test("performs fragment expansion", () => {
    assert.equal(expandUriTemplate("{#var}", values), "#value");
    assert.equal(expandUriTemplate("{#hello}", values), "#Hello%20World!");
    assert.equal(expandUriTemplate("{#half}", values), "#50%25");
    assert.equal(expandUriTemplate("foo{#empty}", values), "foo#");
    assert.equal(expandUriTemplate("foo{#undef}", values), "foo");
    assert.equal(
      expandUriTemplate("{#x,hello,y}", values),
      "#1024,Hello%20World!,768",
    );
    assert.equal(
      expandUriTemplate("{#path,x}/here", values),
      "#/foo/bar,1024/here",
    );
    assert.equal(expandUriTemplate("{#path:6}/here", values), "#/foo/b/here");
    assert.equal(expandUriTemplate("{#list}", values), "#red,green,blue");
    assert.equal(expandUriTemplate("{#list*}", values), "#red,green,blue");
    assert.equal(expandUriTemplate("{#keys}", values), "#semi,;,dot,.,comma,,");
    assert.equal(
      expandUriTemplate("{#keys*}", values),
      "#semi=;,dot=.,comma=,",
    );
  });

  void test("performs label expansion", () => {
    assert.equal(expandUriTemplate("{.who}", values), ".fred");
    assert.equal(expandUriTemplate("{.who,who}", values), ".fred.fred");
    assert.equal(expandUriTemplate("{.half,who}", values), ".50%25.fred");
    assert.equal(expandUriTemplate("www{.dom*}", values), "www.example.com");
    assert.equal(expandUriTemplate("X{.var}", values), "X.value");
    assert.equal(expandUriTemplate("X{.empty}", values), "X.");
    assert.equal(expandUriTemplate("X{.undef}", values), "X");
    assert.equal(expandUriTemplate("X{.var:3}", values), "X.val");
    assert.equal(expandUriTemplate("X{.list}", values), "X.red,green,blue");
    assert.equal(expandUriTemplate("X{.list*}", values), "X.red.green.blue");
    assert.equal(
      expandUriTemplate("X{.keys}", values),
      "X.semi,%3B,dot,.,comma,%2C",
    );
    assert.equal(
      expandUriTemplate("X{.keys*}", values),
      "X.semi=%3B.dot=..comma=%2C",
    );
    assert.equal(expandUriTemplate("X{.empty_keys}", values), "X");
    assert.equal(expandUriTemplate("X{.empty_keys*}", values), "X");
  });

  void test("performs path segment expansion", () => {
    assert.equal(expandUriTemplate("{/who}", values), "/fred");
    assert.equal(expandUriTemplate("{/who,who}", values), "/fred/fred");
    assert.equal(expandUriTemplate("{/half,who}", values), "/50%25/fred");
    assert.equal(expandUriTemplate("{/who,dub}", values), "/fred/me%2Ftoo");
    assert.equal(expandUriTemplate("{/var}", values), "/value");
    assert.equal(expandUriTemplate("{/var,empty}", values), "/value/");
    assert.equal(expandUriTemplate("{/var,undef}", values), "/value");
    assert.equal(
      expandUriTemplate("{/var,x}/here", values),
      "/value/1024/here",
    );
    assert.equal(expandUriTemplate("{/var:1,var}", values), "/v/value");
    assert.equal(expandUriTemplate("{/list}", values), "/red,green,blue");
    assert.equal(expandUriTemplate("{/list*}", values), "/red/green/blue");
    assert.equal(
      expandUriTemplate("{/list*,path:4}", values),
      "/red/green/blue/%2Ffoo",
    );
    assert.equal(
      expandUriTemplate("{/keys}", values),
      "/semi,%3B,dot,.,comma,%2C",
    );
    assert.equal(
      expandUriTemplate("{/keys*}", values),
      "/semi=%3B/dot=./comma=%2C",
    );
  });

  void test("performs path-style parameter expansion", () => {
    assert.equal(expandUriTemplate("{;who}", values), ";who=fred");
    assert.equal(expandUriTemplate("{;half}", values), ";half=50%25");
    assert.equal(expandUriTemplate("{;empty}", values), ";empty");
    assert.equal(
      expandUriTemplate("{;v,empty,who}", values),
      ";v=6;empty;who=fred",
    );
    assert.equal(expandUriTemplate("{;v,bar,who}", values), ";v=6;who=fred");
    assert.equal(expandUriTemplate("{;x,y}", values), ";x=1024;y=768");
    assert.equal(
      expandUriTemplate("{;x,y,empty}", values),
      ";x=1024;y=768;empty",
    );
    assert.equal(expandUriTemplate("{;x,y,undef}", values), ";x=1024;y=768");
    assert.equal(expandUriTemplate("{;hello:5}", values), ";hello=Hello");
    assert.equal(expandUriTemplate("{;list}", values), ";list=red,green,blue");
    assert.equal(
      expandUriTemplate("{;list*}", values),
      ";list=red;list=green;list=blue",
    );
    assert.equal(
      expandUriTemplate("{;keys}", values),
      ";keys=semi,%3B,dot,.,comma,%2C",
    );
    assert.equal(
      expandUriTemplate("{;keys*}", values),
      ";semi=%3B;dot=.;comma=%2C",
    );
  });

  void test("performs form-style query expansion", () => {
    assert.equal(expandUriTemplate("{?who}", values), "?who=fred");
    assert.equal(expandUriTemplate("{?half}", values), "?half=50%25");
    assert.equal(expandUriTemplate("{?x,y}", values), "?x=1024&y=768");
    assert.equal(
      expandUriTemplate("{?x,y,empty}", values),
      "?x=1024&y=768&empty=",
    );
    assert.equal(expandUriTemplate("{?x,y,undef}", values), "?x=1024&y=768");
    assert.equal(expandUriTemplate("{?var:3}", values), "?var=val");
    assert.equal(expandUriTemplate("{?list}", values), "?list=red,green,blue");
    assert.equal(
      expandUriTemplate("{?list*}", values),
      "?list=red&list=green&list=blue",
    );
    assert.equal(
      expandUriTemplate("{?keys}", values),
      "?keys=semi,%3B,dot,.,comma,%2C",
    );
    assert.equal(
      expandUriTemplate("{?keys*}", values),
      "?semi=%3B&dot=.&comma=%2C",
    );
  });

  void test("performs form-style query continuation expansion", () => {
    assert.equal(expandUriTemplate("{&who}", values), "&who=fred");
    assert.equal(expandUriTemplate("{&half}", values), "&half=50%25");
    assert.equal(
      expandUriTemplate("?fixed=yes{&x}", values),
      "?fixed=yes&x=1024",
    );
    assert.equal(
      expandUriTemplate("{&x,y,empty}", values),
      "&x=1024&y=768&empty=",
    );
    assert.equal(expandUriTemplate("{&x,y,undef}", values), "&x=1024&y=768");

    assert.equal(expandUriTemplate("{&var:3}", values), "&var=val");
    assert.equal(expandUriTemplate("{&list}", values), "&list=red,green,blue");
    assert.equal(
      expandUriTemplate("{&list*}", values),
      "&list=red&list=green&list=blue",
    );
    assert.equal(
      expandUriTemplate("{&keys}", values),
      "&keys=semi,%3B,dot,.,comma,%2C",
    );
    assert.equal(
      expandUriTemplate("{&keys*}", values),
      "&semi=%3B&dot=.&comma=%2C",
    );
  });
});
