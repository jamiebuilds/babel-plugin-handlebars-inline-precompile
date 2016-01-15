import path from "path";
import fs from "fs";
import assert from "assert";
import * as babel from "babel-core";
import plugin from "../src/index";

function trim(str) {
  return str.replace(/^\s+|\s+$/, "");
}

function attempt (code) {
  return () => babel.transform(code, {
    babelrc: false,
    filename: "index.js",
    sourceRoot: __dirname,
    plugins: [plugin]
  }).code;
}

function check (msg) {
  const preface = "index.js: ";
  return err => err instanceof SyntaxError && err.message.slice(0, preface.length) === preface && err.message.slice(preface.length) === msg;
}

describe("precompiles inline templates", () => {
  const fixturesDir = path.join(__dirname, "fixtures");

  fs.readdirSync(fixturesDir).map((caseName) => {
    it(`works for ${caseName.split("-").join(" ")}`, () => {
      const fixtureDir = path.join(fixturesDir, caseName);
      const actual     = babel.transformFileSync(
        path.join(fixtureDir, "actual.js")
      ).code;
      const expected = fs.readFileSync(path.join(fixtureDir, "expected.js")).toString();

      assert.equal(trim(actual), trim(expected));
    });
  });
});

describe("importing anything other than the default", () => {
  it("throws a SyntaxError", () => {
    assert.throws(
      attempt("import { foo } from 'handlebars-inline-precompile'"),
      check(`Only \`import hbs from 'handlebars-inline-precompile'\` is supported. You used: \`import { foo } from 'handlebars-inline-precompile'\``));
  });
});

describe("`hbs` is called with 0 arguments", () => {
  it("throws a SyntaxError", () => {
    assert.throws(
      attempt("import hbs from 'handlebars-inline-precompile'; hbs()"),
      check("hbs should be invoked with a single argument: the template string"));
  });
});

describe("`hbs` is called with a non-string argument", () => {
  it("throws a SyntaxError", () => {
    assert.throws(
      attempt("import hbs from 'handlebars-inline-precompile'; hbs(42)"),
      check("hbs should be invoked with a single argument: the template string"));
  });
});

describe("`hbs` is called with more than 1 argument", () => {
  it("throws a SyntaxError", () => {
    assert.throws(
      attempt("import hbs from 'handlebars-inline-precompile'; hbs('foo', 'bar')"),
      check("hbs should be invoked with a single argument: the template string"));
  });
});

describe("`hbs` is used as a tagged template expression, with a template string containing placeholders", () => {
  it("throws a SyntaxError", () => {
    assert.throws(
      attempt("import hbs from 'handlebars-inline-precompile'; hbs`${6 * 7 === 42}`"),
      check("placeholders inside a tagged template string are not supported"));
  });
});
