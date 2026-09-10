#!/usr/bin/env node
/* Smoke check for the source surgery: node test_edit.js */
const assert = require("assert");
const S = require("../assets/diagram-src.js");

const SRC = [
  "flowchart LR",
  "  subgraph SERVICE",
  "    Api[\"Recs API<br/><span class='sublabel'>Go · :8080</span>\"]",
  "    Rank[\"Ranker\"]",
  "  end",
  "  Feat[(\"Feature Store\")]",
  "  App[\"TV App\"] ",
  "  App -->|GET /home| Api",
  "  Api --> Rank",
  "  Rank --> Feat",
  "  classDef entry fill:transparent",
  "  class App,Api entry",
  ""
].join("\n");

assert.strictEqual(S.parseDomId("flowchart-Api-3"), "Api");
assert.strictEqual(S.parseDomId("mermaid-1788950727767-flowchart-Api-3"), "Api", "mermaid prefixes the render id");
assert.strictEqual(S.parseDomId("nope"), null);

// rename keeps the shape and the rest of the line
const renamed = S.rename(SRC, "Api", "Recs API v2<br/><span class='sublabel'>Go · :8080</span>");
assert.ok(renamed.includes('Api["Recs API v2<br/>'), "rename rewrote the label");
assert.ok(renamed.includes("App -->|GET /home| Api"), "rename left edges alone");
assert.ok(S.rename(SRC, "Feat", "Features").includes('Feat[("Features")]'), "cylinder shape kept");
assert.strictEqual(S.rename(SRC, "Ghost", "x"), null, "unknown node refuses");
assert.ok(!S.rename(SRC, "Rank", 'a "quoted" name').includes('"a "quoted"'), "quotes neutralised");

// delete takes the node, its edges, and its name in the class list
const cut = S.removeNode(SRC, "Api");
assert.ok(!cut.includes("Recs API"), "declaration gone");
assert.ok(!cut.includes("GET /home") && !cut.includes("Api --> Rank"), "edges gone");
assert.ok(cut.includes("class App entry"), "class list trimmed, not dropped");
assert.ok(cut.includes("subgraph SERVICE") && cut.includes("Rank --> Feat"), "rest untouched");
assert.ok(!S.removeNode(S.removeNode(SRC, "Api"), "App").match(/^\s*class\s/m), "class line dropped when the list empties");

// edges
assert.strictEqual(S.findEdge(SRC, "App", "Api"), 7);
assert.strictEqual(S.findEdge(SRC, "Api", "App"), -1, "direction matters");
assert.strictEqual(S.addEdge(SRC, "App", "Api"), SRC, "duplicate edge is a no-op");
assert.strictEqual(S.addEdge(SRC, "App", "App"), SRC, "self edge refused");
assert.ok(S.addEdge(SRC, "App", "Feat").includes("App --> Feat"));
assert.ok(!S.removeEdge(SRC, "Api", "Rank").includes("Api --> Rank"));
assert.ok(S.removeEdge(SRC, "Api", "Rank").includes("Rank --> Feat"), "only one line removed");

// new nodes
assert.strictEqual(S.newId(SRC, "N"), "N1");
assert.ok(S.hasId(SRC, "Feat") && !S.hasId(SRC, "N1"));
const added = S.addNode(SRC, "N1", "New box");
assert.ok(added.includes('N1["New box"]') && S.hasId(added, "N1"));
assert.strictEqual(S.newId(added, "N"), "N2");

console.log("ok");
