import path from "path";
import fs from "fs";
import assert from "assert";
import * as babel from "babel-core";
import plugin from "../src/index";

function trim(str) {
  return str.replace(/^\s+|\s+$/, "");
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
